export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const origin = req.headers.origin || '';
  if (!origin.includes('pandora-eight-inky.vercel.app') && !origin.includes('localhost')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { system, userPrompt, claudeKey } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: system,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
