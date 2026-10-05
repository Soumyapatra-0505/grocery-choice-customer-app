import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAddress } from '../utils/formatters.ts';

test('normalizeAddress - null or undefined address returns robust default', () => {
  const resultNull = normalizeAddress(null);
  assert.equal(resultNull.street, 'Standard Delivery Address');
  assert.equal(resultNull.city, 'Bhubaneswar');
  assert.equal(resultNull.state, 'Odisha');
  assert.equal(resultNull.pincode, '751024');
  assert.equal(resultNull.type, 'HOME');
  assert.equal(resultNull.isDefault, false);

  const resultUndefined = normalizeAddress(undefined);
  assert.equal(resultUndefined.street, 'Standard Delivery Address');
  assert.equal(resultUndefined.city, 'Bhubaneswar');
  assert.equal(resultUndefined.pincode, '751024');
  assert.equal(resultUndefined.type, 'HOME');
});

test('normalizeAddress - backend AddressResponse with addressLine1, addressLine2, and postalCode (No street or pincode)', () => {
  const backendAddress = {
    id: 10,
    userId: 2,
    addressLine1: 'Flat 402, Green Valley Apartments',
    addressLine2: 'Chandrasekharpur',
    city: 'Bhubaneswar',
    state: 'Odisha',
    postalCode: '751024',
    landmark: 'Near Infocity Park',
    isDefault: true
  };

  const normalized = normalizeAddress(backendAddress);
  assert.equal(normalized.id, 10);
  assert.equal(normalized.street, 'Flat 402, Green Valley Apartments, Chandrasekharpur');
  assert.equal(normalized.city, 'Bhubaneswar');
  assert.equal(normalized.state, 'Odisha');
  assert.equal(normalized.pincode, '751024');
  assert.equal(normalized.type, 'HOME'); // Safe default
  assert.equal(normalized.isDefault, true);
  assert.equal(normalized.landmark, 'Near Infocity Park');
  assert.equal(normalized.postalCode, '751024');
});

test('normalizeAddress - missing optional fields (missing street, pincode, type) does not crash and provides fallbacks', () => {
  const partialAddress = {
    id: 11,
    city: 'Cuttack',
    state: 'Odisha'
  };

  const normalized = normalizeAddress(partialAddress);
  assert.equal(normalized.id, 11);
  assert.equal(normalized.street, 'Standard Delivery Address');
  assert.equal(normalized.pincode, '751024');
  assert.equal(normalized.type, 'HOME');
  assert.equal(normalized.city, 'Cuttack');
  assert.equal(normalized.state, 'Odisha');
  assert.equal(normalized.landmark, undefined);
});

test('handleEditAddress street-splitting logic - handles undefined, single string, and comma-separated string safely', () => {
  const splitStreet = (addr) => {
    const safeAddr = normalizeAddress(addr);
    const streetStr = (safeAddr.street || '').trim();
    if (streetStr.includes(',')) {
      const parts = streetStr.split(',');
      return {
        houseFlat: parts[0].trim(),
        streetArea: parts.slice(1).join(',').trim()
      };
    }
    return {
      houseFlat: streetStr,
      streetArea: ''
    };
  };

  // Case 1: Comma-separated street
  const res1 = splitStreet({ street: 'Flat 101, Block A, Niladri Vihar' });
  assert.equal(res1.houseFlat, 'Flat 101');
  assert.equal(res1.streetArea, 'Block A, Niladri Vihar');

  // Case 2: Single street string without comma
  const res2 = splitStreet({ street: 'Plot 45 Infocity Square' });
  assert.equal(res2.houseFlat, 'Plot 45 Infocity Square');
  assert.equal(res2.streetArea, '');

  // Case 3: Completely missing/undefined street (The Metro runtime error scenario)
  assert.doesNotThrow(() => {
    const res3 = splitStreet({ street: undefined, addressLine1: undefined });
    assert.equal(res3.houseFlat, 'Standard Delivery Address');
    assert.equal(res3.streetArea, '');
  });
});

test('handleDeleteAddress type label logic - handles undefined type safely without throwing toLowerCase()', () => {
  const getDeleteLabel = (addr) => {
    return (addr.type ? String(addr.type) : 'saved').toLowerCase();
  };

  assert.equal(getDeleteLabel({ type: 'HOME' }), 'home');
  assert.equal(getDeleteLabel({ type: 'WORK' }), 'work');
  assert.equal(getDeleteLabel({ type: 'OTHER' }), 'other');
  assert.equal(getDeleteLabel({ type: undefined }), 'saved');
  assert.equal(getDeleteLabel({ type: null }), 'saved');
});

test('duplicate address check - safely compares addresses even with undefined street/pincode/type', () => {
  const checkDuplicate = (addresses, newAddress, editingId = null) => {
    const targetStreet = `${newAddress.houseFlat.trim()}, ${newAddress.streetArea.trim()}`.toLowerCase();
    const targetPincode = newAddress.pincode.trim();
    const targetType = newAddress.type;

    return addresses.some((a) => {
      if (editingId && a.id === editingId) return false;
      const aStreet = (a.street || (a.addressLine1 ? [a.addressLine1, a.addressLine2].filter(Boolean).join(', ') : '') || '').trim().toLowerCase();
      const aPincode = (a.pincode || a.postalCode || '').trim();
      const aType = a.type || 'HOME';
      return (
        aPincode === targetPincode &&
        aStreet === targetStreet &&
        aType === targetType
      );
    });
  };

  const savedAddresses = [
    {
      id: 1,
      street: 'Flat 402, Green Valley Apartments',
      pincode: '751024',
      type: 'HOME'
    },
    // Corrupted or raw backend item with missing street and pincode fields
    {
      id: 2,
      street: undefined,
      pincode: undefined,
      type: undefined,
      addressLine1: 'TCS Tower',
      addressLine2: 'Patia',
      postalCode: '751024'
    }
  ];

  // Must not throw "Cannot read property 'trim' of undefined"
  assert.doesNotThrow(() => {
    // Exact duplicate of address 1
    const isDup1 = checkDuplicate(savedAddresses, {
      houseFlat: 'Flat 402',
      streetArea: 'Green Valley Apartments',
      pincode: '751024',
      type: 'HOME'
    });
    assert.equal(isDup1, true);

    // Editing address 1 with same values should not be flagged as duplicate of itself
    const isSelfDup = checkDuplicate(savedAddresses, {
      houseFlat: 'Flat 402',
      streetArea: 'Green Valley Apartments',
      pincode: '751024',
      type: 'HOME'
    }, 1);
    assert.equal(isSelfDup, false);

    // Matching backend address 2
    const isDup2 = checkDuplicate(savedAddresses, {
      houseFlat: 'TCS Tower',
      streetArea: 'Patia',
      pincode: '751024',
      type: 'HOME'
    });
    assert.equal(isDup2, true);

    // Completely new address
    const isDup3 = checkDuplicate(savedAddresses, {
      houseFlat: 'House 99',
      streetArea: 'Sailashree Vihar',
      pincode: '751021',
      type: 'WORK'
    });
    assert.equal(isDup3, false);
  });
});
