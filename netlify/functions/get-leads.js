export default async function handler(req, context) {
  const token  = process.env.NETLIFY_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!token || !siteId) {
    return new Response(JSON.stringify({ error: 'NETLIFY_TOKEN and NETLIFY_SITE_ID env vars not set.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Verify the site is reachable first
  const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, { headers });
  if (siteRes.status === 401) {
    return new Response(JSON.stringify({ error: 'Invalid token. Regenerate your Netlify personal access token.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  if (!siteRes.ok) {
    return new Response(JSON.stringify({ error: `Site not found (${siteRes.status}). Check NETLIFY_SITE_ID.` }), {
      status: siteRes.status, headers: { 'Content-Type': 'application/json' }
    });
  }

  const formsRes = await fetch(
    `https://api.netlify.com/api/v1/forms?site_id=${encodeURIComponent(siteId)}`,
    { headers }
  );

  // 404 means no forms registered yet on this site — not an error
  if (formsRes.status === 404 || formsRes.status === 200) {
    if (!formsRes.ok) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } else if (!formsRes.ok) {
    return new Response(JSON.stringify({ error: `Forms API error: ${formsRes.status}` }), {
      status: formsRes.status, headers: { 'Content-Type': 'application/json' }
    });
  }

  const forms = await formsRes.json();

  if (!Array.isArray(forms) || forms.length === 0) {
    return new Response(JSON.stringify({ _debug: 'no_forms', forms: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Use client-intake if found, otherwise fall back to first form
  const intakeForm = forms.find(f => f.name === 'client-intake') || forms[0];

  const subRes = await fetch(
    `https://api.netlify.com/api/v1/forms/${intakeForm.id}/submissions?per_page=100`,
    { headers }
  );
  const submissions = await subRes.json();

  return new Response(JSON.stringify(Array.isArray(submissions) ? submissions : []), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

export const config = { path: '/api/get-leads' };
