/**
 * Mode 2 - "Steer the Hidden Narrative"
 * Game logic for steering the AI toward a hidden target
 */

import { CONFIG, getRandomPrompt, getRandomItem, countWords } from './config.js';
import { estimateTargetProbability } from './api.js';
import * as ui from './ui.js';

// Game state
let gameState = {
  isActive: false,
  hiddenTarget: '',
  currentTurn: 0,
  maxTurns: CONFIG.mode2.maxTurns,
  currentContext: '',
  currentProbability: 0,
  previousProbability: 0,
  probabilityHistory: [],
  nudgeHistory: [],
  hasWon: false
};

/**
 * Initialize Mode 2
 */
export function init() {
  console.log('Mode 2 initialized');
  setupEventListeners();
}

/**
 * Setup event listeners for Mode 2
 */
function setupEventListeners() {
  const elements = ui.getElements();

  // Submit nudge button
  elements.submitNudgeBtn.addEventListener('click', handleNudgeSubmit);

  // Enter key in nudge input
  elements.nudgeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleNudgeSubmit();
    }
  });
}

/**
 * Start a new game
 */
export async function startGame() {
  // Reset game state
  gameState = {
    isActive: true,
    hiddenTarget: getRandomItem(CONFIG.mode2.targets),
    currentTurn: 0,
    maxTurns: CONFIG.mode2.maxTurns,
    currentContext: getRandomPrompt('mode2'),
    currentProbability: 0,
    previousProbability: 0,
    probabilityHistory: [],
    nudgeHistory: [],
    hasWon: false
  };

  console.log('Hidden target:', gameState.hiddenTarget); // For debugging

  // Reset UI
  ui.clearGameUI();
  ui.hide('startControls');
  ui.show('mode2Controls');
  ui.showProbabilityMeter();

  // Set initial text
  ui.setCurrentText(gameState.currentContext);

  // Update turn display
  ui.updateTurn(gameState.currentTurn, gameState.maxTurns);

  // Enable nudge input
  const elements = ui.getElements();
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = false;
  elements.nudgeInput.value = '';
  elements.nudgeInput.focus();

  // Calculate initial probability
  await updateProbability();
}

/**
 * Handle nudge submission
 */
async function handleNudgeSubmit() {
  if (!gameState.isActive) return;

  const elements = ui.getElements();
  const nudge = elements.nudgeInput.value.trim();

  // Validate nudge
  if (!nudge) {
    ui.showFeedback('Please enter a nudge phrase.', 'neutral', 1500);
    return;
  }

  const wordCount = countWords(nudge);
  if (wordCount > CONFIG.mode2.maxNudgeWords) {
    ui.showFeedback(
      `Your nudge is too long (${wordCount} words). Maximum is ${CONFIG.mode2.maxNudgeWords} words.`,
      'error',
      2000
    );
    return;
  }

  // Disable input while processing
  elements.nudgeInput.disabled = true;
  elements.submitNudgeBtn.disabled = true;

  try {
    // Add nudge to context
    gameState.currentContext += ' ' + nudge;
    gameState.nudgeHistory.push(nudge);

    // Update text display
    ui.setCurrentText(gameState.currentContext);

    // Clear input
    elements.nudgeInput.value = '';

    // Increment turn
    gameState.currentTurn++;
    ui.updateTurn(gameState.currentTurn, gameState.maxTurns);

    // Calculate new probability
    await updateProbability();

    // Provide feedback on probability change
    provideFeedback();

    // Check win condition
    if (gameState.currentProbability >= 100) {
      gameState.hasWon = true;
      endGame();
      return;
    }

    // Check if max turns reached
    if (gameState.currentTurn >= gameState.maxTurns) {
      endGame();
      return;
    }

    // Re-enable input
    elements.nudgeInput.disabled = false;
    elements.submitNudgeBtn.disabled = false;
    elements.nudgeInput.focus();

  } catch (error) {
    console.error('Error handling nudge:', error);

    if (error.message === 'RATE_LIMIT') {
      ui.showError('API rate limit reached. Please wait a moment and try again.');
    } else if (error.message === 'INVALID_API_KEY') {
      ui.showError('Invalid API key. Please check your API key and try again.');
    } else {
      ui.showError('Error processing nudge. Please try again.');
    }

    // Re-enable input
    elements.nudgeInput.disabled = false;
    elements.submitNudgeBtn.disabled = false;

    // Revert turn if error occurred
    if (gameState.currentTurn > 0) {
      gameState.currentTurn--;
      ui.updateTurn(gameState.currentTurn, gameState.maxTurns);
    }
  }
}

/**
 * Update probability calculation
 */
async function updateProbability() {
  ui.showLoading();

  try {
    // Store previous probability
    gameState.previousProbability = gameState.currentProbability;

    // Get new probability estimate
    const probability = await estimateTargetProbability(
      gameState.currentContext,
      gameState.hiddenTarget
    );

    gameState.currentProbability = probability;
    gameState.probabilityHistory.push(probability);

    // Update meter
    ui.updateProbabilityMeter(probability);

    ui.hideLoading();
  } catch (error) {
    ui.hideLoading();
    throw error;
  }
}

/**
 * Provide feedback based on probability change
 */
function provideFeedback() {
  const change = gameState.currentProbability - gameState.previousProbability;
  const feedback = CONFIG.mode2.feedback;

  let message = '';
  let type = 'neutral';

  if (change >= feedback.strongIncrease) {
    message = `Strong increase! +${Math.round(change)}% - You're getting much closer!`;
    type = 'success';
  } else if (change >= feedback.smallIncrease) {
    message = `Small increase. +${Math.round(change)}% - You're on the right track.`;
    type = 'info';
  } else if (change <= feedback.strongDecrease) {
    message = `Strong decrease. ${Math.round(change)}% - That nudge moved you away from the target.`;
    type = 'error';
  } else if (change <= feedback.smallDecrease) {
    message = `Small decrease. ${Math.round(change)}% - Try a different approach.`;
    type = 'error';
  } else {
    message = `Minimal change. ${Math.round(change)}% - The target is not affected by that nudge.`;
    type = 'neutral';
  }

  ui.showFeedback(message, type, 3000);
}

/**
 * End the game and show results
 */
function endGame() {
  gameState.isActive = false;

  // Disable input
  const elements = ui.getElements();
  elements.nudgeInput.disabled = true;
  elements.submitNudgeBtn.disabled = true;

  const results = ui.createMode2EndScreen(
    gameState.hiddenTarget,
    gameState.hasWon,
    gameState.currentTurn,
    gameState.currentProbability
  );

  // Add nudge history to results
  if (gameState.nudgeHistory.length > 0) {
    const nudgeListHTML = gameState.nudgeHistory
      .map((nudge, index) => {
        const prob = gameState.probabilityHistory[index + 1] || 0;
        return `<li><strong>Turn ${index + 1}:</strong> "${nudge}" → ${Math.round(prob)}%</li>`;
      })
      .join('');

    results.content += `
      <div class="end-results-section">
        <h3>Your Nudges</h3>
        <ul style="text-align: left; padding-left: 20px;">
          ${nudgeListHTML}
        </ul>
      </div>
    `;
  }

  ui.showEndScreen(results);
}

/**
 * Reset the game
 */
export function reset() {
  gameState = {
    isActive: false,
    hiddenTarget: '',
    currentTurn: 0,
    maxTurns: CONFIG.mode2.maxTurns,
    currentContext: '',
    currentProbability: 0,
    previousProbability: 0,
    probabilityHistory: [],
    nudgeHistory: [],
    hasWon: false
  };

  ui.clearGameUI();
  ui.show('startControls');
  ui.hide('mode2Controls');
  ui.hideProbabilityMeter();

  const elements = ui.getElements();
  elements.nudgeInput.value = '';
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = false;
}

/**
 * Check if game is active
 */
export function isActive() {
  return gameState.isActive;
}

/**
 * Get current game state (for debugging)
 */
export function getState() {
  return gameState;
}
