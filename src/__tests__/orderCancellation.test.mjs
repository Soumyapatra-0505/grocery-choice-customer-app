import test from 'node:test';
import assert from 'node:assert/strict';
import { isOrderCancellable } from '../utils/formatters.ts';

test('isOrderCancellable: PLACED -> Cancel button visible (true)', () => {
  assert.equal(isOrderCancellable('PLACED'), true);
});

test('isOrderCancellable: CONFIRMED -> Cancel button visible (true)', () => {
  assert.equal(isOrderCancellable('CONFIRMED'), true);
});

test('isOrderCancellable: PENDING -> Cancel button visible (true)', () => {
  assert.equal(isOrderCancellable('PENDING'), true);
});

test('isOrderCancellable: PROCESSING -> Cancel button hidden (false)', () => {
  assert.equal(isOrderCancellable('PROCESSING'), false);
});

test('isOrderCancellable: OUT_FOR_DELIVERY -> Cancel button hidden (false)', () => {
  assert.equal(isOrderCancellable('OUT_FOR_DELIVERY'), false);
});

test('isOrderCancellable: DELIVERED -> Cancel button hidden (false)', () => {
  assert.equal(isOrderCancellable('DELIVERED'), false);
});

test('isOrderCancellable: CANCELLED -> Cancel button hidden (false)', () => {
  assert.equal(isOrderCancellable('CANCELLED'), false);
});

test('isOrderCancellable: null, undefined, empty, or unknown status -> Cancel button hidden (false)', () => {
  assert.equal(isOrderCancellable(null), false);
  assert.equal(isOrderCancellable(undefined), false);
  assert.equal(isOrderCancellable(''), false);
  assert.equal(isOrderCancellable('UNKNOWN_STATUS'), false);
});
