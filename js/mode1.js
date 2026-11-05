/** Mode 1: guess each token in one actual model-generated sequence. */

import { CONFIG, getRandomPrompt } from './config.js';
import { getTokenSequence } from './api.js';
import { chooseTokenOptions, displayToken } from './token-math.js';
import * as ui from './ui.js';

let version = 0;
let gameState = {
  isActive: false,
  currentRound: 0,
  maxRounds: 0,
  score: 0,
  currentPrompt: '',
  fullText: '',
  frames: []
};

export function init() {}

export function startGame() {
  const currentVersion = ++version;
  const prompt = getRandomPrompt('mode1');
  gameState = {
    isActive: true,
    currentRound: 1,
    maxRounds: CONFIG.mode1.rounds,
    score: 0,
    currentPrompt: prompt,
    fullText: prompt,
    frames: []
  };

  ui.clearGameUI();
  ui.hide('startControls');
  ui.setCurrentText(prompt);
  ui.updateScore(0, gameState.maxRounds);
  ui.updateRound(1, gameState.maxRounds);
  ui.showMode1Introduction(() => loadSequence(currentVersion));
}

async function loadSequence(currentVersion) {
  ui.showLoading();
  try {
    const frames = await getTokenSequence(gameState.currentPrompt, CONFIG.mode1.rounds);
    if (currentVersion !== version) return;
    gameState.frames = frames;
    gameState.maxRounds = frames.length;
    ui.updateScore(0, frames.length);
    ui.updateRound(1, frames.length);
    playRound(currentVersion);
  } catch (error) {
    if (currentVersion !== version) return;
    console.error('Unable to load token sequence:', error);
    const message = error.message === 'RATE_LIMIT'
      ? 'API rate limit reached. Please wait a moment and try again.'
      : error.message === 'INVALID_API_KEY'
        ? 'Invalid API key. Please contact the site owner.'
        : error.message === 'MODEL_UNAVAILABLE'
          ? 'The AI model is unavailable. Please contact the site owner.'
          : 'Unable to load model tokens. Please try again.';
    ui.showError(message);
    gameState.isActive = false;
    ui.show('startControls');
    ui.getElements().startGameBtn.disabled = false;
  } finally {
    if (currentVersion === version) ui.hideLoading();
  }
}

function playRound(currentVersion) {
  const frame = gameState.frames[gameState.currentRound - 1];
  const options = chooseTokenOptions(frame.distribution, frame.chosenToken);
  ui.createTokenButtons(options, selected => handleTokenSelection(selected, currentVersion));
}

function handleTokenSelection(selected, currentVersion) {
  if (currentVersion !== version || !gameState.isActive) return;
  const frame = gameState.frames[gameState.currentRound - 1];
  const isCorrect = selected.token === frame.chosenToken;
  if (isCorrect) gameState.score++;
  ui.updateScore(gameState.score, gameState.maxRounds);
  ui.highlightTokenButtons(selected.token, frame.chosenToken);
  ui.showProbabilityTable(frame.distribution, frame.otherProbability);

  // Chat responses normally start without a leading space. Add one visual
  // separator at the prompt/response boundary; later tokens are appended exactly.
  if (gameState.currentRound === 1 &&
      /[\p{L}\p{N}]$/u.test(gameState.fullText) &&
      /^[\p{L}\p{N}]/u.test(frame.chosenToken)) {
    gameState.fullText += ' ';
  }
  gameState.fullText += frame.chosenToken;
  ui.setCurrentText(gameState.fullText);

  const label = displayToken(frame.chosenToken);
  ui.showFeedback(
    isCorrect ? `Correct. The model generated “${label}”.` : `The model generated “${label}”.`,
    isCorrect ? 'success' : 'error',
    true,
    () => {
      if (currentVersion !== version || !gameState.isActive) return;
      if (gameState.currentRound >= gameState.maxRounds) {
        endGame();
      } else {
        gameState.currentRound++;
        ui.updateRound(gameState.currentRound, gameState.maxRounds);
        ui.hideProbabilityTable();
        playRound(currentVersion);
      }
    }
  );
}

function endGame() {
  gameState.isActive = false;
  ui.showEndScreen(ui.createMode1EndScreen(
    gameState.score,
    gameState.maxRounds,
    gameState.currentPrompt,
    gameState.fullText
  ));
}

export function reset() {
  version++;
  gameState.isActive = false;
  ui.hideLoading();
  ui.clearGameUI();
  ui.show('startControls');
  ui.hide('scoreDisplay');
  ui.hide('roundDisplay');
}

export function isActive() {
  return gameState.isActive;
}
