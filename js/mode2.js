/** Mode 2: steer a collaborative story toward a visible theme. */

import { CONFIG, getRandomPrompt, getRandomItem, countWords } from './config.js';
import { getTargetFitScore, getStoryBeat, generateNudgeAnalysis } from './api.js';
import * as ui from './ui.js';

function emptyState() {
  return {
    isActive: false,
    isBusy: false,
    target: '',
    currentTurn: 0,
    maxTurns: CONFIG.mode2.maxTurns,
    startingPrompt: '',
    currentContext: '',
    currentScore: null,
    scoreHistory: [],
    nudgeHistory: [],
    beatHistory: [],
    hasWon: false
  };
}

let version = 0;
let gameState = emptyState();

export function init() {
  const elements = ui.getElements();
  elements.submitNudgeBtn.addEventListener('click', handleNudgeSubmit);
  elements.nudgeInput.addEventListener('keypress', event => {
    if (event.key === 'Enter' && !elements.submitNudgeBtn.disabled) handleNudgeSubmit();
  });
  elements.nudgeInput.addEventListener('input', event => {
    const valid = ui.updateWordCounter(event.target.value, CONFIG.mode2.maxNudgeWords);
    elements.submitNudgeBtn.disabled = !event.target.value.trim() || !valid || !gameState.isActive || gameState.isBusy;
  });
  elements.giveUpBtn.addEventListener('click', () => {
    if (gameState.isActive && !gameState.isBusy && confirm('Finish this story and see the summary?')) {
      endGame();
    }
  });
}

export async function startGame() {
  const currentVersion = ++version;
  const startingPrompt = getRandomPrompt('mode2');
  const target = getRandomItem(CONFIG.mode2.targets);
  gameState = {
    ...emptyState(),
    target,
    startingPrompt,
    currentContext: startingPrompt
  };

  ui.clearGameUI();
  ui.hide('startControls');
  ui.show('mode2Controls');
  ui.showProbabilityMeter();
  ui.setMode2Goal(target, CONFIG.mode2.ideas[target], idea => {
    if (!gameState.isActive || gameState.isBusy) return;
    const input = ui.getElements().nudgeInput;
    input.value = idea;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
  ui.initMode2Visualizations(gameState.maxTurns);
  ui.setCurrentText(startingPrompt);
  ui.updateTurn(0, gameState.maxTurns);
  ui.getElements().nudgeInput.disabled = true;
  ui.getElements().submitNudgeBtn.disabled = true;
  ui.showLoading();

  try {
    const score = await getTargetFitScore(startingPrompt, target);
    if (currentVersion !== version) return;
    gameState.currentScore = score;
    gameState.scoreHistory = [score];
    gameState.isActive = true;
    ui.updateCurrentFitScore(score);
    ui.updateTrajectorySparkline(gameState.scoreHistory);

    const elements = ui.getElements();
    elements.nudgeInput.disabled = false;
    elements.submitNudgeBtn.disabled = true;
    elements.nudgeInput.value = '';
    ui.resetWordCounter();
    ui.show(elements.giveUpBtn.parentElement);
    ui.showMode2Introduction(() => elements.nudgeInput.focus());
  } catch (error) {
    if (currentVersion === version) {
      reset();
      throw error;
    }
  } finally {
    if (currentVersion === version) ui.hideLoading();
  }
}

async function handleNudgeSubmit() {
  if (!gameState.isActive || gameState.isBusy) return;
  const elements = ui.getElements();
  const nudge = elements.nudgeInput.value.trim();
  if (!nudge) {
    ui.showFeedback('Please add a story move.', 'neutral', false, 2000);
    return;
  }
  if (countWords(nudge) > CONFIG.mode2.maxNudgeWords) {
    ui.showFeedback(`Use at most ${CONFIG.mode2.maxNudgeWords} words.`, 'error', false, 2000);
    return;
  }

  const currentVersion = version;
  const proposedContext = `${gameState.currentContext}\n${nudge}`;
  gameState.isBusy = true;
  elements.nudgeInput.disabled = true;
  elements.submitNudgeBtn.disabled = true;
  ui.hideFeedback();
  ui.showLoading();

  try {
    const beat = await getStoryBeat(proposedContext, nudge);
    if (currentVersion !== version) return;
    const completedContext = `${proposedContext} ${beat}`;
    const score = await getTargetFitScore(completedContext, gameState.target);
    if (currentVersion !== version) return;

    const previousScore = gameState.currentScore;
    const change = score - previousScore;
    gameState.currentContext = completedContext;
    gameState.currentScore = score;
    gameState.currentTurn++;
    gameState.scoreHistory.push(score);
    gameState.nudgeHistory.push(nudge);
    gameState.beatHistory.push(beat);
    gameState.hasWon = score >= 80;

    ui.setCurrentText(completedContext);
    ui.showStoryReaction(beat);
    ui.updateTurn(gameState.currentTurn, gameState.maxTurns);
    ui.updateTrajectorySparkline(gameState.scoreHistory);
    ui.addPathSegment(gameState.currentTurn, score, change);
    ui.updateVisualFeedback(change, score);
    elements.nudgeInput.value = '';
    ui.resetWordCounter();

    if (gameState.hasWon || gameState.currentTurn >= gameState.maxTurns) {
      endGame();
    } else {
      const direction = change > 0 ? `rose by ${change}` : change < 0 ? `fell by ${-change}` : 'did not change';
      ui.showFeedback(`The AI continued your story. Goal fit ${direction}${change === 0 ? '' : ' points'}.`, change > 0 ? 'success' : change < 0 ? 'error' : 'neutral', false, 0);
    }
  } catch (error) {
    if (currentVersion !== version) return;
    console.error('Unable to continue or score story:', error);
    const message = error.message === 'RATE_LIMIT'
      ? 'API rate limit reached. Your move was not used; please try again shortly.'
      : 'Unable to continue this story. Your move was not used; please try again.';
    ui.showError(message);
  } finally {
    if (currentVersion === version) {
      gameState.isBusy = false;
      ui.hideLoading();
      if (gameState.isActive) {
        elements.nudgeInput.disabled = false;
        elements.submitNudgeBtn.disabled = !elements.nudgeInput.value.trim() ||
          countWords(elements.nudgeInput.value) > CONFIG.mode2.maxNudgeWords;
        elements.nudgeInput.focus();
      }
    }
  }
}

function endGame() {
  if (!gameState.isActive) return;
  gameState.isActive = false;
  const elements = ui.getElements();
  elements.nudgeInput.disabled = true;
  elements.submitNudgeBtn.disabled = true;
  ui.hide(elements.giveUpBtn.parentElement);
  ui.showEndScreen(ui.createMode2EndScreen(
    gameState.target,
    gameState.hasWon,
    gameState.currentTurn,
    gameState.currentScore,
    gameState.scoreHistory,
    gameState.nudgeHistory,
    gameState.beatHistory
  ));
  if (gameState.nudgeHistory.length === 0) {
    ui.updateEndScreenAnalysis('<p>No story moves to analyze yet.</p>');
  } else {
    generateAndDisplayAnalysis(version);
  }
}

async function generateAndDisplayAnalysis(currentVersion) {
  try {
    const analysis = await generateNudgeAnalysis(
      gameState.startingPrompt,
      gameState.nudgeHistory,
      gameState.beatHistory,
      gameState.scoreHistory,
      gameState.target,
      gameState.hasWon
    );
    if (currentVersion !== version) return;
    const formatted = ui.escapeHtml(analysis)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    ui.updateEndScreenAnalysis(`<div style="line-height: 1.8;">${formatted}</div>`);
  } catch (error) {
    if (currentVersion === version) ui.updateEndScreenAnalysis('<p>Analysis is unavailable right now.</p>');
  }
}

export function reset() {
  version++;
  gameState = emptyState();
  ui.hideLoading();
  ui.clearGameUI();
  ui.show('startControls');
  ui.hide('mode2Controls');
  ui.hideProbabilityMeter();
  ui.hideSummaryModal();
  const elements = ui.getElements();
  elements.nudgeInput.value = '';
  elements.nudgeInput.disabled = false;
  elements.submitNudgeBtn.disabled = true;
  ui.resetWordCounter();
  ui.show(elements.giveUpBtn.parentElement);
}

export function isActive() {
  return gameState.isActive;
}
