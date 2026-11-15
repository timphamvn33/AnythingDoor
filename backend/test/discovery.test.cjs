const test = require('node:test');
const assert = require('node:assert/strict');
const { DiscoveryService } = require('../dist/discovery/discovery.service.js');

function database() {
  const rows = new Map();
  return {
    rows,
    discoveredRestaurant: {
      upsert({ where, create, update }) {
        return () => rows.set(where.id, { ...(rows.get(where.id) || create), ...update });
      },
      async findMany({ where }) {
        return [...rows.values()].filter(
          row =>
            row.latitude >= where.latitude.gte &&
            row.latitude <= where.latitude.lte &&
            (!where.longitude ||
              (row.longitude >= where.longitude.gte && row.longitude <= where.longitude.lte)),
        );
      },
    },
    async $transaction(operations) {
      operations.forEach(operation => operation());
    },
  };
}

test('imports US listings by OSM identity, updates them, and keeps other regions', async t => {
  const previousFetch = global.fetch;
  const previousGeocoder = process.env.OSM_GEOCODER_URL;
  const previousOverpass = process.env.OSM_OVERPASS_URL;
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  t.after(() => {
    global.fetch = previousFetch;
    if (previousGeocoder === undefined) delete process.env.OSM_GEOCODER_URL;
    else process.env.OSM_GEOCODER_URL = previousGeocoder;
    if (previousOverpass === undefined) delete process.env.OSM_OVERPASS_URL;
    else process.env.OSM_OVERPASS_URL = previousOverpass;
  });
  let name = 'Pizza Place';
  let zipSearch;
  let radiusMeters;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('https://geocoder.example')) {
      const geocoderUrl = new URL(url);
      if (geocoderUrl.searchParams.has('postalcode')) zipSearch = geocoderUrl;
      const location = geocoderUrl.searchParams.get('q');
      return Response.json([
        {
          lat: location === 'Boston' ? '42.3601' : '40.7128',
          lon: location === 'Boston' ? '-71.0589' : '-74.0060',
          address: { country_code: 'us' },
        },
      ]);
    }
    const query = options.body.get('data');
    radiusMeters = Number(/around:(\d+)/.exec(query)?.[1]);
    const boston = query.includes('42.3601');
    return Response.json({
      elements: [
        {
          type: 'way',
          id: boston ? 2 : 1,
          center: { lat: boston ? 42.3601 : 40.7128, lon: boston ? -71.0589 : -74.006 },
          tags: {
            name: boston ? 'Boston Cafe' : name,
            cuisine: 'pizza;italian',
            website: 'javascript:alert(1)',
          },
        },
        { type: 'node', id: 3, lat: 40.7128, lon: -74.006, tags: {} },
      ],
    });
  };
  const db = database();
  const service = new DiscoveryService(db);
  const first = await service.search({ location: 'New York', radiusMiles: 5 });
  assert.equal(first.restaurants.length, 1);
  assert.equal(first.restaurants[0].website, null);
  assert.deepEqual(first.restaurants[0].category, ['pizza', 'italian']);
  await service.search({ location: 'Boston', radiusMiles: 5 });
  name = 'Updated Pizza Place';
  await service.search({ location: 'New York', radiusMiles: 5 });
  assert.equal(db.rows.size, 2);
  assert.equal(db.rows.get('way/1').name, name);
  await service.search({ location: '02139', radiusMiles: 10 });
  assert.equal(zipSearch.searchParams.get('postalcode'), '02139');
  assert.equal(zipSearch.searchParams.has('q'), false);
  assert.equal(radiusMeters, Math.round(10 * 1609.344));
  const saved = await service.saved({ latitude: 42.3601, longitude: -71.0589, radiusMiles: 5 });
  assert.deepEqual(
    saved.restaurants.map(row => row.name),
    ['Boston Cafe'],
  );
});

test('requires configuration and rejects invalid radius and non-US geocoding', async t => {
  const previousFetch = global.fetch;
  const previousGeocoder = process.env.OSM_GEOCODER_URL;
  const previousOverpass = process.env.OSM_OVERPASS_URL;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousGeocoder === undefined) delete process.env.OSM_GEOCODER_URL;
    else process.env.OSM_GEOCODER_URL = previousGeocoder;
    if (previousOverpass === undefined) delete process.env.OSM_OVERPASS_URL;
    else process.env.OSM_OVERPASS_URL = previousOverpass;
  });
  delete process.env.OSM_GEOCODER_URL;
  delete process.env.OSM_OVERPASS_URL;
  const service = new DiscoveryService(database());
  await assert.rejects(service.search({ location: 'Boston', radiusMiles: 5 }), /not configured/);
  await assert.rejects(service.saved({ latitude: 42, longitude: -71, radiusMiles: 26 }), /radius/);
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  global.fetch = async () =>
    Response.json([{ lat: '43', lon: '-79', address: { country_code: 'ca' } }]);
  await assert.rejects(service.search({ location: 'Toronto', radiusMiles: 5 }), /United States/);
});

test('does not save partial results when Overpass reports an error', async t => {
  const previousFetch = global.fetch;
  const previousGeocoder = process.env.OSM_GEOCODER_URL;
  const previousOverpass = process.env.OSM_OVERPASS_URL;
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  t.after(() => {
    global.fetch = previousFetch;
    if (previousGeocoder === undefined) delete process.env.OSM_GEOCODER_URL;
    else process.env.OSM_GEOCODER_URL = previousGeocoder;
    if (previousOverpass === undefined) delete process.env.OSM_OVERPASS_URL;
    else process.env.OSM_OVERPASS_URL = previousOverpass;
  });
  global.fetch = async url =>
    String(url).startsWith('https://geocoder.example')
      ? Response.json([{ lat: '42.36', lon: '-71.06', address: { country_code: 'us' } }])
      : Response.json({ elements: [], remark: 'runtime error: timeout' });
  const db = database();
  await assert.rejects(
    new DiscoveryService(db).search({ location: 'Boston', radiusMiles: 5 }),
    /could not complete/,
  );
  assert.equal(db.rows.size, 0);
});

test('returns filtered US address suggestions', async t => {
  const previousFetch = global.fetch;
  const previousGeoapifyKey = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'geoapify-test-key';
  t.after(() => {
    global.fetch = previousFetch;
    if (previousGeoapifyKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousGeoapifyKey;
  });

  global.fetch = async input => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api.geoapify.com');
    assert.equal(url.pathname, '/v1/geocode/autocomplete');
    assert.equal(url.searchParams.get('filter'), 'countrycode:us');
    assert.equal(url.searchParams.get('apiKey'), 'geoapify-test-key');
    return Response.json({
      features: [
        { properties: { country_code: 'us', formatted: 'Cambridge, MA 02139, USA' } },
        { properties: { country_code: 'ca', formatted: 'Toronto, Canada' } },
      ],
    });
  };

  const service = new DiscoveryService(database());
  assert.deepEqual(await service.suggestions('Cambridge'), {
    suggestions: ['Cambridge, MA 02139, USA'],
  });
});
