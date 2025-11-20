/**
 * Mode 1 - "Guess the Next Token"
 * Game logic for the token prediction game
 */

import { CONFIG, getRandomPrompt } from './config.js';
import { getNextTokenDistribution } from './api.js';
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

  // Start first round
  await playRound();
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
    gameState.correctToken = result.chosenToken;

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
 * Select 4 token options based on probability ranks
 * @param {Array} distribution - Full token distribution
 * @returns {Array} - Array of 4 selected tokens
 */
function selectTokenOptions(distribution) {
  const selected = [];
  const config = CONFIG.mode1.tokenSelection;

  // 1. Always include the top token (rank 1)
  const topToken = distribution.find(t => t.rank === 1);
  if (topToken) {
    selected.push(topToken);
  }

  // 2. Select a mid-probability token (ranks 2-5)
  const midTokens = distribution.filter(
    t => t.rank >= config.midMin && t.rank <= config.midMax && !selected.includes(t)
  );
  if (midTokens.length > 0) {
    const randomMid = midTokens[Math.floor(Math.random() * midTokens.length)];
    selected.push(randomMid);
  }

  // 3. Select a low-but-plausible token (ranks 6-15)
  const lowTokens = distribution.filter(
    t => t.rank >= config.lowMin && t.rank <= config.lowMax && !selected.includes(t)
  );
  if (lowTokens.length > 0) {
    const randomLow = lowTokens[Math.floor(Math.random() * lowTokens.length)];
    selected.push(randomLow);
  }

  // 4. Select a very unlikely token (rank 20+)
  const veryLowTokens = distribution.filter(
    t => t.rank >= config.veryLowMin && t.rank <= config.veryLowMax && !selected.includes(t)
  );
  if (veryLowTokens.length > 0) {
    const randomVeryLow = veryLowTokens[Math.floor(Math.random() * veryLowTokens.length)];
    selected.push(randomVeryLow);
  }

  // If we don't have 4 tokens, fill with remaining tokens
  while (selected.length < 4 && selected.length < distribution.length) {
    const remaining = distribution.filter(t => !selected.includes(t));
    if (remaining.length === 0) break;
    selected.push(remaining[0]);
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
    ui.showFeedback('Correct! The AI chose this token.', 'success', 1500);
  } else {
    ui.showFeedback(`Incorrect. The AI chose "${gameState.correctToken}".`, 'error', 1500);
  }

  // Highlight buttons
  ui.highlightTokenButtons(selectedToken.token, gameState.correctToken);

  // Show probability table
  ui.showProbabilityTable(gameState.tokenDistribution.slice(0, 5));

  // Append the correct token to the text
  gameState.fullText += gameState.correctToken;
  ui.setCurrentText(gameState.fullText);

  // Wait a bit before moving to next round
  await delay(2500);

  // Check if game is over
  if (gameState.currentRound >= gameState.maxRounds) {
    endGame();
  } else {
    // Move to next round
    gameState.currentRound++;
    ui.updateRound(gameState.currentRound, gameState.maxRounds);
    ui.hideProbabilityTable();
    ui.hideFeedback();
    await playRound();
  }
}

/**
 * End the game and show results
 */
function endGame() {
  gameState.isActive = false;

  const results = ui.createMode1EndScreen(
    gameState.score,
    gameState.maxRounds,
    gameState.fullText
  );

  ui.showEndScreen(results);
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
