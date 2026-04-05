export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { topic } = req.body;
    const seed = Math.random(); // Har baar unique result ke liye
    const prompt = `Create a viral Hinglish Instagram caption for: "${topic}". Seed: ${seed}. Output JSON only: {"caption": "...", "tip": "..."}`;

    // --- ENGINE 1: GROQ ---
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        if (data.choices) return sendRes(res, JSON.parse(data.choices[0].message.content), "Groq ⚡");
    } catch (e) { console.log("Groq fail"); }

    // --- ENGINE 2: GEMINI ---
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return sendRes(res, JSON.parse(text), "Gemini ✨");
    } catch (e) { console.log("Gemini fail"); }

    // --- ENGINE 3: HF (MISTRAL) - DYNAMIC FALLBACK ---
    try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.HF_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: prompt })
        });
        const hfData = await hfRes.json();
        // HF aksar raw text deta hai, isliye hum use handle karenge
        const cleanText = hfData[0].generated_text.split("JSON only:")[1] || hfData[0].generated_text;
        return sendRes(res, { caption: cleanText, tip: "Post Reels daily." }, "Mistral 🤗");
    } catch (e) {
        res.status(500).json({ error: "All engines down" });
    }
}

function sendRes(res, result, engine) {
    const reach = 5000 + Math.floor(Math.random() * 10000);
    res.status(200).json({
        caption: result.caption || result,
        tip: result.tip || "Use trending audio.",
        analytics: { reach, likes: Math.floor(reach * 0.1) },
        type: engine
    });
}
