const { OpenAI } = require('openai');

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const chatWithOpenAI = async (req, res) => {
    const { prompt } = req.body || {};

    if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
    }

    if (!openai) {
        return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300
        });

        const reply = completion.choices?.[0]?.message?.content?.trim() || '';
        return res.status(200).json({ reply });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to generate response',
            details: error.message
        });
    }
};

module.exports = { chatWithOpenAI };

