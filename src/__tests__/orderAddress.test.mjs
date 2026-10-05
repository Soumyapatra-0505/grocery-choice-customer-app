import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOrderAddress, normalizeOrder } from '../utils/formatters.ts';

test('formatOrderAddress - null or undefined order returns graceful fallback', () => {
  const resultNull = formatOrderAddress(null);
  assert.equal(resultNull.formattedAddress, 'Standard Delivery Address');
  assert.equal(resultNull.recipientName, 'Valued Customer');
  assert.equal(resultNull.recipientPhone, '');
  assert.equal(resultNull.addressType, 'HOME');

  const resultUndefined = formatOrderAddress(undefined);
  assert.equal(resultUndefined.formattedAddress, 'Standard Delivery Address');
  assert.equal(resultUndefined.recipientName, 'Valued Customer');
  assert.equal(resultUndefined.recipientPhone, '');
  assert.equal(resultUndefined.addressType, 'HOME');
});

test('formatOrderAddress - COD order with undefined deliveryAddress and defined deliveryAddressText (Real Bug Scenario)', () => {
  // This simulates the exact data returned by backend for the Moto Edge 50 Fusion COD order
  const codOrder = {
    id: 101,
    orderNumber: 'GC-COD-101',
    deliveryAddress: undefined,
    deliveryAddressText: 'Flat 402, Green Valley Apartments, Bhubaneswar, Odisha - 751024',
    customerName: 'Soumya Patra',
    customerPhone: '9876543210'
  };

  // Must not throw "Cannot read property 'street' of undefined"
  assert.doesNotThrow(() => {
    const result = formatOrderAddress(codOrder);
    assert.equal(result.formattedAddress, 'Flat 402, Green Valley Apartments, Bhubaneswar, Odisha - 751024');
    assert.equal(result.recipientName, 'Soumya Patra');
    assert.equal(result.recipientPhone, '9876543210');
    assert.equal(result.addressType, 'HOME');
  });
});

test('formatOrderAddress - null deliveryAddress does not throw on contactName', () => {
  const orderWithNullAddress = {
    id: 102,
    orderNumber: 'GC-102',
    deliveryAddress: null,
    deliveryAddressText: null,
    customerName: 'Aditi Sharma',
    customerPhone: '9123456780'
  };

  assert.doesNotThrow(() => {
    const result = formatOrderAddress(orderWithNullAddress);
    assert.equal(result.formattedAddress, 'Standard Delivery Address');
    assert.equal(result.recipientName, 'Aditi Sharma');
    assert.equal(result.recipientPhone, '9123456780');
    assert.equal(result.addressType, 'HOME');
  });
});

test('formatOrderAddress - string deliveryAddress', () => {
  const orderWithStringAddress = {
    id: 103,
    deliveryAddress: 'Plot 45, Chandrasekharpur, Bhubaneswar - 751016'
  };

  const result = formatOrderAddress(orderWithStringAddress);
  assert.equal(result.formattedAddress, 'Plot 45, Chandrasekharpur, Bhubaneswar - 751016');
  assert.equal(result.recipientName, 'Valued Customer');
  assert.equal(result.addressType, 'HOME');
});

test('formatOrderAddress - structured Address object', () => {
  const orderWithAddressObject = {
    id: 104,
    deliveryAddress: {
      id: 5,
      street: '123 MG Road, Apt 2B',
      landmark: 'Near City Mall',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      contactName: 'Rahul Verma',
      contactPhone: '9988776655',
      type: 'WORK',
      isDefault: true
    }
  };

  const result = formatOrderAddress(orderWithAddressObject);
  assert.equal(result.formattedAddress, '123 MG Road, Apt 2B, Near City Mall, Bengaluru, Karnataka - 560001');
  assert.equal(result.recipientName, 'Rahul Verma');
  assert.equal(result.recipientPhone, '9988776655');
  assert.equal(result.addressType, 'WORK');
});

test('formatOrderAddress - partial Address object with missing fields', () => {
  const orderWithPartialAddress = {
    id: 105,
    deliveryAddress: {
      city: 'Mumbai',
      pincode: '400001'
    }
  };

  const result = formatOrderAddress(orderWithPartialAddress);
  assert.equal(result.formattedAddress, 'Mumbai, 400001');
  assert.equal(result.recipientName, 'Valued Customer');
  assert.equal(result.addressType, 'HOME');
});

test('normalizeOrder - maps deliveryAddressText into deliveryAddress', () => {
  const rawBackendResponse = {
    id: 201,
    orderNumber: 'GC-201',
    deliveryAddressText: 'Shop 12, Main Bazaar, Cuttack - 753001',
    deliveryAddressId: 3,
    totalAmount: 349
  };

  const normalized = normalizeOrder(rawBackendResponse);
  assert.equal(normalized.deliveryAddress, 'Shop 12, Main Bazaar, Cuttack - 753001');
  assert.equal(normalized.deliveryAddressText, 'Shop 12, Main Bazaar, Cuttack - 753001');
});

test('normalizeOrder - fallback when no address text exists', () => {
  const rawBackendResponse = {
    id: 202,
    orderNumber: 'GC-202',
    totalAmount: 199
  };

  const normalized = normalizeOrder(rawBackendResponse);
  assert.equal(normalized.deliveryAddress, 'Standard Delivery Address');
});
