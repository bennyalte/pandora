// ⚠️ תיקון-אבטחה: isAllowedOrigin משתמשת-בהשוואה-מדויקת/regex, לא-
// substring-matching (.includes()) — נמצא-בפועל-שבדיקת-.includes() הישנה-
// הייתה-ניתנת-לעקיפה-על-ידי-דומיין-תוקף-כמו-
// "pandora-eight-inky.vercel.app.evil.com" (מכיל-את-המחרוזת-המקורית-כתת-
// מחרוזת, אך-הוא-דומיין-זר-לגמרי) — אותה-מחלקת-באג-שתוקנה-מוקדם-יותר-
// בניתוב-הנושאים (מגנטיות/נטיות), כאן-בהקשר-קריטי-לאבטחה.
function isAllowedOrigin(origin) {
  if (origin === 'https://pandora-eight-inky.vercel.app') return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

// ⚠️ (pkg72) בחירת-מודל-מהדפדפן — רק-מתוך-רשימה-סגורה. כל-ערך-אחר (או-חסר) → ברירת-המחדל.
// בלי-הרשימה, כל-מי-שמגיע-לאתר-היה-יכול-לבקש-כל-מודל-על-חשבון-המפתח-של-השרת.
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-opus-5-5'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const origin = req.headers.origin || '';
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }
  try {
    const { system, userPrompt, useWebSearch, model } = req.body;
    const chosenModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    const requestBody = {
      model: chosenModel,
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
      // ⚠️ (pkg44) max_uses:3 — מתועד-רשמית (platform.claude.com/docs — אומת-ישירות-מול-המקור, לא-ממצרפי-מחירים).
      // נמצא-בפועל: ממוצע-6.8-חיפושים-לקריאה-בהדהוד, בלי-הגבלה-עד-כה. מגביל-עלות, בלי-לבטל-אימות-לגמרי.
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];
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
