
require("dotenv").config();

const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static("."));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const toolInstructions = {
  instagram: `
Create:
1. One engaging Instagram caption
2. Relevant hashtags
3. One Reel idea
Keep the response concise and specific to the business.
`,
  ads: `
Create:
1. Three short ad headlines
2. Primary ad text
3. Call to action
4. One audience targeting suggestion
Never promise guaranteed results.
`,
  calendar: `
Create a 7-day social media content calendar.
For each day provide:
1. Topic
2. Format
3. Short caption idea
4. Goal
Keep each day's entry concise.
`,
  seo: `
Create:
1. Five relevant keyword ideas
2. One SEO page title
3. One meta description
4. Three content ideas
Do not invent search-volume data.
`,
};

app.post("/api/generate", async (req, res) => {
  const requestStarted = Date.now();

  try {
    const { business, type, goal, details } = req.body || {};

    if (
      typeof business !== "string" ||
      !business.trim() ||
      typeof goal !== "string" ||
      !goal.trim()
    ) {
      return res.status(400).json({
        error: "Business name and marketing tool are required.",
      });
    }

    const selectedTool = toolInstructions[goal];

    if (!selectedTool) {
      return res.status(400).json({
        error: "Please select a valid marketing tool.",
      });
    }

    const safeType =
      typeof type === "string" ? type.slice(0, 200) : "Other";

    const safeDetails =
      typeof details === "string"
        ? details.slice(0, 1500)
        : "Not provided";

    const prompt = `
You are FaruAI, a practical digital marketing assistant.

Business: ${business.slice(0, 200)}
Business type: ${safeType}
Product or service details: ${safeDetails}

Task:
${selectedTool}

Use clear headings and practical suggestions.
Tailor the answer to the business.
Do not invent facts, reviews, statistics, or guarantees.
Keep the answer concise while completing every requested item.
`;

    console.log(`[FaruAI] Starting ${goal} generation`);

    const aiStarted = Date.now();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 1200,
      },
    });

    console.log(
      `[FaruAI] Gemini response: ${Date.now() - aiStarted} ms`
    );

    if (!response.text) {
      throw new Error("AI returned an empty response. Please try again.");
    }

    console.log(
      `[FaruAI] Total request: ${Date.now() - requestStarted} ms`
    );

    return res.json({
      result: response.text,
    });
  } catch (error) {
    console.error(
      `[FaruAI] Request failed after ${Date.now() - requestStarted} ms:`,
      error.message
    );

    return res.status(500).json({
      error: "AI generation failed. Please try again in a moment.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FaruAI server started on port ${PORT}`);
});
