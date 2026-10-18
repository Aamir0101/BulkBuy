import assert from 'assert';
import http from 'http';
import { app } from '../src/app.js';
import { db } from '../src/repositories/db.js';
import { generateToken } from '../src/utils/security.js';

console.log('--- Running BulkBuy User Profile & Address Management Test Suite ---');

async function runAuthProfileTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // Setup test users
    const userAToken = generateToken({
      userId: 'usr_customer_1',
      role: 'CUSTOMER',
      email: 'priya.sharma@example.com',
    });

    const userBToken = generateToken({
      userId: 'usr_supplier_1',
      role: 'SUPPLIER',
      email: 'supplier@amaraagro.in',
    });

    // -------------------------------------------------------------
    // Test 1: Profile Editing (PUT /api/v1/auth/profile)
    // -------------------------------------------------------------
    console.log('\n[Test 1] User Profile Update:');
    {
      // 1. Unauthorized request
      const unauthRes = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'New Name', phone: '+91 99999 11111' }),
      });
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated profile update must return 401');

      // 2. Invalid validation payload
      const invalidRes = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({ fullName: 'A', phone: '123' }),
      });
      assert.strictEqual(invalidRes.status, 400, 'Invalid name and phone length must return 400');

      // 3. Successful profile update
      const updatedName = `Priya Sharma Updated ${Date.now().toString().slice(-4)}`;
      const updatedPhone = '+91 98765 00000';
      const successRes = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({ fullName: updatedName, phone: updatedPhone }),
      });
      assert.strictEqual(successRes.status, 200, 'Valid profile update should succeed with 200');
      const successBody = await successRes.json();
      assert.strictEqual(successBody.user.fullName, updatedName);
      assert.strictEqual(successBody.user.phone, updatedPhone);

      // Verify DB persistence
      const freshUser = db.findUserById('usr_customer_1');
      assert.strictEqual(freshUser?.fullName, updatedName);
      assert.strictEqual(freshUser?.phone, updatedPhone);

      console.log('  ✓ Profile update validation, execution, and persistence verified');
    }

    // -------------------------------------------------------------
    // Test 2: Address Creation (POST /api/v1/auth/address)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Address Creation:');
    let createdAddressId = '';
    {
      const addressPayload = {
        recipientName: 'Priya Sharma (Office)',
        phone: '+91 98234 56789',
        streetAddress: 'Tower B, Tech Park, Bellandur',
        landmark: 'Opposite Lake Gate',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        isDefault: false,
      };

      const addRes = await fetch(`${baseUrl}/auth/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify(addressPayload),
      });

      assert.strictEqual(addRes.status, 201, 'Address creation should return 201');
      const addBody = await addRes.json();
      assert.ok(addBody.address.id, 'Created address must have an ID');
      createdAddressId = addBody.address.id;
      assert.strictEqual(addBody.address.recipientName, addressPayload.recipientName);
      assert.strictEqual(addBody.address.userId, 'usr_customer_1');

      console.log('  ✓ Address creation succeeded and bound to user');
    }

    // -------------------------------------------------------------
    // Test 3: Address Update & Ownership (PUT /api/v1/auth/addresses/:id)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Address Update & Cross-Tenant Protection:');
    {
      // 1. User B attempts to edit User A's address (BOLA attack)
      const bolaRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userBToken}`,
        },
        body: JSON.stringify({ streetAddress: 'Hacked Street By User B' }),
      });
      assert.strictEqual(
        bolaRes.status,
        403,
        "User B modifying User A's address must be rejected with 403 Forbidden"
      );

      // 2. User A successfully updates their own address
      const validUpdateRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({ streetAddress: 'Tower C, Level 4, Tech Park' }),
      });
      assert.strictEqual(validUpdateRes.status, 200, 'User A should update own address successfully');
      const updateBody = await validUpdateRes.json();
      assert.strictEqual(updateBody.address.streetAddress, 'Tower C, Level 4, Tech Park');

      console.log('  ✓ Cross-tenant address modification prevented; owner update verified');
    }

    // -------------------------------------------------------------
    // Test 4: Default Address Toggling (PUT /api/v1/auth/addresses/:id/default)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Default Address Switching:');
    {
      // 1. User B cannot set User A's address as default
      const bolaDefaultRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.strictEqual(bolaDefaultRes.status, 403, 'User B cannot set default on User A address');

      // 2. User A sets created address as default
      const defaultRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(defaultRes.status, 200, 'User A should successfully set default address');

      // Verify that other addresses for user A are no longer default
      const allAddressesRes = await fetch(`${baseUrl}/auth/addresses`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const allData = await allAddressesRes.json();
      const updatedItem = allData.addresses.find((a: any) => a.id === createdAddressId);
      assert.strictEqual(updatedItem.isDefault, true, 'Target address must be default');

      const others = allData.addresses.filter((a: any) => a.id !== createdAddressId);
      for (const other of others) {
        assert.strictEqual(other.isDefault, false, 'Other addresses must not be default');
      }

      console.log('  ✓ Default address toggling correctly enforces single default invariant');
    }

    // -------------------------------------------------------------
    // Test 5: Address Deletion & Ownership (DELETE /api/v1/auth/addresses/:id)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Address Deletion & Cross-Tenant Protection:');
    {
      // 1. User B attempts to delete User A's address
      const bolaDeleteRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.strictEqual(bolaDeleteRes.status, 403, "User B deleting User A's address must return 403");

      // 2. User A deletes their address
      const validDeleteRes = await fetch(`${baseUrl}/auth/addresses/${createdAddressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(validDeleteRes.status, 200, 'User A successfully deletes address');

      // Verify it no longer exists
      const verifyRes = await fetch(`${baseUrl}/auth/addresses`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const verifyData = await verifyRes.json();
      assert.ok(
        !verifyData.addresses.some((a: any) => a.id === createdAddressId),
        'Deleted address must not appear in user addresses'
      );

      console.log('  ✓ Cross-tenant deletion prevented; owner deletion verified');
    }

    console.log('\n======================================================');
    console.log(' ALL USER PROFILE & ADDRESS TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runAuthProfileTests().catch((err) => {
  console.error('\n❌ Auth Profile Test Suite Failed:', err);
  process.exit(1);
});
