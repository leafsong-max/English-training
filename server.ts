import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

const ALLOWED_ACCOUNTS: Record<string, string> = {
  twins1: "1029",
  twins2: "1029",
};

const AUTH_SECRET =
  process.env.SESSION_SECRET ||
  process.env.GEMINI_API_KEY ||
  "sprouteng-local-auth-secret-2026";

function signAuthToken(username: string): string {
  const issuedAt = Date.now().toString(36);
  const payload = `${username}.${issuedAt}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyAuthToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [username, issuedAt, sig] = parts;
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_ACCOUNTS, username)) {
    return null;
  }
  const payload = `${username}.${issuedAt}`;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return username;
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
  const username = verifyAuthToken(token);
  if (!username) {
    res.status(401).json({ error: "로그인이 필요한 서비스입니다." });
    return;
  }
  (req as express.Request & { authUser?: string }).authUser = username;
  next();
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getReadableError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("API_KEY_INVALID") || raw.includes("PERMISSION_DENIED") || raw.includes("403")) {
    return {
      status: 403,
      message: "Gemini API 키가 유효하지 않거나 권한이 없습니다. Settings > Secrets 패널을 확인해 주세요.",
    };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      message: "요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  return {
    status: 500,
    message: raw || "AI 응답 처리 중 오류가 발생했습니다.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Authentication routes (restricted strictly to twins1 & twins2)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const cleanId = typeof username === "string" ? username.trim() : "";
    const cleanPw = typeof password === "string" ? password.trim() : "";

    if (!cleanId || !cleanPw) {
      res.status(400).json({ error: "아이디와 비밀번호를 모두 입력해 주세요." });
      return;
    }

    const expectedPw = Object.prototype.hasOwnProperty.call(ALLOWED_ACCOUNTS, cleanId)
      ? ALLOWED_ACCOUNTS[cleanId]
      : null;

    if (!expectedPw || expectedPw !== cleanPw) {
      res.status(401).json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." });
      return;
    }

    const token = signAuthToken(cleanId);
    res.json({ token, username: cleanId });
  });

  app.get("/api/auth/session", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
    const username = verifyAuthToken(token);
    if (!username) {
      res.status(401).json({ valid: false });
      return;
    }
    res.json({ valid: true, username });
  });

  // 1. Real-time English sentence correction & natural expression recommendation
  app.post("/api/correct", requireAuth, async (req, res) => {
    try {
      const { text, contextType = "general", targetPrompt = "" } = req.body ?? {};
      if (!text || typeof text !== "string" || text.trim().length < 2) {
        res.status(400).json({ error: "교정할 영어 문장을 2글자 이상 입력해 주세요." });
        return;
      }

      const ai = getGeminiClient();
      const prompt = [
        `Learner sentence: "${text.trim()}"`,
        `Practice context: ${contextType}`,
        targetPrompt ? `Target Korean prompt / intent: "${targetPrompt}"` : "",
        "Analyze the learner's English sentence carefully.",
        "Fix all grammar, tense, article, preposition, word choice, and spelling errors.",
        "If the sentence is grammatically acceptable but sounds unnatural or textbook-like to native speakers, set isNatural appropriately and offer natural alternatives.",
        "Provide clear Korean explanations tailored for a Korean English learner.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a warm, precise bilingual English-Korean tutor. Always respond strictly in the requested JSON schema with clear, concise Korean explanations and authentic native English expressions.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isNatural: {
                type: Type.BOOLEAN,
                description: "True if the original sentence is both grammatically accurate and natural.",
              },
              correctedSentence: {
                type: Type.STRING,
                description: "The corrected, grammatically accurate version of the learner's sentence.",
              },
              accuracyScore: {
                type: Type.INTEGER,
                description: "Grammar and naturalness score from 0 to 100.",
              },
              errorHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    corrected: { type: Type.STRING },
                    reasonKo: { type: Type.STRING },
                  },
                  required: ["original", "corrected", "reasonKo"],
                },
              },
              explanationKo: {
                type: Type.STRING,
                description: "Friendly 1-3 sentence Korean summary of what was fixed and why.",
              },
              naturalAlternatives: {
                type: Type.ARRAY,
                description: "3 natural English alternatives in different tones.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tone: { type: Type.STRING },
                    expression: { type: Type.STRING },
                    meaningKo: { type: Type.STRING },
                  },
                  required: ["tone", "expression", "meaningKo"],
                },
              },
              keyTakeawayKo: {
                type: Type.STRING,
                description: "One memorable grammar or vocabulary tip in Korean.",
              },
            },
            required: [
              "isNatural",
              "correctedSentence",
              "accuracyScore",
              "errorHighlights",
              "explanationKo",
              "naturalAlternatives",
              "keyTakeawayKo",
            ],
          },
        },
      });

      const raw = (response.text ?? "{}").trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const { status, message } = getReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  // 2. Daily new sentence + 3-question quiz generator
  app.post("/api/daily-quiz", requireAuth, async (req, res) => {
    try {
      const { track = "grammar", level = "intermediate" } = req.body ?? {};
      const ai = getGeminiClient();

      const trackLabel =
        track === "writing"
          ? "English Writing & Natural Phrasing"
          : track === "conversation"
            ? "Spoken English Conversation & Idioms"
            : "English Grammar & Sentence Structure";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Create 1 practical daily English sentence to learn today and 3 multiple-choice quiz questions focused on ${trackLabel} for a Korean learner (${level} level). Make every question distinct, practical, and unambiguous with exactly 4 options.`,
        config: {
          systemInstruction:
            "You are an expert Korean-English curriculum designer. Return JSON strictly matching the schema. All explanations and question instructions for Korean learners should be in natural Korean, while English sentences/options stay in natural English.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dailySentence: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  ko: { type: Type.STRING },
                  nuanceKo: { type: Type.STRING },
                  keyExpression: { type: Type.STRING },
                },
                required: ["en", "ko", "nuanceKo", "keyExpression"],
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionKo: { type: Type.STRING },
                    promptEn: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanationKo: { type: Type.STRING },
                    keySentenceEn: { type: Type.STRING },
                    keySentenceKo: { type: Type.STRING },
                  },
                  required: [
                    "questionKo",
                    "promptEn",
                    "options",
                    "correctIndex",
                    "explanationKo",
                    "keySentenceEn",
                    "keySentenceKo",
                  ],
                },
              },
            },
            required: ["dailySentence", "questions"],
          },
        },
      });

      const raw = (response.text ?? "{}").trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const { status, message } = getReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  // 3. Interactive English conversation partner + instant coaching
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { scenarioTitle = "Daily Small Talk", scenarioContext = "", history = [], userMessage } = req.body ?? {};
      if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
        res.status(400).json({ error: "회화 메시지를 입력해 주세요." });
        return;
      }

      const ai = getGeminiClient();
      const historyText = Array.isArray(history)
        ? history
            .slice(-8)
            .map((m: { role?: string; text?: string }) => `${m.role === "user" ? "Learner" : "Partner"}: ${m.text ?? ""}`)
            .join("\n")
        : "";

      const prompt = [
        `Scenario: ${scenarioTitle}`,
        scenarioContext ? `Context: ${scenarioContext}` : "",
        historyText ? `Recent conversation:\n${historyText}` : "",
        `Learner's latest message: "${userMessage.trim()}"`,
        "1) Gently coach the learner's latest message in Korean if there is any grammar slip or a more natural native phrasing (or praise if already great).",
        "2) Continue the roleplay naturally in 1-3 engaging English sentences and provide its Korean translation.",
        "3) Suggest 2 natural reply options the learner can use next.",
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a friendly native English conversation partner helping a Korean speaker practice spoken English. Keep replies natural, realistic, and concise.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyEn: { type: Type.STRING },
              replyKo: { type: Type.STRING },
              coaching: {
                type: Type.OBJECT,
                properties: {
                  isNatural: { type: Type.BOOLEAN },
                  betterExpression: { type: Type.STRING },
                  feedbackKo: { type: Type.STRING },
                },
                required: ["isNatural", "betterExpression", "feedbackKo"],
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["replyEn", "replyKo", "coaching", "suggestedReplies"],
          },
        },
      });

      const raw = (response.text ?? "{}").trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const { status, message } = getReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SproutEng server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
