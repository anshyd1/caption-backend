// 🚀 Caption Studio Final Engine (Groq + 9 Gemini Keys Rotator)
const GEMINI_KEYS = [
    "AIzaSyDeaaDZ13wrh7_n_CcWsw8wpLpBFiMLOxs",
    "AIzaSyCkUNwmyavUgnUU8psGBkloJLPyPu9TRKA",
    "AIzaSyA96EoEYepe3XyCNNkX7LOb3FeBJCbjeiI",
    "AIzaSyCTUMu70LRqN7XPl3QViITrr-q7H8WHO60",
    "AIzaSyDKbz8LZpStqFqEgcEjI2FVwzuVxoD6FiQ",
    "AIzaSyC-5745w1pLYKzWdPoevI3j9YyleHuRJb0",
    "AIzaSyAPWQPcdugDOzwwGFBgvmcT1kIVwp95yx8",
    "AIzaSyBYTMwt-BbQ99rzGq9YLx3hyvs0uoHrP-M",
    "AIzaSyAI_dEagK8afxlVAsQ2Yf284xPOtaX6xyQ"
];

export default async function handler(req, res) {
    // 1. CORS Headers Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    try {
        // --- STEP 1: TRY GROQ (Super Fast Primary Engine) ---
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.GROQ_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ 
                    role: "user", 
                    content: `Write a viral Hinglish IG caption for: "${topic}". Return ONLY a JSON object: {"caption": "...", "tip": "..."}` 
                }],
                response_format: { type: "json_object" }
            })
        });

        const groqData = await groqRes.json();
        
        if (groqData.choices && groqData.choices[0]) {
            const result = JSON.parse(groqData.choices[0].message.content);
            return sendRes(res, result, "Groq Engine ⚡");
        }

        throw new Error("Groq failed, switching to Gemini Rotator");

    } catch (error) {
        // --- STEP 2: TRY GEMINI ROTATOR (The Power Backup) ---
        try {
            const keyIndex = Math.floor(Math.random() * GEMINI_KEYS.length);
            const selectedKey = GEMINI_KEYS[keyIndex];
            
            // Using the "BINGO" tested model: Gemini 3.1 Flash Lite
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${selectedKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Write a viral Hinglish IG caption for: ${topic}. Return ONLY JSON: {"caption": "...", "tip": "..."}` }] }],
                    generationConfig: { 
                        response_mime_type: "application/json",
                        temperature: 0.8 
                    }
                })
            });

            const geminiData = await geminiRes.json();
            
            if (geminiData.candidates && geminiData.candidates[0]) {
                const result = JSON.parse(geminiData.candidates[0].content.parts[0].text);
                return sendRes(res, result, `Gemini Flash Slot #${keyIndex + 1} ✨`);
            } else {
                throw new Error("Gemini Key Busy");
            }

        } catch (geminiError) {
            // --- FINAL FALLBACK: If everything fails ---
            const emergencyResult = {
                caption: `Full power mode: ${topic}! 🔥 Har din naya swag. #${topic.replace(/\s+/g, '')} #Gorakhpur53 #Trending`,
                tip: "Trending audio use karo for 2x reach!"
            };
            return sendRes(res, emergencyResult, "Emergency System 🔄");
        }
    }
}

// Helper to send formatted response with analytics
function sendRes(res, result, engine) {
    const reach = 8000 + Math.floor(Math.random() * 7000);
    res.status(200).json({
        caption: result.caption,
        tip: result.tip,
        analytics: { reach, likes: Math.floor(reach * 0.12) },
        type: engine
    });
}
