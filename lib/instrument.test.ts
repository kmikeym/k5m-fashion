import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instrumentScore } from './instrument.ts';

test('no items → neutral 5.0', () => {
  assert.equal(instrumentScore([]), 5.0);
});

test('one strong item pulls above neutral but is shrunk toward 5', () => {
  // 8 hits / 10 votes → raw 0.8, shrunk = (8 + 2.5)/(10 + 5) = 0.7 → 7.0
  assert.equal(instrumentScore([{ hits: 8, total: 10 }]), 7.0);
});

test('thin data stays near neutral', () => {
  // 1 hit / 1 vote → (1 + 2.5)/(1 + 5) = 0.5833 → 5.8
  assert.equal(instrumentScore([{ hits: 1, total: 1 }]), 5.8);
});

test('a zero-vote item reads exactly neutral', () => {
  // 0/0 → (0 + 2.5)/(0 + 5) = 0.5 → 5.0
  assert.equal(instrumentScore([{ hits: 0, total: 0 }]), 5.0);
});

test('confidence-weights items by vote count', () => {
  // a heavily-voted strong item dominates a thin weak one
  const s = instrumentScore([{ hits: 90, total: 100 }, { hits: 0, total: 1 }]);
  assert.ok(s > 7.5 && s <= 9.0, `expected 7.5–9.0, got ${s}`);
});

test('all-miss strong item pulls below neutral', () => {
  // 0 hits / 20 votes → (0 + 2.5)/(20 + 5) = 0.1 → 1.0
  assert.equal(instrumentScore([{ hits: 0, total: 20 }]), 1.0);
});
