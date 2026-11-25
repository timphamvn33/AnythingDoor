const test = require('node:test');
const assert = require('node:assert/strict');
const { OpenMenuService } = require('../dist/openmenu/openmenu.service.js');

function setup(t, handler) {
  const previousFetch = global.fetch;
  const previousKey = process.env.OPENMENU_API_KEY;
  process.env.OPENMENU_API_KEY = 'test-secret';
  global.fetch = handler;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENMENU_API_KEY;
    else process.env.OPENMENU_API_KEY = previousKey;
  });
  return new OpenMenuService();
}

function result(data) {
  return Response.json({ response: { api: { status: 200 }, result: data } });
}

test('search sends the ZIP and name to OpenMenu and returns location identities', async t => {
  const service = setup(t, async url => {
    assert.equal(url.origin, 'https://www.openmenu.com');
    assert.equal(url.pathname, '/api/v2/location.php');
    assert.equal(url.searchParams.get('key'), 'test-secret');
    assert.equal(url.searchParams.get('postal_code'), '29204');
    assert.equal(url.searchParams.get('s'), 'Chicken');
    return result({
      restaurants: [
        {
          id: 'location-1',
          restaurant_name: 'Chicken',
          address_1: '10 Main St',
          city_town: 'Columbia',
          state_province: 'SC',
          postal_code: '29204',
        },
        { restaurant_name: 'Missing ID' },
      ],
    });
  });
  const search = await service.search('29204', 'Chicken');
  assert.deepEqual(search.restaurants, [
    {
      id: 'location-1',
      name: 'Chicken',
      address: '10 Main St, Columbia, SC, 29204',
      updatedAt: null,
    },
  ]);
  await assert.rejects(() => service.search('12', ''), { status: 400 });
});

test('preserves valid menu prices and currencies without inventing missing amounts', async t => {
  const service = setup(t, async url => {
    assert.equal(url.searchParams.get('id'), 'location-1');
    return result({
      restaurant_info: { restaurant_name: 'Chicken' },
      menus: [
        {
          menu_name: 'Lunch',
          currency_symbol: 'USD',
          menu_groups: [
            {
              group_name: 'Meals',
              menu_items: [
                {
                  menu_item_name: 'Sandwich',
                  menu_item_description: 'Chicken',
                  menu_item_price: '5.99',
                },
                { menu_item_name: 'Meal', menu_item_price: '' },
                { menu_item_name: 'Variable', menu_item_price: 'from 5.99' },
              ],
            },
          ],
        },
        {
          menu_name: 'Other',
          currency_symbol: 'EUR',
          menu_groups: [
            {
              group_name: 'Items',
              menu_items: [{ menu_item_name: 'Other dish', menu_item_price: '2.00' }],
            },
          ],
        },
        {
          menu_name: 'Unspecified',
          menu_groups: [
            {
              group_name: 'Soup',
              menu_items: [
                {
                  menu_item_name: 'Chicken Pho',
                  menu_item_description: 'Vietnamese chicken noodle soup',
                  menu_item_price: '14.99',
                },
              ],
            },
          ],
        },
      ],
    });
  });
  const menu = await service.menu('location-1');
  assert.equal(menu.name, 'Chicken');
  assert.equal(menu.groups[0].name, 'Lunch — Meals');
  assert.deepEqual(
    menu.groups.flatMap(group => group.items.map(item => item.price)),
    [5.99, null, null, 2, 14.99],
  );
  assert.equal(menu.groups[0].items[0].currency, 'USD');
  assert.equal(menu.groups[1].items[0].currency, 'EUR');
  assert.equal(menu.groups[2].items[0].currency, null);
  assert.match(menu.groups[0].items[0].id, /^openmenu-[a-f0-9]{64}$/);
  assert.deepEqual(await service.menu('location-1'), menu);
});

test('reports configuration, provider errors, and malformed payloads instead of fake menus', async t => {
  const service = setup(t, async () => Response.json({ response: { api: { status: 402 } } }));
  await assert.rejects(() => service.menu('x'), { status: 502 });
  global.fetch = async () => result({ menus: [] });
  await assert.rejects(() => service.menu('x'), { status: 502 });
  delete process.env.OPENMENU_API_KEY;
  await assert.rejects(() => service.search('29204', ''), { status: 503 });
});

test('handles empty results and bounds provider requests per process', async t => {
  const service = setup(t, async () => new Response(null, { status: 204 }));
  assert.deepEqual(await service.search('29204', ''), { restaurants: [] });
  for (let i = 1; i < 60; i++) await service.search('29204', '');
  await assert.rejects(() => service.search('29204', ''), { status: 429 });
});
