const test = require('node:test');
const assert = require('node:assert/strict');
const { SousLabService } = require('../dist/souslab/souslab.service.js');

function setup(t, handler) {
  const previousFetch = global.fetch;
  const previousKey = process.env.SOUSLAB_API_KEY;
  process.env.SOUSLAB_API_KEY = 'test-secret';
  global.fetch = handler;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.SOUSLAB_API_KEY;
    else process.env.SOUSLAB_API_KEY = previousKey;
  });
  return new SousLabService();
}

test('searches by ZIP and restaurant, retains location and pagination, and reuses identical requests', async t => {
  let calls = 0;
  const service = setup(t, async (url, options) => {
    calls++;
    assert.equal(url.origin, 'https://api.souslab.site');
    assert.equal(url.pathname, '/v1/restaurants');
    assert.equal(url.searchParams.get('zip'), '29204');
    assert.equal(url.searchParams.get('q'), 'Chicken');
    assert.equal(options.headers['X-API-Key'], 'test-secret');
    assert.equal(url.searchParams.has('key'), false);
    return Response.json({
      data: [
        {
          restaurant_id: 'store-1',
          name: 'Chicken',
          street: '10 Main St',
          city: 'Columbia',
          state_code: 'SC',
          zip: '29204',
          cuisine_primary: 'Chicken',
          cuisines: ['American', 'Chicken'],
          item_count: 40,
          status: 'listed',
        },
        { restaurant_id: 'store-2', name: 'Thai Place', cuisine_primary: 'Thai', cuisines: null },
        { restaurant_id: 'store-3', name: 'Unknown', cuisines: null },
      ],
      next_cursor: 'next-page',
      total: 25,
      total_is_lower_bound: false,
    });
  });
  const [first, second] = await Promise.all([
    service.search('29204', 'Chicken'),
    service.search('29204', 'Chicken'),
  ]);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  assert.deepEqual(first, {
    restaurants: [
      {
        id: 'store-1',
        name: 'Chicken',
        address: '10 Main St, Columbia, SC, 29204',
        cuisines: ['American', 'Chicken'],
        itemCount: 40,
        status: 'listed',
      },
      {
        id: 'store-2',
        name: 'Thai Place',
        address: '',
        cuisines: ['Thai'],
        itemCount: null,
        status: null,
      },
      {
        id: 'store-3',
        name: 'Unknown',
        address: '',
        cuisines: [],
        itemCount: null,
        status: null,
      },
    ],
    nextCursor: 'next-page',
  });
  await service.search('29204', 'Chicken');
  assert.equal(calls, 1);
  await assert.rejects(() => service.search('12', '', undefined), { status: 400 });
  await assert.rejects(() => service.menu('../unsafe'), { status: 400 });
});

test('maps nested menus, USD prices, unavailable prices and out-of-stock items', async t => {
  const service = setup(t, async url => {
    assert.equal(url.pathname, '/v1/restaurants/store-1/menu');
    return Response.json({
      restaurant_id: 'store-1',
      menus: [
        {
          name: 'Lunch',
          sections: [
            {
              name: 'Meals',
              items: [
                {
                  item_uid: 'a',
                  name: 'Chicken Pho',
                  description: 'Soup',
                  price: 14.99,
                  currency: null,
                  out_of_stock: false,
                },
                { item_uid: 'b', name: 'No price', price: 0, currency: 'USD', out_of_stock: null },
                {
                  item_uid: 'c',
                  name: 'Sold out',
                  price: 4.5,
                  currency: 'USD',
                  out_of_stock: true,
                },
                {
                  item_uid: 'd',
                  name: 'Other currency',
                  price: 2,
                  currency: 'EUR',
                  out_of_stock: false,
                },
                {
                  item_uid: 'a',
                  name: 'Chicken Pho',
                  price: 15.99,
                  currency: 'USD',
                  out_of_stock: false,
                },
              ],
            },
          ],
        },
      ],
    });
  });
  const menu = await service.menu('store-1');
  assert.equal(menu.groups[0].name, 'Lunch — Meals');
  const items = menu.groups[0].items;
  assert.deepEqual(
    items.map(item => item.price),
    [14.99, null, 4.5, 2, 15.99],
  );
  assert.equal(items[0].currency, 'USD');
  assert.equal(items[2].outOfStock, true);
  assert.equal(items[3].currency, 'EUR');
  assert.notEqual(items[0].id, items[4].id);
});

test('passes ZIP+4 and pagination cursor without changing the search filters', async t => {
  const service = setup(t, async url => {
    assert.equal(url.searchParams.get('zip'), '02114-3122');
    assert.equal(url.searchParams.get('q'), 'Pho');
    assert.equal(url.searchParams.get('cursor'), 'page/2+=');
    return Response.json({ data: [], next_cursor: null });
  });
  assert.deepEqual(await service.search('02114-3122', 'Pho', 'page/2+='), {
    restaurants: [],
    nextCursor: null,
  });
});

test('retrieves restaurant details independently for direct links', async t => {
  const service = setup(t, async url => {
    assert.equal(url.pathname, '/v1/restaurants/store-1');
    return Response.json({
      restaurant_id: 'store-1',
      name: 'Pho Place',
      street: '1 Main St',
      city: 'Boston',
      state_code: 'MA',
      zip: '02114',
      description: 'Noodle soup',
      phone: '5551234567',
      cuisine_primary: 'Vietnamese',
      cuisines: ['Vietnamese', 'Asian'],
      status: 'listed',
      last_seen: '2026-11-01T08:10:11+00:00',
    });
  });
  assert.deepEqual(await service.restaurant('store-1'), {
    id: 'store-1',
    name: 'Pho Place',
    address: '1 Main St, Boston, MA, 02114',
    description: 'Noodle soup',
    phone: '5551234567',
    cuisines: ['Vietnamese', 'Asian'],
    status: 'listed',
    lastSeen: '2026-11-01T08:10:11+00:00',
  });
  await assert.rejects(() => service.restaurant('../unsafe'), { status: 400 });
});

test('surfaces provider and configuration errors and does not cache malformed responses', async t => {
  let calls = 0;
  const service = setup(t, async () => {
    calls++;
    return calls === 1
      ? Response.json({ data: [] })
      : Response.json({ data: [], next_cursor: null });
  });
  await assert.rejects(() => service.search('29204', '', undefined), { status: 502 });
  assert.deepEqual(await service.search('29204', '', undefined), {
    restaurants: [],
    nextCursor: null,
  });
  assert.equal(calls, 2);
  global.fetch = async () => Response.json({ error: { code: 'quota_exceeded' } }, { status: 429 });
  await assert.rejects(() => service.menu('store-1'), { status: 429 });
  delete process.env.SOUSLAB_API_KEY;
  await assert.rejects(() => service.search('29204', '', undefined), { status: 503 });
});

test('reports only observed quota headers to explicitly authorized accounts', async t => {
  const previousIds = process.env.SOUSLAB_USAGE_USER_IDS;
  process.env.SOUSLAB_USAGE_USER_IDS = 'owner-id, other-owner';
  t.after(() => {
    if (previousIds === undefined) delete process.env.SOUSLAB_USAGE_USER_IDS;
    else process.env.SOUSLAB_USAGE_USER_IDS = previousIds;
  });
  let calls = 0;
  const service = setup(t, async () => {
    calls++;
    if (calls === 1) {
      return Response.json(
        { data: [], next_cursor: null },
        { headers: { 'X-RateLimit-Limit': '10000', 'X-RateLimit-Remaining': '9995', 'X-RateLimit-Reset': '1800000000' } },
      );
    }
    return Response.json(
      { error: { code: 'quota_exceeded' } },
      { status: 429, headers: { 'X-RateLimit-Limit': '10000', 'X-RateLimit-Remaining': '0' } },
    );
  });
  assert.deepEqual(service.getUsage('owner-id'), { usage: null });
  assert.throws(() => service.getUsage('stranger'), { status: 403 });
  await service.search('29204', '', undefined);
  const initial = service.getUsage('owner-id').usage;
  assert.equal(initial.limit, 10000);
  assert.equal(initial.remaining, 9995);
  assert.equal(initial.resetAt, 1800000000);
  assert.ok(Number.isFinite(Date.parse(initial.observedAt)));
  await service.search('29204', '', undefined);
  assert.equal(calls, 1);
  assert.deepEqual(service.getUsage('owner-id').usage, initial);
  await assert.rejects(() => service.menu('store-1'), { status: 429 });
  assert.equal(service.getUsage('other-owner').usage.remaining, 0);
  assert.equal(service.getUsage('owner-id').usage.resetAt, null);
  process.env.SOUSLAB_API_KEY = 'another-key';
  assert.deepEqual(service.getUsage('owner-id'), { usage: null });
  delete process.env.SOUSLAB_USAGE_USER_IDS;
  assert.throws(() => service.getUsage('owner-id'), { status: 403 });
});

test('ignores malformed quota headers without reporting a false balance', async t => {
  const previousIds = process.env.SOUSLAB_USAGE_USER_IDS;
  process.env.SOUSLAB_USAGE_USER_IDS = 'owner-id';
  t.after(() => {
    if (previousIds === undefined) delete process.env.SOUSLAB_USAGE_USER_IDS;
    else process.env.SOUSLAB_USAGE_USER_IDS = previousIds;
  });
  const service = setup(t, async () =>
    Response.json(
      { data: [], next_cursor: null },
      { headers: { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': 'invalid' } },
    ),
  );
  await service.search('29204', '', undefined);
  assert.deepEqual(service.getUsage('owner-id'), { usage: null });
});

test('distinguishes rejected credentials from denied plan access', async t => {
  const service = setup(t, async url =>
    Response.json(
      { error: { code: 'not_shown' } },
      { status: url.pathname.endsWith('/menu') ? 403 : 401 },
    ),
  );
  await assert.rejects(() => service.search('29204', '', undefined), {
    status: 503,
    message: 'SousLab rejected the API key. Check that the backend uses an active SousLab API key.',
  });
  await assert.rejects(() => service.menu('store-1'), {
    status: 503,
    message: 'SousLab denied access to this request. Check the account and plan permissions.',
  });
});

test('usage endpoint requires a valid token and an allowed user ID', async t => {
  const { Test } = require('@nestjs/testing');
  const { PassportModule } = require('@nestjs/passport');
  const { ConfigService } = require('@nestjs/config');
  const { JwtService } = require('@nestjs/jwt');
  const { SousLabController } = require('../dist/souslab/souslab.controller.js');
  const { JwtStrategy } = require('../dist/auth/use-cases/strategies/jwt.strategy.js');
  const { UserService } = require('../dist/user/user.service.js');
  const previousIds = process.env.SOUSLAB_USAGE_USER_IDS;
  process.env.SOUSLAB_USAGE_USER_IDS = 'owner-id';
  t.after(() => {
    if (previousIds === undefined) delete process.env.SOUSLAB_USAGE_USER_IDS;
    else process.env.SOUSLAB_USAGE_USER_IDS = previousIds;
  });
  const secret = 'a-test-secret-long-enough-for-jwt-signing';
  const module = await Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
    controllers: [SousLabController],
    providers: [
      SousLabService,
      JwtStrategy,
      { provide: ConfigService, useValue: { get: () => secret } },
      {
        provide: UserService,
        useValue: { findById: async id => ({ id, role: ['admin'] }) },
      },
    ],
  }).compile();
  const app = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const port = app.getHttpServer().address().port;
  const url = `http://127.0.0.1:${port}/souslab/usage`;
  const jwt = new JwtService({ secret });
  const request = id =>
    fetch(url, { headers: { Authorization: `Bearer ${jwt.sign({ sub: id })}` } });
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await request('stranger')).status, 403);
  const owner = await request('owner-id');
  assert.equal(owner.status, 200);
  assert.equal(owner.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await owner.json(), { usage: null });
});
