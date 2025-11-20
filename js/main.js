/**
 * Main Application Module
 * Entry point and app coordination
 */

import * as ui from './ui.js';
import * as mode1 from './mode1.js';
import * as mode2 from './mode2.js';

// Application state
let appState = {
  currentMode: 'mode1', // 'mode1' or 'mode2'
  isInitialized: false
};

/**
 * Initialize the application
 */
function init() {
  console.log('MINDREADER initializing...');

  // Initialize UI
  ui.initUI();

  // Setup global event listeners
  setupEventListeners();

  // Initialize modes
  mode1.init();
  mode2.init();

  // Start with Mode 1
  initializeApp();

  console.log('MINDREADER initialized');
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  const elements = ui.getElements();

  // Mode selection buttons
  elements.mode1Btn.addEventListener('click', () => switchMode('mode1'));
  elements.mode2Btn.addEventListener('click', () => switchMode('mode2'));

  // Start game button
  elements.startGameBtn.addEventListener('click', handleStartGame);

  // Play again button
  elements.playAgainBtn.addEventListener('click', handlePlayAgain);
}

/**
 * Initialize the main app
 */
function initializeApp() {
  if (appState.isInitialized) return;

  // Set initial mode
  switchMode('mode1');

  appState.isInitialized = true;
}

/**
 * Switch between modes
 */
function switchMode(mode) {
  if (appState.currentMode === mode) return;

  // Reset current mode
  resetCurrentMode();

  // Update mode state
  appState.currentMode = mode;

  // Update UI
  const elements = ui.getElements();

  if (mode === 'mode1') {
    // Mode 1: Guess the Next Token
    elements.mode1Btn.classList.add('active');
    elements.mode2Btn.classList.remove('active');

    ui.show('mode1Controls');
    ui.hide('mode2Controls');
    ui.show('startControls');

  } else if (mode === 'mode2') {
    // Mode 2: Steer the Hidden Narrative
    elements.mode2Btn.classList.add('active');
    elements.mode1Btn.classList.remove('active');

    ui.hide('mode1Controls');
    ui.hide('mode2Controls'); // Hide nudge controls initially
    ui.show('startControls');
  }

  // Reset UI
  ui.clearGameUI();
  ui.hideEndScreen();

  // Re-enable start button
  elements.startGameBtn.disabled = false;
}

/**
 * Reset the current mode
 */
function resetCurrentMode() {
  if (appState.currentMode === 'mode1') {
    mode1.reset();
  } else if (appState.currentMode === 'mode2') {
    mode2.reset();
  }
}

/**
 * Handle start game button
 */
async function handleStartGame() {
  const elements = ui.getElements();
  elements.startGameBtn.disabled = true;

  try {
    if (appState.currentMode === 'mode1') {
      await mode1.startGame();
    } else if (appState.currentMode === 'mode2') {
      await mode2.startGame();
    }
  } catch (error) {
    console.error('Error starting game:', error);
    ui.showError('Error starting game. Please try again.');
    elements.startGameBtn.disabled = false;
  }
}

/**
 * Handle play again button
 */
function handlePlayAgain() {
  const elements = ui.getElements();

  ui.hideEndScreen();
  resetCurrentMode();
  ui.show('startControls');

  // Re-enable start button
  elements.startGameBtn.disabled = false;
}

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
