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
    aiClient = new GoogleGenAI({ apiKey });
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
    path.join(process.cwd(), "public", "Sidda Venkata Sai Tejasri.jpeg"),
    path.join(process.cwd(), "src", "assets", "Sidda Venkata Sai Tejasri.jpeg"),
    path.join(process.cwd(), "public", "Sidda Venkata Sai Tejashree.jpeg"),
    path.join(process.cwd(), "src", "assets", "Sidda Venkata Sai Tejashree.jpeg"),
    path.join(process.cwd(), "public", "creator.jpeg"),
    path.join(process.cwd(), "src", "assets", "creator.jpeg"),
    path.join(process.cwd(), "public", "creator.jpg"),
    path.join(process.cwd(), "public", "creator.png"),
    path.join(process.cwd(), "public", "WhatsApp Image 2026-09-22 at 5.36.59 PM.jpeg"),
    path.join(process.cwd(), "Sidda Venkata Sai Tejasri.jpeg"),
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
            /sidda|tejasri|tejashree|creator|whatsapp/i.test(f) &&
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

  const textToCheck = `${rawMsg} ${extracted} ${error?.status || ""}`.toLowerCase();

  if (isQuotaError(error)) {
    const retrySec = extractRetrySeconds(error);
    if (retrySec && retrySec > 0) {
      return `Free Gemini API rate limit reached. Please wait ${retrySec}s before sending another message, or add your custom key in Settings > Secrets.`;
    }
    return "Gemini API rate limit reached. Please wait a moment before sending another message, or add your custom key in Settings > Secrets.";
  }

  if (
    textToCheck.includes("503") ||
    textToCheck.includes("unavailable") ||
    textToCheck.includes("high demand")
  ) {
    return "The Gemini service is temporarily experiencing high demand. Spikes in demand are usually brief — please wait a moment and try again.";
  }

  if (
    textToCheck.includes("api_key") ||
    textToCheck.includes("apikey") ||
    textToCheck.includes("401") ||
    textToCheck.includes("403") ||
    textToCheck.includes("unauthenticated")
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

function isQuotaError(error: any): boolean {
  if (!error) return false;
  const msg = `${typeof error === "string" ? error : error?.message || ""} ${error?.status || ""} ${error?.code || ""}`.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted")
  );
}

function extractRetrySeconds(error: any): number | null {
  if (!error) return null;
  const msg = `${typeof error === "string" ? error : error?.message || ""}`;
  const match =
    msg.match(/retry in ([0-9]+(?:\.[0-9]+)?)s/i) ||
    msg.match(/"retryDelay":\s*"([0-9]+)s"/i);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      return Math.ceil(val);
    }
  }
  return null;
}

function isTemporaryCapacityError(error: any): boolean {
  if (!error) return false;
  const msg = `${typeof error === "string" ? error : error?.message || ""} ${error?.status || ""} ${error?.code || ""}`.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded")
  );
}

function isApiKeyError(error: any): boolean {
  if (!error) return false;
  const msg = `${typeof error === "string" ? error : error?.message || ""} ${error?.status || ""}`.toLowerCase();
  return (
    msg.includes("api_key") ||
    msg.includes("apikey") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("unauthenticated") ||
    msg.includes("permission_denied")
  );
}

// WMO weather code descriptions
function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return "Clear sky (Sunny)";
    case 1: return "Mainly clear";
    case 2: return "Partly cloudy";
    case 3: return "Overcast";
    case 45: return "Fog";
    case 48: return "Depositing rime fog";
    case 51: return "Light drizzle";
    case 53: return "Moderate drizzle";
    case 55: return "Dense drizzle";
    case 61: return "Slight rain";
    case 63: return "Moderate rain";
    case 65: return "Heavy rain";
    case 66: return "Light freezing rain";
    case 67: return "Heavy freezing rain";
    case 71: return "Slight snow fall";
    case 73: return "Moderate snow fall";
    case 75: return "Heavy snow fall";
    case 77: return "Snow grains";
    case 80: return "Slight rain showers";
    case 81: return "Moderate rain showers";
    case 82: return "Violent rain showers";
    case 85: return "Slight snow showers";
    case 86: return "Heavy snow showers";
    case 95: return "Thunderstorm";
    case 96: return "Thunderstorm with slight hail";
    case 99: return "Thunderstorm with heavy hail";
    default: return "Partly cloudy";
  }
}

// Live real-time weather retrieval function
async function fetchLiveWeather(params: { city?: string; latitude?: number; longitude?: number }): Promise<string> {
  try {
    let lat = params.latitude;
    let lon = params.longitude;
    let locationName = params.city || "Current Location";

    if ((lat === undefined || lon === undefined) && params.city) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl, { headers: { "User-Agent": "JulieAI/1.0" } });
      if (!geoRes.ok) {
        return `Live weather error: Could not find geographic coordinates for "${params.city}".`;
      }
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return `Live weather error: City "${params.city}" could not be found. Please check the spelling or specify the region/country.`;
      }
      const top = geoData.results[0];
      lat = top.latitude;
      lon = top.longitude;
      locationName = `${top.name}${top.admin1 ? ", " + top.admin1 : ""}, ${top.country || ""}`.trim();
    }

    if (lat === undefined || lon === undefined) {
      return "Live weather notice: Location is required. Please ask the user to provide their city name.";
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const weatherRes = await fetch(weatherUrl, { headers: { "User-Agent": "JulieAI/1.0" } });
    if (!weatherRes.ok) {
      return `Live weather notice: Live information could not be retrieved from the weather service at this time.`;
    }

    const wData = await weatherRes.json();
    const current = wData.current;
    if (!current) {
      return "Live weather notice: Current weather data is temporarily unavailable for this location.";
    }

    const tempC = Math.round(current.temperature_2m * 10) / 10;
    const tempF = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
    const feelsLikeC = Math.round(current.apparent_temperature * 10) / 10;
    const feelsLikeF = Math.round(((feelsLikeC * 9) / 5 + 32) * 10) / 10;
    const condition = getWeatherDescription(current.weather_code);
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const precip = current.precipitation;

    return `LIVE CURRENT WEATHER REPORT:
- Location: ${locationName}
- Current Condition: ${condition}
- Temperature: ${tempC}°C (${tempF}°F)
- Feels Like: ${feelsLikeC}°C (${feelsLikeF}°F)
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} km/h
- Precipitation / Rain: ${precip} mm (Status: ${precip > 0 ? "Currently raining/precipitating" : "No rain currently detected"})
- Time of Observation: ${current.time} (${wData.timezone || "local time"})`;
  } catch (err: any) {
    console.error("Live weather fetch error:", err);
    return "Live weather notice: Live information could not be retrieved due to a temporary network issue.";
  }
}

// Live real-time web search retrieval function
async function fetchLiveWebSearch(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return `Live search notice: Live search results could not be retrieved at this time.`;
    }

    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let match;

    while ((match = regex.exec(html)) && snippets.length < 5) {
      const text = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, " ")
        .trim();
      if (text && text.length > 20) {
        snippets.push(text);
      }
    }

    if (snippets.length === 0) {
      return `Live search notice: No recent web results were found for "${query}".`;
    }

    return `LIVE REAL-TIME WEB SEARCH RESULTS FOR "${query}":\n` + snippets.map((s, idx) => `${idx + 1}. ${s}`).join("\n\n");
  } catch (err) {
    console.error("Live web search fetch error:", err);
    return "Live search notice: Live search information could not be retrieved due to a temporary network issue.";
  }
}

// Real-time query detector
function detectRealTimeQuery(text: string): {
  isWeather: boolean;
  isDateTime: boolean;
  isWebSearch: boolean;
  weatherCity?: string;
  isWeatherNearMe: boolean;
  searchQuery?: string;
} {
  const lower = text.toLowerCase().trim();

  // Date and Time queries
  const isDateTime =
    /\b(what('?s| is) (the )?(current )?(date|time|day)|what date is it|what time is it|today'?s date|date today|time (now|today)|current date|current time)\b/i.test(
      lower
    ) ||
    /^(date|time|what day is today|what date is today|what time is it now|what is the time now)\??$/i.test(
      lower
    );

  // Weather queries
  const isWeatherNearMe =
    /\b(weather (near me|here|around me|in my area|at my location)|is it raining (here|near me|outside))\b/i.test(lower);

  const isGeneralWeather =
    /\b(weather|temperature|forecast|is it raining|is it snowing|humidity)\b/i.test(lower);

  // Extract city if provided: e.g. "weather in Paris", "temperature in Tokyo", "what is the weather in New York"
  let weatherCity: string | undefined = undefined;
  const cityMatch =
    lower.match(/\b(?:weather|temperature|forecast|rain(?:ing)?)\s+(?:in|for|at|of)\s+([a-zA-Z\s.,'-]+?)(?:\?|$|\s+(?:today|now|tomorrow|right now|currently))/i) ||
    lower.match(/^([a-zA-Z\s.,'-]+?)\s+(?:weather|temperature|forecast)\??$/i);

  if (cityMatch && cityMatch[1]) {
    const candidate = cityMatch[1]
      .replace(/\b(right now|now|today|currently|tomorrow|this weekend|please)\b/gi, "")
      .replace(/[?!.,;:_]/g, "")
      .trim();
    if (candidate && !/^(here|near me|my area|my location|today|now)$/i.test(candidate)) {
      weatherCity = candidate;
    }
  }

  const isWeather = isWeatherNearMe || isGeneralWeather;

  // Real-time news, current events, or web queries
  const isWebSearch =
    !isDateTime &&
    !isWeather &&
    (/\b(latest news|breaking news|today'?s news|current events|recent updates|what happened today|who won|score today|stock price|latest developments)\b/i.test(
      lower
    ) ||
      /\b(today|yesterday|this week|2026)\b/i.test(lower) && /\b(news|winner|champion|status|announcement)\b/i.test(lower));

  return {
    isWeather,
    isDateTime,
    isWebSearch,
    weatherCity,
    isWeatherNearMe,
    searchQuery: isWebSearch ? text : undefined,
  };
}

// Distinct candidate models in order of priority:
// 1. gemini-3.8-flash (Recommended standard flash)
// 2. gemini-3.6-flash (Resilient alternative)
// 3. gemini-3.1-flash-lite (Lightweight model with independent capacity)
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
];

let lastSuccessfulModel = "gemini-3.8-flash";

// Chat completion streaming endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, clientContext } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGenAI();

    // Determine user's latest query
    const lastUserMessage = [...messages].reverse().find((m) => m && m.role === "user");
    const lastUserText = typeof lastUserMessage?.content === "string" ? lastUserMessage.content.trim() : "";

    // Resolve date and time in user's timezone or server default
    const clientTimeZone = clientContext?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const now = new Date();
    const currentDateTimeString = clientContext?.localTime || now.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: clientTimeZone,
    });
    const currentDateOnly = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: clientTimeZone,
    });
    const currentTimeOnly = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
      timeZone: clientTimeZone,
    });

    // Detect if this question requires real-time information
    const rtInfo = detectRealTimeQuery(lastUserText);
    let realTimeContext = "";

    if (rtInfo.isDateTime) {
      realTimeContext = `\n\n[VERIFIED REAL-TIME SYSTEM INFORMATION - DATE & TIME]
- Current Local Time: ${currentTimeOnly}
- Today's Date: ${currentDateOnly}
- Complete Date & Time: ${currentDateTimeString}
- User Timezone: ${clientTimeZone}
(Answer accurately using this exact live information. Do not invent or estimate.)`;
    } else if (rtInfo.isWeather) {
      if (rtInfo.weatherCity) {
        const weatherReport = await fetchLiveWeather({ city: rtInfo.weatherCity });
        realTimeContext = `\n\n[VERIFIED LIVE REAL-TIME WEATHER INFORMATION]\n${weatherReport}\n(Report this live weather data to the user accurately and clearly with temperature in Celsius and Fahrenheit, conditions, humidity, wind, and rain status.)`;
      } else if (clientContext?.location?.latitude && clientContext?.location?.longitude) {
        const weatherReport = await fetchLiveWeather({
          latitude: clientContext.location.latitude,
          longitude: clientContext.location.longitude,
        });
        realTimeContext = `\n\n[VERIFIED LIVE REAL-TIME WEATHER INFORMATION FOR USER LOCATION]\n${weatherReport}\n(Report this live weather data to the user accurately and clearly with temperature in Celsius and Fahrenheit, conditions, humidity, wind, and rain status.)`;
      } else {
        // Location needed from user
        realTimeContext = `\n\n[REAL-TIME WEATHER INSTRUCTION]
The user asked for current weather without specifying a city, and their device location is not available. Politeness rule: Ask the user which city they would like the current weather for so you can retrieve live real-time conditions.`;
      }
    } else if (rtInfo.isWebSearch && rtInfo.searchQuery) {
      const searchReport = await fetchLiveWebSearch(rtInfo.searchQuery);
      realTimeContext = `\n\n[VERIFIED LIVE REAL-TIME WEB SEARCH DATA]\n${searchReport}\n(Use this live search information to answer the user's question accurately. If live results were not found, inform the user clearly that live information could not be retrieved.)`;
    }

    // Prepare contents for Gemini API:
    // Alternate roles if needed and handle text and multimodal image/file attachments
    const formattedContents = messages
      .filter((m) => m && ((typeof m.content === "string" && m.content.trim().length > 0) || (Array.isArray(m.attachments) && m.attachments.length > 0)))
      .map((m, idx, arr) => {
        const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
        const parts: any[] = [];

        // Attach user/model text content
        if (m.content && typeof m.content === "string" && m.content.trim().length > 0) {
          let textContent = m.content;
          // If this is the last user message and we have real-time live tool data, inject it cleanly
          if (idx === arr.length - 1 && role === "user" && realTimeContext) {
            textContent = `${textContent}\n\n${realTimeContext}`;
          }
          parts.push({ text: textContent });
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

    let isClientConnected = true;
    res.on("close", () => {
      if (!res.writableEnded) {
        isClientConnected = false;
      }
    });

    const systemInstruction =
      "You are Julie AI, a conversational AI assistant. Respond naturally, helpfully, and directly, just like ChatGPT.\n" +
      "Important rules:\n" +
      "1. Focus directly on answering the user's actual question or prompt without fluff.\n" +
      "2. For simple greetings or conversational pleasantries (such as 'Hi', 'Hello', 'Hey', 'How are you?'), give a friendly, natural, and concise response (for example: 'Hi! How can I help you today?').\n" +
      "3. NEVER start responses with an unnecessary self-introduction (e.g. do not say 'Hi! I am Julie AI, an intelligent conversational assistant created by...').\n" +
      "4. Do NOT mention Julie AI's name, website, features, Gemini, or technical background in normal conversations unless the user explicitly asks about them.\n" +
      "5. If and ONLY if the user explicitly asks who created you, who developed you, or who made you, explain that Julie AI was created and developed by Sidda Venkata Sai Tejasri, a 19-year-old B.Tech student at Visvodaya Institute of Technology and Science. She is interested in technology, software development, problem-solving, AI, and building useful applications while continuously improving her technical skills. Do NOT invent achievements or job experience.\n" +
      "6. REAL-TIME CAPABILITIES: You have live real-time access to the current date, current time, live weather data, and live web information provided in the prompt context. Never use static training data or hardcoded guesses for real-time questions. For date/time, provide the exact verified current date and time. For weather, include current temperature, condition, feels-like, humidity, wind, and rain info when available. If live data for a specific location or search could not be retrieved, clearly state that live information could not be retrieved rather than guessing.\n" +
      "7. Use clean Markdown formatting with clear headers, bold text, lists, and fenced code blocks when helpful.";

    // Prioritize the last successful model, followed by the rest
    const modelsToTry = [
      lastSuccessfulModel,
      ...CANDIDATE_MODELS.filter((m) => m !== lastSuccessfulModel),
    ];

    let chunksWritten = 0;
    let lastError: any = null;

    // Try candidate models in prioritized order.
    // If a model returns 503 (high demand), try the next candidate model.
    // If quota (429) is reached, immediately stop to prevent burning requests and increasing rate penalties.
    let hasQuotaError = false;

    for (const model of modelsToTry) {
      if (!isClientConnected || chunksWritten > 0) break;

      try {
        console.log(`[Julie AI] Streaming with candidate model: ${model}`);
        const stream = await ai.models.generateContentStream({
          model,
          contents: formattedContents,
          config: { systemInstruction },
        });

        for await (const chunk of stream) {
          if (!isClientConnected) break;
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            chunksWritten++;
            if (typeof (res as any).flush === "function") {
              (res as any).flush();
            }
          }
        }

        if (chunksWritten > 0) {
          lastSuccessfulModel = model;
          break; // Successfully completed streaming with this model
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Julie AI] Model ${model} encountered error:`, err?.message || err);

        // If chunks were already written to the client, we cannot seamlessly switch models
        if (chunksWritten > 0) {
          break;
        }

        // Fatal API key or authentication errors should fail fast
        if (isApiKeyError(err)) {
          break;
        }

        // If quota limit (429) hit, record quota error and do not flood the API
        if (isQuotaError(err)) {
          hasQuotaError = true;
          break;
        }

        // If temporary 503 high demand spike, brief pause before trying next candidate
        if (isTemporaryCapacityError(err)) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        continue;
      }
    }

    // Direct non-streaming fallback: only if no chunks were written and it was NOT a quota or auth error
    if (chunksWritten === 0 && isClientConnected && !hasQuotaError && !isApiKeyError(lastError)) {
      try {
        console.log(`[Julie AI] Trying non-streaming fallback on model ${modelsToTry[0]}...`);
        const response = await ai.models.generateContent({
          model: modelsToTry[0],
          contents: formattedContents,
          config: { systemInstruction },
        });

        const directText = response.text || "";
        if (directText) {
          res.write(`data: ${JSON.stringify({ text: directText })}\n\n`);
          chunksWritten++;
          lastSuccessfulModel = modelsToTry[0];
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      } catch (fbErr: any) {
        lastError = fbErr;
      }
    }

    if (chunksWritten === 0) {
      throw lastError || new Error("Failed to receive response from Gemini service.");
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
      res.status(503).json({ error: friendlyMessage });
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
