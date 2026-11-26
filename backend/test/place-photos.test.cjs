const test = require('node:test');
const assert = require('node:assert/strict');
const { PlacePhotosService } = require('../dist/place-photos/place-photos.service.js');

function setup(t, count = 0) {
  const previousKey = process.env.GOOGLE_PLACES_API_KEY;
  const previousFetch = global.fetch;
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  t.after(() => {
    if (previousKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = previousKey;
    global.fetch = previousFetch;
  });
  const prisma = {
    discoveredRestaurant: {
      findUnique: async () => ({
        name: 'Pizza Place',
        address: '1 Main St, Boston, MA, 02114',
        latitude: 42.36,
        longitude: -71.06,
      }),
    },
    $queryRaw: async () => (count < 1000 ? [{ requests: ++count }] : []),
  };
  const souslab = {
    restaurant: async () => ({ name: 'Pizza Place', address: '1 Main St, Boston, MA, 02114' }),
  };
  return { service: new PlacePhotosService(prisma, souslab), prisma, count: () => count };
}

const place = {
  displayName: { text: 'Pizza Place' },
  formattedAddress: '1 Main St, Boston, MA 02114, USA',
  location: { latitude: 42.36, longitude: -71.06 },
  photos: [
    {
      name: 'places/abc/photos/xyz',
      googleMapsUri: 'https://maps.google.com/photo/example',
      authorAttributions: [
        {
          displayName: 'Photographer',
          uri: '//maps.google.com/example',
          photoUri: '//lh3.googleusercontent.com/avatar',
        },
      ],
    },
  ],
  attributions: [{ provider: 'Provider', providerUri: 'javascript:alert(1)' }],
};

test('matches a nearby restaurant and returns photo credits without exposing the key', async t => {
  const { service, count } = setup(t);
  global.fetch = async (url, options) => {
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-key');
    assert.doesNotMatch(url, /test-key/);
    if (url.endsWith('places:searchText')) {
      assert.equal(options.method, 'POST');
      return Response.json({ places: [place] });
    }
    assert.match(url, /places\/abc\/photos\/xyz\/media/);
    return Response.json({ photoUri: 'https://lh3.googleusercontent.com/photo' });
  };
  assert.deepEqual(await service.photo('discovery', 'node/1'), {
    status: 'available',
    url: 'https://lh3.googleusercontent.com/photo',
    googleMapsUri: 'https://maps.google.com/photo/example',
    attributions: [
      {
        name: 'Photographer',
        uri: 'https://maps.google.com/example',
        photoUri: 'https://lh3.googleusercontent.com/avatar',
      },
      { name: 'Provider', uri: null, photoUri: null },
    ],
  });
  assert.equal(count(), 2);
  assert.equal((await service.photo('souslab', 'abc')).status, 'available');
  assert.equal(count(), 4);
});

test('does not display a photo without a safe link to its Google Maps source', async t => {
  const { service, count } = setup(t);
  global.fetch = async () =>
    Response.json({
      places: [
        { ...place, photos: [{ ...place.photos[0], googleMapsUri: 'javascript:alert(1)' }] },
      ],
    });
  assert.deepEqual(await service.photo('discovery', 'node/1'), { status: 'not-found' });
  assert.equal(count(), 1);
});

test('does not use a wrong or ambiguous restaurant match', async t => {
  const { service, count } = setup(t);
  global.fetch = async () =>
    Response.json({
      places: [
        { ...place, location: { latitude: 42.5, longitude: -71.06 } },
        { ...place, displayName: { text: 'Another Pizza Place' } },
      ],
    });
  assert.deepEqual(await service.photo('discovery', 'node/1'), { status: 'not-found' });
  assert.equal(count(), 1);
  global.fetch = async () => Response.json({ places: [place, place] });
  assert.deepEqual(await service.photo('souslab', 'abc'), { status: 'not-found' });
  assert.equal(count(), 2);
});

test('stops outbound calls at the monthly boundary and fails closed if counting fails', async t => {
  const { service, prisma, count } = setup(t, 999);
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return Response.json({ places: [place] });
  };
  assert.deepEqual(await service.photo('discovery', 'node/1'), { status: 'limit-reached' });
  assert.equal(count(), 1000);
  assert.equal(calls, 1);
  assert.deepEqual(await service.photo('discovery', 'node/1'), { status: 'limit-reached' });
  assert.equal(calls, 1);
  prisma.$queryRaw = async () => {
    throw new Error('database unavailable');
  };
  await assert.rejects(() => service.photo('discovery', 'node/1'), /database unavailable/);
  assert.equal(calls, 1);
});

test('does not send requests without a key and surfaces invalid Google media URLs', async t => {
  const { service, count } = setup(t);
  delete process.env.GOOGLE_PLACES_API_KEY;
  assert.deepEqual(await service.photo('discovery', 'node/1'), { status: 'disabled' });
  assert.equal(count(), 0);
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  global.fetch = async url =>
    url.endsWith('places:searchText')
      ? Response.json({ places: [place] })
      : Response.json({ photoUri: 'https://example.com/image' });
  await assert.rejects(() => service.photo('discovery', 'node/1'), { status: 502 });
});
