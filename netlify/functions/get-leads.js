export default async function handler(req, context) {
  const token  = process.env.NETLIFY_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!token || !siteId) {
    return new Response(JSON.stringify({ error: 'NETLIFY_TOKEN and NETLIFY_SITE_ID env vars not set.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = { Authorization: `Bearer ${token}` };

  const formsRes = await fetch(
    `https://api.netlify.com/api/v1/forms?site_id=${encodeURIComponent(siteId)}`,
    { headers }
  );

  if (!formsRes.ok) {
    return new Response(JSON.stringify({ error: `Netlify API error: ${formsRes.status}` }), {
      status: formsRes.status, headers: { 'Content-Type': 'application/json' }
    });
  }

  const forms = await formsRes.json();
  const intakeForm = forms.find(f => f.name === 'client-intake');

  if (!intakeForm) {
    return new Response(JSON.stringify([]), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  const subRes = await fetch(
    `https://api.netlify.com/api/v1/forms/${intakeForm.id}/submissions?per_page=100`,
    { headers }
  );
  const submissions = await subRes.json();

  return new Response(JSON.stringify(submissions), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

export const config = { path: '/api/get-leads' };
