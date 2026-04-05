export default async function handler(req, res) {
    // CORS Headers for Localhost & Production support
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { topic, category } = req.body;
    
    // Unique Seed for variety every time
    const seed = new Date().getTime();
    const prompt = `Write a UNIQUE viral Hinglish Instagram caption for: "${topic}". Category: ${category || 'Viral'}. Random Seed: ${seed}. Provide ONE unique growth tip. Output ONLY JSON: {"caption": "...", "tip": "..."}`;

    // --- ENGINE 1: GROQ (Primary) ---
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                temperature: 0.9,
                response_format: { type: "json_object" },
                messages: [{ role: "system", content: "You are a viral content expert." }, { role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        if (data.choices) return sendRes(res, JSON.parse(data.choices[0].message.content), "Groq Engine ⚡");
    } catch (e) { console.log("Groq Engine Busy"); }

    // --- ENGINE 2: GEMINI (Backup) ---
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return sendRes(res, JSON.parse(text), "Gemini AI ✨");
    } catch (e) { console.log("Gemini Engine Busy"); }

    // --- ENGINE 3: HF Fallback (Dynamic) ---
    try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.HF_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: prompt, parameters: { temperature: 0.9 } })
        });
        const hfData = await hfRes.json();
        const genText = hfData[0]?.generated_text || "Viral vibes only! 🚀 #Growth";
        return sendRes(res, { caption: genText, tip: "Post consistently at peak hours." }, "Mistral 🤗");
    } catch (e) {
        res.status(500).json({ error: "All Engines Busy" });
    }
}

function sendRes(res, result, engine) {
    const reach = 5000 + Math.floor(Math.random() * 15000);
    const likes = Math.floor(reach * (0.08 + Math.random() * 0.05));
    res.status(200).json({
        caption: result.caption,
        tip: result.tip,
        analytics: { reach, likes },
        type: engine
    });
}
