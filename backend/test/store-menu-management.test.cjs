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
