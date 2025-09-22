import json
import boto3
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-5')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

# DynamoDB table
LESSONS_TABLE = dynamodb.Table('pacific-lessons')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for PACIFIC lesson generation
    NOW with proper frontend data structure handling
    """
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Handle preflight CORS requests
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'CORS preflight handled'})
            }
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return error_response(400, "Invalid JSON in request body")
        
        logger.info(f"Request body: {json.dumps(body)}")
        
        # Extract required parameters
        user_profile = body.get('userProfile', {})
        lesson_request = body.get('lessonRequest', {})
        
        # Validate input with frontend-aware validation
        validation_error = validate_input(user_profile, lesson_request)
        if validation_error:
            return error_response(400, validation_error)
        
        # Route to different handlers based on path
        path = event.get('path', '')
        
        if path == '/api/ai/generate-scenario':
            # Import the new functions from integrationLayer
            from integrationLayer import generate_simulation_scenario
            scenario_result = generate_simulation_scenario(processed_profile, processed_request)
            return success_response(scenario_result)
            
        elif path == '/api/ai/generate-dialogue':
            from integrationLayer import generate_simulation_dialogue
            dialogue_result = generate_simulation_dialogue(processed_profile, processed_request)
            return success_response(dialogue_result)
            
        elif path == '/api/ai/continue-dialogue':
            from integrationLayer import continue_simulation_dialogue
            continuation_result = continue_simulation_dialogue(processed_profile, processed_request)
            return success_response(continuation_result)
            
        else:
            # Default to lesson generation (existing functionality)
            lesson_result = process_lesson_request(processed_profile, processed_request)
            return success_response(lesson_result)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return error_response(500, f"Internal server error: {str(e)}")

# Add health check endpoint for monitoring
def handle_health_check() -> Dict[str, Any]:
    """
    Health check endpoint for API monitoring
    """
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'status': 'healthy',
            'service': 'PACIFIC Lesson Generator',
            'version': '1.0',
            'timestamp': datetime.utcnow().isoformat()
        })
    }

def get_cors_headers() -> Dict[str, str]:
    """Return CORS headers for cross-origin requests"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }

def validate_input(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> Optional[str]:
    """
    Validate the input parameters matching PACIFIC frontend data structure
    Returns error message if validation fails, None if valid
    """
    # Check user profile required fields - matching ProfileProgressTracker structure
    if not user_profile:
        return "Missing user profile"
    
    # Validate nationality (required by ProfileProgressTracker)
    if not user_profile.get('nationality'):
        return "Missing required user profile field: nationality"
    
    # Validate native languages - must be array from LanguageSelector
    native_languages = user_profile.get('nativeLanguages')
    if not native_languages:
        return "Missing required user profile field: nativeLanguages"
    
    if isinstance(native_languages, str):
        # Convert string to array for compatibility
        user_profile['nativeLanguages'] = [native_languages]
    elif not isinstance(native_languages, list) or len(native_languages) == 0:
        return "nativeLanguages must be a non-empty array"
    
    # Validate additional languages (should be array)
    additional_languages = user_profile.get('additionalLanguages', [])
    if not isinstance(additional_languages, list):
        return "additionalLanguages must be an array"
    
    # Validate learning style (from LearningStyleConfig)
    learning_style = user_profile.get('learningStyle')
    if not learning_style:
        return "Missing required user profile field: learningStyle"
    
    valid_learning_styles = ['visual', 'auditory', 'reading', 'kinesthetic', 'balanced', 
                            'visual-auditory', 'visual-kinesthetic', 'auditory-kinesthetic']
    if learning_style not in valid_learning_styles:
        return f"Invalid learning style: {learning_style}"
    
    # Check lesson request required fields
    if not lesson_request:
        return "Missing lesson request"
    
    # Validate target language - from LanguageSelector component
    target_language = lesson_request.get('targetLanguage')
    if not target_language:
        return "Missing required lesson request field: targetLanguage"
    
    # Handle both string and object formats from frontend
    if isinstance(target_language, dict):
        if not target_language.get('language'):
            return "Target language object missing 'language' field"
        if not isinstance(target_language.get('language'), str) or not target_language['language'].strip():
            return "Target language must be a non-empty string"
    elif isinstance(target_language, str):
        if not target_language.strip():
            return "Target language must be a non-empty string"
    else:
        return "Target language must be string or object with 'language' field"
    
    # Validate contextual use (optional but structure matters if present)
    contextual_use = lesson_request.get('contextualUse', {})
    if contextual_use and not isinstance(contextual_use, dict):
        return "contextualUse must be an object"
    
    # Validate topic (optional)
    topic = lesson_request.get('topic', 'Basic Communication')
    if not isinstance(topic, str):
        return "topic must be a string"
    
    # Validate proficiency level if provided
    proficiency = lesson_request.get('proficiencyLevel')
    if proficiency:
        valid_cefr_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        if proficiency not in valid_cefr_levels:
            return f"Invalid proficiency level: {proficiency}. Must be one of {valid_cefr_levels}"
    
    # Validate placement test results if present
    placement_test = user_profile.get('placementTest')
    if placement_test and not isinstance(placement_test, dict):
        return "placementTest must be an object"
    
    if placement_test:
        cefr_level = placement_test.get('cefrLevel')
        if cefr_level:
            valid_cefr_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
            if cefr_level not in valid_cefr_levels:
                return f"Invalid CEFR level in placement test: {cefr_level}"
    
    # Validate learning phase if provided (from PhaseManager)
    learning_phase = lesson_request.get('learningPhase')
    if learning_phase:
        valid_phases = ['new_knowledge', 'consolidate', 'simulation']
        if learning_phase not in valid_phases:
            return f"Invalid learning phase: {learning_phase}. Must be one of {valid_phases}"
    
    return None

def preprocess_request_data(user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> tuple:
    """
    Preprocess and normalize request data for internal processing
    Ensures compatibility between frontend and backend data structures
    """
    # Deep copy to avoid modifying original data
    import copy
    processed_profile = copy.deepcopy(user_profile)
    processed_request = copy.deepcopy(lesson_request)
    
    # Normalize native languages to array
    native_langs = processed_profile.get('nativeLanguages')
    if isinstance(native_langs, str):
        processed_profile['nativeLanguages'] = [native_langs]
    
    # Ensure additional languages is array
    if 'additionalLanguages' not in processed_profile:
        processed_profile['additionalLanguages'] = []
    
    # Normalize target language
    target_lang = processed_request.get('targetLanguage')
    if isinstance(target_lang, dict):
        # Extract language string and preserve other data
        processed_request['targetLanguage'] = target_lang.get('language', 'Unknown')
        
        # Move additional target language data to contextual use
        if 'reason' in target_lang:
            if 'contextualUse' not in processed_request:
                processed_request['contextualUse'] = {}
            processed_request['contextualUse']['inspiration'] = target_lang['reason']
        
        if 'isSpanishSpecialty' in target_lang:
            if 'contextualUse' not in processed_request:
                processed_request['contextualUse'] = {}
            processed_request['contextualUse']['isSpanishSpecialty'] = target_lang['isSpanishSpecialty']
    
    # Ensure contextual use has default structure
    if 'contextualUse' not in processed_request:
        processed_request['contextualUse'] = {'type': 'personal'}
    
    # Extract proficiency from placement test if not provided directly
    if 'proficiencyLevel' not in processed_request:
        placement_test = processed_profile.get('placementTest', {})
        cefr_level = placement_test.get('cefrLevel')
        if cefr_level:
            processed_request['proficiencyLevel'] = cefr_level
        else:
            processed_request['proficiencyLevel'] = 'A1'  # Default for beginners
    
    # Add default topic if missing
    if 'topic' not in processed_request:
        processed_request['topic'] = 'Basic Communication'
    
    return processed_profile, processed_request


# Import the integration layer
from integrationLayer import process_lesson_request, handle_system_health_check