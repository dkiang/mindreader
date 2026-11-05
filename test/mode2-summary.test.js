import test from 'node:test';
import assert from 'node:assert/strict';
import { createMode2EndScreen } from '../js/ui.js';

test('flat ratings still produce a specific story payoff', () => {
  const result = createMode2EndScreen(
    'crime', false, 2, 30, [30, 30, 30],
    ['A witness hesitated.', 'Someone hid the key.'],
    ['She looked away from the door.', 'The lock clicked shut.']
  );
  assert.equal(result.title, 'Story Complete');
  assert.match(result.content, /The fit rating did not rise, but your moves still changed the story/);
  assert.match(result.content, /A witness hesitated/);
  assert.match(result.content, /She looked away from the door/);
  assert.doesNotMatch(result.content, /Hidden Target/);
});
