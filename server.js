import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/generate-story", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Look at this image and create a short creative story about it (around 150-200 words).",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const story = response.choices[0].message.content;

    return res.json({ story });
  } catch (error) {
    console.error("Error generating story:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate story", details: error.message });
  }
});

app.post("/api/text-to-speech", async (req, res) => {
  try {
    const { text, voice = "coral" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Call OpenAI API to convert text to speech
    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice,
      input: text,
      instructions: "Speak in an engaging, storytelling tone.",
    });

    // For Vercel, we'll return the audio as base64
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    return res.json({
      audio: base64Audio,
      format: "mp3",
      message: "Audio generated successfully",
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate speech", details: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
