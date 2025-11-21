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
  elements.appContainer = document.getElementById('app-container');

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

  elements.introModal = document.getElementById('intro-modal');
  elements.introTitle = document.getElementById('intro-title');
  elements.introText = document.getElementById('intro-text');
  elements.dismissIntroBtn = document.getElementById('dismiss-intro-btn');

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
 * Display feedback message with optional dismiss button
 * @param {string} message - The message to display
 * @param {string} type - Type of message: 'success', 'error', 'info', 'neutral'
 * @param {boolean} dismissible - Whether to show dismiss button (default: true)
 * @param {Function|number} onDismissOrDuration - Optional callback when dismissed, or duration in ms (0 = persist)
 */
export function showFeedback(message, type = 'neutral', dismissible = true, onDismissOrDuration = null) {
  const feedbackEl = elements.feedbackMessage;

  // Clear previous content and any existing timers
  feedbackEl.innerHTML = '';
  if (feedbackEl._autoHideTimer) {
    clearTimeout(feedbackEl._autoHideTimer);
    feedbackEl._autoHideTimer = null;
  }

  // Create message span
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  messageSpan.className = 'feedback-text';
  feedbackEl.appendChild(messageSpan);

  // Determine if onDismissOrDuration is a callback or duration
  const onDismiss = typeof onDismissOrDuration === 'function' ? onDismissOrDuration : null;
  const duration = typeof onDismissOrDuration === 'number' ? onDismissOrDuration : null;

  // Add dismiss button if dismissible
  if (dismissible) {
    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Continue';
    dismissBtn.className = 'feedback-dismiss-btn';
    dismissBtn.onclick = () => {
      hideFeedback();
      if (onDismiss) {
        onDismiss();
      }
    };
    feedbackEl.appendChild(dismissBtn);
  } else if (duration !== null && duration > 0) {
    // If not dismissible and duration specified, auto-hide after duration
    feedbackEl._autoHideTimer = setTimeout(() => {
      hideFeedback();
    }, duration);
  } else if (duration === null) {
    // Backward compatibility: if no duration specified, auto-hide after 2 seconds
    feedbackEl._autoHideTimer = setTimeout(() => {
      hideFeedback();
    }, 2000);
  }
  // If duration === 0, don't set any timer (persist indefinitely)

  feedbackEl.className = `feedback-message ${type}`;
  show(feedbackEl);
}

export function hideFeedback() {
  // Clear any auto-hide timer
  if (elements.feedbackMessage._autoHideTimer) {
    clearTimeout(elements.feedbackMessage._autoHideTimer);
    elements.feedbackMessage._autoHideTimer = null;
  }

  hide(elements.feedbackMessage);
  elements.feedbackMessage.innerHTML = '';
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
 * Show introduction modal for Mode 1
 */
export function showMode1Introduction(onDismiss) {
  elements.introTitle.textContent = 'Welcome to Mode 1';
  elements.introText.innerHTML = `
    <p>In this mode, you'll see the beginning of a paragraph that's being generated live by an AI. At each step, the AI knows the most statistically likely next word—and your job is to guess which one it will choose.</p>
    <p>You're trying to think like the model: predictable, literal, and probability-driven. See how often you match it.</p>
  `;

  // Set up dismiss button handler
  elements.dismissIntroBtn.onclick = () => {
    hideIntroModal();
    if (onDismiss) {
      onDismiss();
    }
  };

  show(elements.introModal);
}

/**
 * Hide introduction modal
 */
export function hideIntroModal() {
  hide(elements.introModal);
}

/**
 * Create end screen content for Mode 1
 */
export function createMode1EndScreen(score, total, startingPrompt, gameText, completion) {
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

  // Format the complete sentence with the game portion highlighted
  // The starting prompt is shown, then the game portion in bold, then the completion
  const gamePlayedPortion = gameText.substring(startingPrompt.length);

  // Ensure there's a space before the completion text
  let formattedCompletion = '';
  if (completion) {
    // Add a space before completion if it doesn't start with one or punctuation
    formattedCompletion = (completion.startsWith(' ') || /^[.,!?;:]/.test(completion))
      ? completion
      : ' ' + completion;
  }

  const completeSentence = formattedCompletion
    ? `${startingPrompt}<strong>${gamePlayedPortion}</strong>${formattedCompletion}`
    : `${startingPrompt}<strong>${gamePlayedPortion}</strong>`;

  const content = `
    <div class="end-results-section">
      <h3>Your Score</h3>
      <p style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
        ${score} / ${total} (${percentage}%)
      </p>
      <p>${message}</p>
    </div>
    <div class="end-results-section">
      <h3>Complete Sentence</h3>
      <p style="font-style: italic; line-height: 1.8; font-size: 1.1rem;">
        "${completeSentence}"
      </p>
      <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">
        <strong>Bold text</strong> shows the tokens you played during the game.
      </p>
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
 * Get DOM elements (for use by other modules)
 */
export function getElements() {
  return elements;
}

/**
 * Show error message
 */
export function showError(message, onDismiss = null) {
  showFeedback(message, 'error', true, onDismiss);
}

/**
 * Show success message
 */
export function showSuccess(message, onDismiss = null) {
  showFeedback(message, 'success', true, onDismiss);
}
