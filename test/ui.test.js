import test from 'node:test';
import assert from 'node:assert/strict';
import { initUI, setMode2Goal, setNudgeIdeaPlaceholder, resetNudgePlaceholder, getElements } from '../js/ui.js';

function element() {
  return {
    children: [],
    classList: { add() {}, remove() {} },
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    addEventListener(event, handler) { this[`on${event}`] = handler; },
    textContent: '',
    value: '',
    placeholder: '',
    innerHTML: ''
  };
}

test('mode 2 idea chips change the placeholder without inserting prose', () => {
  const nodes = new Map();
  globalThis.document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    },
    querySelector() {
      return element();
    },
    createElement() {
      return element();
    }
  };

  initUI();
  const input = getElements().nudgeInput;
  input.value = 'My own sentence';
  setMode2Goal('discovery', ['odd clue'], setNudgeIdeaPlaceholder);
  getElements().storyIdeas.children[0].onclick();

  assert.equal(input.value, 'My own sentence');
  assert.equal(input.placeholder, 'Write a line involving odd clue...');

  resetNudgePlaceholder();
  assert.equal(input.placeholder, 'Add a clue, choice, or twist...');
});
