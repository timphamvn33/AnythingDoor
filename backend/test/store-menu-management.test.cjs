const test = require('node:test');
const assert = require('node:assert/strict');
const { RestaurantService } = require('../dist/restaurant/restaurant.service.js');
const { MenuItemService } = require('../dist/menu-items/menu-item.service.js');

test('store creation persists address and daily hours', async () => {
  let request;
  const service = new RestaurantService({
    restaurant: { create: async input => { request = input; return input; } },
  });
  const address = { street: '1 Main', city: 'Town', state: 'CA', zip: '12345', country: 'US' };
  await service.createRestaurant({
    name: 'Cafe', category: ['Cafe'], openHrs: '09:00', closeHrs: '17:00',
    phoneNumber: '123', address,
    hours: [
      { day: 'monday', opensAt: '09:00', closesAt: '17:00' },
      { day: 'tuesday', opensAt: '10:00', closesAt: '18:00' },
    ],
  }, 'owner');
  assert.deepEqual(request.data.address.create, address);
  assert.equal(request.data.owner.connect.id, 'owner');
  assert.equal(request.data.logoUrl, '');
  assert.equal(request.data.hours.create[1].opensAt.toISOString(), '1970-01-01T10:00:00.000Z');
});

test('store updates replace hours and reject invalid schedules', async () => {
  let request;
  const service = new RestaurantService({
    restaurant: {
      findFirst: async () => ({ addressId: 'address' }),
      update: async input => { request = input; return input; },
    },
  });
  await service.updateRestaurant('store', 'owner', {
    hours: [{ day: 'friday', opensAt: '08:30', closesAt: '16:00' }],
  });
  assert.deepEqual(request.data.hours.deleteMany, {});
  assert.equal(request.data.hours.create[0].day, 'friday');
  await assert.rejects(service.updateRestaurant('store', 'owner', {
    hours: [{ day: 'friday', opensAt: '25:00', closesAt: '16:00' }],
  }), /Invalid opening hours/);
  await assert.rejects(service.updateRestaurant('store', 'owner', { hours: [] }), /opening day/);
});

test('menu creation allows no image and persists ingredients', async () => {
  let request;
  const service = new MenuItemService({
    restaurant: { findUnique: async () => ({ id: 'store' }) },
    menuItem: { create: async input => { request = input; return input; } },
  });
  await service.createMenuItem({
    name: 'Soup', price: 5, restaurantId: 'store', category: ['Lunch'], ingredients: 'Carrot',
  });
  assert.equal(request.data.imgUrl, '');
  assert.equal(request.data.ingredients, 'Carrot');
  await assert.rejects(service.createMenuItem({ name: 'Soup' }), /restaurant ID/);
});

test('menu sections are stored on create and update', async () => {
  let created;
  let updated;
  const service = new MenuItemService({
    restaurant: { findUnique: async () => ({ id: 'store' }) },
    menuItem: {
      create: async input => { created = input; return input; },
      update: async input => { updated = input; return input; },
    },
  });
  await service.createMenuItem({
    name: 'Cake', price: 5, restaurantId: 'store', category: ['Food'], menuSection: 'Desserts',
  });
  assert.equal(created.data.menuSection, 'Desserts');
  await service.updateMenuItem({ menuSection: 'Specials' }, 'item');
  assert.equal(updated.data.menuSection, 'Specials');
});

test('renaming a menu table updates all items in the selected store and section', async () => {
  let update;
  const service = new MenuItemService({
    restaurant: { findFirst: async ({ where }) => where.ownerId === 'owner' ? {} : null },
    menuItem: {
      findFirst: async () => null,
      updateMany: async input => { update = input; return { count: 2 }; },
    },
  });
  await service.renameSection('store', 'owner', { section: null, title: ' Specials ' });
  assert.deepEqual(update.where, {
    restaurantId: 'store', OR: [{ menuSection: null }, { menuSection: '' }],
  });
  assert.deepEqual(update.data, { menuSection: 'Specials' });
  await service.renameSection('store', 'owner', { section: 'Specials', title: 'SPECIALS' });
  assert.deepEqual(update.where, { restaurantId: 'store', menuSection: 'Specials' });
  assert.deepEqual(update.data, { menuSection: 'SPECIALS' });
  await assert.rejects(
    service.renameSection('store', 'other', { section: 'Specials', title: 'Lunch' }),
    /Store not found/,
  );
  await assert.rejects(
    service.renameSection('store', 'owner', { section: 'Specials', title: '  ' }),
    /valid section and title/,
  );
  await assert.rejects(
    service.renameSection('store', 'owner', { section: 'Specials', title: 'Menu items' }),
    /reserved/,
  );
});

test('renaming rejects an existing title and a missing source table', async () => {
  let duplicate = true;
  const service = new MenuItemService({
    restaurant: { findFirst: async () => ({}) },
    menuItem: {
      findFirst: async () => duplicate ? {} : null,
      updateMany: async () => ({ count: 0 }),
    },
  });
  await assert.rejects(
    service.renameSection('store', 'owner', { section: 'Lunch', title: 'DINNER' }),
    /already exists/,
  );
  duplicate = false;
  await assert.rejects(
    service.renameSection('store', 'owner', { section: 'Lunch', title: 'Dinner' }),
    /table not found/,
  );
});

test('deleting a table snapshots order item names and removes only its store section', async () => {
  const calls = [];
  const tx = {
    restaurant: { findFirst: async ({ where }) => where.ownerId === 'owner' ? {} : null },
    menuItem: {
      findMany: async input => {
        calls.push(['find', input]);
        return [{ id: 'item-1', name: 'Soup' }, { id: 'item-2', name: 'Cake' }];
      },
      deleteMany: async input => { calls.push(['delete', input]); return { count: 2 }; },
    },
    orderItem: { updateMany: async input => { calls.push(['snapshot', input]); } },
  };
  const service = new MenuItemService({
    $transaction: async (run, options) => {
      assert.equal(options.isolationLevel, 'Serializable');
      return run(tx);
    },
  });
  const result = await service.deleteSection('store', 'owner', { section: null });
  assert.equal(result.count, 2);
  const where = { restaurantId: 'store', OR: [{ menuSection: null }, { menuSection: '' }] };
  assert.deepEqual(calls[0][1].where, where);
  assert.deepEqual(calls[1][1], {
    where: { menuItemId: 'item-1', itemName: null }, data: { itemName: 'Soup' },
  });
  assert.deepEqual(calls[2][1], {
    where: { menuItemId: 'item-2', itemName: null }, data: { itemName: 'Cake' },
  });
  assert.deepEqual(calls[3], ['delete', { where }]);
  calls.length = 0;
  await service.deleteSection('store', 'owner', { section: 'Lunch' });
  assert.deepEqual(calls[3], ['delete', { where: { restaurantId: 'store', menuSection: 'Lunch' } }]);
  calls.length = 0;
  await assert.rejects(service.deleteSection('store', 'other', { section: 'Lunch' }), /Store not found/);
  assert.equal(calls.length, 0);
  await assert.rejects(service.deleteSection('store', 'owner', {}), /valid section/);
});

test('deleting a table does not delete menu items if saving order names fails', async () => {
  let deleted = false;
  const tx = {
    restaurant: { findFirst: async () => ({}) },
    menuItem: {
      findMany: async () => [{ id: 'item', name: 'Soup' }],
      deleteMany: async () => { deleted = true; },
    },
    orderItem: { updateMany: async () => { throw new Error('Database error'); } },
  };
  const service = new MenuItemService({ $transaction: async run => run(tx) });
  await assert.rejects(service.deleteSection('store', 'owner', { section: 'Lunch' }), /Database error/);
  assert.equal(deleted, false);
});
