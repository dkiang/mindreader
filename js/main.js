/**
 * Main Application Module
 * Entry point and app coordination
 */

import { isValidApiKey } from './config.js';
import { setApiKey, getApiKey, clearApiKey, testApiConnection } from './api.js';
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

  // Check if API key exists
  const existingKey = getApiKey();
  if (existingKey && isValidApiKey(existingKey)) {
    // Show app directly
    ui.showAppContainer();
    initializeApp();
  } else {
    // Show API key input
    ui.showApiKeySection();
  }

  // Setup global event listeners
  setupEventListeners();

  // Initialize modes
  mode1.init();
  mode2.init();

  console.log('MINDREADER initialized');
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  const elements = ui.getElements();

  // API Key submission
  elements.apiKeySubmit.addEventListener('click', handleApiKeySubmit);
  elements.apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleApiKeySubmit();
    }
  });

  // Change API key
  elements.changeApiKeyBtn.addEventListener('click', handleChangeApiKey);

  // Mode selection buttons
  elements.mode1Btn.addEventListener('click', () => switchMode('mode1'));
  elements.mode2Btn.addEventListener('click', () => switchMode('mode2'));

  // Start game button
  elements.startGameBtn.addEventListener('click', handleStartGame);

  // Play again button
  elements.playAgainBtn.addEventListener('click', handlePlayAgain);
}

/**
 * Handle API key submission
 */
async function handleApiKeySubmit() {
  const elements = ui.getElements();
  const apiKey = elements.apiKeyInput.value.trim();

  // Validate API key format
  if (!isValidApiKey(apiKey)) {
    ui.showError('Invalid API key format. OpenAI keys start with "sk-"');
    return;
  }

  // Show loading
  elements.apiKeySubmit.disabled = true;
  elements.apiKeySubmit.textContent = 'Testing...';

  // Set API key
  setApiKey(apiKey);

  // Test connection
  const result = await testApiConnection();

  if (result.success) {
    // Success! Show app
    ui.showAppContainer();
    initializeApp();
  } else {
    // Invalid key
    ui.showError(`API connection failed: ${result.error}`);
    clearApiKey();
    elements.apiKeySubmit.disabled = false;
    elements.apiKeySubmit.textContent = 'Start Learning';
  }
}

/**
 * Handle changing API key
 */
function handleChangeApiKey() {
  if (confirm('Are you sure you want to change your API key? The current game will be reset.')) {
    clearApiKey();
    resetCurrentMode();
    ui.showApiKeySection();

    // Clear the input
    const elements = ui.getElements();
    elements.apiKeyInput.value = '';
    elements.apiKeySubmit.disabled = false;
    elements.apiKeySubmit.textContent = 'Start Learning';
  }
}

/**
 * Initialize the main app after API key is set
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
    ui.show('mode2Controls');
    ui.show('startControls');
  }

  // Reset UI
  ui.clearGameUI();
  ui.hideEndScreen();
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
  ui.hideEndScreen();
  resetCurrentMode();
  ui.show('startControls');
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
