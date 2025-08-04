from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
import os
import logging
from datetime import datetime
import openai
from dotenv import load_dotenv
import re
import json
from typing import Dict, List, Optional
import nltk
from textblob import TextBlob
import spacy

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure API documentation
api = Api(app, 
    version='1.0', 
    title='MailFlow AI Service',
    description='AI-powered email generation and processing service for interview management',
    doc='/docs/'
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure OpenAI (if API key is provided)
openai_client = None
if os.getenv('OPENAI_API_KEY'):
    openai.api_key = os.getenv('OPENAI_API_KEY')
    openai_client = openai.OpenAI()

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
except:
    logger.warning("Failed to download NLTK data")

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    logger.warning("spaCy model not found. Please install: python -m spacy download en_core_web_sm")
    nlp = None

# API Models
ns_ai = api.namespace('ai', description='AI Operations')

generate_email_model = api.model('GenerateEmail', {
    'template_type': fields.String(required=True, description='Type of email template'),
    'context': fields.Raw(description='Context data for email generation'),
    'tone': fields.String(description='Tone of the email (formal, casual, friendly)'),
    'length': fields.String(description='Length preference (short, medium, long)'),
    'include_company_info': fields.Boolean(description='Include company information'),
    'personalization_level': fields.String(description='Level of personalization (basic, detailed)')
})

analyze_email_model = api.model('AnalyzeEmail', {
    'content': fields.String(required=True, description='Email content to analyze'),
    'analysis_type': fields.String(description='Type of analysis (sentiment, readability, tone)')
})

improve_email_model = api.model('ImproveEmail', {
    'content': fields.String(required=True, description='Email content to improve'),
    'improvement_type': fields.String(description='Type of improvement (clarity, tone, length)')
})

class AIEmailGenerator:
    """AI-powered email generation service"""
    
    def __init__(self):
        self.templates = {
            'interview-invitation': {
                'subject_templates': [
                    "Interview Invitation - {position} Position at {company}",
                    "Let's schedule your interview for the {position} role",
                    "Next step: Interview for {position} at {company}"
                ],
                'body_structure': {
                    'greeting': "Dear {candidate_name},",
                    'opening': "We are {opening_phrase} to invite you for an interview for the {position} position.",
                    'body': "Based on your {qualification_highlight}, we believe you would be {fit_description} for our team.",
                    'details': "Interview details:\n- Date: {date}\n- Time: {time}\n- Type: {interview_type}\n- Duration: {duration}",
                    'next_steps': "Please {action_request} to confirm your availability.",
                    'closing': "We look forward to {meeting_phrase} you!\n\nBest regards,\n{sender_name}\n{company}"
                }
            },
            'follow-up': {
                'subject_templates': [
                    "Following up on your {position} application",
                    "Update on your application - {position} role",
                    "Thank you for your interest in {position}"
                ],
                'body_structure': {
                    'greeting': "Dear {candidate_name},",
                    'opening': "Thank you for your interest in the {position} role at {company}.",
                    'body': "We {update_message} and wanted to {contact_reason}.",
                    'timeline': "We expect to {timeline_info} within {timeframe}.",
                    'closing': "Thank you for your patience.\n\nBest regards,\n{sender_name}\n{company}"
                }
            },
            'offer': {
                'subject_templates': [
                    "Job Offer - {position} Position at {company}",
                    "Congratulations! Offer for {position} role",
                    "We'd love to have you join our team - {position}"
                ],
                'body_structure': {
                    'greeting': "Dear {candidate_name},",
                    'opening': "We are {excitement_phrase} to extend an offer for the {position} position.",
                    'body': "After {evaluation_process}, we believe you would be {value_statement}.",
                    'details': "Offer details:\n- Position: {position}\n- Start Date: {start_date}\n- Compensation: {salary_range}",
                    'next_steps': "Please review the attached offer letter and {response_request}.",
                    'closing': "We look forward to welcoming you to the team!\n\nBest regards,\n{sender_name}\n{company}"
                }
            },
            'rejection': {
                'subject_templates': [
                    "Update on your {position} application",
                    "Thank you for your interest in {position}",
                    "Application status update - {position}"
                ],
                'body_structure': {
                    'greeting': "Dear {candidate_name},",
                    'opening': "Thank you for your interest in the {position} position and for {application_effort}.",
                    'body': "After {evaluation_process}, we have decided to {decision_explanation}.",
                    'feedback': "We were impressed with {positive_feedback} and encourage you to {future_encouragement}.",
                    'closing': "Thank you again for your interest.\n\nBest regards,\n{sender_name}\n{company}"
                }
            }
        }
        
        self.tone_variations = {
            'formal': {
                'opening_phrases': ['pleased', 'delighted', 'honored'],
                'meeting_phrases': ['meeting with', 'speaking with', 'interviewing'],
                'fit_descriptions': ['an excellent fit', 'a strong candidate', 'well-suited'],
                'excitement_phrases': ['delighted', 'pleased', 'excited']
            },
            'friendly': {
                'opening_phrases': ['excited', 'thrilled', 'happy'],
                'meeting_phrases': ['chatting with', 'meeting', 'connecting with'],
                'fit_descriptions': ['a great fit', 'perfect for', 'ideal for'],
                'excitement_phrases': ['thrilled', 'excited', 'happy']
            },
            'casual': {
                'opening_phrases': ['happy', 'excited', 'glad'],
                'meeting_phrases': ['talking with', 'meeting', 'having a chat with'],
                'fit_descriptions': ['a good fit', 'right for', 'great for'],
                'excitement_phrases': ['excited', 'happy', 'glad']
            }
        }

    def generate_email(self, template_type: str, context: Dict, tone: str = 'formal', 
                      length: str = 'medium', use_ai: bool = True) -> Dict:
        """Generate an email based on template type and context"""
        
        try:
            if template_type not in self.templates:
                return {'error': f'Template type {template_type} not found'}
            
            template = self.templates[template_type]
            tone_vars = self.tone_variations.get(tone, self.tone_variations['formal'])
            
            # Generate subject
            subject_template = template['subject_templates'][0]  # Default to first template
            subject = self._fill_template(subject_template, context)
            
            # Generate body
            body_parts = []
            for section, template_text in template['body_structure'].items():
                # Add tone variations
                filled_template = self._fill_template_with_tone(template_text, context, tone_vars)
                body_parts.append(filled_template)
            
            body = '\n\n'.join(body_parts)
            
            # Use AI enhancement if available and requested
            if use_ai and openai_client:
                try:
                    enhanced = self._enhance_with_ai(subject, body, template_type, context, tone, length)
                    if enhanced:
                        return enhanced
                except Exception as e:
                    logger.warning(f"AI enhancement failed: {e}")
            
            return {
                'subject': subject,
                'body': body,
                'template_type': template_type,
                'tone': tone,
                'generated_at': datetime.now().isoformat(),
                'method': 'template-based'
            }
            
        except Exception as e:
            logger.error(f"Error generating email: {e}")
            return {'error': str(e)}

    def _fill_template(self, template: str, context: Dict) -> str:
        """Fill template with context data"""
        try:
            return template.format(**context)
        except KeyError as e:
            # Handle missing keys gracefully
            logger.warning(f"Missing context key: {e}")
            return template

    def _fill_template_with_tone(self, template: str, context: Dict, tone_vars: Dict) -> str:
        """Fill template with context and tone variations"""
        # Add tone variations to context
        enhanced_context = {**context}
        
        # Randomly select tone variations
        import random
        for key, values in tone_vars.items():
            placeholder_key = key.replace('_phrases', '_phrase').replace('_descriptions', '_description')
            enhanced_context[placeholder_key] = random.choice(values)
        
        return self._fill_template(template, enhanced_context)

    def _enhance_with_ai(self, subject: str, body: str, template_type: str, 
                        context: Dict, tone: str, length: str) -> Optional[Dict]:
        """Enhance email using AI"""
        
        if not openai_client:
            return None
            
        try:
            prompt = f"""
            Improve this {template_type} email to be more {tone} and {length}. 
            
            Current Subject: {subject}
            Current Body: {body}
            
            Context: {json.dumps(context, indent=2)}
            
            Please provide:
            1. An improved subject line
            2. An enhanced email body that maintains professionalism while being {tone}
            3. Ensure the tone is {tone} and length is {length}
            
            Return only JSON with 'subject' and 'body' fields.
            """
            
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert email writer specializing in professional recruitment communications."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'subject': result.get('subject', subject),
                'body': result.get('body', body),
                'template_type': template_type,
                'tone': tone,
                'generated_at': datetime.now().isoformat(),
                'method': 'ai-enhanced'
            }
            
        except Exception as e:
            logger.error(f"AI enhancement error: {e}")
            return None

class EmailAnalyzer:
    """Email content analysis service"""
    
    def analyze_sentiment(self, content: str) -> Dict:
        """Analyze sentiment of email content"""
        try:
            blob = TextBlob(content)
            sentiment = blob.sentiment
            
            # Classify sentiment
            if sentiment.polarity > 0.1:
                sentiment_label = 'positive'
            elif sentiment.polarity < -0.1:
                sentiment_label = 'negative'
            else:
                sentiment_label = 'neutral'
            
            return {
                'sentiment': sentiment_label,
                'polarity': sentiment.polarity,
                'subjectivity': sentiment.subjectivity,
                'confidence': abs(sentiment.polarity)
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {'error': str(e)}

    def analyze_readability(self, content: str) -> Dict:
        """Analyze readability of email content"""
        try:
            # Basic readability metrics
            sentences = content.split('.')
            words = content.split()
            
            avg_sentence_length = len(words) / max(len(sentences), 1)
            
            # Count complex words (3+ syllables)
            complex_words = [word for word in words if self._count_syllables(word) >= 3]
            complex_word_ratio = len(complex_words) / max(len(words), 1)
            
            # Simple readability score
            readability_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * complex_word_ratio)
            
            if readability_score >= 90:
                level = 'very_easy'
            elif readability_score >= 80:
                level = 'easy'
            elif readability_score >= 70:
                level = 'fairly_easy'
            elif readability_score >= 60:
                level = 'standard'
            elif readability_score >= 50:
                level = 'fairly_difficult'
            else:
                level = 'difficult'
            
            return {
                'readability_score': readability_score,
                'readability_level': level,
                'average_sentence_length': avg_sentence_length,
                'complex_word_ratio': complex_word_ratio,
                'word_count': len(words),
                'sentence_count': len(sentences)
            }
            
        except Exception as e:
            logger.error(f"Readability analysis error: {e}")
            return {'error': str(e)}

    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = is_vowel
        
        # Handle silent e
        if word.endswith('e'):
            syllable_count -= 1
        
        return max(1, syllable_count)

    def extract_entities(self, content: str) -> Dict:
        """Extract named entities from email content"""
        if not nlp:
            return {'error': 'spaCy model not available'}
            
        try:
            doc = nlp(content)
            
            entities = {
                'persons': [],
                'organizations': [],
                'dates': [],
                'locations': [],
                'other': []
            }
            
            for ent in doc.ents:
                entity_info = {
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                }
                
                if ent.label_ in ['PERSON']:
                    entities['persons'].append(entity_info)
                elif ent.label_ in ['ORG', 'PRODUCT']:
                    entities['organizations'].append(entity_info)
                elif ent.label_ in ['DATE', 'TIME']:
                    entities['dates'].append(entity_info)
                elif ent.label_ in ['GPE', 'LOC']:
                    entities['locations'].append(entity_info)
                else:
                    entities['other'].append(entity_info)
            
            return entities
            
        except Exception as e:
            logger.error(f"Entity extraction error: {e}")
            return {'error': str(e)}

# Initialize services
email_generator = AIEmailGenerator()
email_analyzer = EmailAnalyzer()

# API Routes
@ns_ai.route('/generate-email')
class GenerateEmail(Resource):
    @ns_ai.expect(generate_email_model)
    def post(self):
        """Generate an AI-powered email"""
        try:
            data = request.json
            
            template_type = data.get('template_type', 'interview-invitation')
            context = data.get('context', {})
            tone = data.get('tone', 'formal')
            length = data.get('length', 'medium')
            
            # Set default context values if missing
            default_context = {
                'candidate_name': context.get('candidate_name', '[Candidate Name]'),
                'position': context.get('position', '[Position]'),
                'company': context.get('company', 'Our Company'),
                'sender_name': context.get('sender_name', 'HR Team'),
                'date': context.get('date', '[Date]'),
                'time': context.get('time', '[Time]'),
                'interview_type': context.get('interview_type', 'video interview'),
                'duration': context.get('duration', '45 minutes'),
                'action_request': 'reply to this email',
                'application_effort': 'taking the time to apply',
                'evaluation_process': 'careful consideration',
                'decision_explanation': 'move forward with other candidates',
                'positive_feedback': 'your qualifications',
                'future_encouragement': 'apply for future opportunities',
                'qualification_highlight': 'background and experience',
                'update_message': 'have received your application',
                'contact_reason': 'provide you with an update',
                'timeline_info': 'make a decision',
                'timeframe': 'the next two weeks',
                'salary_range': '[Salary Range]',
                'start_date': '[Start Date]',
                'response_request': 'let us know your decision by [Date]',
                'value_statement': 'a valuable addition to our team'
            }
            
            # Merge with provided context
            final_context = {**default_context, **context}
            
            result = email_generator.generate_email(
                template_type=template_type,
                context=final_context,
                tone=tone,
                length=length,
                use_ai=True
            )
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Email generation error: {e}")
            return {'error': str(e)}, 500

@ns_ai.route('/analyze-email')
class AnalyzeEmail(Resource):
    @ns_ai.expect(analyze_email_model)
    def post(self):
        """Analyze email content"""
        try:
            data = request.json
            content = data.get('content', '')
            analysis_type = data.get('analysis_type', 'all')
            
            results = {}
            
            if analysis_type in ['sentiment', 'all']:
                results['sentiment'] = email_analyzer.analyze_sentiment(content)
            
            if analysis_type in ['readability', 'all']:
                results['readability'] = email_analyzer.analyze_readability(content)
            
            if analysis_type in ['entities', 'all']:
                results['entities'] = email_analyzer.extract_entities(content)
            
            return jsonify({
                'analysis': results,
                'analyzed_at': datetime.now().isoformat(),
                'content_length': len(content)
            })
            
        except Exception as e:
            logger.error(f"Email analysis error: {e}")
            return {'error': str(e)}, 500

@ns_ai.route('/improve-email')
class ImproveEmail(Resource):
    @ns_ai.expect(improve_email_model)
    def post(self):
        """Improve email content using AI"""
        try:
            data = request.json
            content = data.get('content', '')
            improvement_type = data.get('improvement_type', 'general')
            
            if not openai_client:
                return {'error': 'AI service not available'}, 503
            
            # Create improvement prompt based on type
            prompts = {
                'clarity': "Improve the clarity and readability of this email while maintaining its professional tone:",
                'tone': "Adjust the tone of this email to be more professional and engaging:",
                'length': "Make this email more concise while preserving all important information:",
                'general': "Improve this email for better clarity, tone, and effectiveness:"
            }
            
            prompt = f"{prompts.get(improvement_type, prompts['general'])}\n\n{content}\n\nProvide only the improved email content."
            
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert email writer specializing in professional communications."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            improved_content = response.choices[0].message.content.strip()
            
            return jsonify({
                'original_content': content,
                'improved_content': improved_content,
                'improvement_type': improvement_type,
                'improved_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Email improvement error: {e}")
            return {'error': str(e)}, 500

@ns_ai.route('/templates')
class EmailTemplates(Resource):
    def get(self):
        """Get available email templates"""
        try:
            template_info = {}
            for template_type, template_data in email_generator.templates.items():
                template_info[template_type] = {
                    'subject_templates': template_data['subject_templates'],
                    'structure_keys': list(template_data['body_structure'].keys()),
                    'description': f"Template for {template_type.replace('-', ' ')} emails"
                }
            
            return jsonify({
                'templates': template_info,
                'available_tones': list(email_generator.tone_variations.keys()),
                'supported_lengths': ['short', 'medium', 'long']
            })
            
        except Exception as e:
            logger.error(f"Template retrieval error: {e}")
            return {'error': str(e)}, 500

@api.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Health check endpoint"""
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'ai_service_available': openai_client is not None,
            'nlp_service_available': nlp is not None,
            'version': '1.0.0'
        }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)