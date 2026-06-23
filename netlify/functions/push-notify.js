const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const store = getStore({ name: 'syc', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_TOKEN });

  webpush.setVapidDetails(
    'mailto:hello@getsaturdayyard.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscription = await store.get('push-subscription', { type: 'json' });
  if (!subscription) return { statusCode: 200, body: JSON.stringify({ ok: true, note: 'no subscription' }) };

  // Parse Netlify Forms webhook payload
  let title = 'New Lead — Saturday Yard Co.';
  let body = 'Someone submitted the intake form.';
  try {
    const data = JSON.parse(event.body || '{}');
    const first = data.data?.first || data.first || '';
    const last  = data.data?.last  || data.last  || '';
    const yard  = data.data?.yardSize || data.yardSize || '';
    if (first || last) body = `${first} ${last}${yard ? ` · ${yard} yard` : ''} wants to get on the route.`;
  } catch (_) {}

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url: '/leads.html' }));
  } catch (err) {
    if (err.statusCode === 410) await store.delete('push-subscription');
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
