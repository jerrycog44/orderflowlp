// Vercel serverless function. Keys live in Vercel > Settings > Environment Variables, never in the page.
const OK_ROLE = ['business', 'rider'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Server not configured' });

  const b = req.body || {};
  const s = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const row = {
    role: s(b.role, 20),
    full_name: s(b.full_name, 120),
    business_name: s(b.business_name, 160) || null,
    email: s(b.email, 254).toLowerCase(),
    phone: s(b.phone, 20),
    city: s(b.city, 60),
    vehicle: s(b.vehicle, 30) || null,
  };

  if (!OK_ROLE.includes(row.role) || row.full_name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)
      || row.phone.length < 7 || !row.city) {
    return res.status(400).json({ error: 'Invalid details' });
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });

  // 409 = this email already signed up for this role. Treat as success.
  if (r.ok || r.status === 409) return res.status(200).json({ ok: true });
  return res.status(502).json({ error: 'Could not save' });
}
