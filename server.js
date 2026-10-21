
require("dotenv").config();

const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/generate", async (req, res) => {
  try {
    const { business, type, goal, details } = req.body;

    if (!business || !goal) {
      return res.status(400).json({
        error: "Business name and marketing tool are required.",
      });
    }

    const toolInstructions = {
      instagram: `
Create an Instagram caption, relevant hashtags, and one Reel idea.
Make the caption engaging and suitable for the business.
`,
      ads: `
Create advertising copy with:
1. Three headline options
2. Primary ad text
3. Call to action
4. One audience targeting suggestion.
Do not promise guaranteed results.
`,
      calendar: `
Create a practical 7-day social media content calendar.
For each day, include the content topic, format, caption idea, and goal.
`,
      seo: `
Create SEO suggestions including:
1. Five relevant keyword ideas
2. One SEO page title
3. One meta description
4. Three content ideas.
Do not claim keywords have verified search volumes.
`,
    };

    const selectedTool = toolInstructions[goal];

    if (!selectedTool) {
      return res.status(400).json({
        error: "Please select a valid marketing tool.",
      });
    }

    const prompt = `
You are FaruAI, a professional digital marketing assistant.

Business name: ${business}
Business type: ${type || "Other"}
Product or service details: ${details || "Not provided"}

Task:
${selectedTool}

Use clear, practical language.
Tailor suggestions to the business details.
Do not invent product facts, customer reviews, statistics, or guarantees.
Clearly label each section.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({
      result: response.text,
    });

  } catch (error) {
    console.error("AI request failed:", error);

    res.status(500).json({
      error: error.message || "AI request failed. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`FaruAI running at http://localhost:${PORT}`);
});

