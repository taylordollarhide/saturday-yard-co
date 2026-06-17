const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const store = getStore('syc');

  if (event.httpMethod === 'GET') {
    try {
      const clients = await store.get('clients', { type: 'json' });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clients || [])
      };
    } catch {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '[]' };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const clients = JSON.parse(event.body || '[]');
      await store.setJSON('clients', clients);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
