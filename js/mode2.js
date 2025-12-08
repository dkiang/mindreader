/**
 * Mode 2 - "Steer the Hidden Narrative"
 * Game logic for steering the AI toward a hidden target
 */

import { CONFIG, getRandomPrompt, getRandomItem, countWords } from './config.js';
import { estimateTargetProbability, generateNudgeAnalysis } from './api.js';
import * as ui from './ui.js';

// Game state
let gameState = {
  isActive: false,
  hiddenTarget: '',
  currentTurn: 0,
  maxTurns: CONFIG.mode2.maxTurns,
  startingPrompt: '',
  currentContext: '',
  currentProbability: 0,
  previousProbability: 0,
  probabilityHistory: [],
  nudgeHistory: [],
  hasWon: false,
  journeySummaryHTML: '',
  aiAnalysis: null
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

  // Give up button
  elements.giveUpBtn.addEventListener('click', handleGiveUp);
}

/**
 * Start a new game
 */
export async function startGame() {
  // Reset game state
  const startingPrompt = getRandomPrompt('mode2');
  gameState = {
    isActive: true,
    hiddenTarget: getRandomItem(CONFIG.mode2.targets),
    currentTurn: 0,
    maxTurns: CONFIG.mode2.maxTurns,
    startingPrompt: startingPrompt,
    currentContext: startingPrompt,
    currentProbability: 0,
    previousProbability: 0,
    probabilityHistory: [],
    nudgeHistory: [],
    hasWon: false,
    journeySummaryHTML: '',
    aiAnalysis: null
  };

  console.log('Hidden target:', gameState.hiddenTarget); // For debugging

  // Reset UI
  ui.clearGameUI();
  ui.hide('startControls');
  ui.show('mode2Controls');
  ui.showProbabilityMeter();

  // Initialize visualizations
  ui.initMode2Visualizations(gameState.maxTurns);

  // Set initial text
  ui.setCurrentText(gameState.currentContext);

  // Update turn display
  ui.updateTurn(gameState.currentTurn, gameState.maxTurns);

  // Set initial probability to 0%
  gameState.probabilityHistory.push(0);
  ui.updateTrajectorySparkline(gameState.probabilityHistory);

  // Enable nudge input and show End Game button
  const elements = ui.getElements();
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = false;
  elements.nudgeInput.value = '';

  // Show the End Game button
  if (elements.giveUpBtn.parentElement) {
    ui.show(elements.giveUpBtn.parentElement);
  }

  // Show introduction modal, then focus input when dismissed
  ui.showMode2Introduction(() => {
    elements.nudgeInput.focus();
  });

  // Don't calculate initial probability - start at 0%
  // Probability will be calculated after the first nudge
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
    ui.showFeedback('Please enter a nudge phrase.', 'neutral', false, 0);
    return;
  }

  const wordCount = countWords(nudge);
  if (wordCount > CONFIG.mode2.maxNudgeWords) {
    ui.showFeedback(
      `Your nudge is too long (${wordCount} words). Maximum is ${CONFIG.mode2.maxNudgeWords} words.`,
      'error',
      false,
      0
    );
    return;
  }

  // Clear feedback and disable input while processing
  ui.hideFeedback();

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

    // Provide feedback on probability change
    // Input will be re-enabled when user dismisses the feedback
    provideFeedback();

  } catch (error) {
    console.error('Error handling nudge:', error);

    let errorMessage = 'Error processing nudge. Please try again.';
    if (error.message === 'RATE_LIMIT') {
      errorMessage = 'API rate limit reached. Please wait a moment and try again.';
    } else if (error.message === 'INVALID_API_KEY') {
      errorMessage = 'Invalid API key. Please check your API key and try again.';
    }

    // Show error and re-enable input when dismissed
    ui.showError(errorMessage, () => {
      elements.nudgeInput.disabled = false;
      elements.submitNudgeBtn.disabled = false;
      elements.nudgeInput.focus();
    });

    // Revert turn if error occurred
    if (gameState.currentTurn > 0) {
      gameState.currentTurn--;
      ui.updateTurn(gameState.currentTurn, gameState.maxTurns);
    }
  }
}

/**
 * Handle give up button click
 */
function handleGiveUp() {
  if (!gameState.isActive) return;

  if (confirm('Are you sure you want to end the game and see results?')) {
    endGame();
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

    // Update visualizations
    ui.updateTrajectorySparkline(gameState.probabilityHistory);

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
  const elements = ui.getElements();

  // Add path segment with visual feedback
  ui.addPathSegment(gameState.currentTurn, gameState.currentProbability, change);

  // Update visual feedback indicator
  ui.updateVisualFeedback(change, gameState.currentProbability);

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

  // Show feedback without dismiss button and persist indefinitely (duration = 0)
  // The feedback will stay visible until replaced by the next nudge's feedback
  ui.showFeedback(message, type, false, 0);

  // Re-enable input immediately so user can type next nudge
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = false;
  elements.nudgeInput.focus();
}

/**
 * End the game and show results
 */
async function endGame() {
  gameState.isActive = false;

  // Disable input and hide End Game button
  const elements = ui.getElements();
  elements.nudgeInput.disabled = true;
  elements.submitNudgeBtn.disabled = true;
  ui.hide(elements.giveUpBtn.parentElement); // Hide the give-up-container

  const results = ui.createMode2EndScreen(
    gameState.hiddenTarget,
    gameState.hasWon,
    gameState.currentTurn,
    gameState.currentProbability,
    gameState.probabilityHistory,
    gameState.nudgeHistory
  );

  // Show end screen without summary button (analysis is in the end screen now)
  ui.showEndScreen(results, false);

  // Generate AI analysis asynchronously and update the end screen
  generateAndDisplayAnalysis();
}

/**
 * Generate AI analysis and update the end screen
 */
async function generateAndDisplayAnalysis() {
  try {
    // Generate analysis
    const analysis = await generateNudgeAnalysis(
      gameState.startingPrompt,
      gameState.nudgeHistory,
      gameState.probabilityHistory,
      gameState.hiddenTarget,
      gameState.hasWon
    );

    // Store analysis
    gameState.aiAnalysis = analysis;

    // Format the analysis with proper HTML
    const formattedAnalysis = formatAnalysisHTML(analysis);

    // Update the end screen with the analysis
    ui.updateEndScreenAnalysis(formattedAnalysis);

  } catch (error) {
    console.error('Error generating analysis:', error);

    // Show error message
    const errorHTML = '<p style="color: #f44336;">Unable to generate analysis at this time. Please try again later.</p>';

    // Update end screen with error
    ui.updateEndScreenAnalysis(errorHTML);
  }
}

/**
 * Format AI analysis text into HTML
 */
function formatAnalysisHTML(analysis) {
  // Convert markdown-style bold to HTML
  let formatted = analysis
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<div style="line-height: 1.8;">${formatted}</div>`;
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
    startingPrompt: '',
    currentContext: '',
    currentProbability: 0,
    previousProbability: 0,
    probabilityHistory: [],
    nudgeHistory: [],
    hasWon: false,
    journeySummaryHTML: '',
    aiAnalysis: null
  };

  ui.clearGameUI();
  ui.show('startControls');
  ui.hide('mode2Controls');
  ui.hideProbabilityMeter();
  ui.hideSummaryModal();

  const elements = ui.getElements();
  elements.nudgeInput.value = '';
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = false;

  // Show the End Game button again
  if (elements.giveUpBtn.parentElement) {
    ui.show(elements.giveUpBtn.parentElement);
  }
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
