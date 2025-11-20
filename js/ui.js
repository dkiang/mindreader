/**
 * UI Module - DOM manipulation and UI helpers
 */

import { CONFIG, formatProbability } from './config.js';

// DOM Element Cache
const elements = {};

/**
 * Initialize DOM element cache
 */
export function initUI() {
  elements.apiKeySection = document.getElementById('api-key-section');
  elements.appContainer = document.getElementById('app-container');
  elements.apiKeyInput = document.getElementById('api-key-input');
  elements.apiKeySubmit = document.getElementById('api-key-submit');
  elements.changeApiKeyBtn = document.getElementById('change-api-key-btn');

  elements.mode1Btn = document.getElementById('mode1-btn');
  elements.mode2Btn = document.getElementById('mode2-btn');

  elements.currentText = document.getElementById('current-text');
  elements.interactionArea = document.getElementById('interaction-area');
  elements.mode1Controls = document.getElementById('mode1-controls');
  elements.mode2Controls = document.getElementById('mode2-controls');
  elements.startControls = document.getElementById('start-controls');
  elements.startGameBtn = document.getElementById('start-game-btn');

  elements.tokenButtons = document.getElementById('token-buttons');
  elements.nudgeInput = document.getElementById('nudge-input');
  elements.submitNudgeBtn = document.getElementById('submit-nudge-btn');

  elements.feedbackArea = document.getElementById('feedback-area');
  elements.probabilityDisplay = document.getElementById('probability-display');
  elements.probabilityTable = document.getElementById('probability-table');
  elements.probabilityTableBody = document.getElementById('probability-table-body');
  elements.probabilityMeterContainer = document.getElementById('probability-meter-container');
  elements.probabilityMeterFill = document.getElementById('probability-meter-fill');
  elements.probabilityMeterText = document.getElementById('probability-meter-text');
  elements.feedbackMessage = document.getElementById('feedback-message');
  elements.scoreDisplay = document.getElementById('score-display');
  elements.roundDisplay = document.getElementById('round-display');
  elements.score = document.getElementById('score');
  elements.totalRounds = document.getElementById('total-rounds');
  elements.currentRound = document.getElementById('current-round');
  elements.maxRounds = document.getElementById('max-rounds');

  elements.currentTurn = document.getElementById('current-turn');
  elements.maxTurns = document.getElementById('max-turns');

  elements.endScreen = document.getElementById('end-screen');
  elements.endTitle = document.getElementById('end-title');
  elements.endResults = document.getElementById('end-results');
  elements.playAgainBtn = document.getElementById('play-again-btn');

  elements.loadingOverlay = document.getElementById('loading-overlay');
}

/**
 * Show/hide elements
 */
export function show(element) {
  if (typeof element === 'string') {
    element = elements[element] || document.getElementById(element);
  }
  if (element) {
    element.classList.remove('hidden');
  }
}

export function hide(element) {
  if (typeof element === 'string') {
    element = elements[element] || document.getElementById(element);
  }
  if (element) {
    element.classList.add('hidden');
  }
}

/**
 * Show/hide loading overlay
 */
export function showLoading() {
  show(elements.loadingOverlay);
}

export function hideLoading() {
  hide(elements.loadingOverlay);
}

/**
 * Display feedback message
 * @param {string} message - The message to display
 * @param {string} type - Type of message: 'success', 'error', 'info', 'neutral'
 * @param {number} duration - How long to display (ms), 0 for permanent
 */
export function showFeedback(message, type = 'neutral', duration = CONFIG.ui.feedbackDisplayTime) {
  const feedbackEl = elements.feedbackMessage;
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback-message ${type}`;
  show(feedbackEl);

  if (duration > 0) {
    setTimeout(() => {
      hide(feedbackEl);
    }, duration);
  }
}

export function hideFeedback() {
  hide(elements.feedbackMessage);
  elements.feedbackMessage.textContent = '';
}

/**
 * Update the current text display
 */
export function setCurrentText(text) {
  elements.currentText.textContent = text;
}

export function appendToCurrentText(text) {
  const current = elements.currentText.textContent;
  // Add space if needed
  const separator = current && !current.endsWith(' ') ? ' ' : '';
  elements.currentText.textContent = current + separator + text;
}

/**
 * Clear the current text
 */
export function clearCurrentText() {
  elements.currentText.textContent = '';
}

/**
 * Create token buttons for Mode 1
 * @param {Array} tokens - Array of token objects {token, probability, rank}
 * @param {Function} onSelect - Callback when a button is clicked
 */
export function createTokenButtons(tokens, onSelect) {
  elements.tokenButtons.innerHTML = '';

  tokens.forEach((tokenObj) => {
    const button = document.createElement('button');
    button.className = 'token-btn';
    button.textContent = tokenObj.token;
    button.dataset.token = tokenObj.token;
    button.dataset.rank = tokenObj.rank;

    button.addEventListener('click', () => {
      // Disable all buttons after selection
      disableTokenButtons();
      onSelect(tokenObj);
    });

    elements.tokenButtons.appendChild(button);
  });
}

/**
 * Disable all token buttons
 */
export function disableTokenButtons() {
  const buttons = elements.tokenButtons.querySelectorAll('.token-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
  });
}

/**
 * Highlight correct/incorrect token buttons
 * @param {string} selectedToken - The token the user selected
 * @param {string} correctToken - The correct token
 */
export function highlightTokenButtons(selectedToken, correctToken) {
  const buttons = elements.tokenButtons.querySelectorAll('.token-btn');

  buttons.forEach(btn => {
    const token = btn.dataset.token;

    if (token === correctToken) {
      btn.classList.add('correct');
    } else if (token === selectedToken && token !== correctToken) {
      btn.classList.add('incorrect');
    } else {
      btn.classList.add('revealed');
    }
  });
}

/**
 * Display probability table (Mode 1)
 * @param {Array} distribution - Array of {token, probability, rank}
 */
export function showProbabilityTable(distribution) {
  elements.probabilityTableBody.innerHTML = '';

  distribution.forEach((item) => {
    const row = document.createElement('tr');

    const tokenCell = document.createElement('td');
    tokenCell.textContent = item.token;

    const probCell = document.createElement('td');
    probCell.textContent = formatProbability(item.probability);

    const rankCell = document.createElement('td');
    rankCell.textContent = `#${item.rank}`;

    row.appendChild(tokenCell);
    row.appendChild(probCell);
    row.appendChild(rankCell);

    elements.probabilityTableBody.appendChild(row);
  });

  show(elements.probabilityDisplay);
}

export function hideProbabilityTable() {
  hide(elements.probabilityDisplay);
}

/**
 * Update probability meter (Mode 2)
 * @param {number} probability - Probability from 0 to 100
 */
export function updateProbabilityMeter(probability) {
  const clamped = Math.max(0, Math.min(100, probability));
  elements.probabilityMeterFill.style.width = `${clamped}%`;
  elements.probabilityMeterText.textContent = `${Math.round(clamped)}%`;
}

export function showProbabilityMeter() {
  show(elements.probabilityMeterContainer);
}

export function hideProbabilityMeter() {
  hide(elements.probabilityMeterContainer);
}

/**
 * Update score display (Mode 1)
 */
export function updateScore(score, total) {
  elements.score.textContent = score;
  elements.totalRounds.textContent = total;
  show(elements.scoreDisplay);
}

/**
 * Update round display (Mode 1)
 */
export function updateRound(current, max) {
  elements.currentRound.textContent = current;
  elements.maxRounds.textContent = max;
  show(elements.roundDisplay);
}

/**
 * Update turn display (Mode 2)
 */
export function updateTurn(current, max) {
  elements.currentTurn.textContent = current;
  elements.maxTurns.textContent = max;
}

/**
 * Show end screen
 * @param {Object} results - Results object with title and content
 */
export function showEndScreen(results) {
  elements.endTitle.textContent = results.title || 'Game Complete!';
  elements.endResults.innerHTML = results.content || '';
  show(elements.endScreen);
}

export function hideEndScreen() {
  hide(elements.endScreen);
}

/**
 * Create end screen content for Mode 1
 */
export function createMode1EndScreen(score, total, finalText) {
  const percentage = Math.round((score / total) * 100);

  let message = '';
  if (percentage >= 80) {
    message = "Excellent! You have a great understanding of how AI predicts text.";
  } else if (percentage >= 60) {
    message = "Good job! You're getting the hang of AI predictions.";
  } else if (percentage >= 40) {
    message = "Not bad! AI predictions can be tricky.";
  } else {
    message = "Keep learning! AI often chooses the most common, safest options.";
  }

  const content = `
    <div class="end-results-section">
      <h3>Your Score</h3>
      <p style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
        ${score} / ${total} (${percentage}%)
      </p>
      <p>${message}</p>
    </div>
    <div class="end-results-section">
      <h3>Final Text</h3>
      <p style="font-style: italic;">"${finalText}"</p>
    </div>
    <div class="end-results-section">
      <h3>Key Insights</h3>
      <ul style="text-align: left; padding-left: 20px;">
        <li>Language models predict the most probable next token based on patterns in their training data.</li>
        <li>They tend to favor common, safe continuations over creative or unusual ones.</li>
        <li>Understanding these patterns helps us work more effectively with AI.</li>
      </ul>
    </div>
  `;

  return {
    title: 'Game Complete!',
    content: content
  };
}

/**
 * Create end screen content for Mode 2
 */
export function createMode2EndScreen(target, success, turns, finalProbability) {
  const resultMessage = success
    ? `Success! You successfully steered the narrative toward "${target}" in ${turns} turns.`
    : `The hidden target was "${target}". You reached ${Math.round(finalProbability)}% probability in ${turns} turns.`;

  const content = `
    <div class="end-results-section">
      <h3>Hidden Target</h3>
      <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
        ${target}
      </p>
      <p>${resultMessage}</p>
    </div>
    <div class="end-results-section">
      <h3>Key Insights</h3>
      <ul style="text-align: left; padding-left: 20px;">
        <li>Steering AI narratives requires explicit signals and related concepts.</li>
        <li>AI models have strong "momentum" toward their initial direction.</li>
        <li>Subtle hints often don't work - you need clear, direct language.</li>
        <li>Understanding semantic relationships is key to influencing AI outputs.</li>
      </ul>
    </div>
  `;

  return {
    title: success ? 'Success!' : 'Game Over',
    content: content
  };
}

/**
 * Clear all game UI elements
 */
export function clearGameUI() {
  clearCurrentText();
  elements.tokenButtons.innerHTML = '';
  hideProbabilityTable();
  hideProbabilityMeter();
  hideFeedback();
  hide(elements.scoreDisplay);
  hide(elements.roundDisplay);
  elements.nudgeInput.value = '';
}

/**
 * Show API key section
 */
export function showApiKeySection() {
  show(elements.apiKeySection);
  hide(elements.appContainer);
}

/**
 * Show app container
 */
export function showAppContainer() {
  hide(elements.apiKeySection);
  show(elements.appContainer);
}

/**
 * Get DOM elements (for use by other modules)
 */
export function getElements() {
  return elements;
}

/**
 * Show error message
 */
export function showError(message) {
  showFeedback(message, 'error', 5000);
}

/**
 * Show success message
 */
export function showSuccess(message) {
  showFeedback(message, 'success', CONFIG.ui.feedbackDisplayTime);
}
