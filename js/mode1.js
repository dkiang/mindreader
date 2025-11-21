/**
 * Mode 1 - "Guess the Next Token"
 * Game logic for the token prediction game
 */

import { CONFIG, getRandomPrompt } from './config.js';
import { getNextTokenDistribution, generateContinuation } from './api.js';
import * as ui from './ui.js';

// Game state
let gameState = {
  isActive: false,
  currentRound: 0,
  maxRounds: CONFIG.mode1.rounds,
  score: 0,
  currentPrompt: '',
  fullText: '',
  tokenDistribution: null,
  correctToken: ''
};

/**
 * Initialize Mode 1
 */
export function init() {
  console.log('Mode 1 initialized');
}

/**
 * Start a new game
 */
export async function startGame() {
  // Reset game state
  gameState = {
    isActive: true,
    currentRound: 1,
    maxRounds: CONFIG.mode1.rounds,
    score: 0,
    currentPrompt: getRandomPrompt('mode1'),
    fullText: '',
    tokenDistribution: null,
    correctToken: ''
  };

  // Reset UI
  ui.clearGameUI();
  ui.hide('startControls');
  ui.show('scoreDisplay');
  ui.show('roundDisplay');

  // Set initial text
  gameState.fullText = gameState.currentPrompt;
  ui.setCurrentText(gameState.fullText);

  // Update displays
  ui.updateScore(gameState.score, gameState.maxRounds);
  ui.updateRound(gameState.currentRound, gameState.maxRounds);

  // Show introduction modal, then start first round when dismissed
  ui.showMode1Introduction(async () => {
    await playRound();
  });
}

/**
 * Play a single round
 */
async function playRound() {
  try {
    ui.showLoading();

    // Get token distribution from API
    const result = await getNextTokenDistribution(
      gameState.fullText,
      CONFIG.mode1.logprobCount
    );

    gameState.tokenDistribution = result.distribution;

    // Find the first VALID word in the distribution as the correct answer
    // This avoids fragments like "k" being the correct answer
    const firstValidToken = result.distribution.find(t => isValidWord(t.token));

    if (!firstValidToken) {
      // No valid tokens found - skip this round and try again
      console.warn('No valid tokens in distribution, retrying...');
      await playRound();
      return;
    }

    // Use the first valid token as the correct answer
    gameState.correctToken = firstValidToken.token;
    gameState.correctOriginalToken = firstValidToken.originalToken || firstValidToken.token;

    // Select 4 tokens for the user to choose from
    const selectedTokens = selectTokenOptions(gameState.tokenDistribution);

    ui.hideLoading();

    // Create token buttons
    ui.createTokenButtons(selectedTokens, handleTokenSelection);

  } catch (error) {
    ui.hideLoading();
    console.error('Error in playRound:', error);

    if (error.message === 'RATE_LIMIT') {
      ui.showError('API rate limit reached. Please wait a moment and try again.');
    } else if (error.message === 'INVALID_API_KEY') {
      ui.showError('Invalid API key. Please check your API key and try again.');
    } else {
      ui.showError('Error loading next token. Please try again.');
    }

    // Reset game
    gameState.isActive = false;
    ui.show('startControls');
  }
}

/**
 * Check if a token is a valid word (not punctuation or fragment)
 * @param {string} token - The token string
 * @returns {boolean} - True if it's a valid word
 */
function isValidWord(token) {
  // Remove leading/trailing whitespace
  const trimmed = token.trim().toLowerCase();

  // Reject empty strings
  if (!trimmed || trimmed.length === 0) {
    return false;
  }

  // Reject pure punctuation (quotes, periods, commas, etc.)
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return false;
  }

  // Must have at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return false;
  }

  // Reject tokens that contain only punctuation and spaces
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (!lettersOnly) {
    return false;
  }

  // Allow valid single-letter words only
  const validSingleLetterWords = ['a', 'i'];
  if (trimmed.length === 1) {
    return validSingleLetterWords.includes(trimmed);
  }

  // Reject 2-letter fragments that are clearly incomplete
  if (trimmed.length === 2) {
    // Only allow common 2-letter words
    const validTwoLetterWords = [
      'am', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'hi',
      'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or',
      'so', 'to', 'up', 'us', 'we'
    ];
    return validTwoLetterWords.includes(trimmed);
  }

  // For 3-letter words, use a whitelist of common valid words
  if (trimmed.length === 3) {
    const validThreeLetterWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
      'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
      'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did',
      'let', 'put', 'say', 'she', 'too', 'use', 'way', 'far', 'few', 'got',
      'had', 'lot', 'off', 'own', 'run', 'set', 'top', 'yet', 'big', 'hot',
      'sun', 'red', 'dog', 'eat', 'far', 'fun', 'job', 'law', 'add', 'age',
      'ago', 'air', 'arm', 'art', 'ask', 'bad', 'bag', 'bar', 'bed', 'bit',
      'box', 'bus', 'buy', 'car', 'cat', 'cup', 'cut', 'dad', 'die', 'due',
      'end', 'eye', 'far', 'fat', 'fit', 'fly', 'god', 'gun', 'guy', 'hit',
      'ice', 'key', 'kid', 'lay', 'leg', 'lie', 'low', 'mad', 'man', 'map',
      'men', 'mix', 'mom', 'nor', 'oil', 'pay', 'per', 'pop', 'pot', 'red',
      'rid', 'row', 'sad', 'sat', 'sea', 'sir', 'sit', 'six', 'son', 'tax',
      'tea', 'ten', 'tie', 'tip', 'try', 'war', 'win', 'yes', 'via', 'hot'
    ];
    return validThreeLetterWords.includes(trimmed);
  }

  // Reject tokens that start with punctuation (except apostrophes for contractions)
  if (/^[^a-zA-Z0-9']/.test(trimmed)) {
    return false;
  }

  // Reject common suffix-only fragments (incomplete words)
  const suffixOnlyPatterns = [
    /^(ing|ed|tion|sion|ness|ment|ity|ly|er|est|ful|less|able|ible|ous|ious|ive|al|ial|ent|ant|ence|ance|ure|ture)$/i,
    /^(es|nt|unt|ist|ism|ship|dom|hood)$/i
  ];

  for (const pattern of suffixOnlyPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Reject common prefix-only fragments (incomplete words)
  const prefixOnlyPatterns = [
    /^(un|re|pre|dis|mis|non|over|under|sub|inter|fore|anti|semi|mid|mini|micro|mega|super)$/i,
    /^(gro|hes|whe|tha|thi|whi|sho|cou|wou|mus|nee)$/i  // Common fragments
  ];

  for (const pattern of prefixOnlyPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // For words 4+ letters, apply pattern-based validation
  // Reject tokens with no vowels (likely fragments)
  if (trimmed.length >= 4 && !/[aeiouAEIOU]/.test(trimmed)) {
    return false;
  }

  // Words 4+ letters are considered valid if they pass all the checks above
  return true;
}

/**
 * Check if a token string is already selected
 * @param {Array} selected - Array of selected token objects
 * @param {string} tokenString - The token string to check
 * @returns {boolean} - True if already selected
 */
function isTokenSelected(selected, tokenString) {
  return selected.some(t => t.token.trim() === tokenString.trim());
}

/**
 * Select 4 token options based on probability ranks
 * @param {Array} distribution - Full token distribution
 * @returns {Array} - Array of 4 selected tokens
 */
function selectTokenOptions(distribution) {
  const selected = [];
  const config = CONFIG.mode1.tokenSelection;

  // 1. ALWAYS include the correct token (gameState.correctToken)
  // This is now guaranteed to be a valid word
  const correctTokenObj = distribution.find(t => t.token === gameState.correctToken);
  if (correctTokenObj) {
    selected.push(correctTokenObj);
  }

  // Filter distribution to only include valid words (excluding the correct token)
  const validDistribution = distribution.filter(t =>
    isValidWord(t.token) && !isTokenSelected(selected, t.token)
  );

  // If we don't have enough valid tokens, we need to be less strict
  if (validDistribution.length < 3) {
    console.warn('Not enough valid tokens, using fallback selection');

    // Add all available valid tokens
    selected.push(...validDistribution);

    // Fill remaining slots with ANY tokens that aren't pure punctuation
    const fallbackTokens = distribution.filter(t => {
      // Skip if already selected
      if (isTokenSelected(selected, t.token)) return false;

      // Skip pure punctuation
      const trimmed = t.token.trim();
      if (!trimmed || /^[^a-zA-Z0-9]+$/.test(trimmed)) return false;

      // Accept anything else (even fragments)
      return true;
    });

    // Add as many as needed to reach 4 total
    const needed = 4 - selected.length;
    selected.push(...fallbackTokens.slice(0, needed));

    // Final safety check - if we still don't have 4, log error
    if (selected.length < 4) {
      console.error(`Only found ${selected.length} tokens for choices`);
    }

    return shuffleArray(selected);
  }

  // 2. Select a mid-probability token (ranks 2-5)
  const midTokens = validDistribution.filter(
    t => t.rank >= config.midMin &&
         t.rank <= config.midMax &&
         !isTokenSelected(selected, t.token)
  );
  if (midTokens.length > 0) {
    const randomMid = midTokens[Math.floor(Math.random() * midTokens.length)];
    selected.push(randomMid);
  }

  // 3. Select a low-but-plausible token (ranks 6-15)
  const lowTokens = validDistribution.filter(
    t => t.rank >= config.lowMin &&
         t.rank <= config.lowMax &&
         !isTokenSelected(selected, t.token)
  );
  if (lowTokens.length > 0) {
    const randomLow = lowTokens[Math.floor(Math.random() * lowTokens.length)];
    selected.push(randomLow);
  }

  // 4. Select a very unlikely token (rank 20+)
  const veryLowTokens = validDistribution.filter(
    t => t.rank >= config.veryLowMin &&
         t.rank <= config.veryLowMax &&
         !isTokenSelected(selected, t.token)
  );
  if (veryLowTokens.length > 0) {
    const randomVeryLow = veryLowTokens[Math.floor(Math.random() * veryLowTokens.length)];
    selected.push(randomVeryLow);
  }

  // If we don't have 4 tokens, fill with remaining valid tokens
  while (selected.length < 4) {
    const remaining = validDistribution.filter(t => !isTokenSelected(selected, t.token));

    if (remaining.length > 0) {
      // Add next valid token
      selected.push(remaining[0]);
    } else {
      // No more valid tokens - use fallback (any non-punctuation token)
      const fallbackTokens = distribution.filter(t => {
        if (isTokenSelected(selected, t.token)) return false;
        const trimmed = t.token.trim();
        if (!trimmed || /^[^a-zA-Z0-9]+$/.test(trimmed)) return false;
        return true;
      });

      if (fallbackTokens.length > 0) {
        selected.push(fallbackTokens[0]);
      } else {
        // Absolutely no more tokens available
        console.error(`Cannot find 4 tokens, only have ${selected.length}`);
        break;
      }
    }
  }

  // Shuffle the selected tokens so the correct answer isn't always in the same position
  return shuffleArray(selected);
}

/**
 * Handle token selection by user
 * @param {Object} selectedToken - The token object the user selected
 */
async function handleTokenSelection(selectedToken) {
  const isCorrect = selectedToken.token === gameState.correctToken;

  // Update score if correct
  if (isCorrect) {
    gameState.score++;
    ui.updateScore(gameState.score, gameState.maxRounds);
  }

  // Highlight buttons
  ui.highlightTokenButtons(selectedToken.token, gameState.correctToken);

  // Show probability table - filter to only valid words and re-rank
  const validTokensForDisplay = gameState.tokenDistribution
    .filter(t => isValidWord(t.token))
    .slice(0, 5)
    .map((token, index) => ({
      ...token,
      rank: index + 1  // Re-rank based on filtered order
    }));

  ui.showProbabilityTable(validTokensForDisplay);

  // Append the correct token to the text using the original token with OpenAI's spacing
  // Check if we need to add a space before the token
  const originalToken = gameState.correctOriginalToken;
  const needsSpace = gameState.fullText.length > 0 &&
                     !originalToken.startsWith(' ') &&
                     !/^[.,!?;:)]/.test(originalToken) &&
                     !gameState.fullText.endsWith(' ');

  if (needsSpace) {
    gameState.fullText += ' ' + originalToken;
  } else {
    gameState.fullText += originalToken;
  }
  ui.setCurrentText(gameState.fullText);

  // Show feedback and wait for user to dismiss it
  const feedbackMessage = isCorrect
    ? 'Correct! The AI chose this token.'
    : `Incorrect. The AI chose "${gameState.correctToken}".`;
  const feedbackType = isCorrect ? 'success' : 'error';

  ui.showFeedback(feedbackMessage, feedbackType, true, async () => {
    // This callback runs when user dismisses the feedback
    // Check if game is over
    if (gameState.currentRound >= gameState.maxRounds) {
      endGame();
    } else {
      // Move to next round
      gameState.currentRound++;
      ui.updateRound(gameState.currentRound, gameState.maxRounds);
      ui.hideProbabilityTable();
      await playRound();
    }
  });
}

/**
 * End the game and show results
 */
async function endGame() {
  gameState.isActive = false;

  // Show loading while completing the sentence
  ui.showLoading();

  try {
    // Complete the sentence with additional tokens
    const completion = await generateContinuation(gameState.fullText, 30);

    ui.hideLoading();

    const results = ui.createMode1EndScreen(
      gameState.score,
      gameState.maxRounds,
      gameState.currentPrompt,
      gameState.fullText,
      completion
    );

    ui.showEndScreen(results);
  } catch (error) {
    ui.hideLoading();
    console.error('Error completing sentence:', error);

    // Show results without completion if there's an error
    const results = ui.createMode1EndScreen(
      gameState.score,
      gameState.maxRounds,
      gameState.currentPrompt,
      gameState.fullText,
      ''
    );

    ui.showEndScreen(results);
  }
}

/**
 * Reset the game
 */
export function reset() {
  gameState = {
    isActive: false,
    currentRound: 0,
    maxRounds: CONFIG.mode1.rounds,
    score: 0,
    currentPrompt: '',
    fullText: '',
    tokenDistribution: null,
    correctToken: ''
  };

  ui.clearGameUI();
  ui.show('startControls');
  ui.hide('scoreDisplay');
  ui.hide('roundDisplay');
}

/**
 * Check if game is active
 */
export function isActive() {
  return gameState.isActive;
}

/**
 * Utility: Shuffle array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Utility: Delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
