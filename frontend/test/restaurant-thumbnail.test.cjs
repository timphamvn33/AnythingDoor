const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('renders category icons without images', async t => {
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
  assert.match(render(['burger']), /lucide-sandwich/);
  assert.match(render(['regional', 'bubble_tea']), /lucide-coffee/);
  assert.match(render(['steak']), /lucide-store/);
  assert.match(render([]), /lucide-store/);
  assert.match(render(['ramen']), /lucide-soup/);
  assert.match(render(['sushi']), /aria-hidden="true"/);
  for (const categories of [['pizza'], ['burger'], ['sushi'], ['steak'], []]) {
    assert.doesNotMatch(render(categories), /<img/);
  }
});
