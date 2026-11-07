/**
 * Configuration settings for MINDREADER
 * Browser game parameters. Model request settings live in api/chat.js.
 */

export const CONFIG = {
  // Mode 1 Settings - "Guess the Next Word"
  mode1: {
    rounds: 5,                    // Maximum complete-word rounds per game
    continuationTokens: 60,        // Generated tokens to reveal after the playable rounds

    // Starting prompts for Mode 1
    startingPrompts: [
      "The stock market was about to",
      "After years of research, the scientist finally",
      "The door creaked open and inside they found",
      "On the first day of school, the teacher",
      "The detective looked at the evidence and",
      "When the phone rang at midnight, she",
      "The ancient map revealed a path to",
      "As the storm approached, the captain decided to",
      "The package arrived three days late and contained",
      "Breaking news: scientists have discovered that",
      "The restaurant critic took one bite and",
      "In the final seconds of the game, the player",
      "The email attachment wouldn't open until she",
      "According to the weather forecast, tomorrow will be",
      "The job interview was going well until the manager",
      "His grandmother's recipe called for exactly",
      "The museum curator carefully examined the painting and",
      "When the lights came back on, everyone saw",
      "The car wouldn't start because the",
      "After reading the contract, the lawyer warned them about",
      "The hiking trail ended at a cliff where they could see",
      "The password reset email said to",
      "In her acceptance speech, the winner thanked",
      "The flight attendant announced that passengers should",
      "According to the instructions, the first step was to"
    ]
  },

  // Mode 2 Settings - "Steer the Story"
  mode2: {
    maxTurns: 6,
    maxNudgeWords: 20,

    // Target concepts to be guessed
    targets: [
      "accident",
      "argument",
      "apology",
      "confession",
      "crime",
      "surprise",
      "revelation",
      "betrayal",
      "discovery",
      "reunion"
    ],

    ideas: {
      accident: ['A small warning goes unnoticed.', 'The equipment begins to fail.', 'Someone makes a rushed choice.'],
      argument: ['Two friends want opposite things.', 'A careless remark changes the mood.', 'Someone refuses to back down.'],
      apology: ['Someone realizes they caused harm.', 'An old mistake comes up again.', 'A person asks to be heard.'],
      confession: ['Someone can no longer keep a secret.', 'A hidden detail slips out.', 'The truth would change a friendship.'],
      crime: ['An important object goes missing.', 'A witness notices a contradiction.', 'Someone has a reason to lie.'],
      surprise: ['An expected plan suddenly changes.', 'An unexpected guest arrives.', 'Someone hides a gift or message.'],
      revelation: ['A familiar fact has a new meaning.', 'A letter reveals a hidden connection.', 'Someone notices what others missed.'],
      betrayal: ['A trusted friend makes a secret deal.', 'A promise is quietly broken.', 'Someone chooses loyalty to another person.'],
      discovery: ['A clue appears in an odd place.', 'Someone opens a forgotten box.', 'A question leads to an answer.'],
      reunion: ['Two people have been apart for years.', 'An old friend returns unexpectedly.', 'Someone recognizes a familiar voice.']
    },

    // Starting prompts for Mode 2
    startingPrompts: [
      "Sarah walked into the office that morning, not knowing that",
      "The letter had been sitting unopened for three days. When he finally read it,",
      "They had been friends for years, but tonight something felt different.",
      "The phone call came at exactly 9:47 PM. The voice on the other end said,",
      "She found the old photograph in the attic. It showed",
      "The meeting was supposed to be routine, but then someone mentioned",
      "Marcus hadn't seen his brother in ten years. When the doorbell rang,",
      "The email subject line simply read 'We need to talk.' Opening it, she saw",
      "After the concert ended, two people stayed behind. One of them whispered,",
      "The diary entry was dated 1987. It began with the words,",
      "Everyone at the dinner table went silent when Tom said,",
      "The voicemail was from a number she didn't recognize. The message began,",
      "He had been keeping the secret for months, but now his wife had asked him directly:",
      "The package on the doorstep had no return address. Inside was",
      "When she arrived at the café, her old college roommate looked completely different.",
      "The text message arrived at 2 AM: 'I know what you did.' He replied,",
      "Walking through the parking lot, Jennifer noticed someone watching her from",
      "The family had gathered for Thanksgiving when Dad cleared his throat and announced,",
      "After years apart, they ran into each other at the grocery store.",
      "The police officer's expression changed when she checked his license.",
      "He opened his laptop to find an unfamiliar document on the desktop titled",
      "The retirement party was winding down when the CEO pulled her aside and",
      "She thought she was alone in the house until she heard footsteps",
      "The news report showed a familiar face. Her husband turned up the volume as",
      "They were sorting through Mom's belongings when they found a box labeled 'Do Not Open.'"
    ]
  }
};

// Helper function to get a random item from an array
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const promptDecks = new Map();

function refillPromptDeck(mode, previousPrompt) {
  const prompts = mode === 'mode1'
    ? CONFIG.mode1.startingPrompts
    : CONFIG.mode2.startingPrompts;
  const deck = [...prompts];

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  if (deck.length > 1 && deck[0] === previousPrompt) {
    const swapIndex = deck.findIndex(prompt => prompt !== previousPrompt);
    [deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]];
  }

  promptDecks.set(mode, deck);
  return deck;
}

// Helper function to get a random starting prompt for a mode
export function getRandomPrompt(mode) {
  if (mode !== 'mode1' && mode !== 'mode2') return '';
  const previousPrompt = promptDecks.get(`${mode}:previous`);
  const deck = promptDecks.get(mode)?.length
    ? promptDecks.get(mode)
    : refillPromptDeck(mode, previousPrompt);
  const prompt = deck.shift();
  promptDecks.set(`${mode}:previous`, prompt);
  return prompt;
}

// Helper function to count words in a string
export function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
