import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { chatSchema } from "../utils/schemas.js";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many AI requests, slow down." },
});

router.post("/chat", protect, aiLimiter, validate(chatSchema), async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "AI API key is not configured.",
    });
  }

  const { messages } = req.body || {};

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 20 ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 8000
    )
  ) {
    return res.status(400).json({
      error: "Invalid messages.",
    });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:5173",
          "X-Title": "HCM Lite AI Assistant",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openrouter/free",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant for an HR / HCM web app. Reply clearly in English, Urdu, or Roman Urdu. Do not claim access to live application data or private employee records unless explicitly provided. Refuse requests for another person's private data.",
            },
            ...messages,
          ],
          max_tokens: 1024,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "OpenRouter error:",
        response.status,
        data?.error?.message
      );

      return res.status(502).json({
        error: "AI provider request failed. Please try again.",
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "AI returned an empty response.",
      });
    }

    return res.status(200).json({
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("AI request failed:", error.message);

    return res.status(500).json({
      error: "Unable to connect to the AI service.",
    });
  }
});

export default router;