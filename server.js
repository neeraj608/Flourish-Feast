const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static('public'));

// CRITICAL: This will immediately tell you if the API key is not loaded from the .env file.
if (!process.env.API_KEY) {
    console.error('\nFATAL ERROR: API_KEY is not defined.');
    console.error('Please ensure you have a .env file in the root directory with the line: API_KEY="YOUR_KEY_HERE"\n');
    process.exit(1); // Stop the server.
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/generate-recipe', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).send('Prompt is required.');
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are a premium recipe writer for "Flourish Feast".You should be able
            to generate the recipe in every langauge and not just in english. and also you should be able to
            understand the language which user is speaking and reply accordingly.
             You have a strict set of rules.
            RULE 1: TITLE IS MANDATORY: You MUST start every response with '### Title: [Your Recipe Title]'.
            RULE 2: STRUCTURE: You MUST use these headers with their emojis: '## 📜 Introduction', '## 🥣 Ingredients', '## 🔪 Instructions', '## ✨ Tips for Success' (Optional).
            RULE 3: FORMATTING: Use '*' for ingredient lists and '1.', '2.' for instruction steps. Use '**' for bold text.`
        });

        const result = await model.generateContentStream(prompt);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        for await (const chunk of result.stream) {
            res.write(chunk.text());
        }
        res.end();

    } catch (error) {
        // This will now log the detailed error from Google to your terminal.
        console.error('\n!!!!!! GOOGLE API ERROR !!!!!!\n', error, '\n');
        res.status(500).send("Error communicating with the Google API. Check the server terminal for details.");
    }
});

app.listen(port, () => {
    console.log(`\nFlourish Feast is serving at http://localhost:${port}`);
});