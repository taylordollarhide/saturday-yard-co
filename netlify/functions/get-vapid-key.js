exports.handler = async function() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'VAPID_PUBLIC_KEY not set' }) };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey: key })
  };
};
