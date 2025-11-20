# **Product Requirements Document (PRD)**  
## **Project: MINDREADER — Next-Token Prediction Simulator**  
**Tech Stack:** HTML, CSS, Vanilla JavaScript  
**Platforms:** Web, fully mobile-responsive  
**LLM API:** Must support logprobs (per-token probability distributions)

# **1. Overview**

MINDREADER is an interactive web app that simulates how a language model predicts and selects next tokens in a text sequence. It teaches users—students, educators, developers—how next-token prediction works, why LLMs are conservative, and why steering them is hard.

The app supports two distinct modes:

### **Mode 1 — “Guess the Next Token”**
User is shown a sentence fragment and must guess which of several word options the AI is most likely to pick next.  
After each guess, the system reveals the actual probability distribution and adds the correct next token to the sentence.

### **Mode 2 — “Steer the Hidden Narrative”**
A target concept is secretly chosen.  
The AI begins generating a narrative path silently.  
The user inserts occasional “nudges” (short phrases).  
A probability meter shows how close their nudges come to triggering the hidden target.  
The student infers the target and attempts to force the narrative toward it.

# **2. Goals**

### **Educational Objectives**
- Teach users how LLM next-token prediction works.  
- Demonstrate the model’s bias toward high-frequency, safe, conventional continuations.  
- Show how difficult it is to shift an LLM’s trajectory without explicit lexical signals.  
- Give users an experiential sense of probability distributions, token-level inertia, and narrative “momentum.”

### **User Experience Objectives**
- Simple, visual, responsive interface.  
- Zero friction: no accounts, no downloads, no scrolling required.  
- Fast interaction loop (< 300ms latency ideal).  
- Works on mobile, tablet, and desktop.  
- Clean minimal UI suitable for a classroom.

# **3. Core Features**

##Mode 1 — Guess the Next Token
###3.1. Mode 1 Flow

1. Display a starting text fragment.
2. Query LLM with logprobs=5 (or more) to retrieve the top tokens + probabilities.
3. Randomly select 4 option words:
	* Number 1 top token
	* a mid-prob token
	* a low-but-plausible token
	* a very unlikely token

4. Present these as buttons.

5. User chooses one.

6. UI displays:
	* correct token
	* a mini-table of token probabilities

7. Append the correct token to the text fragment.

8. Continue for N rounds (configurable: default = 5).

9. End screen shows:
	* 	Score (e.g., "2/5 correct")
	* 	Final generated sentence
	* 	Summary insights

###3.2. Mode 1 Requirements
**Inputs**:
	* Starting text prompt (string)
	* Number of rounds (integer)
	* Temperature for AI (0–0.3 recommended)
	* Logprob count (5–20)

**Outputs**:
	* 	Probability table (token, prob, rank)
	* 	Final text
	* 	Score

**UI Components**:
	* Top area: running text fragment
	* Middle area: 4 selectable token buttons
	* Bottom: feedback (“Correct” / “Incorrect”), probability visualization

**Probability Visualization Format**:

Simple textual table:

Token    Probability    Rank
set      42%            #1
rise     22%            #2
dip      5%             #5
explode  <1%            #37

##Mode 2 — Steer the Hidden Narrative
##3.3. Mode 2 Flow

1. System selects a hidden target concept from a predefined list (e.g., “accident,” “apology,” “argument,” “confession,” “surprise”).
2. Display a starting fragment to the user.
3. Backend LLM generates a silent continuation (e.g., 20–40 tokens).
4. User can input a “nudge” phrase every turn (max 6 words).
5. System inserts the user's nudge into the context.
6. System estimates:
	**P(target concept appears in the next N tokens)**
7. Display this probability using a horizontal meter (0–100%).
8. User continues nudging until:
	* they reach 100%, or
	* they hit max turns (default: 10).
9. End screen reveals:
	* Hidden target
	* Model’s original continuation
	* Probability graph over time
	* Annotated insights on steering difficulty

##3.4. Mode 2 Requirements
**Inputs:**
	* Starting fragment
	* List of target concepts
	* Hidden target (random selection)
	* Max user turns
	* Silent model continuation length (20–40 tokens)

**Target Probability Calculation:
**
LLM queried with prompt:
Given the context below, estimate the probability (0–100%) that the concept "<TARGET>" will appear in the next 20 tokens of the model's natural continuation. Respond with only a number.

System interprets number into meter %.

**UI Components:**
	* Top: running text with user nudges appended
	* Middle: user input box
	* Prob meter (horizontal bar) with % displayed
	* Turn counter
	* Feedback messages (“Small increase”, “Strong increase”, “Decrease”)

# **4. User Interface & UX**
##4.1. Layout Structure (Shared Across Both Modes)
-----------------------------------------
|          Title / Mode Selector        |
-----------------------------------------
|         Text Context Display          |
-----------------------------------------
|   Mode-Specific Interaction Area      |
|   (Buttons or Input Box)              |
-----------------------------------------
|     Feedback / Probability Meter      |
-----------------------------------------
|              Footer                   |
-----------------------------------------

##4.2. Mobile Requirements
	* Stack vertically.
	* All clickable elements ≥ 44px height.
	* Text wraps naturally.
	* Probability meter responsive (full width).
	* No horizontal scroll allowed.

##4.3. Desktop Requirements

Wider layout.

Sentence text may be centered or left-aligned.

Probability tables formatted into two columns when space permits.

5. Architecture
5.1. No Frameworks Allowed

Only:

HTML

CSS (vanilla; can use CSS variables)

JavaScript (ES6+)

No bundlers, no libraries, no frameworks.

5.2. JavaScript Modules

Use ES modules with the following structure:

/js/api.js

Functions for API calls to LLM

getNextTokenDistribution()

estimateTargetProbability()

Uses fetch()

/js/mode1.js

Game state

UI generation for token buttons

Probability reveal table

Score tracking

/js/mode2.js

Manages hidden target

Handles silent model generation

Probability meter logic

Turn tracking

/js/ui.js

DOM helpers

Meter animation

Mobile adjustments

/js/main.js

Mode selection

Initializes app

6. APIs & Data Flow
6.1. Data Flow for Mode 1

User loads Mode 1.

JS sends prompt to LLM with logprobs flag.

AI returns:

tokens

logprobs

chosen top_token

JS selects 4 candidate options.

User picks one.

JS reveals probability table.

JS appends real token to story.

Loop.

6.2. Data Flow for Mode 2

JS chooses hidden target (random from list).

JS sends starting fragment to LLM to produce silent continuation.

User enters nudge.

JS inserts nudge into context.

JS asks LLM for probability of target within next 20 token continuation.

LLM returns a single number (0–100).

JS animates meter.

Loop until:

meter hits 100%, or

max turns used.

JS reveals hidden target + reflection data.

7. UI Detailed Specifications
7.1. Text Context Display

Monospace or clean serif font

Light grey background (#f7f7f7)

Padding: 16px

Rounded corners: 8px

Line breaks handled automatically

Max width: 600px on desktop

100% width on mobile

7.2. Buttons (Mode 1)

4 buttons arranged vertically on mobile, grid of 2x2 on desktop

Padding: 10–12px

Border-radius: 6px

Hover/active states

Click locks all buttons and triggers reveal

7.3. Probability Meter (Mode 2)

Full-width bar

Background: #ddd

Fill color: #4CAF50 (green)

Smooth transition animation (300ms ease-out)

Percentage text centered

Always visible

7.4. Feedback Messages

Color coded:

Increase: green

Small increase: olive

Decrease: red

Neutral: grey

8. States & Error Handling
8.1. Loading State

Show animated dots or “Thinking…” message.

8.2. Network Failures

Display small retry button.

8.3. API Rate Limits

Temporarily disable user input; display friendly message:

“Model is cooling off. Try again in a few seconds.”

9. Configuration Options

In /js/config.js:

export const CONFIG = {
  mode1Rounds: 5,
  mode1LogprobCount: 10,
  mode1Temperature: 0.2,

  mode2MaxTurns: 10,
  mode2SilentTokens: 30,
  mode2Targets: [
    "accident",
    "argument",
    "apology",
    "confession",
    "crime",
    "surprise",
    "revelation"
  ]
};

10. Non-Functional Requirements
10.1. Performance

< 300ms UI updates

< 2s per LLM call

Zero jank on mobile

10.2. Accessibility

High contrast

Button labels screen-reader friendly

Keyboard navigation required

10.3. Stability

No dependencies

Works in modern browsers (Chrome, Safari, Firefox, Edge)

11. Completion Criteria

The project is considered complete when:

* Both Mode 1 and Mode 2 are fully playable.
* Mobile and desktop layouts are responsive and accessible.
* All UI interactions work without frameworks.
* LLM calls correctly surface log-probabilities (Mode 1).
* Target probability meter is operational (Mode 2).
* Clear end-of-round summary appears in both modes.
* Code is modular (ES6 modules) and documented.

12. Optional Extensions (Not MVP)

Dark mode

Teacher dashboard showing aggregated student results

Shareable “challenge links” for specific prompts

Export session as JSON

“Free Play” mode displaying real-time token probabilities