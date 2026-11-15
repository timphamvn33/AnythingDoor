const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('renders local category photos with icon fallbacks', async t => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  t.after(() => server.close());
  const { default: RestaurantThumbnail } = await server.ssrLoadModule(
    '/src/components/shared/RestaurantThumbnail.tsx',
  );
  const render = categories =>
    renderToStaticMarkup(React.createElement(RestaurantThumbnail, { categories }));

  assert.match(render(['PIZZA']), /lucide-pizza/);
  assert.match(render(['PIZZA']), /images\/discovery\/pizza\.jpg/);
  assert.match(render(['burger']), /images\/discovery\/burger\.jpg/);
  assert.match(render(['regional', 'bubble_tea']), /lucide-coffee/);
  assert.match(render(['regional', 'bubble_tea']), /images\/discovery\/coffee\.jpg/);
  assert.match(render(['steak']), /lucide-store/);
  assert.doesNotMatch(render(['steak']), /<img/);
  assert.match(render([]), /lucide-store/);
  assert.match(render(['ramen']), /lucide-soup/);
  assert.doesNotMatch(render(['ramen']), /<img/);
  assert.match(render(['sushi']), /aria-hidden="true"/);
});
