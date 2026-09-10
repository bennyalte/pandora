export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const origin = req.headers.origin || '';
  if (!origin.includes('pandora-eight-inky.vercel.app') && !origin.includes('localhost')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }
  try {
    const { system, userPrompt, useWebSearch } = req.body;
    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: system,
      messages: [{ role: 'user', content: userPrompt }]
    };
    // ⚠️ תמיכה-אופציונלית-בחיפוש-אינטרנט: נמצא-בפועל שClaude-ממציא-בביטחון-
    // מלא עובדות-על-מקורות-חיצוניים-אמיתיים (ספר-שלא-הכיר-לעומק — דמויות-
    // שלמות-בדויות, לא-שגיאת-סגנון). כלי-שרת (Anthropic-עצמו-מבצע-את-
    // החיפוש) — לא-דורש-טיפול-רב-סיבובי-בצד-שלנו. מופעל-רק-כשהפרונט-מבקש-
    // זאת-במפורש (useWebSearch), לא-בכל-קריאה, כדי-לשמור-על-מהירות-ברירת-
    // המחדל לרוב-המקרים-שלא-דורשים-עיגון-עובדתי-חיצוני.
    if (useWebSearch) {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
      requestBody.max_tokens = 2000;
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
