const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');

exports.handler = async function() {
  const store = getStore({ name: 'syc', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_TOKEN });

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'VAPID keys not set in env vars' }) };
  }

  webpush.setVapidDetails(
    'mailto:hello@getsaturdayyard.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscription = await store.get('push-subscription', { type: 'json' });
  if (!subscription) {
    return { statusCode: 200, body: JSON.stringify({ error: 'No subscription saved. Tap the bell icon in leads.html first.' }) };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: 'Saturday Yard Co. 🌿',
      body: 'Push notifications are working!',
      url: '/leads.html'
    }));
    return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Test notification sent!' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message, statusCode: err.statusCode }) };
  }
};
