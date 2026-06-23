const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const store = getStore({ name: 'syc', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_TOKEN });
  const subscription = JSON.parse(event.body || '{}');

  await store.setJSON('push-subscription', subscription);

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
