const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const path = require('node:path');

test('duplicate drafts are marked and missing menu images use a Lucide icon', async t => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': path.resolve('src') } },
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  t.after(() => server.close());
  const { default: ItemInfo } = await server.ssrLoadModule('/src/components/shared/ItemInfo.tsx');
  const item = { name: 'Soup', price: 5, imgUrl: '', category: ['Lunch'], restaurantId: 'store' };
  const html = renderToStaticMarkup(React.createElement(ItemInfo, {
    item, isOwner: true, isReadOnly: false, isDuplicate: true,
  }));
  assert.match(html, /border-red-500/);
  assert.match(html, /rename and save/);
  assert.match(html, /lucide-image-off/);
  const image = renderToStaticMarkup(React.createElement(ItemInfo, {
    item: { ...item, imgUrl: 'https://example.com/image.png' }, isReadOnly: false,
  }));
  assert.match(image, /<img/);
  assert.doesNotMatch(image, /border-red-500/);
});
