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
   * @returns {string} System prompt
   */
  buildSystemPrompt(tone) {
    const toneDescription = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS[TONES.AUTO];

    return `You are a helpful assistant that generates social media reply suggestions.
Your task is to create natural, authentic replies that sound human-written.

Tone style: ${toneDescription}

Guidelines:
- Keep replies concise (1-3 sentences typically)
- Match the language of the original content
- Be respectful and constructive
- Avoid generic phrases like "Great post!" or "Thanks for sharing!"
- Make each suggestion distinct in approach
- Consider the context (video title, post caption, etc.)
- Never use hashtags unless the original content uses them
- Sound natural, not like a bot`;
  }

  /**
   * Build the user prompt with context
   * @param {Object} context - Context object
   * @returns {string} User prompt
   */
  buildUserPrompt(context) {
    let prompt = `Generate ${API_CONFIG.SUGGESTIONS_COUNT} distinct reply suggestions for the following:\n\n`;

    if (context.platform) {
      prompt += `Platform: ${context.platform}\n`;
    }

    if (context.postTitle) {
      prompt += `Title: ${context.postTitle}\n`;
    }

    if (context.postDescription) {
      prompt += `Description: ${context.postDescription.substring(0, 500)}\n`;
    }

    if (context.postAuthor) {
      prompt += `Author: ${context.postAuthor}\n`;
    }

    if (context.originalComment) {
      prompt += `\nComment to reply to: "${context.originalComment}"\n`;
    } else if (context.postCaption) {
      prompt += `\nPost caption: "${context.postCaption.substring(0, 500)}"\n`;
    }

    prompt += `\nProvide exactly ${API_CONFIG.SUGGESTIONS_COUNT} reply suggestions, each on a new line, prefixed with a number (1., 2., 3.). Keep them natural and varied in approach.`;

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

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.buildSystemPrompt(tone) },
            { role: 'user', content: this.buildUserPrompt(context) },
          ],
          max_tokens: API_CONFIG.MAX_TOKENS,
          temperature: 0.8,
        }),
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
