const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('places the distance control in nearby restaurant discovery', async t => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve('src') } },
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const previousStorage = global.localStorage;
  global.localStorage = { getItem: () => null };
  t.after(async () => {
    if (previousStorage === undefined) delete global.localStorage;
    else global.localStorage = previousStorage;
    await server.close();
  });

  const { default: RestaurantDiscovery } = await server.ssrLoadModule(
    '/src/components/shared/RestaurantDiscovery.tsx',
  );
  const html = renderToStaticMarkup(
    React.createElement(RestaurantDiscovery, { selectedCategory: 'All', query: '' }),
  );
  assert.match(html, /<section[^>]*aria-labelledby="discovery-heading"/);
  assert.match(html, /<label[^>]*for="discovery-distance"[^>]*>Distance \(miles\)<\/label>/);
  const input = html.match(/<input\b[^>]*id="discovery-distance"[^>]*>/);
  assert.ok(input);
  assert.match(input[0], /type="number"/);
  assert.match(input[0], /min="1"/);
  assert.match(input[0], /max="25"/);
});

test('matches SousLab cuisine labels using the discovery category rules', async t => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve('src') } },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  t.after(() => server.close());
  const { categoryMatches } = await server.ssrLoadModule('/src/utils/category.ts');
  assert.equal(categoryMatches(['American', 'BURGERS'], 'Burgers'), true);
  assert.equal(categoryMatches(['Pizza'], 'Burgers'), false);
  assert.equal(categoryMatches([], 'Burgers'), false);
  assert.equal(categoryMatches([], 'All'), true);
  assert.equal(categoryMatches(['Coffee'], 'Coffe'), true);
});

test('renders accessible vertical category navigation with food icons and cuisine flags', async t => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve('src') } },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  t.after(() => server.close());
  const { default: CategoryNavigation } = await server.ssrLoadModule(
    '/src/components/shared/CategoryNavigation.tsx',
  );
  const { Tabs } = await server.ssrLoadModule('/src/components/ui/tabs.tsx');
  const html = renderToStaticMarkup(
    React.createElement(
      Tabs,
      { value: 'Pizza', orientation: 'vertical' },
      React.createElement(CategoryNavigation),
    ),
  );
  assert.match(html, /<nav[^>]*aria-label="Food categories"/);
  assert.match(html, /role="tablist"[^>]*aria-orientation="vertical"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*title="Pizza"/);
  assert.match(html, /class="lucide lucide-pizza/);
  assert.match(html, /flags\/4x3\/mx\.svg/);
  assert.match(html, /sr-only md:not-sr-only">Mexican/);
});

test('filters loaded SousLab results by text and category without hiding pagination', async t => {
  const { createServer } = await import('vite');
  const routerPath = path.resolve('node_modules/react-router/dist/development/index.mjs');
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve('src'), 'react-router-dom': routerPath } },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  t.after(() => server.close());
  const { MemoryRouter } = await server.ssrLoadModule('react-router-dom');
  const { default: SousLabSearch } = await server.ssrLoadModule(
    '/src/components/shared/SousLabSearch.tsx',
  );
  const { AuthContext } = await server.ssrLoadModule('/src/context/auth.context.tsx');
  const snapshot = {
    zip: '29204',
    name: '',
    restaurants: [
      { id: '1', name: 'Golden Bowl', address: 'Main Street', cuisines: ['Vietnamese'] },
      { id: '2', name: 'Pizza Place', address: 'Broadway', cuisines: ['Pizza'] },
      { id: '3', name: 'Unknown Place', address: '', cuisines: [] },
    ],
    nextCursor: 'next',
    lastSearch: { zip: '29204', name: '' },
    searched: true,
  };
  const render = (query, selectedCategory = 'All') =>
    renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: [{ pathname: '/landing', state: { souslabSnapshot: snapshot } }] },
        React.createElement(
          AuthContext.Provider,
          { value: { user: null } },
          React.createElement(SousLabSearch, { selectedCategory, query }),
        ),
      ),
    );
  for (const query of [' golden ', 'VIETNAMESE', 'main street']) {
    const html = render(query);
    assert.match(html, /Golden Bowl/);
    assert.doesNotMatch(html, /Pizza Place|Unknown Place/);
  }
  assert.match(render('  '), /Pizza Place/);
  assert.match(render('golden', 'Pizza'), /No loaded SousLab restaurants match the current filters/);
  assert.match(render('missing'), /Load more restaurants/);
});
