import { API_CONFIG, TONES, TONE_DESCRIPTIONS } from './constants.js';
import storage from './storage.js';

/**
 * API service for generating AI replies
 */
class ApiService {
  constructor() {
    this.endpoint = API_CONFIG.DEFAULT_ENDPOINT;
    this.model = API_CONFIG.DEFAULT_MODEL;
  }

  /**
   * Build the system prompt for reply generation
   * @param {string} tone - Selected tone
   * @param {Object} userProfile - User profile for personalization
   * @returns {string} System prompt
   */
  buildSystemPrompt(tone, userProfile = {}) {
    const toneDescription = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS[TONES.AUTO];

    let personalizationSection = '';

    // Build personalization context if user has provided info
    if (userProfile.nickname || userProfile.occupation || userProfile.bio) {
      personalizationSection = '\n\nABOUT THE PERSON WRITING REPLIES:';
      if (userProfile.nickname) {
        personalizationSection += `\n- Name: ${userProfile.nickname}`;
      }
      if (userProfile.occupation) {
        personalizationSection += `\n- Role: ${userProfile.occupation}`;
      }
      if (userProfile.bio) {
        personalizationSection += `\n- Background: ${userProfile.bio}`;
      }
      personalizationSection += '\n\nUse this context to make replies more authentic and relevant to their expertise when appropriate.';
    }

    // Build reply style guidance
    let styleGuidance = '';
    if (userProfile.replyStyle) {
      const styleDescriptions = {
        'professional': 'Keep a formal, business-appropriate tone.',
        'casual': 'Use relaxed, conversational language.',
        'witty': 'Include clever observations and subtle humor.',
        'thoughtful': 'Provide deeper, more reflective responses.',
        'concise': 'Keep replies extremely brief and to the point.',
      };
      styleGuidance = styleDescriptions[userProfile.replyStyle] || '';
      if (styleGuidance) {
        styleGuidance = `\n\nStyle preference: ${styleGuidance}`;
      }
    }

    // Build custom instructions section
    let customInstructionsSection = '';
    if (userProfile.customInstructions) {
      customInstructionsSection = `\n\nCUSTOM INSTRUCTIONS FROM USER:\n${userProfile.customInstructions}`;
    }

    return `You are an expert at writing engaging, authentic social media replies that feel personal and human.

CRITICAL REQUIREMENTS:
1. Every reply MUST directly reference SPECIFIC details from the post (names, topics, numbers, opinions, questions)
2. BANNED phrases: "Great post", "Thanks for sharing", "Well said", "Interesting perspective", "I agree", "Love this"
3. Each reply must prove you actually READ the content by mentioning something specific from it
4. Add genuine value: share a related experience, ask a thoughtful follow-up, or offer a unique angle

Tone: ${toneDescription}${styleGuidance}${personalizationSection}${customInstructionsSection}

Format rules:
- 1-2 sentences maximum
- Sound like a real person having a conversation
- Match the energy/formality of the original post
- No hashtags or emojis unless the original uses them
- Each suggestion must take a COMPLETELY different approach`;
  }

  /**
   * Build the user prompt with context
   * @param {Object} context - Context object
   * @returns {string} User prompt
   */
  buildUserPrompt(context) {
    // Gather all available content
    const content = context.originalComment || context.tweetContent ||
                    context.postContent || context.postCaption || '';
    const author = context.postAuthor || context.tweetAuthor || '';
    const title = context.postTitle || '';
    const description = context.postDescription || '';

    // If no content captured, return a helpful message
    if (!content && !title && !description) {
      return `Platform: ${context.platform || 'social media'}

[No post content was captured - the extension couldn't read this post]

Generate 3 placeholder replies that the user should customize. Make them templates like:
1. [Something specific about TOPIC] really resonates because...
2. Your point about [SPECIFIC DETAIL] made me think...
3. This reminds me of [RELATED EXPERIENCE]...`;
    }

    let prompt = `PLATFORM: ${context.platform || 'social media'}\n\n`;

    // Primary content to reply to
    if (content) {
      prompt += `>>> POST/COMMENT TO REPLY TO:\n"${content.substring(0, 600)}"\n\n`;
    }

    // Additional context
    if (author) {
      prompt += `Author: ${author}\n`;
    }
    if (title && title !== content) {
      prompt += `Title: ${title}\n`;
    }
    if (description && description !== content) {
      prompt += `Context: ${description.substring(0, 200)}\n`;
    }

    prompt += `
TASK: Write 3 replies that each:
- Quote or reference a SPECIFIC word/phrase/idea from the post above
- Take a different angle (1: build on their point, 2: ask smart follow-up, 3: share related insight)
- Sound like a thoughtful human, not a bot

Reply format:
1. [Reply that references specific content]
2. [Different angle, still specific]
3. [Third unique approach]`;

    return prompt;
  }

  /**
   * Parse the API response to extract suggestions
   * @param {string} content - Response content
   * @returns {string[]} Array of suggestions
   */
  parseResponse(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const suggestions = [];

    for (const line of lines) {
      // Match lines starting with number and period (1., 2., 3.)
      const match = line.match(/^\d+\.\s*(.+)/);
      if (match && match[1]) {
        // Remove surrounding quotes if present
        let suggestion = match[1].trim();
        suggestion = suggestion.replace(/^["']|["']$/g, '');
        suggestions.push(suggestion);
      }
    }

    // If parsing failed, try to split by double newlines
    if (suggestions.length === 0) {
      const parts = content.split(/\n\n+/);
      for (const part of parts) {
        const cleaned = part.trim().replace(/^["']|["']$/g, '');
        if (cleaned && cleaned.length > 5) {
          suggestions.push(cleaned);
        }
      }
    }

    return suggestions.slice(0, API_CONFIG.SUGGESTIONS_COUNT);
  }

  /**
   * Generate reply suggestions using the AI API
   * @param {Object} context - Context for reply generation
   * @param {string} tone - Selected tone
   * @returns {Promise<Object>} Response with suggestions or error
   */
  async generateReplies(context, tone = TONES.AUTO) {
    try {
      const apiKey = await storage.getApiKey();

      if (!apiKey) {
        return {
          success: false,
          error: 'API key not configured. Please set your API key in the extension options.',
          suggestions: this.getFallbackSuggestions(context, tone),
        };
      }

      // Get settings and user profile
      const settings = await storage.getSettings();
      const userProfile = await storage.getUserProfile();
      const selectedModel = settings.selectedModel || this.model;

      const systemPrompt = this.buildSystemPrompt(tone, userProfile);
      const userPrompt = this.buildUserPrompt(context);

      // Debug logging
      console.log('Smart Reply: Sending to API with context:', {
        platform: context.platform,
        hasContent: !!(context.originalComment || context.tweetContent || context.postContent),
        contentPreview: (context.originalComment || context.tweetContent || context.postContent || '').substring(0, 100),
        tone,
        model: selectedModel,
        hasUserProfile: !!(userProfile.nickname || userProfile.occupation || userProfile.bio),
      });
      console.log('Smart Reply: User prompt:', userPrompt);

      // Build request body - o1 models don't support system messages or temperature
      const isO1Model = selectedModel.startsWith('o1') || selectedModel.startsWith('o3');
      let requestBody;

      if (isO1Model) {
        // o1 models: combine system and user prompts, no temperature
        requestBody = {
          model: selectedModel,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n---\n\n${userPrompt}` },
          ],
          max_completion_tokens: API_CONFIG.MAX_TOKENS,
        };
      } else {
        // Standard models: use system message and temperature
        requestBody = {
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: API_CONFIG.MAX_TOKENS,
          temperature: 0.9,
        };
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from API');
      }

      const suggestions = this.parseResponse(content);

      if (suggestions.length === 0) {
        throw new Error('Failed to parse suggestions from response');
      }

      return {
        success: true,
        suggestions,
      };
    } catch (error) {
      console.error('Smart Reply API error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: this.getFallbackSuggestions(context, tone),
      };
    }
  }

  /**
   * Generate fallback suggestions when API is unavailable
   * @param {Object} context - Context object
   * @param {string} tone - Selected tone
   * @returns {string[]} Fallback suggestions
   */
  getFallbackSuggestions(context, tone) {
    const fallbacks = {
      [TONES.AUTO]: [
        "Thanks for sharing this perspective!",
        "This is really insightful, appreciate you posting.",
        "Interesting point - I hadn't thought about it that way.",
      ],
      [TONES.FRIENDLY]: [
        "Love this! Thanks for brightening my feed.",
        "This made my day! Really appreciate you sharing.",
        "So glad I came across this - thanks for posting!",
      ],
      [TONES.HUMOROUS]: [
        "This is the content I signed up for!",
        "Okay, this actually made me laugh out loud.",
        "My scrolling has finally paid off!",
      ],
      [TONES.ENGAGING]: [
        "This is fascinating - what inspired you to share this?",
        "I'd love to hear more about your thoughts on this!",
        "Really interesting perspective! Have you explored this further?",
      ],
    };

    return fallbacks[tone] || fallbacks[TONES.AUTO];
  }
}

export const api = new ApiService();
export default api;
