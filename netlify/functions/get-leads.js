const https = require('https');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.get({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

exports.handler = async function() {
  const token  = process.env.NETLIFY_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!token || !siteId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NETLIFY_TOKEN and NETLIFY_SITE_ID env vars not set.' }) };
  }

  // Get all forms for this site
  const formsResp = await get(
    `https://api.netlify.com/api/v1/forms?site_id=${encodeURIComponent(siteId)}`,
    token
  );

  if (formsResp.status === 401) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token.' }) };
  }

  let forms = [];
  try { forms = JSON.parse(formsResp.body); } catch (_) {}
  if (!Array.isArray(forms)) forms = [];

  // Debug: return what forms were found
  if (forms.length === 0) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _debug: 'no_forms_found', formsStatus: formsResp.status }) };
  }

  const intakeForm = forms.find(f => f.name === 'client-intake') || forms[0];

  // Fetch submissions
  const subResp = await get(
    `https://api.netlify.com/api/v1/forms/${intakeForm.id}/submissions?per_page=100`,
    token
  );

  let submissions = [];
  try { submissions = JSON.parse(subResp.body); } catch (_) {}
  if (!Array.isArray(submissions)) submissions = [];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissions)
  };
};
