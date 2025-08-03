const OpenAI = require('openai');
const moment = require('moment');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 1000;
  }

  /**
   * Generate email content based on prompt and context
   */
  async generateEmailContent(prompt, context = {}) {
    try {
      const {
        industry = '',
        tone = 'professional',
        targetAudience = '',
        campaignType = 'marketing',
        keyPoints = [],
        brandVoice = '',
        callToAction = ''
      } = context;

      const systemPrompt = `You are an expert email marketing copywriter. Create engaging, high-converting email content that follows best practices for email marketing. 

Guidelines:
- Write in a ${tone} tone
- Target audience: ${targetAudience || 'general audience'}
- Industry: ${industry || 'general'}
- Campaign type: ${campaignType}
- Brand voice: ${brandVoice || 'friendly and professional'}
- Include a clear call-to-action: ${callToAction || 'engage with our brand'}
- Keep paragraphs short and scannable
- Use personalization opportunities where appropriate
- Follow email marketing best practices for deliverability
- Ensure mobile-friendly formatting

Key points to include:
${keyPoints.length > 0 ? keyPoints.map(point => `- ${point}`).join('\n') : '- Focus on value proposition\n- Address customer pain points\n- Create urgency or relevance'}

Format your response as JSON with the following structure:
{
  "html": "HTML formatted email content with proper structure",
  "text": "Plain text version of the email",
  "subject_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "personalization_fields": ["first_name", "company", "location"],
  "estimated_reading_time": "2 minutes",
  "key_message": "Brief summary of the main message"
}`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens * 2, // Allow more tokens for email generation
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: {
          html: response.html,
          text: response.text,
          subjectSuggestions: response.subject_suggestions || [],
          personalizationFields: response.personalization_fields || [],
          estimatedReadingTime: response.estimated_reading_time || '2 minutes',
          keyMessage: response.key_message || '',
          tokensUsed: completion.usage?.total_tokens || 0,
          confidence: this.calculateConfidenceScore(completion)
        }
      };

    } catch (error) {
      console.error('AI email content generation error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getEmailContentFallback(context)
      };
    }
  }

  /**
   * Generate subject line suggestions
   */
  async generateSubjectLines(emailContent, context = {}) {
    try {
      const {
        industry = '',
        campaignType = 'marketing',
        targetAudience = '',
        tone = 'professional',
        maxLength = 60
      } = context;

      const systemPrompt = `You are an expert email marketing specialist focused on creating high-converting subject lines.

Guidelines:
- Maximum length: ${maxLength} characters
- Tone: ${tone}
- Industry: ${industry || 'general'}
- Campaign type: ${campaignType}
- Target audience: ${targetAudience || 'general audience'}
- Avoid spam trigger words
- Create urgency without being pushy
- Use personalization opportunities
- A/B test friendly variations
- Focus on benefits, not features
- Create curiosity and interest

Generate 10 subject line variations with different approaches:
- Benefit-focused
- Urgency-driven
- Curiosity-inducing
- Personal/Direct
- Question-based
- Emotional appeal
- Social proof
- Seasonal/Timely
- Problem-solving
- Value proposition

Format as JSON:
{
  "subject_lines": [
    {
      "text": "subject line text",
      "type": "benefit-focused",
      "length": 45,
      "estimated_open_rate": 25.5,
      "personalization_used": false,
      "urgency_level": "medium"
    }
  ],
  "best_recommendation": "subject line text",
  "reasoning": "Why this subject line is recommended"
}`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate subject lines for this email content: ${emailContent.substring(0, 500)}...`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: {
          subjectLines: response.subject_lines || [],
          bestRecommendation: response.best_recommendation || '',
          reasoning: response.reasoning || '',
          tokensUsed: completion.usage?.total_tokens || 0,
          confidence: this.calculateConfidenceScore(completion)
        }
      };

    } catch (error) {
      console.error('AI subject line generation error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getSubjectLineFallback(context)
      };
    }
  }

  /**
   * Optimize send time based on audience analysis
   */
  async optimizeSendTime(audienceData, campaignContext = {}) {
    try {
      const {
        campaignType = 'marketing',
        industry = '',
        timezone = 'UTC',
        urgency = 'medium'
      } = campaignContext;

      const systemPrompt = `You are an email marketing optimization expert specializing in send time optimization.

Analyze the audience data and recommend the optimal send time considering:
- Audience demographics and behavior patterns
- Industry best practices
- Campaign type and urgency
- Timezone considerations
- Historical engagement patterns
- Day of week performance
- Seasonal factors

Format response as JSON:
{
  "recommended_time": {
    "datetime": "2024-01-15T10:00:00Z",
    "local_time": "10:00 AM",
    "day_of_week": "Monday",
    "timezone": "UTC"
  },
  "alternative_times": [
    {
      "datetime": "2024-01-15T14:00:00Z",
      "local_time": "2:00 PM",
      "confidence": 85,
      "reason": "Secondary peak engagement time"
    }
  ],
  "reasoning": "Detailed explanation for the recommendation",
  "expected_open_rate_improvement": 15.2,
  "confidence_score": 88
}`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Optimize send time for:
            Campaign Type: ${campaignType}
            Industry: ${industry}
            Timezone: ${timezone}
            Urgency: ${urgency}
            Audience Data: ${JSON.stringify(audienceData, null, 2)}`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for optimization tasks
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: {
          recommendedTime: response.recommended_time,
          alternativeTimes: response.alternative_times || [],
          reasoning: response.reasoning || '',
          expectedImprovement: response.expected_open_rate_improvement || 0,
          confidenceScore: response.confidence_score || 0,
          tokensUsed: completion.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('AI send time optimization error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getSendTimeFallback(campaignContext)
      };
    }
  }

  /**
   * Personalize email content for specific contact
   */
  async personalizeContent(emailContent, contactData, personalizationRules = {}) {
    try {
      const systemPrompt = `You are an email personalization expert. Personalize the email content based on the contact data while maintaining the original message and tone.

Personalization Guidelines:
- Use contact's name naturally in the content
- Reference relevant information about their company, location, or interests
- Adapt examples to their industry or role
- Maintain the original message and call-to-action
- Keep personalization subtle and natural
- Ensure all personalizations have fallbacks

Format response as JSON:
{
  "personalized_html": "HTML content with personalizations",
  "personalized_text": "Text content with personalizations",
  "personalized_subject": "Personalized subject line",
  "personalization_elements": [
    {
      "type": "name",
      "original": "Dear Customer",
      "personalized": "Dear John",
      "field_used": "firstName"
    }
  ],
  "fallback_content": "Content to use if personalization data is missing"
}`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Personalize this email content:
            
            Email Content: ${emailContent}
            
            Contact Data: ${JSON.stringify(contactData, null, 2)}
            
            Personalization Rules: ${JSON.stringify(personalizationRules, null, 2)}`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: {
          personalizedHtml: response.personalized_html || emailContent,
          personalizedText: response.personalized_text || emailContent,
          personalizedSubject: response.personalized_subject || '',
          personalizationElements: response.personalization_elements || [],
          fallbackContent: response.fallback_content || emailContent,
          tokensUsed: completion.usage?.total_tokens || 0,
          confidence: this.calculateConfidenceScore(completion)
        }
      };

    } catch (error) {
      console.error('AI personalization error:', error);
      return {
        success: false,
        error: error.message,
        fallback: {
          personalizedHtml: emailContent,
          personalizedText: emailContent,
          personalizedSubject: '',
          personalizationElements: [],
          fallbackContent: emailContent
        }
      };
    }
  }

  /**
   * Analyze campaign performance and provide improvement suggestions
   */
  async analyzeCampaignPerformance(campaignData, benchmarkData = {}) {
    try {
      const systemPrompt = `You are an email marketing performance analyst. Analyze the campaign data and provide actionable insights and improvement recommendations.

Analysis Framework:
- Compare performance against industry benchmarks
- Identify strengths and weaknesses
- Provide specific, actionable recommendations
- Suggest A/B test opportunities
- Recommend optimization strategies
- Consider deliverability factors

Format response as JSON:
{
  "performance_summary": {
    "overall_score": 85,
    "open_rate_assessment": "above_average",
    "click_rate_assessment": "below_average",
    "key_strengths": ["strength1", "strength2"],
    "key_weaknesses": ["weakness1", "weakness2"]
  },
  "recommendations": [
    {
      "category": "subject_line",
      "priority": "high",
      "suggestion": "Specific recommendation",
      "expected_impact": "10-15% improvement in open rates",
      "implementation": "How to implement this change"
    }
  ],
  "ab_test_suggestions": [
    {
      "test_type": "subject_line",
      "hypothesis": "Testing hypothesis",
      "variants": ["variant1", "variant2"],
      "success_metric": "open_rate"
    }
  ],
  "next_steps": ["action1", "action2", "action3"]
}`;

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze this campaign performance:
            
            Campaign Data: ${JSON.stringify(campaignData, null, 2)}
            
            Benchmark Data: ${JSON.stringify(benchmarkData, null, 2)}`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: {
          performanceSummary: response.performance_summary || {},
          recommendations: response.recommendations || [],
          abTestSuggestions: response.ab_test_suggestions || [],
          nextSteps: response.next_steps || [],
          tokensUsed: completion.usage?.total_tokens || 0,
          confidence: this.calculateConfidenceScore(completion)
        }
      };

    } catch (error) {
      console.error('AI campaign analysis error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getCampaignAnalysisFallback()
      };
    }
  }

  /**
   * Calculate confidence score based on AI response quality
   */
  calculateConfidenceScore(completion) {
    try {
      const finishReason = completion.choices[0].finish_reason;
      const messageLength = completion.choices[0].message.content.length;
      
      let confidence = 0;
      
      // Base score on finish reason
      if (finishReason === 'stop') {
        confidence += 70;
      } else if (finishReason === 'length') {
        confidence += 50;
      } else {
        confidence += 30;
      }
      
      // Adjust based on response length
      if (messageLength > 500) {
        confidence += 20;
      } else if (messageLength > 200) {
        confidence += 10;
      }
      
      // Cap at 95 to indicate AI uncertainty
      return Math.min(confidence, 95);
      
    } catch (error) {
      return 60; // Default medium confidence
    }
  }

  /**
   * Fallback methods for when AI service fails
   */
  getEmailContentFallback(context) {
    return {
      html: `<p>Hello {{firstName}},</p>
             <p>We're excited to share something special with you.</p>
             <p>Best regards,<br>The Team</p>`,
      text: `Hello {{firstName}},\n\nWe're excited to share something special with you.\n\nBest regards,\nThe Team`,
      subjectSuggestions: ['Important Update', 'Special Announcement', 'Just for You'],
      personalizationFields: ['firstName', 'company'],
      estimatedReadingTime: '1 minute',
      keyMessage: 'General communication'
    };
  }

  getSubjectLineFallback(context) {
    const { campaignType = 'marketing' } = context;
    const fallbacks = {
      marketing: ['Limited Time Offer', 'Don\'t Miss Out', 'Special Just for You'],
      newsletter: ['This Week\'s Update', 'Latest News', 'Your Weekly Digest'],
      announcement: ['Important Update', 'Big News', 'Exciting Announcement']
    };
    
    return {
      subjectLines: fallbacks[campaignType] || fallbacks.marketing,
      bestRecommendation: fallbacks[campaignType]?.[0] || 'Important Update',
      reasoning: 'Fallback subject lines when AI service is unavailable'
    };
  }

  getSendTimeFallback(context) {
    const now = moment();
    const recommendedTime = now.clone().add(1, 'day').hour(10).minute(0).second(0);
    
    return {
      recommendedTime: {
        datetime: recommendedTime.toISOString(),
        localTime: '10:00 AM',
        dayOfWeek: recommendedTime.format('dddd'),
        timezone: 'UTC'
      },
      alternativeTimes: [
        {
          datetime: recommendedTime.clone().hour(14).toISOString(),
          localTime: '2:00 PM',
          confidence: 75,
          reason: 'Alternative peak time'
        }
      ],
      reasoning: 'Default send time optimization when AI service is unavailable',
      expectedImprovement: 0,
      confidenceScore: 60
    };
  }

  getCampaignAnalysisFallback() {
    return {
      performanceSummary: {
        overallScore: 70,
        openRateAssessment: 'average',
        clickRateAssessment: 'average',
        keyStrengths: ['Campaign was delivered successfully'],
        keyWeaknesses: ['Analysis requires AI service']
      },
      recommendations: [{
        category: 'general',
        priority: 'medium',
        suggestion: 'Review campaign metrics manually',
        expectedImpact: 'Various improvements possible',
        implementation: 'Analyze performance data and compare with industry benchmarks'
      }],
      abTestSuggestions: [],
      nextSteps: ['Review campaign analytics', 'Compare with previous campaigns', 'Plan next campaign improvements']
    };
  }
}

module.exports = new AIService();