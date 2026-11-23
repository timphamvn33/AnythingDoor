const test = require('node:test');
const assert = require('node:assert/strict');
const { DiscoveryService } = require('../dist/discovery/discovery.service.js');

function database() {
  const rows = new Map();
  return {
    rows,
    discoveredRestaurant: {
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
    async $executeRaw(_query, payload) {
      for (const entry of JSON.parse(payload)) {
        rows.set(entry.id, entry);
      }
    },
  };
}

test('imports US listings by OSM identity, updates them, and keeps other regions', async t => {
  const previousFetch = global.fetch;
  const previousGeocoder = process.env.OSM_GEOCODER_URL;
  const previousOverpass = process.env.OSM_OVERPASS_URL;
  const previousGeoapifyKey = process.env.GEOAPIFY_API_KEY;
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  delete process.env.GEOAPIFY_API_KEY;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousGeocoder === undefined) delete process.env.OSM_GEOCODER_URL;
    else process.env.OSM_GEOCODER_URL = previousGeocoder;
    if (previousOverpass === undefined) delete process.env.OSM_OVERPASS_URL;
    else process.env.OSM_OVERPASS_URL = previousOverpass;
    if (previousGeoapifyKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousGeoapifyKey;
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
          address: {
            country_code: 'us',
            ...(geocoderUrl.searchParams.has('postalcode') ? { postcode: '02139' } : {}),
          },
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
  await new DiscoveryService(db).search({ location: 'New York', radiusMiles: 5 });
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

test('falls back to an exact US ZIP lookup when the configured geocoder has no matching ZIP', async t => {
  const previousFetch = global.fetch;
  const vars = ['GEOAPIFY_API_KEY', 'OSM_GEOCODER_URL', 'OSM_OVERPASS_URL'];
  const previous = Object.fromEntries(vars.map(key => [key, process.env[key]]));
  process.env.GEOAPIFY_API_KEY = 'test-key';
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  t.after(() => {
    global.fetch = previousFetch;
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  let mode = 'empty';
  let fallbackCalls = 0;
  let overpassCalls = 0;
  global.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname === 'geocoder.example') {
      assert.equal(url.searchParams.get('postalcode'), '31005-1234');
      if (mode === 'malformed-primary') return Response.json({ error: 'invalid' });
      if (mode === 'wrong-primary') {
        return Response.json([
          { lat: '48', lon: '-116', address: { country_code: 'us', postcode: '83860' } },
        ]);
      }
      return Response.json([]);
    }
    if (url.hostname === 'api.geoapify.com') {
      fallbackCalls++;
      assert.equal(url.pathname, '/v1/geocode/search');
      assert.equal(url.searchParams.get('postcode'), '31005');
      assert.equal(url.searchParams.get('country'), 'United States');
      assert.equal(url.searchParams.get('filter'), 'countrycode:us');
      if (mode === 'provider-error') return new Response('unavailable', { status: 503 });
      if (mode === 'malformed') return Response.json({ invalid: [] });
      if (mode === 'invalid-coordinates') {
        return Response.json({
          results: [{ country_code: 'us', postcode: '31005', lat: null, lon: -83 }],
        });
      }
      if (mode === 'no-match') {
        return Response.json({
          results: [
            { country_code: 'us', postcode: '31006', lat: 32, lon: -83 },
            { country_code: 'ca', postcode: '31005', lat: 44, lon: -79 },
          ],
        });
      }
      return Response.json({
        results: [{ country_code: 'us', postcode: '31005', lat: 32.53348, lon: -83.59558 }],
      });
    }
    assert.equal(url.hostname, 'overpass.example');
    overpassCalls++;
    assert.match(options.body.get('data'), /32\.53348,-83\.59558/);
    return Response.json({ elements: [] });
  };
  for (const scenario of ['empty', 'wrong-primary', 'zip4']) {
    mode = scenario;
    const result = await new DiscoveryService(database()).search({
      location: '31005-1234',
      radiusMiles: 5,
    });
    assert.deepEqual(result.center, { latitude: 32.53348, longitude: -83.59558, radiusMiles: 5 });
  }
  assert.equal(fallbackCalls, 3);
  assert.equal(overpassCalls, 3);
  for (const [scenario, message] of [
    ['no-match', /No US location found for this ZIP/],
    ['invalid-coordinates', /invalid coordinates/],
    ['malformed', /invalid response/],
    ['malformed-primary', /invalid response/],
    ['provider-error', /could not complete/],
  ]) {
    mode = scenario;
    await assert.rejects(
      new DiscoveryService(database()).search({ location: '31005-1234', radiusMiles: 5 }),
      message,
    );
  }
  delete process.env.GEOAPIFY_API_KEY;
  mode = 'empty';
  await assert.rejects(
    new DiscoveryService(database()).search({ location: '31005-1234', radiusMiles: 5 }),
    /Set GEOAPIFY_API_KEY/,
  );
  assert.equal(overpassCalls, 3);
});

test('uses Geoapify first for five-digit ZIPs and falls back safely to the configured geocoder', async t => {
  const previousFetch = global.fetch;
  const vars = ['GEOAPIFY_API_KEY', 'OSM_GEOCODER_URL', 'OSM_OVERPASS_URL'];
  const previous = Object.fromEntries(vars.map(key => [key, process.env[key]]));
  process.env.GEOAPIFY_API_KEY = 'test-key';
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  t.after(() => {
    global.fetch = previousFetch;
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  let mode = 'success';
  const calls = [];
  global.fetch = async (input, options) => {
    const url = new URL(String(input));
    calls.push(url.hostname);
    if (url.hostname === 'api.geoapify.com') {
      assert.equal(url.searchParams.get('postcode'), '31005');
      if (mode === 'error') return new Response('unavailable', { status: 503 });
      if (mode === 'invalid')
        return Response.json({
          results: [{ country_code: 'us', postcode: '31005', lat: null, lon: -83 }],
        });
      if (mode === 'not-found') return Response.json({ results: [] });
      return Response.json({
        results: [{ country_code: 'us', postcode: '31005', lat: 32.53, lon: -83.59 }],
      });
    }
    if (url.hostname === 'geocoder.example') {
      assert.equal(url.searchParams.get('postalcode'), '31005');
      if (mode === 'both-missing') return Response.json([]);
      return Response.json([
        { lat: '32.54', lon: '-83.60', address: { country_code: 'us', postcode: '31005' } },
      ]);
    }
    assert.equal(url.hostname, 'overpass.example');
    assert.ok(
      options.body.get('data').includes(mode === 'success' ? '32.53,-83.59' : '32.54,-83.6'),
    );
    return Response.json({ elements: [] });
  };
  const first = await new DiscoveryService(database()).search({
    location: '31005',
    radiusMiles: 5,
  });
  assert.equal(first.center.latitude, 32.53);
  assert.deepEqual(calls, ['api.geoapify.com', 'overpass.example']);
  for (const scenario of ['error', 'invalid', 'not-found']) {
    mode = scenario;
    calls.length = 0;
    const result = await new DiscoveryService(database()).search({
      location: '31005',
      radiusMiles: 5,
    });
    assert.equal(result.center.latitude, 32.54);
    assert.deepEqual(calls, ['api.geoapify.com', 'geocoder.example', 'overpass.example']);
  }
  mode = 'both-missing';
  calls.length = 0;
  global.fetch = async input => {
    const url = new URL(String(input));
    calls.push(url.hostname);
    return Response.json(url.hostname === 'api.geoapify.com' ? { results: [] } : []);
  };
  await assert.rejects(
    new DiscoveryService(database()).search({ location: '31005', radiusMiles: 5 }),
    /No US location found/,
  );
  assert.deepEqual(calls, ['api.geoapify.com', 'geocoder.example']);
  calls.length = 0;
  global.fetch = async input => {
    const url = new URL(String(input));
    calls.push(url.hostname);
    return url.hostname === 'api.geoapify.com'
      ? new Response('unavailable', { status: 503 })
      : Response.json([]);
  };
  await assert.rejects(
    new DiscoveryService(database()).search({ location: '31005', radiusMiles: 5 }),
    /could not complete/,
  );
  assert.deepEqual(calls, ['api.geoapify.com', 'geocoder.example']);
});

test('caches identical searches, coalesces concurrent requests, and refreshes after expiry', async t => {
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

  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  let geocoderCalls = 0;
  let overpassCalls = 0;
  let releaseGeocoder;
  const waitForGeocoder = new Promise(resolve => {
    releaseGeocoder = resolve;
  });
  global.fetch = async url => {
    if (String(url).startsWith('https://geocoder.example')) {
      geocoderCalls++;
      await waitForGeocoder;
      return Response.json([{ lat: '42.36', lon: '-71.06', address: { country_code: 'us' } }]);
    }
    overpassCalls++;
    return Response.json({
      elements: [{ type: 'node', id: 1, lat: 42.36, lon: -71.06, tags: { name: 'Cafe' } }],
    });
  };
  const service = new DiscoveryService(database());
  const first = service.search({ location: 'Boston', radiusMiles: 5 });
  const concurrent = service.search({ location: ' boston ', radiusMiles: 5 });
  releaseGeocoder();
  const [firstResult, concurrentResult] = await Promise.all([first, concurrent]);
  assert.equal(firstResult.cached, false);
  assert.deepEqual(concurrentResult, firstResult);
  assert.equal(geocoderCalls, 1);
  assert.equal(overpassCalls, 1);

  const cached = await service.search({ location: 'BOSTON', radiusMiles: 5 });
  assert.equal(cached.cached, true);
  assert.deepEqual(cached.restaurants, firstResult.restaurants);
  assert.equal(overpassCalls, 1);

  await service.search({ location: 'Boston', radiusMiles: 10 });
  assert.equal(overpassCalls, 2);
  now += 5 * 60 * 1000;
  assert.equal((await service.search({ location: 'Boston', radiusMiles: 5 })).cached, false);
  assert.equal(overpassCalls, 3);
  assert.equal(geocoderCalls, 3);
});

test('does not cache failed searches', async t => {
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
  let attempts = 0;
  global.fetch = async url => {
    if (String(url).startsWith('https://geocoder.example')) {
      return Response.json([{ lat: '42.36', lon: '-71.06', address: { country_code: 'us' } }]);
    }
    attempts++;
    return attempts === 1
      ? new Response('unavailable', { status: 503 })
      : Response.json({ elements: [] });
  };
  const service = new DiscoveryService(database());
  await assert.rejects(
    service.search({ location: 'Boston', radiusMiles: 5 }),
    /could not complete/,
  );
  assert.equal((await service.search({ location: 'Boston', radiusMiles: 5 })).cached, false);
  assert.equal(attempts, 2);
});

test('bounds the number of cached searches', async t => {
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
  let overpassCalls = 0;
  global.fetch = async url => {
    if (String(url).startsWith('https://geocoder.example')) {
      return Response.json([{ lat: '42.36', lon: '-71.06', address: { country_code: 'us' } }]);
    }
    overpassCalls++;
    return Response.json({ elements: [] });
  };
  const service = new DiscoveryService(database());
  for (let i = 0; i <= 100; i++) {
    await service.search({ location: `Location ${i}`, radiusMiles: 5 });
  }
  assert.equal((await service.search({ location: 'Location 100', radiusMiles: 5 })).cached, true);
  assert.equal((await service.search({ location: 'Location 0', radiusMiles: 5 })).cached, false);
  assert.equal(overpassCalls, 102);
});

test('surfaces database write failures and retries without caching them', async t => {
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
      : Response.json({
          elements: [{ type: 'node', id: 1, lat: 42.36, lon: -71.06, tags: { name: 'Cafe' } }],
        });
  const db = database();
  const write = db.$executeRaw;
  let attempts = 0;
  db.$executeRaw = async (...args) => {
    if (++attempts === 1) throw new Error('database unavailable');
    return write(...args);
  };
  const service = new DiscoveryService(db);
  await assert.rejects(
    service.search({ location: 'Boston', radiusMiles: 5 }),
    /database unavailable/,
  );
  const result = await service.search({ location: 'Boston', radiusMiles: 5 });
  assert.equal(result.cached, false);
  assert.equal(result.restaurants[0].name, 'Cafe');
  assert.equal(attempts, 2);
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
        {
          properties: {
            country_code: 'us',
            formatted: 'Cambridge, MA 02139, USA',
            lat: 42.37,
            lon: -71.11,
          },
        },
        { properties: { country_code: 'us', formatted: 'Boston, MA, USA' } },
        { properties: { country_code: 'ca', formatted: 'Toronto, Canada' } },
      ],
    });
  };

  const service = new DiscoveryService(database());
  const result = await service.suggestions('Cambridge');
  assert.deepEqual(result.suggestions, ['Cambridge, MA 02139, USA', 'Boston, MA, USA']);
  assert.equal(result.places[0].label, 'Cambridge, MA 02139, USA');
  assert.equal(typeof result.places[0].token, 'string');
  assert.deepEqual(result.places[1], { label: 'Boston, MA, USA' });
});

test('selected suggestions skip geocoding, with safe fallback for changed, expired or tampered tokens', async t => {
  const previousFetch = global.fetch;
  const vars = ['GEOAPIFY_API_KEY', 'OSM_GEOCODER_URL', 'OSM_OVERPASS_URL', 'JWT_ACCESS_SECRET'];
  const previous = Object.fromEntries(vars.map(key => [key, process.env[key]]));
  process.env.GEOAPIFY_API_KEY = 'test-key';
  process.env.OSM_GEOCODER_URL = 'https://geocoder.example/search';
  process.env.OSM_OVERPASS_URL = 'https://overpass.example/interpreter';
  process.env.JWT_ACCESS_SECRET = 'test-shared-key';
  t.after(() => {
    global.fetch = previousFetch;
    for (const key of vars) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  let geocoderCalls = 0;
  let overpassCalls = 0;
  const queries = [];
  global.fetch = async (input, options) => {
    if (String(input).startsWith('https://api.geoapify.com')) {
      return Response.json({
        features: [
          { properties: { country_code: 'us', formatted: 'Boston, MA', lat: 42.36, lon: -71.06 } },
          {
            properties: {
              country_code: 'ca',
              formatted: 'Toronto, Canada',
              lat: 43.65,
              lon: -79.38,
            },
          },
        ],
      });
    }
    if (String(input).startsWith('https://geocoder.example')) {
      geocoderCalls++;
      return Response.json([{ lat: '40.71', lon: '-74.00', address: { country_code: 'us' } }]);
    }
    overpassCalls++;
    queries.push(options.body.get('data'));
    return Response.json({ elements: [] });
  };
  const service = new DiscoveryService(database());
  const suggestion = (await service.suggestions('Boston')).places[0];
  const otherInstance = new DiscoveryService(database());
  const logs = [];
  t.mock.method(otherInstance.logger, 'log', message => logs.push(message));
  const selected = await otherInstance.search({
    location: suggestion.label,
    radiusMiles: 5,
    suggestionToken: suggestion.token,
  });
  assert.deepEqual(selected.center, { latitude: 42.36, longitude: -71.06, radiusMiles: 5 });
  assert.equal(geocoderCalls, 0);
  assert.match(queries[0], /42\.36,-71\.06/);
  assert.ok(logs.some(message => message.includes('geocoder skipped')));
  assert.ok(logs.some(message => /overpass ok \d+ms/.test(message)));
  assert.ok(logs.some(message => /database upsert ok \d+ms/.test(message)));
  assert.ok(logs.some(message => /database nearby ok \d+ms/.test(message)));
  assert.ok(logs.some(message => /live total ok \d+ms/.test(message)));
  assert.ok(logs.every(message => !message.includes('Boston') && !message.includes('42.36')));
  await otherInstance.search({
    location: suggestion.label,
    radiusMiles: 10,
    suggestionToken: suggestion.token,
  });
  assert.equal(geocoderCalls, 0);
  assert.equal(overpassCalls, 2);

  await otherInstance.search({
    location: 'New York',
    radiusMiles: 5,
    suggestionToken: suggestion.token,
  });
  assert.equal(geocoderCalls, 1);
  const changedSignature = suggestion.token.slice(0, -2) + 'XX';
  await otherInstance.search({
    location: suggestion.label,
    radiusMiles: 5,
    suggestionToken: changedSignature,
  });
  assert.equal(geocoderCalls, 2);
  now += 15 * 60 * 1000;
  await otherInstance.search({
    location: suggestion.label,
    radiusMiles: 5,
    suggestionToken: suggestion.token,
  });
  assert.equal(geocoderCalls, 3);
  await assert.rejects(
    otherInstance.search({ location: 'Boston, MA', radiusMiles: 5, suggestionToken: 1 }),
    /Invalid location suggestion/,
  );
});
