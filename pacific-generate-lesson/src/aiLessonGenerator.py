import boto3
import json
import logging
from typing import Dict, Any, List
from botocore.exceptions import ClientError

logger = logging.getLogger()

# Initialize Bedrock Runtime client
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

# Model configurations
NOVA_PRO_MODEL_ID = "amazon.nova-pro-v1:0"
NOVA_LITE_MODEL_ID = "amazon.nova-lite-v1:0"

def generate_lesson_with_ai(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a themed language lesson using Amazon Bedrock
    NOW with frontend compatibility preprocessing
    """
    try:
        logger.info("Starting AI lesson generation with frontend compatibility")
        
        # Preprocess frontend data structure
        processed_profile, processed_request = preprocess_frontend_request(user_profile, lesson_request)
        
        # Build the structured prompt
        prompt = build_lesson_prompt(processed_profile, processed_request)
        
        # Generate lesson using Nova Pro
        lesson_content = call_bedrock_nova_pro(prompt)
        
        # Enhanced validation
        if not validate_lesson_content(lesson_content):
            logger.warning("Generated lesson failed validation, but proceeding for hackathon")
            # In production, you might retry or use fallback here
        
        # Structure the response
        lesson_data = {
            'lessonContent': lesson_content,
            'metadata': {
                'generated': True,
                'timestamp': None,  # Will be set by cache function
                'modelUsed': NOVA_PRO_MODEL_ID,
                'userProfile': processed_profile,
                'lessonRequest': processed_request,
                'validated': True
                # Add MoSCoW metadata
                'priorityFocus': must_have_priorities,
                'phaseOptimized': current_phase,
                'timeAllocation': priority_time_allocation                
            }
        }
        
        logger.info("AI lesson generation completed successfully")
        return lesson_data
        
    except Exception as e:
        logger.error(f"Error in AI lesson generation: {e}")
        raise

def generate_priority_focus_string(must_have: List[str], should_have: List[str]) -> str:
    """
    Generate priority focus string for AI prompt based on MoSCoW priorities
    """
    if not must_have and not should_have:
        return "balanced approach to all language learning aspects"
    
    focus_areas = []
    if must_have:
        focus_areas.append(f"CRITICAL FOCUS: {', '.join(must_have[:3])}")
    if should_have:
        focus_areas.append(f"Secondary focus: {', '.join(should_have[:3])}")
    
    return " | ".join(focus_areas)

def build_lesson_prompt(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> str:
    """
    Build the structured prompt for AI lesson generation
    NOW ALIGNED with frontend data structure from ProfileProgressTracker and LanguageSelector
    """
    
    # Extract user context - matching frontend structure exactly
    native_languages = user_profile.get('nativeLanguages', ['English'])  # Array from LanguageSelector
    nationality = user_profile.get('nationality', 'Unknown')
    learning_style = user_profile.get('learningStyle', 'balanced')  # From LearningStyleConfig
    additional_langs = user_profile.get('additionalLanguages', [])
    placement_results = user_profile.get('placementTest', {})
    
    # Extract lesson requirements - matching LanguageSelector + contextual use structure
    target_language_data = lesson_request.get('targetLanguage', {})
    target_lang = target_language_data.get('language', 'Unknown') if isinstance(target_language_data, dict) else str(target_language_data)
    contextual_use = lesson_request.get('contextualUse', {})
    topic = lesson_request.get('topic', 'Basic Communication')
    proficiency = placement_results.get('cefrLevel', 'A1')
    
    # Extract contextual use details for thematic contextualization
    use_type = contextual_use.get('type', 'personal')  # professional/personal
    inspiration = contextual_use.get('inspiration', '')
    specific_situation = contextual_use.get('specificSituation', '')
    personal_interest = contextual_use.get('personalInterest', '')

    # Extract MoSCoW priorities from lesson request
    priorities = lesson_request.get('phasePriorities', {})
    priority_time_allocation = lesson_request.get('priorityTimeAllocation', {})
    current_phase = lesson_request.get('currentPhase', 'new_knowledge')

    # Process MoSCoW priorities for AI prompt
    must_have_priorities = priorities.get('mustHave', [])
    should_have_priorities = priorities.get('shouldHave', [])
    could_have_priorities = priorities.get('couldHave', [])
    wont_have_priorities = priorities.get('wontHave', [])

    # Calculate priority weights for content generation
    priority_focus = generate_priority_focus_string(must_have_priorities, should_have_priorities)
    
    # Determine thematic context based on your design document
    if use_type == 'professional' and specific_situation:
        thematic_context = f"Professional context: {specific_situation}"
        thematic_examples = "business scenarios, workplace vocabulary, formal communication"
    elif use_type == 'personal' and (inspiration or personal_interest):
        thematic_inspiration = inspiration or personal_interest
        thematic_context = f"Personal interest context: {thematic_inspiration}"
        thematic_examples = "themed examples using personal inspiration as narrative framework"
    else:
        thematic_context = "General practical communication"
        thematic_examples = "everyday situations, practical vocabulary"

    # Build the comprehensive prompt following your thematic contextualization methodology
    prompt = f"""You are PACIFIC AI, implementing thematic contextualization for foundational language learning.
    priority_focus=priority_focus,
    current_phase=current_phase,
    priority_time_allocation=priority_time_allocation,
    must_have_priorities=must_have_priorities,
    should_have_priorities=should_have_priorities,
    wont_have_priorities=wont_have_priorities,


CORE TASK: Generate a structured {target_lang} lesson using the user's context as a THEMATIC WRAPPER for standard language curriculum.

CRITICAL INSTRUCTION - THEMATIC CONTEXTUALIZATION:
- DO NOT create content ABOUT the user's inspiration
- DO use their inspiration as a narrative framework for teaching standard {target_lang}
- Think of it as a "themed pencil case" - the theme makes learning exciting, but the core function is language education
- Focus on foundational skills: grammar, vocabulary, sentence structure

USER PROFILE:
- Native Languages: {', '.join(native_languages)}
- Nationality: {nationality}
- Additional Languages: {', '.join(additional_langs) if additional_langs else 'None'}
- Learning Style: {learning_style}
- Current {target_lang} Level: {proficiency}

LESSON CONTEXT:
- Target Language: {target_lang}
- Topic Focus: {topic}
- Thematic Context: {thematic_context}
- Learning Approach: {thematic_examples}

CURRICULUM MAPPING REQUIREMENTS:
1. Extract verifiable traits from the thematic context
2. Map these traits to standard {target_lang} curriculum points
3. Generate exercises using core curriculum but themed with extracted traits
4. Maintain educational primacy - grammar/vocabulary comes first, theme is wrapper

PRIORITY-BASED CONTENT GENERATION (MoSCoW):
- MUST FOCUS ON: {priority_focus}
- Phase Context: {current_phase} learning phase
- Time Allocation: Spend {priority_time_allocation.get('mustHave', 70)}% of lesson time on critical priorities
- Content Weighting: Prioritize must-have items over optional content
- Exercise Selection: Generate exercises that target high-priority learning areas first

RESPONSE FORMAT (JSON):
{{
    "lesson": {{
        "title": "Lesson title incorporating theme naturally",
        "objective": "Clear {target_lang} learning objective (grammar/vocabulary focus)",
        "themeContext": "How the user's context is used as narrative framework",
        "coreContent": {{
            "vocabulary": [
                {{"word": "{target_lang}_word", "translation": "{native_languages[0]}_translation", "context": "themed_example_sentence", "pronunciation": "phonetic_guide"}}
            ],
            "grammar": {{
                "rule": "Specific grammar rule being taught",
                "explanation": "Clear explanation relating to {native_languages[0]} if helpful",
                "examples": ["themed_example_1", "themed_example_2"],
                "practice": ["fill_in_blank_exercise", "transformation_exercise"]
            }},
            "dialogues": [
                {{"speaker1": "Character A", "text": "Themed dialogue line 1"}},
                {{"speaker2": "Character B", "text": "Response using target grammar/vocab"}}
            ],
            "practiceExercises": [
                {{"type": "multiple_choice", "question": "themed_question", "options": ["A", "B", "C", "D"], "correct": 1}},
                {{"type": "translation", "source": "sentence_to_translate", "target": "correct_translation"}},
                {{"type": "fill_blank", "sentence": "themed_sentence_with_____", "answer": "correct_word"}}
            ]
        }},
        "culturalNotes": "Authentic {target_lang} cultural context relevant to lesson",
        "pronunciation": {{
            "focus": "Key pronunciation points for this lesson",
            "drills": ["sound_practice_1", "sound_practice_2"]
        }},
        "nextSteps": "What to study next in the curriculum sequence"
    }},
    "metadata": {{
        "difficultyLevel": "{proficiency}",
        "estimatedTime": "time_in_minutes",
        "skillsFocused": ["vocabulary", "grammar", "pronunciation"],
        "thematicElements": ["list", "of", "theme", "elements", "used"]
    }}
}}

LANGUAGE BRIDGING (if applicable):
- Leverage similarities between {', '.join(native_languages)} and {target_lang}
- Highlight cognates, similar grammar structures, or cultural parallels
- Use native language knowledge to accelerate {target_lang} acquisition

PRIORITY-DRIVEN LESSON STRUCTURE:
- Dedicate primary lesson content to: {', '.join(must_have_priorities[:4]) if must_have_priorities else 'core curriculum'}
- Include secondary content for: {', '.join(should_have_priorities[:3]) if should_have_priorities else 'balanced learning'}
- Minimize or exclude: {', '.join(wont_have_priorities[:2]) if wont_have_priorities else 'none specified'}
- Ensure lesson serves user's specific learning priorities within thematic context

Generate the lesson now, ensuring thematic contextualization follows the "themed pencil case" principle:"""

    return prompt
    

def call_bedrock_nova_pro(prompt: str) -> Dict[str, Any]:
    """
    Call Amazon Nova Pro model via Bedrock
    """
    try:
        logger.info(f"Calling Bedrock Nova Pro model: {NOVA_PRO_MODEL_ID}")
        
        # Prepare the request
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 4000,
                "temperature": 0.7,
                "topP": 0.9
            }
        }
        
        # Make the API call
        response = bedrock_runtime.converse(
            modelId=NOVA_PRO_MODEL_ID,
            messages=request_body["messages"],
            inferenceConfig=request_body["inferenceConfig"]
        )
        
        # Extract the response content
        response_content = response['output']['message']['content'][0]['text']
        
        # Debug: Log the raw AI response
        logger.info(f"Raw AI response: {response_content[:500]}...")

        # Parse JSON response
        try:
            lesson_data = json.loads(response_content)
            logger.info(f"Parsed AI response structure: {json.dumps(lesson_data, default=str)[:300]}...")
            return lesson_data
        except json.JSONDecodeError:
            # If JSON parsing fails, return structured fallback
            logger.warning("Failed to parse JSON response, returning as text")
            return {
                "lesson": {
                    "title": "Generated Language Lesson",
                    "content": response_content,
                    "format": "text_fallback"
                }
            }
    
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"Bedrock API error - Code: {error_code}, Message: {error_message}")
        
        if error_code == 'ThrottlingException':
            raise Exception("API rate limit exceeded. Please try again in a moment.")
        elif error_code == 'ValidationException':
            raise Exception("Invalid request parameters sent to AI model.")
        else:
            raise Exception(f"AI model error: {error_message}")
    
    except Exception as e:
        logger.error(f"Unexpected error calling Bedrock: {e}")
        raise Exception(f"Failed to generate lesson: {str(e)}")

def call_bedrock_nova_lite(prompt: str) -> Dict[str, Any]:
    """
    Call Amazon Nova Lite model for simpler/cheaper operations
    Can be used for validation or simple content generation
    """
    try:
        logger.info(f"Calling Bedrock Nova Lite model: {NOVA_LITE_MODEL_ID}")
        
        request_body = {
            "messages": [
                {
                    "role": "user", 
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 2000,
                "temperature": 0.5,
                "topP": 0.8
            }
        }
        
        response = bedrock_runtime.converse(
            modelId=NOVA_LITE_MODEL_ID,
            messages=request_body["messages"],
            inferenceConfig=request_body["inferenceConfig"]
        )
        
        response_content = response['output']['message']['content'][0]['text']
        
        try:
            return json.loads(response_content)
        except json.JSONDecodeError:
            return {"content": response_content, "format": "text"}
            
    except Exception as e:
        logger.error(f"Error calling Nova Lite: {e}")
        raise

def validate_lesson_content(lesson_data: Dict[str, Any]) -> bool:
    """
    Enhanced validation matching the new lesson structure
    Ensures the AI response meets PACIFIC quality standards
    """
    try:
        lesson = lesson_data.get('lesson', {})
        
        # Required top-level fields
        required_fields = ['title', 'objective', 'themeContext', 'coreContent']
        for field in required_fields:
            if field not in lesson:
                logger.warning(f"Generated lesson missing required field: {field}")
                return False
        
        # Validate core content structure
        core_content = lesson.get('coreContent', {})
        if not core_content.get('vocabulary') and not core_content.get('grammar'):
            logger.warning("Generated lesson lacks substantial vocabulary or grammar content")
            return False
        
        # Ensure thematic contextualization is present but not overwhelming
        if not lesson.get('themeContext'):
            logger.warning("Missing thematic contextualization")
            return False
            
        # Validate practice exercises exist
        practice_exercises = core_content.get('practiceExercises', [])
        if len(practice_exercises) < 2:
            logger.warning("Insufficient practice exercises (minimum 2 required)")
            return False
        
        # Validate vocabulary structure
        vocabulary = core_content.get('vocabulary', [])
        for vocab_item in vocabulary:
            if not all(key in vocab_item for key in ['word', 'translation', 'context']):
                logger.warning("Vocabulary item missing required fields")
                return False
        
        # Validate grammar structure
        grammar = core_content.get('grammar', {})
        if grammar and not all(key in grammar for key in ['rule', 'explanation', 'examples']):
            logger.warning("Grammar section missing required fields")
            return False
        
        logger.info("Lesson content validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Error validating lesson content: {e}")
        return False

# Add new function to handle frontend data structure
def preprocess_frontend_request(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> tuple:
    """
    Preprocess and validate frontend data structure
    Ensures compatibility with PACIFIC frontend components
    """
    try:
        # Ensure native languages is always an array
        if isinstance(user_profile.get('nativeLanguages'), str):
            user_profile['nativeLanguages'] = [user_profile['nativeLanguages']]
        
        # Ensure additional languages is always an array
        if not isinstance(user_profile.get('additionalLanguages'), list):
            user_profile['additionalLanguages'] = []
        
        # Handle target language data structure
        target_lang = lesson_request.get('targetLanguage')
        if isinstance(target_lang, dict):
            # From LanguageSelector component
            lesson_request['targetLanguage'] = target_lang.get('language', 'Unknown')
            if 'reason' in target_lang:
                # Incorporate reason into contextual use
                if 'contextualUse' not in lesson_request:
                    lesson_request['contextualUse'] = {}
                lesson_request['contextualUse']['inspiration'] = target_lang['reason']
        
        # Ensure contextual use has proper structure
        if 'contextualUse' not in lesson_request:
            lesson_request['contextualUse'] = {'type': 'personal'}
        
        return user_profile, lesson_request
        
    except Exception as e:
        logger.error(f"Error preprocessing frontend request: {e}")
        raise ValueError(f"Invalid frontend data structure: {str(e)}")