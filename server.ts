import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initialization for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please configure it in Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// Serve static files from public directory directly
app.use(express.static(path.join(process.cwd(), "public")));

// Handle direct creator images requests
app.get(["/creator.jpeg", "/creator.jpg", "/creator.png"], (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "creator.jpeg");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/jpeg");
    return res.sendFile(filePath);
  }
  const altPath = path.join(process.cwd(), "src", "assets", "creator.jpeg");
  if (fs.existsSync(altPath)) {
    res.setHeader("Content-Type", "image/jpeg");
    return res.sendFile(altPath);
  }
  res.status(404).end();
});

// Serve creator profile image if placed in project or public directory
app.get("/api/creator-image", (_req, res) => {
  const possiblePaths = [
    path.join(process.cwd(), "public", "Sidda Venkata Sai Tejashree.jpeg"),
    path.join(process.cwd(), "src", "assets", "Sidda Venkata Sai Tejashree.jpeg"),
    path.join(process.cwd(), "public", "creator.jpeg"),
    path.join(process.cwd(), "src", "assets", "creator.jpeg"),
    path.join(process.cwd(), "public", "creator.jpg"),
    path.join(process.cwd(), "public", "creator.png"),
    path.join(process.cwd(), "public", "WhatsApp Image 2026-09-22 at 5.36.59 PM.jpeg"),
    path.join(process.cwd(), "Sidda Venkata Sai Tejashree.jpeg"),
    path.join(process.cwd(), "creator.jpeg"),
    path.join(process.cwd(), "creator.jpg"),
    path.join(process.cwd(), "creator.png"),
    path.join(process.cwd(), "WhatsApp Image 2026-09-22 at 5.36.59 PM.jpeg"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.sendFile(filePath);
    }
  }

  // Scan root, public, and src/assets directories for any creator image
  try {
    const searchDirs = [
      process.cwd(),
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "src", "assets"),
    ];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const match = files.find(
          (f) =>
            /sidda|tejashree|creator|whatsapp/i.test(f) &&
            /\.(jpeg|jpg|png|webp|gif)$/i.test(f)
        );
        if (match) {
          const matchedPath = path.join(dir, match);
          const ext = path.extname(match).toLowerCase();
          const contentType =
            ext === ".png"
              ? "image/png"
              : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";
          res.setHeader("Content-Type", contentType);
          return res.sendFile(matchedPath);
        }
      }
    }
  } catch (err) {
    console.error("Error searching for creator image:", err);
  }

  res.status(404).json({ error: "Creator image not found" });
});

// Endpoint to persist uploaded creator image
app.post("/api/upload-creator-image", (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required." });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(imageBase64, "base64");

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const targetFilename = filename || "WhatsApp Image 2026-09-22 at 5.36.59 PM.jpeg";
    fs.writeFileSync(path.join(publicDir, targetFilename), buffer);
    fs.writeFileSync(path.join(publicDir, "creator.jpeg"), buffer);

    res.json({ success: true, path: "/api/creator-image" });
  } catch (err: any) {
    console.error("Error saving creator image:", err);
    res.status(500).json({ error: err?.message || "Failed to save creator image" });
  }
});

function formatGeminiErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred while communicating with Julie AI.";

  const rawMsg = typeof error === "string" ? error : error?.message || "";

  // Attempt to extract clean message if it's nested JSON
  let extracted = "";
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed?.error?.message === "string" && parsed.error.message.includes("{")) {
        try {
          parsed = JSON.parse(parsed.error.message);
        } catch {
          // retain parsed
        }
      }
      extracted = parsed?.error?.message || parsed?.message || parsed?.error?.status || "";
    }
  } catch {
    // non-json string
  }

  const textToCheck = `${rawMsg} ${extracted}`.toLowerCase();

  if (
    textToCheck.includes("503") ||
    textToCheck.includes("unavailable") ||
    textToCheck.includes("high demand")
  ) {
    return "The Gemini service is temporarily experiencing high demand. Spikes in demand are usually brief — please wait a moment and try again.";
  }

  if (
    textToCheck.includes("429") ||
    textToCheck.includes("quota") ||
    textToCheck.includes("resource_exhausted")
  ) {
    return "Request rate limit reached. Please wait a moment before sending another message.";
  }

  if (
    textToCheck.includes("api_key") ||
    textToCheck.includes("apikey") ||
    textToCheck.includes("401") ||
    textToCheck.includes("403")
  ) {
    return "Gemini API key is invalid or unauthorized. Please verify your API key in Settings > Secrets.";
  }

  if (extracted && extracted.trim().length > 0 && !extracted.startsWith("{")) {
    return extracted.trim();
  }

  return rawMsg && !rawMsg.startsWith("{")
    ? rawMsg
    : "Julie AI encountered a temporary service issue. Please try again.";
}

function isTemporaryCapacityError(error: any): boolean {
  if (!error) return false;
  const msg = `${typeof error === "string" ? error : error?.message || ""} ${error?.status || ""}`.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("429") ||
    msg.includes("resource_exhausted")
  );
}

// Candidate models in fallback order - prioritize highly available gemini-3.1-flash-lite
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

let lastSuccessfulModel = "gemini-3.1-flash-lite";

// Chat completion streaming endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGenAI();

    // Prepare contents for Gemini API:
    // Alternate roles if needed and handle text and multimodal image/file attachments
    const formattedContents = messages
      .filter((m) => m && ((typeof m.content === "string" && m.content.trim().length > 0) || (Array.isArray(m.attachments) && m.attachments.length > 0)))
      .map((m) => {
        const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
        const parts: any[] = [];

        // Attach user/model text content
        if (m.content && typeof m.content === "string" && m.content.trim().length > 0) {
          parts.push({ text: m.content });
        }

        // Process attachments (images as inlineData, documents as text context or inlineData)
        if (Array.isArray(m.attachments) && m.attachments.length > 0) {
          for (const att of m.attachments) {
            if (att.isImage && att.dataUrl && att.dataUrl.includes(";base64,")) {
              const [header, base64Data] = att.dataUrl.split(";base64,");
              const mimeType = header.replace("data:", "") || "image/jpeg";
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            } else if (att.textContent) {
              parts.push({
                text: `[Attached Document: ${att.name || "File"}]\n\`\`\`\n${att.textContent}\n\`\`\``,
              });
            } else if (att.dataUrl && att.dataUrl.includes(";base64,")) {
              const [header, base64Data] = att.dataUrl.split(";base64,");
              const mimeType = header.replace("data:", "") || att.type || "application/octet-stream";
              if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
                parts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                });
              } else {
                parts.push({
                  text: `[Attached file: ${att.name} (${att.type || "unknown format"})]`,
                });
              }
            }
          }
        }

        return { role, parts };
      })
      .filter((m) => m.parts.length > 0);

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "At least one message with content is required." });
    }

    // Set SSE headers for instantaneous streaming (disable proxy buffering)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const systemInstruction =
      "You are Julie AI, an intelligent, helpful, approachable, and articulate AI companion created and developed by Sidda Venkata Sai Tejashree. Provide rich, accurate, and insightful explanations. Use Markdown cleanly with headers, bold text, bullet points, numbered lists, and fenced code blocks with language identifiers. Keep your tone encouraging and professional.";

    let activeStream: any = null;
    let lastError: any = null;

    // Prioritize the last successful model, followed by the rest
    const modelsToTry = [
      lastSuccessfulModel,
      ...CANDIDATE_MODELS.filter((m) => m !== lastSuccessfulModel),
    ];

    // Try candidate models with fallback if 503/temporary capacity issues arise
    for (const model of modelsToTry) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: formattedContents,
          config: { systemInstruction },
        });

        activeStream = stream;
        lastSuccessfulModel = model;
        break; // Stream successfully initialized!
      } catch (err: any) {
        lastError = err;
        console.log(`[Julie AI] Upstream model ${model} unavailable, failing over to alternative...`);

        // If it's a transient 503 / 429 capacity spike, wait briefly and try next model
        if (isTemporaryCapacityError(err)) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        } else {
          // Non-transient error, don't spam other models
          break;
        }
      }
    }

    if (!activeStream) {
      throw lastError || new Error("Failed to initialize response stream from Gemini API.");
    }

    for await (const chunk of activeStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      }
    }

    res.write("data: [DONE]\n\n");
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }
    res.end();
  } catch (error: any) {
    console.error("Error generating response with Julie AI:", error);
    const friendlyMessage = formatGeminiErrorMessage(error);

    if (!res.headersSent) {
      res.status(500).json({ error: friendlyMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      res.end();
    }
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Julie AI server running at http://0.0.0.0:${PORT}`);
  });
}

start();
