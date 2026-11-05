/**
 * UI Module - DOM manipulation and UI helpers
 */

import { displayToken, percentageTenths } from './token-math.js';

// DOM Element Cache
const elements = {};

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  elements.giveUpBtn = document.getElementById('give-up-btn');

  elements.feedbackArea = document.getElementById('feedback-area');
  elements.probabilityDisplay = document.getElementById('probability-display');
  elements.probabilityTable = document.getElementById('probability-table');
  elements.probabilityTableBody = document.getElementById('probability-table-body');
  elements.probabilityMeterContainer = document.getElementById('probability-meter-container');
  elements.feedbackMessage = document.getElementById('feedback-message');
  elements.scoreDisplay = document.getElementById('score-display');
  elements.roundDisplay = document.getElementById('round-display');
  elements.score = document.getElementById('score');
  elements.totalRounds = document.getElementById('total-rounds');
  elements.currentRound = document.getElementById('current-round');
  elements.maxRounds = document.getElementById('max-rounds');

  elements.currentTurn = document.getElementById('current-turn');
  elements.maxTurns = document.getElementById('max-turns');

  elements.wordCount = document.getElementById('word-count');
  elements.wordCounter = document.querySelector('.word-counter');

  elements.endScreen = document.getElementById('end-screen');
  elements.endTitle = document.getElementById('end-title');
  elements.endResults = document.getElementById('end-results');
  elements.playAgainBtn = document.getElementById('play-again-btn');
  elements.seeSummaryBtn = document.getElementById('see-summary-btn');

  elements.summaryModal = document.getElementById('summary-modal');
  elements.summaryContent = document.getElementById('summary-content');
  elements.closeSummaryBtn = document.getElementById('close-summary-btn');

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
    button.textContent = displayToken(tokenObj.token);
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
export function showProbabilityTable(distribution, otherProbability) {
  elements.probabilityTableBody.innerHTML = '';

  const rows = [...distribution, { other: true, probability: otherProbability }];
  const displayed = percentageTenths(rows.map(item => item.probability));

  rows.forEach((item, index) => {
    const row = document.createElement('tr');

    const tokenCell = document.createElement('td');
    tokenCell.textContent = item.other
      ? 'All other tokens'
      : `${displayToken(item.token)}${item.isChosen ? ' ← generated' : ''}`;

    const probCell = document.createElement('td');
    probCell.textContent = `${(displayed[index] / 10).toFixed(1)}%`;

    const rankCell = document.createElement('td');
    rankCell.textContent = item.other ? '—' : item.sampledOutsideTop ? 'outside top list' : `#${item.rank}`;

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
 * @param {boolean} showSummaryButton - Whether to show the "See Summary" button (Mode 2 only)
 */
export function showEndScreen(results, showSummaryButton = false) {
  elements.endTitle.textContent = results.title || 'Game Complete!';
  elements.endResults.innerHTML = results.content || '';

  // Show/hide the "See Summary" button based on mode
  if (showSummaryButton) {
    show(elements.seeSummaryBtn);
  } else {
    hide(elements.seeSummaryBtn);
  }

  // Add click-outside-to-dismiss
  setTimeout(() => {
    elements.endScreen.onclick = (e) => {
      if (e.target === elements.endScreen) {
        hideEndScreen();
      }
    };
  }, 100);

  show(elements.endScreen);
}

export function hideEndScreen() {
  hide(elements.endScreen);
  if (elements.endScreen) {
    elements.endScreen.onclick = null;
  }
}

/**
 * Show summary modal
 * @param {string} summaryHTML - HTML content for the summary
 */
export function showSummaryModal(summaryHTML) {
  elements.summaryContent.innerHTML = summaryHTML;

  // Add click-outside-to-dismiss
  setTimeout(() => {
    elements.summaryModal.onclick = (e) => {
      if (e.target === elements.summaryModal) {
        hideSummaryModal();
      }
    };
  }, 100);

  show(elements.summaryModal);
}

export function hideSummaryModal() {
  hide(elements.summaryModal);
  if (elements.summaryModal) {
    elements.summaryModal.onclick = null;
  }
}

/**
 * Show introduction modal for Mode 1
 */
export function showMode1Introduction(onDismiss) {
  elements.introTitle.textContent = 'Welcome to Mode 1';
  elements.introText.innerHTML = `
    <p>The model continues the displayed prompt. Guess each generated token from one response, up to four choices per step. A token can be a word, part of a word, punctuation, or a space.</p>
    <p>After each guess, you'll see the model's likelihoods for the returned alternatives. The table groups every unlisted possibility under “All other tokens.”</p>
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
 * Show introduction modal for Mode 2
 */
export function showMode2Introduction(onDismiss) {
  elements.introTitle.textContent = 'Welcome to Mode 2';
  elements.introText.innerHTML = `
    <p>Add short nudges to the displayed passage. An AI judge rates how strongly the passage points toward a hidden concept, from 0 to 100. This fit score is a subjective rating, not a probability.</p>
    <p>Use the score changes as clues. Type the exact hidden concept in a nudge to win, or reveal it after ten turns.</p>
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
export function createMode1EndScreen(score, total, startingPrompt, gameText) {
  const percentage = Math.round((score / total) * 100);
  const gamePlayedPortion = gameText.substring(startingPrompt.length);
  const safeStartingPrompt = escapeHtml(startingPrompt);
  const safeGamePlayedPortion = escapeHtml(gamePlayedPortion);

  const content = `
    <div class="end-results-section">
      <h3>Your Score</h3>
      <p style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
        ${score} / ${total} (${percentage}%)
      </p>
      <p>This is the share of tokens you guessed in this one model response.</p>
    </div>
    <div class="end-results-section">
      <h3>Generated Text</h3>
      <p style="font-style: italic; line-height: 1.8; font-size: 1.1rem;">
        “${safeStartingPrompt}<strong>${safeGamePlayedPortion}</strong>”
      </p>
      <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">
        <strong>Bold text</strong> shows the generated tokens you played. A space may be added at the prompt boundary for readability.
      </p>
    </div>
    <div class="end-results-section">
      <h3>Key Insights</h3>
      <ul style="text-align: left; padding-left: 20px;">
        <li>Each table describes one token position in the model's response to the prompt.</li>
        <li>Returned alternatives and “All other tokens” together cover 100% of that position's likelihood.</li>
        <li>Tokens are not necessarily whole words.</li>
      </ul>
    </div>
  `;

  return {
    title: 'Game Complete!',
    content: content
  };
}

/**
 * Create end screen content for Mode 2 with AI analysis placeholder
 */
export function createMode2EndScreen(target, success, turns, finalScore, scoreHistory, nudgeHistory) {
  const resultMessage = success
    ? `You found the exact hidden concept in ${turns} turns.`
    : `The hidden concept was “${target}”. Your final fit score was ${finalScore}/100 after ${turns} turns.`;

  // Create journey summary
  let journeySummary = createJourneySummary(scoreHistory);

  // Add nudge history
  let nudgeHistoryHTML = '';
  if (nudgeHistory.length > 0) {
    const nudgeListHTML = nudgeHistory
      .map((nudge, index) => {
        const score = scoreHistory[index + 1];
        return `<li><strong>Turn ${index + 1}:</strong> “${escapeHtml(nudge)}” → ${score}/100 fit score</li>`;
      })
      .join('');

    nudgeHistoryHTML = `
      <div class="end-results-section">
        <h3>Your Nudges</h3>
        <ul style="text-align: left; padding-left: 20px;">
          ${nudgeListHTML}
        </ul>
      </div>
    `;
  }

  const content = `
    <div class="end-results-section">
      <h3>Hidden Target</h3>
      <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
        ${escapeHtml(target)}
      </p>
      <p>${escapeHtml(resultMessage)}</p>
      <p>The fit score is an AI judgment of this passage. It is not a measured chance of the concept appearing.</p>
    </div>
    ${journeySummary}
    ${nudgeHistoryHTML}
    <div class="end-results-section ai-analysis-section">
      <h3>AI Feedback</h3>
      <div id="ai-analysis-content-endscreen" class="ai-analysis-content">
        <div class="loading-analysis">
          <div class="spinner-small"></div>
          <p>Analyzing your strategy...</p>
        </div>
      </div>
    </div>
  `;

  return {
    title: success ? 'Success!' : 'Game Over',
    content: content
  };
}

/**
 * Update the AI analysis in the end screen
 */
export function updateEndScreenAnalysis(analysisHTML) {
  const analysisContent = document.getElementById('ai-analysis-content-endscreen');
  if (analysisContent) {
    analysisContent.innerHTML = analysisHTML;
  }
}

/**
 * Update word counter for nudge input
 * @param {string} text - The text to count words from
 * @param {number} maxWords - Maximum allowed words
 * @returns {boolean} - Whether the text is within the word limit
 */
export function updateWordCounter(text, maxWords) {
  const wordCount = countWords(text);

  if (elements.wordCount) {
    elements.wordCount.textContent = wordCount;
  }

  const isOverLimit = wordCount > maxWords;

  if (elements.wordCounter) {
    if (isOverLimit) {
      elements.wordCounter.classList.add('over-limit');
    } else {
      elements.wordCounter.classList.remove('over-limit');
    }
  }

  return !isOverLimit;
}

/**
 * Count words in a string (helper function)
 * @param {string} text - Text to count words from
 * @returns {number} - Number of words
 */
function countWords(text) {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Reset word counter
 */
export function resetWordCounter() {
  if (elements.wordCount) {
    elements.wordCount.textContent = '0';
  }
  if (elements.wordCounter) {
    elements.wordCounter.classList.remove('over-limit');
  }
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

/**
 * Mode 2 Visual Feedback System Functions
 */

/**
 * Get probability color based on value
 */
function getProbabilityColor(probability) {
  if (probability >= 81) return '#4CAF50';
  if (probability >= 61) return '#8BC34A';
  if (probability >= 41) return '#FFC107';
  if (probability >= 21) return '#FF9800';
  return '#E53935';
}

/**
 * Get probability range for path segment
 */
function getProbabilityRange(probability) {
  if (probability >= 81) return '81-100';
  if (probability >= 61) return '61-80';
  if (probability >= 41) return '41-60';
  if (probability >= 21) return '21-40';
  return '0-20';
}

/**
 * Initialize Mode 2 visualizations
 */
export function initMode2Visualizations(maxTurns) {
  // Clear previous visualizations
  const pathSegments = document.getElementById('path-segments');
  const remainingTurns = document.getElementById('remaining-turns');
  const trajectoryPoints = document.getElementById('trajectory-points');
  const trajectoryPath = document.getElementById('trajectory-path');
  const trajectoryArea = document.getElementById('trajectory-area');

  if (pathSegments) pathSegments.innerHTML = '';
  if (remainingTurns) remainingTurns.innerHTML = '';
  if (trajectoryPoints) trajectoryPoints.innerHTML = '';
  if (trajectoryPath) trajectoryPath.setAttribute('d', '');
  if (trajectoryArea) trajectoryArea.setAttribute('d', '');

  // Create remaining turn dots
  if (remainingTurns) {
    for (let i = 0; i < maxTurns; i++) {
      const dot = document.createElement('div');
      dot.className = 'remaining-turn-dot';
      dot.dataset.turn = i + 1;
      remainingTurns.appendChild(dot);
    }
  }

  // Reset probability status
  const probabilityCurrentText = document.getElementById('probability-current-text');
  const feedbackIndicator = document.getElementById('feedback-indicator');
  if (probabilityCurrentText) probabilityCurrentText.textContent = 'Fit score: —';
  if (feedbackIndicator) feedbackIndicator.textContent = '';
}

export function updateCurrentFitScore(score) {
  const currentText = document.getElementById('probability-current-text');
  if (currentText) currentText.textContent = `Fit score: ${score}/100`;
}

/**
 * Update trajectory sparkline chart
 */
export function updateTrajectorySparkline(probabilityHistory) {
  const trajectoryPath = document.getElementById('trajectory-path');
  const trajectoryArea = document.getElementById('trajectory-area');
  const trajectoryPoints = document.getElementById('trajectory-points');

  if (!trajectoryPath || !trajectoryArea || !trajectoryPoints) return;

  const width = 600;
  const height = 100;
  const padding = 5;
  const maxTurns = 10;

  // Calculate positions
  const points = probabilityHistory.map((prob, index) => {
    const x = padding + (index / Math.max(probabilityHistory.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((prob / 100) * (height - 2 * padding));
    return { x, y, prob };
  });

  if (points.length === 0) return;

  // Build path data
  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x} ${points[i].y}`;
  }

  // Build area data
  let areaData = `M ${points[0].x} ${height - padding}`;
  areaData += ` L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    areaData += ` L ${points[i].x} ${points[i].y}`;
  }
  areaData += ` L ${points[points.length - 1].x} ${height - padding}`;
  areaData += ' Z';

  // Set path attributes
  const currentColor = getProbabilityColor(points[points.length - 1].prob);
  trajectoryPath.setAttribute('d', pathData);
  trajectoryPath.setAttribute('stroke', currentColor);
  trajectoryArea.setAttribute('d', areaData);
  trajectoryArea.setAttribute('fill', currentColor);

  // Update points
  trajectoryPoints.innerHTML = '';
  points.forEach((point, index) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'trajectory-point');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', 4);
    circle.setAttribute('fill', getProbabilityColor(point.prob));

    // Add tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `Turn ${index}: fit score ${Math.round(point.prob)}/100`;
    circle.appendChild(title);

    trajectoryPoints.appendChild(circle);
  });
}

/**
 * Add a path segment for a turn
 */
export function addPathSegment(turnNumber, probability, change) {
  const pathSegments = document.getElementById('path-segments');
  const remainingTurns = document.getElementById('remaining-turns');

  if (!pathSegments) return;

  // Create segment
  const segment = document.createElement('div');
  segment.className = 'path-segment';
  segment.dataset.turn = turnNumber;
  segment.dataset.range = getProbabilityRange(probability);
  segment.textContent = `${Math.round(probability)}/100`;
  segment.setAttribute('title', `Turn ${turnNumber}: fit score ${Math.round(probability)}/100`);

  // Add animation based on change
  if (change >= 15) {
    segment.classList.add('glow');
  } else if (change <= -15) {
    segment.classList.add('shake');
  }

  pathSegments.appendChild(segment);

  // Remove one remaining turn dot
  if (remainingTurns) {
    const dots = remainingTurns.querySelectorAll('.remaining-turn-dot');
    if (dots.length > 0) {
      dots[0].remove();
    }
  }
}

/**
 * Update visual feedback indicator
 */
export function updateVisualFeedback(change, currentProbability) {
  const feedbackIndicator = document.getElementById('feedback-indicator');
  const probabilityCurrentText = document.getElementById('probability-current-text');

  if (!feedbackIndicator) return;

  // Update current probability text
  if (probabilityCurrentText) {
    probabilityCurrentText.textContent = `Fit score: ${Math.round(currentProbability)}/100`;
  }

  // Clear previous feedback
  feedbackIndicator.className = 'feedback-indicator';

  // Determine feedback type and icon
  let icon = '';
  let text = '';
  let feedbackClass = '';

  if (change >= 15) {
    icon = '↑↑';
    text = `+${Math.round(change)} points`;
    feedbackClass = 'strong-increase';
    feedbackIndicator.setAttribute('aria-label', `Strong increase: ${Math.round(change)} score points`);
  } else if (change >= 5) {
    icon = '↑';
    text = `+${Math.round(change)} points`;
    feedbackClass = 'small-increase';
    feedbackIndicator.setAttribute('aria-label', `Small increase: ${Math.round(change)} score points`);
  } else if (change <= -15) {
    icon = '↓↓';
    text = `${Math.round(change)} points`;
    feedbackClass = 'strong-decrease';
    feedbackIndicator.setAttribute('aria-label', `Strong decrease: ${Math.round(change)} score points`);
  } else if (change <= -5) {
    icon = '↓';
    text = `${Math.round(change)} points`;
    feedbackClass = 'small-decrease';
    feedbackIndicator.setAttribute('aria-label', `Small decrease: ${Math.round(change)} score points`);
  } else {
    icon = '→';
    text = `${Math.round(change)} points`;
    feedbackClass = 'neutral';
    feedbackIndicator.setAttribute('aria-label', `Minimal change: ${Math.round(change)} score points`);
  }

  feedbackIndicator.textContent = `${icon} ${text}`;
  feedbackIndicator.className = `feedback-indicator ${feedbackClass} fade-out`;
}

/**
 * Create journey summary for end screen
 */
export function createJourneySummary(scoreHistory) {
  if (scoreHistory.length === 0) return '';

  const startingScore = scoreHistory[0];
  const finalScore = scoreHistory[scoreHistory.length - 1];
  const peakScore = Math.max(...scoreHistory);

  // Find biggest jump
  let biggestJump = 0;
  let biggestJumpTurn = 0;
  for (let i = 1; i < scoreHistory.length; i++) {
    const change = scoreHistory[i] - scoreHistory[i - 1];
    if (Math.abs(change) > Math.abs(biggestJump)) {
      biggestJump = change;
      biggestJumpTurn = i;
    }
  }

  // Count increases vs decreases
  let increases = 0;
  let decreases = 0;
  for (let i = 1; i < scoreHistory.length; i++) {
    const change = scoreHistory[i] - scoreHistory[i - 1];
    if (change > 0) increases++;
    else if (change < 0) decreases++;
  }

  return `
    <div class="journey-summary">
      <h4>Journey Summary</h4>
      <div class="journey-stats">
        <div class="journey-stat">
          <div class="journey-stat-value">${startingScore}/100</div>
          <div class="journey-stat-label">Starting fit</div>
        </div>
        <div class="journey-stat">
          <div class="journey-stat-value">${peakScore}/100</div>
          <div class="journey-stat-label">Peak fit</div>
        </div>
        <div class="journey-stat">
          <div class="journey-stat-value">${finalScore}/100</div>
          <div class="journey-stat-label">Final fit</div>
        </div>
        <div class="journey-stat">
          <div class="journey-stat-value">${biggestJumpTurn ? `${biggestJump > 0 ? '+' : ''}${Math.round(biggestJump)} points` : '—'}</div>
          <div class="journey-stat-label">${biggestJumpTurn ? `Biggest change (turn ${biggestJumpTurn})` : 'No nudges yet'}</div>
        </div>
        <div class="journey-stat">
          <div class="journey-stat-value">${increases} / ${decreases}</div>
          <div class="journey-stat-label">Increases / Decreases</div>
        </div>
      </div>
      <div class="journey-path-display">
        <h4>Your Path</h4>
        <div class="path-segments">
          ${scoreHistory.slice(1).map((score, index) => `
            <div class="path-segment" data-range="${getProbabilityRange(score)}" title="Turn ${index + 1}: fit score ${score}/100">
              ${score}/100
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
