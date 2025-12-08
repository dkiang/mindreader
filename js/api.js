/**
 * API Module - Handles all API interactions via Vercel serverless functions
 */

import { CONFIG } from './config.js';

/**
 * Get the correct API path for the current deployment context
 */
function getApiPath() {
  // Use relative path so it works in subdirectories
  return 'api/chat';
}

/**
 * Make a request to our Vercel serverless function (which proxies to OpenAI)
 */
async function makeOpenAIRequest(messages, options = {}) {
  const requestBody = {
    messages: messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.maxTokens || CONFIG.api.maxTokens
  };

  // Add logprobs parameters if present
  if (options.additionalParams?.logprobs) {
    requestBody.logprobs = options.additionalParams.logprobs;
  }
  if (options.additionalParams?.top_logprobs) {
    requestBody.top_logprobs = options.additionalParams.top_logprobs;
  }

  // Call our serverless function instead of OpenAI directly
  const response = await fetch(getApiPath(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    } else if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    } else {
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }
  }

  return await response.json();
}

/**
 * Stub functions for API key management (no longer needed with serverless backend)
 */
export function setApiKey(key) {
  // No-op: API key is now managed server-side
  console.log('API key management handled by server');
}

export function getApiKey() {
  // Always return truthy value since server handles authentication
  return 'server-managed';
}

export function clearApiKey() {
  // No-op: API key is now managed server-side
  console.log('API key management handled by server');
}

/**
 * Get next token distribution with logprobs (Mode 1)
 * @param {string} prompt - The text prompt to continue
 * @param {number} logprobs - Number of top logprobs to return
 * @returns {Promise<Object>} - Contains tokens, probabilities, and the chosen token
 */
export async function getNextTokenDistribution(prompt, logprobs = CONFIG.mode1.logprobCount) {
  try {
    const messages = [
      {
        role: 'user',
        content: `Continue this sentence with natural text. Only provide the continuation, no explanation: "${prompt}"`
      }
    ];

    const response = await makeOpenAIRequest(messages, {
      temperature: CONFIG.mode1.temperature,
      maxTokens: 1,  // We only want one token
      additionalParams: {
        logprobs: true,
        top_logprobs: logprobs
      }
    });

    // Extract logprobs data
    const choice = response.choices[0];
    const content = choice.message.content;

    // Note: OpenAI's chat completion API returns logprobs differently than completion API
    // We need to parse the response accordingly
    const logprobsData = choice.logprobs;

    if (!logprobsData || !logprobsData.content || logprobsData.content.length === 0) {
      throw new Error('No logprobs data returned from API');
    }

    // Get the first token's logprobs
    const firstTokenData = logprobsData.content[0];
    const topLogprobs = firstTokenData.top_logprobs || [];

    // Convert logprobs to probabilities
    const tokenDistribution = topLogprobs.map((item, index) => ({
      token: item.token,
      logprob: item.logprob,
      probability: Math.exp(item.logprob),
      rank: index + 1
    }));

    // Sort by probability (should already be sorted, but just to be sure)
    tokenDistribution.sort((a, b) => b.probability - a.probability);

    // Deduplicate tokens - keep only the highest probability version of each unique token
    // This handles cases where "hidden" and " hidden" both appear
    const seenTokens = new Map();
    const deduplicatedDistribution = [];
    const normalizedChosenToken = firstTokenData.token.trim();

    for (const item of tokenDistribution) {
      const normalizedToken = item.token.trim();

      // Skip empty tokens
      if (!normalizedToken) continue;

      // If we haven't seen this token, keep it
      if (!seenTokens.has(normalizedToken)) {
        seenTokens.set(normalizedToken, true);
        deduplicatedDistribution.push({
          token: normalizedToken, // Display version (trimmed for buttons)
          originalToken: item.token, // Preserve original with spacing for appending
          logprob: item.logprob,
          probability: item.probability,
          rank: 0, // Will be reassigned below
          isChosen: normalizedToken === normalizedChosenToken
        });
      }
    }

    // Re-assign ranks after deduplication
    deduplicatedDistribution.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Ensure the chosen token is in the distribution
    const chosenTokenInDistribution = deduplicatedDistribution.find(t => t.isChosen);
    if (!chosenTokenInDistribution) {
      console.warn('Chosen token not found in distribution, adding it');
      deduplicatedDistribution.unshift({
        token: normalizedChosenToken,
        originalToken: firstTokenData.token,
        logprob: firstTokenData.logprob || 0,
        probability: Math.exp(firstTokenData.logprob || 0),
        rank: 1,
        isChosen: true
      });
      // Re-rank all items
      deduplicatedDistribution.forEach((item, index) => {
        item.rank = index + 1;
      });
    }

    return {
      chosenToken: normalizedChosenToken,
      chosenOriginalToken: firstTokenData.token, // Keep original with spacing
      distribution: deduplicatedDistribution,
      fullContent: content
    };
  } catch (error) {
    console.error('Error getting token distribution:', error);
    throw error;
  }
}

/**
 * Generate a continuation of the text (Mode 2)
 * @param {string} prompt - The text to continue
 * @param {number} tokens - Number of tokens to generate
 * @returns {Promise<string>} - The generated continuation
 */
export async function generateContinuation(prompt, tokens = CONFIG.mode2.silentTokens) {
  try {
    const messages = [
      {
        role: 'user',
        content: `Continue this narrative naturally: "${prompt}"`
      }
    ];

    const response = await makeOpenAIRequest(messages, {
      temperature: CONFIG.mode2.temperature,
      maxTokens: tokens
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating continuation:', error);
    throw error;
  }
}

/**
 * Estimate probability of target concept appearing (Mode 2 - Hybrid Approach)
 * Uses logprobs analysis and semantic estimation
 * @param {string} context - Current text context
 * @param {string} target - Target concept to check for
 * @returns {Promise<number>} - Probability from 0 to 100
 */
export async function estimateTargetProbability(context, target) {
  try {
    // Method 1: Check logprobs for target-related tokens
    const logprobScore = await checkLogprobsForTarget(context, target);

    // Method 2: Ask LLM to estimate probability
    const llmScore = await getLLMProbabilityEstimate(context, target);

    // Combine scores (weighted average: 60% logprobs, 40% LLM estimate)
    const combinedScore = (logprobScore * 0.6) + (llmScore * 0.4);

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, combinedScore));
  } catch (error) {
    console.error('Error estimating target probability:', error);
    // Fallback to LLM estimate only
    try {
      return await getLLMProbabilityEstimate(context, target);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Check logprobs for target-related tokens
 * @param {string} context - Current text context
 * @param {string} target - Target concept
 * @returns {Promise<number>} - Score from 0 to 100
 */
async function checkLogprobsForTarget(context, target) {
  try {
    const messages = [
      {
        role: 'user',
        content: `Continue this narrative: "${context}"`
      }
    ];

    // Generate a few tokens and check their logprobs
    const response = await makeOpenAIRequest(messages, {
      temperature: CONFIG.mode2.temperature,
      maxTokens: 5,
      additionalParams: {
        logprobs: true,
        top_logprobs: 20
      }
    });

    const logprobsData = response.choices[0].logprobs;

    if (!logprobsData || !logprobsData.content) {
      return 0;
    }

    // Check if any of the top tokens are related to the target
    let maxProbability = 0;
    const targetLower = target.toLowerCase();
    const targetVariations = generateTargetVariations(target);

    for (const tokenData of logprobsData.content) {
      if (!tokenData.top_logprobs) continue;

      for (const logprobItem of tokenData.top_logprobs) {
        const token = logprobItem.token.toLowerCase().trim();
        const probability = Math.exp(logprobItem.logprob);

        // Check if token matches target or variations
        if (token === targetLower ||
            token.includes(targetLower) ||
            targetVariations.some(v => token.includes(v))) {
          maxProbability = Math.max(maxProbability, probability);
        }
      }
    }

    // Convert to 0-100 scale (amplify the signal)
    return maxProbability * 200; // Multiply by 200 to make it more sensitive
  } catch (error) {
    console.error('Error checking logprobs:', error);
    return 0;
  }
}

/**
 * Get LLM's estimate of target probability
 * @param {string} context - Current text context
 * @param {string} target - Target concept
 * @returns {Promise<number>} - Probability from 0 to 100
 */
async function getLLMProbabilityEstimate(context, target) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that estimates probabilities. Respond with only a number between 0 and 100.'
      },
      {
        role: 'user',
        content: `Given the context below, estimate the probability (0-100) that the concept "${target}" will naturally appear or be implied in the next 20 tokens of the narrative continuation.\n\nContext: "${context}"\n\nRespond with only a number.`
      }
    ];

    const response = await makeOpenAIRequest(messages, {
      temperature: 0.3,
      maxTokens: 10
    });

    const content = response.choices[0].message.content.trim();
    const probability = parseFloat(content);

    if (isNaN(probability)) {
      console.warn('LLM returned non-numeric probability:', content);
      return 0;
    }

    return Math.max(0, Math.min(100, probability));
  } catch (error) {
    console.error('Error getting LLM probability estimate:', error);
    return 0;
  }
}

/**
 * Generate variations of the target word for matching
 * @param {string} target - Target concept
 * @returns {Array<string>} - Array of variations
 */
function generateTargetVariations(target) {
  const variations = [target.toLowerCase()];

  // Add common variations
  const suffixes = ['s', 'ed', 'ing', 'ly'];
  for (const suffix of suffixes) {
    variations.push(target.toLowerCase() + suffix);
  }

  // Add related forms based on common targets
  const relatedForms = {
    'accident': ['crash', 'collision', 'mishap'],
    'argument': ['fight', 'dispute', 'disagree', 'quarrel'],
    'apology': ['sorry', 'apologize', 'regret'],
    'confession': ['confess', 'admit', 'reveal'],
    'crime': ['criminal', 'illegal', 'theft', 'murder'],
    'surprise': ['shocked', 'unexpected', 'astonish'],
    'revelation': ['reveal', 'discover', 'uncover'],
    'betrayal': ['betray', 'deceive', 'backstab'],
    'discovery': ['discover', 'found', 'uncovered'],
    'reunion': ['reunite', 'meet again', 'together again']
  };

  if (relatedForms[target.toLowerCase()]) {
    variations.push(...relatedForms[target.toLowerCase()]);
  }

  return variations;
}

/**
 * Generate personalized analysis of user's nudges (Mode 2)
 * @param {string} startingPrompt - The initial prompt
 * @param {Array<string>} nudges - Array of user nudges
 * @param {Array<number>} probabilities - Probability after each nudge
 * @param {string} target - The hidden target concept
 * @param {boolean} won - Whether the user won
 * @returns {Promise<string>} - Personalized analysis
 */
export async function generateNudgeAnalysis(startingPrompt, nudges, probabilities, target, won) {
  try {
    // Build the narrative showing how the story evolved
    let narrative = startingPrompt;
    const nudgeDetails = nudges.map((nudge, index) => {
      const prevProb = probabilities[index] || 0;
      const newProb = probabilities[index + 1] || 0;
      const change = newProb - prevProb;
      narrative += ' ' + nudge;

      return `Turn ${index + 1}: "${nudge}" → Probability changed from ${Math.round(prevProb)}% to ${Math.round(newProb)}% (${change > 0 ? '+' : ''}${Math.round(change)}%)`;
    }).join('\n');

    const messages = [
      {
        role: 'system',
        content: 'You are an expert at analyzing narrative steering and language model behavior. Provide insightful, specific feedback about how effectively the user steered the narrative toward the target concept.'
      },
      {
        role: 'user',
        content: `Analyze this attempt to steer an AI narrative toward the hidden target concept "${target}".

Starting prompt: "${startingPrompt}"

User's nudges and results:
${nudgeDetails}

Final narrative: "${narrative}"

${won ? 'The user successfully reached 100% probability.' : `The user reached ${Math.round(probabilities[probabilities.length - 1])}% probability but did not hit 100%.`}

Provide a personalized analysis with:
1. **Overall Strategy**: Assess their overall approach (2-3 sentences)
2. **Most Effective Nudge**: Identify which nudge had the biggest positive impact and explain why it worked
3. **Least Effective Nudge**: Identify which nudge was least helpful and explain why
4. **Key Insight**: One specific learning point about steering AI narratives
5. **Suggestion**: One concrete suggestion for how they could improve next time

Keep the tone encouraging but analytical. Be specific about semantic relationships and why certain words/phrases moved the probability.`
      }
    ];

    const response = await makeOpenAIRequest(messages, {
      temperature: 0.7,
      maxTokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating nudge analysis:', error);
    // Return a generic message on error
    return 'Analysis unavailable at this time. Your journey toward the target was recorded, and you can review your nudges in the summary above.';
  }
}

/**
 * Test API connection
 * @returns {Promise<Object>} - {success: boolean, error: string}
 */
export async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    const messages = [
      {
        role: 'user',
        content: 'Say "OK"'
      }
    ];

    await makeOpenAIRequest(messages, {
      maxTokens: 5
    });

    console.log('API connection successful!');
    return { success: true, error: null };
  } catch (error) {
    console.error('API connection failed:', error);
    let errorMessage = 'Unknown error';

    if (error.message === 'RATE_LIMIT') {
      errorMessage = 'Rate limit exceeded. Please wait and try again.';
    } else if (error.message === 'INVALID_API_KEY') {
      errorMessage = 'Invalid API key. Please check your key.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}
