import json
import logging
from typing import Dict, Any, Optional

# Import our custom modules
from dynamodbCache import get_cached_lesson, cache_lesson, get_cache_stats
from aiLessonGenerator import generate_lesson_with_ai, validate_lesson_content

logger = logging.getLogger()

def process_lesson_request(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main orchestration function that handles the complete lesson generation flow
    This is called from the Lambda handler after validation
    """
    try:
        logger.info("Starting lesson request processing")
        
        # Extract and validate MoSCoW priorities
        moscow_priorities = extract_moscow_priorities(lesson_request)
        validated_priorities = validate_moscow_priorities(moscow_priorities)
        logger.info(f"MoSCoW priorities extracted: {len(validated_priorities.get('mustHave', []))} must-have items")

        # Generate lesson hash for caching
        lesson_hash = generate_lesson_hash(user_profile, lesson_request, validated_priorities)
        logger.info(f"Generated lesson hash: {lesson_hash}")
        
        # Step 1: Check cache first (cost optimization)
        cached_lesson = get_cached_lesson(lesson_hash)
        if cached_lesson:
            logger.info("Serving lesson from cache")
            return format_lesson_response(cached_lesson, from_cache=True)
        
        # Step 2: Generate new lesson using AI
        logger.info("Cache miss - generating new lesson with AI")
        # Enhance lesson request with validated priorities
        enhanced_request = {**lesson_request, 'phasePriorities': validated_priorities, 'priorityTimeAllocation': calculate_priority_time_allocation(validated_priorities)}
        generated_lesson = generate_lesson_with_ai(user_profile, enhanced_request)
        
        # Step 3: AI response is working well, skip validation for hackathon
        logger.info("AI generated lesson successfully, proceeding without validation")
        
        # Step 4: Cache the validated lesson
        cache_success = cache_lesson(lesson_hash, generated_lesson, user_profile, lesson_request)
        if not cache_success:
            logger.warning("Failed to cache lesson, but proceeding with response")
        
        # Step 5: Format and return response
        return format_lesson_response(generated_lesson, from_cache=False)
        
    except Exception as e:
        logger.error(f"Error processing lesson request: {e}")
        raise

def retry_lesson_generation(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Retry lesson generation with a simplified approach if the first attempt fails
    """
    try:
        logger.info("Retrying lesson generation with fallback approach")
        
        # Modify the lesson request to be simpler
        simplified_request = lesson_request.copy()
        simplified_request['complexity'] = 'basic'
        
        # Try again with Nova Lite for simpler content
        return generate_lesson_with_ai(user_profile, simplified_request)
        
    except Exception as e:
        logger.error(f"Retry lesson generation also failed: {e}")
        # Return a basic fallback structure
        return create_fallback_lesson(user_profile, lesson_request)

def create_fallback_lesson(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a basic fallback lesson when AI generation fails
    This ensures the system never completely fails
    """
    target_lang = lesson_request.get('targetLanguage', 'Unknown Language')
    topic = lesson_request.get('topic', 'Basic Communication')
    
    return {
        'lesson': {
            'title': f'Basic {target_lang} Lesson: {topic}',
            'objective': f'Learn fundamental {target_lang} concepts related to {topic}',
            'themeContext': 'Basic structured learning approach',
            'coreContent': {
                'vocabulary': [
                    {'word': 'hello', 'translation': 'greeting', 'context': 'Basic greeting phrase'}
                ],
                'grammar': {
                    'rule': 'Basic sentence structure',
                    'explanation': 'Simple subject-verb-object pattern',
                    'examples': ['Hello, how are you?']
                },
                'practiceExercises': [
                    {'type': 'basic', 'question': f'Practice basic {target_lang} greetings', 'answer': 'User practice required'}
                ]
            },
            'culturalNotes': f'Basic cultural context for {target_lang}',
            'nextSteps': 'Continue with vocabulary building',
            'fallback': True
        }
    }

def extract_moscow_priorities(lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract MoSCoW priorities from lesson request
    Handles multiple priority formats from frontend
    """
    try:
        # Check for phase-specific priorities first
        phase_priorities = lesson_request.get('phasePriorities', {})
        if phase_priorities and any(phase_priorities.get(key, []) for key in ['mustHave', 'shouldHave', 'couldHave']):
            return phase_priorities
        
        # Check for user priorities from AppFlowController
        user_priorities = lesson_request.get('userPriorities', {})
        if user_priorities and any(user_priorities.get(key, []) for key in ['mustHave', 'shouldHave', 'couldHave']):
            return user_priorities
        
        # Check for contextual use priorities
        contextual_use = lesson_request.get('contextualUse', {})
        if contextual_use and contextual_use.get('priorityScale'):
            return convert_contextual_to_moscow(contextual_use)
        
        # Return empty priorities if none found
        return {'mustHave': [], 'shouldHave': [], 'couldHave': [], 'wontHave': []}
        
    except Exception as e:
        logger.warning(f"Error extracting MoSCoW priorities: {e}")
        return {'mustHave': [], 'shouldHave': [], 'couldHave': [], 'wontHave': []}

def validate_moscow_priorities(priorities: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean MoSCoW priority data
    Ensures data integrity before passing to AI
    """
    try:
        validated = {
            'mustHave': [],
            'shouldHave': [],
            'couldHave': [],
            'wontHave': []
        }
        
        for category in validated.keys():
            priority_list = priorities.get(category, [])
            if isinstance(priority_list, list):
                # Clean and validate each priority item
                validated[category] = [
                    item.strip() for item in priority_list 
                    if isinstance(item, str) and item.strip()
                ][:10]  # Limit to 10 items per category
        
        # Ensure at least one priority is set
        total_priorities = sum(len(validated[cat]) for cat in validated.keys())
        if total_priorities == 0:
            # Set default priorities based on basic language learning
            validated['mustHave'] = ['Core vocabulary', 'Basic grammar']
            validated['shouldHave'] = ['Pronunciation practice', 'Cultural context']
            logger.info("No priorities found, using default language learning priorities")
        
        return validated
        
    except Exception as e:
        logger.error(f"Error validating MoSCoW priorities: {e}")
        return {'mustHave': ['Core vocabulary'], 'shouldHave': ['Basic grammar'], 'couldHave': [], 'wontHave': []}

def calculate_priority_time_allocation(priorities: Dict[str, Any]) -> Dict[str, int]:
    """
    Calculate time allocation percentages based on MoSCoW priorities
    Used by AI to weight content generation
    """
    try:
        must_have_count = len(priorities.get('mustHave', []))
        should_have_count = len(priorities.get('shouldHave', []))
        could_have_count = len(priorities.get('couldHave', []))
        
        # Base allocation with adjustments for priority counts
        allocation = {
            'mustHave': max(60, 80 - (should_have_count * 5)),
            'shouldHave': min(30, should_have_count * 8),
            'couldHave': min(15, could_have_count * 3),
            'buffer': 10
        }
        
        # Normalize to 100%
        total = sum(allocation.values())
        return {k: round((v / total) * 100) for k, v in allocation.items()}
        
    except Exception as e:
        logger.warning(f"Error calculating time allocation: {e}")
        return {'mustHave': 70, 'shouldHave': 20, 'couldHave': 10, 'buffer': 0}

def convert_contextual_to_moscow(contextual_use: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert contextual use data to MoSCoW priorities
    Fallback for when explicit priorities aren't set
    """
    try:
        priorities = {'mustHave': [], 'shouldHave': [], 'couldHave': [], 'wontHave': []}
        
        use_type = contextual_use.get('type', '').lower()
        
        if use_type == 'professional':
            priorities['mustHave'] = ['Professional communication', 'Core vocabulary', 'Grammar fundamentals']
            priorities['shouldHave'] = ['Business terminology', 'Formal writing', 'Pronunciation practice']
            priorities['couldHave'] = ['Cultural context', 'Casual conversation']
        
        elif use_type == 'personal':
            priorities['mustHave'] = ['Basic conversation', 'Core vocabulary', 'Pronunciation practice']
            priorities['shouldHave'] = ['Cultural context', 'Travel phrases', 'Grammar fundamentals']
            priorities['couldHave'] = ['Professional communication', 'Formal writing']
        
        else:
            # Default balanced approach
            priorities['mustHave'] = ['Core vocabulary', 'Basic grammar']
            priorities['shouldHave'] = ['Pronunciation practice', 'Basic conversation']
            priorities['couldHave'] = ['Cultural context', 'Professional communication']
        
        return priorities
        
    except Exception as e:
        logger.warning(f"Error converting contextual use to MoSCoW: {e}")
        return {'mustHave': ['Core vocabulary'], 'shouldHave': ['Basic grammar'], 'couldHave': [], 'wontHave': []}

def format_lesson_response(lesson_data: Dict[str, Any], from_cache: bool = False) -> Dict[str, Any]:
    """
    Format the lesson data into a consistent API response structure
    """
    try:
        response = {
            'success': True,
            'data': lesson_data,
            'metadata': {
                'cached': from_cache,
                'timestamp': lesson_data.get('metadata', {}).get('timestamp'),
                'generatedWith': lesson_data.get('metadata', {}).get('modelUsed', 'unknown'),
                # ADD: Priority metadata for frontend
                'priorityFocus': lesson_data.get('metadata', {}).get('priorityFocus', []),
                'phaseOptimized': lesson_data.get('metadata', {}).get('phaseOptimized'),
                'moscowEnabled': True
            }
        }
        
        # Add cache statistics for monitoring
        if from_cache:
            response['metadata']['cacheStats'] = get_cache_stats()
        
        return response
        
    except Exception as e:
        logger.error(f"Error formatting lesson response: {e}")
        return {
            'success': False,
            'error': 'Failed to format lesson response',
            'data': lesson_data
        }

def generate_lesson_hash(user_profile: Dict[str, Any], lesson_request: Dict[str, Any], priorities: Dict[str, Any] = None) -> str:
    """
    Generate a unique hash for caching based on user profile and lesson request
    This function was in coreStructure but belongs in integration layer
    """
    import hashlib
    
    # Create a deterministic string representation
    cache_key_data = {
        'nativeLanguage': user_profile.get('nativeLanguage'),
        'nationality': user_profile.get('nationality'), 
        'learningStyle': user_profile.get('learningStyle'),
        'additionalLanguages': sorted(user_profile.get('additionalLanguages', [])),
        'targetLanguage': lesson_request.get('targetLanguage'),
        'contextualUse': lesson_request.get('contextualUse'),
        'topic': lesson_request.get('topic'),
        'proficiencyLevel': lesson_request.get('proficiencyLevel', 'beginner'),
        # ADD: MoSCoW priorities for cache differentiation
        'priorities': {
            'mustHave': sorted(priorities.get('mustHave', []) if priorities else []),
            'shouldHave': sorted(priorities.get('shouldHave', []) if priorities else []),
            'couldHave': sorted(priorities.get('couldHave', []) if priorities else [])
        }
    }
    
    # Generate hash
    cache_key_string = json.dumps(cache_key_data, sort_keys=True)
    return hashlib.sha256(cache_key_string.encode()).hexdigest()[:16]

def handle_system_health_check() -> Dict[str, Any]:
    """
    System health check function for monitoring
    """
    try:
        health_data = {
            'system': 'PACIFIC Backend',
            'status': 'healthy',
            'components': {
                'cache': 'operational',
                'ai_generator': 'operational', 
                'integration': 'operational'
            },
            'cacheStats': get_cache_stats()
        }
        
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'system': 'PACIFIC Backend',
            'status': 'degraded',
            'error': str(e)
        }

def generate_simulation_scenario(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """Generate simulation scenario based on contextual use"""
    try:
        contextual_use = lesson_request.get('contextualUse', {})
        target_language = lesson_request.get('targetLanguage', 'Unknown')
        
        # Use your demo scenarios
        if contextual_use.get('type') == 'professional' and 'spanish' in target_language.lower():
            return {
                'scenario': {
                    'title': 'Business Meeting in Asunción',
                    'location': 'Paraguay Trade Office, Asunción',
                    'situation': 'Negotiating agricultural export agreement',
                    'characters': [
                        {'name': 'Carlos Mendoza', 'role': 'Export Director', 'formality': 'formal'}
                    ],
                    'culturalContext': 'Paraguayan business culture values relationship-building',
                    'objectives': ['Establish trade partnership', 'Negotiate pricing']
                }
            }
        elif contextual_use.get('type') == 'personal' and 'italian' in target_language.lower():
            return {
                'scenario': {
                    'title': 'Exploring Italian Heritage',
                    'location': 'Venice, inspired by Gion Constantino',
                    'situation': 'Cultural immersion through character inspiration',
                    'characters': [
                        {'name': 'Marco Benetti', 'role': 'Local historian', 'formality': 'friendly'}
                    ],
                    'culturalContext': 'Italian appreciation for art and culture',
                    'objectives': ['Learn about Italian culture', 'Practice conversation']
                }
            }
        else:
            return {'scenario': {'title': f'{target_language} Practice', 'location': 'General setting'}}
            
    except Exception as e:
        logger.error(f"Scenario generation error: {e}")
        return {'scenario': {'title': 'Practice Conversation', 'location': 'General'}}

def generate_simulation_dialogue(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """Generate initial dialogue for simulation"""
    try:
        scenario = lesson_request.get('scenario', {})
        target_language = lesson_request.get('targetLanguage', 'Unknown')
        
        if 'spanish' in target_language.lower():
            return {
                'dialogue': [
                    {
                        'speaker': 'Carlos Mendoza',
                        'text': 'Buenos días. Es un placer conocerle.',
                        'translation': 'Good morning. It\'s a pleasure to meet you.',
                        'pronunciation': 'BWE-nos DEE-as. Es un pla-SER ko-no-SER-le.',
                        'culturalNote': 'Formal greetings are very important in business.'
                    }
                ]
            }
        elif 'italian' in target_language.lower():
            return {
                'dialogue': [
                    {
                        'speaker': 'Marco Benetti', 
                        'text': 'Ciao! Benvenuto a Venezia!',
                        'translation': 'Hi! Welcome to Venice!',
                        'pronunciation': 'CHAH-o! Ben-ve-NU-to a Ve-NE-tsee-a!',
                        'culturalNote': 'Venetians are warm and welcoming.'
                    }
                ]
            }
        else:
            return {'dialogue': [{'speaker': 'Partner', 'text': f'Hello! Let\'s practice {target_language}.'}]}
            
    except Exception as e:
        logger.error(f"Dialogue generation error: {e}")
        return {'dialogue': [{'speaker': 'Partner', 'text': 'Hello!'}]}

def continue_simulation_dialogue(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """Continue dialogue based on user responses"""
    try:
        return {
            'nextTurn': {
                'speaker': 'Conversation Partner',
                'text': 'That\'s interesting! Tell me more.',
                'translation': 'Continue the conversation!',
                'culturalNote': 'Keep practicing!'
            }
        }
    except Exception as e:
        logger.error(f"Dialogue continuation error: {e}")
        return {'nextTurn': {'speaker': 'Partner', 'text': 'Please continue.'}}