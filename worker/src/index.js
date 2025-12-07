const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_ALLOWED_ORIGINS = ["https://ferdrama.github.io", "http://localhost:8083"];

const parseAllowedOrigins = (env) => {
  if (typeof env.ALLOWED_ORIGINS !== "string") return DEFAULT_ALLOWED_ORIGINS;
  const parsed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  return parsed.length ? parsed : DEFAULT_ALLOWED_ORIGINS;
};

const allowedOriginForRequest = (request, env) => {
  const origin = request.headers.get("Origin");
  const allowedOrigins = parseAllowedOrigins(env);
  if (origin && allowedOrigins.includes(origin)) return origin;
  return null;
};

const baseCorsHeaders = { "Access-Control-Allow-Methods": "POST, OPTIONS, GET", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };

const buildHeaders = (origin, extra = {}) => {
  const headers = new Headers({ ...extra, ...baseCorsHeaders });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
};

const jsonResponse = (data, status = 200, origin = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: buildHeaders(origin, { "Content-Type": "application/json" }),
  });

const emptyResponse = (status = 204, origin = null) => new Response(null, { status, headers: buildHeaders(origin) });

const isValidString = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

const validatePayload = (payload) => {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid JSON body" };
  const { question, choices } = payload;

  if (!isValidString(question, 1, 1000)) {
    return { ok: false, error: "question must be a non-empty string up to 1000 characters" };
  }

  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 12) {
    return { ok: false, error: "choices must contain between 2 and 12 items" };
  }

  const parsedChoices = choices.map((choice, idx) => {
    if (!choice || typeof choice !== "object") return null;
    const { id, label } = choice;
    if (!isValidString(id, 1, 50) || !isValidString(label, 1, 50)) return null;
    return { id: id.trim(), label: label.trim(), idx };
  });

  if (parsedChoices.some((c) => c === null)) {
    return { ok: false, error: "choices items must include id and label strings (1-50 chars)" };
  }

  const ids = parsedChoices.map((c) => c.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    return { ok: false, error: "choices ids must be unique" };
  }

  return { ok: true, value: { question: question.trim(), choices: parsedChoices } };
};

const buildMessages = (question, choices) => {
  const choiceLines = choices.map((c) => `- ${c.id}: ${c.label}`).join("\n");
  const system =
    "Responde SOLO con JSON plano sin Markdown. Formato exacto: {\"scores\":[{\"id\":\"<id>\",\"score\":<entero 0-100>}...],\"reason\":\"<frase corta estilo galleta de la suerte>\"}. " +
    "Incluye una entrada en scores para CADA opción listada, usando exactamente su id. Scores enteros 0-100. La razón debe ser una sola frase corta, positiva y concisa, sin saltos de línea. El formato de esa frase es similar a una galleta de la suerte.";

  const user = `Pregunta: ${question}\nOpciones:\n${choiceLines}\nDevuelve el JSON con scores para TODAS las opciones y reason.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

const validateScoresShape = (data, expectedIds) => {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.scores) ||
    data.scores.length !== expectedIds.length ||
    typeof data.reason !== "string"
  ) {
    return { ok: false, error: "MODEL_BAD_JSON" };
  }

  const seen = new Set();
  for (const entry of data.scores) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "MODEL_BAD_JSON" };
    const { id, score } = entry;
    if (!isValidString(id, 1, 50)) return { ok: false, error: "MODEL_BAD_JSON" };
    if (!Number.isInteger(score) || score < 0 || score > 100) return { ok: false, error: "MODEL_BAD_JSON" };
    if (seen.has(id)) return { ok: false, error: "MODEL_BAD_JSON" };
    seen.add(id);
  }

  const expectedSet = new Set(expectedIds);
  if (seen.size !== expectedSet.size) return { ok: false, error: "MODEL_BAD_JSON" };
  for (const id of seen) {
    if (!expectedSet.has(id)) return { ok: false, error: "MODEL_BAD_JSON" };
  }

  const reason = data.reason.trim();
  if (reason.length < 1 || reason.length > 300) return { ok: false, error: "MODEL_BAD_JSON" };

  return { ok: true, reason };
};

const modelBadJson = (origin) => jsonResponse({ error: "MODEL_BAD_JSON" }, 502, origin);

const callOpenRouter = async (body, env) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { ok: false, status: 500, payload: { error: "CONFIG_OPENROUTER_API_KEY_MISSING" } };
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (env.OPENROUTER_HTTP_REFERER) headers["HTTP-Referer"] = env.OPENROUTER_HTTP_REFERER;
    if (env.OPENROUTER_X_TITLE) headers["X-Title"] = env.OPENROUTER_X_TITLE;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    if (error.name === "AbortError") {
      return { ok: false, status: 504, payload: { error: "MODEL_TIMEOUT" } };
    }
    return { ok: false, status: 502, payload: { error: "MODEL_ERROR" } };
  } finally {
    clearTimeout(timeoutId);
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin");
    const allowedOrigin = allowedOriginForRequest(request, env);

    if (request.method === "OPTIONS") {
      if (originHeader && !allowedOrigin) {
        return jsonResponse({ error: "ORIGIN_FORBIDDEN" }, 403);
      }
      return emptyResponse(204, allowedOrigin);
    }

    if (url.pathname === "/health" && request.method === "GET") {
      if (originHeader && !allowedOrigin) {
        return jsonResponse({ error: "ORIGIN_FORBIDDEN" }, 403);
      }
      return jsonResponse({ ok: true }, 200, allowedOrigin);
    }

    if (url.pathname !== "/api/weights") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405, allowedOrigin);
    }

    if (originHeader && !allowedOrigin) {
      return jsonResponse({ error: "ORIGIN_FORBIDDEN" }, 403);
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({ error: "CONFIG_OPENROUTER_API_KEY_MISSING" }, 500, allowedOrigin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid JSON" }, 400, allowedOrigin);
    }

    const validation = validatePayload(payload);
    if (!validation.ok) {
      return jsonResponse({ error: validation.error }, 400, allowedOrigin);
    }

    const { question, choices } = validation.value;
    const expectedIds = choices.map((c) => c.id);
    const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const messages = buildMessages(question, choices);

    const requestBody = {
      model,
      messages,
      temperature: 0,
      max_tokens: 120,
    };

    const modelResult = await callOpenRouter(requestBody, env);
    if (!modelResult || !modelResult.payload) {
      return jsonResponse({ error: "MODEL_ERROR" }, 502, allowedOrigin);
    }

    if (!modelResult.ok) {
      const code = modelResult.payload?.error || "MODEL_ERROR";
      return jsonResponse({ error: code }, modelResult.status || 502, allowedOrigin);
    }

    if (modelResult.payload.error) {
      console.error("OpenRouter error:", modelResult.payload.error);
      return jsonResponse({ error: "MODEL_API_ERROR", details: modelResult.payload.error.message }, 502, allowedOrigin);
    }

    const rawContent = modelResult.payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      console.error("No content from model:", modelResult.payload);
      return modelBadJson(allowedOrigin);
    }

    // Strip markdown code blocks if present
    let cleanedContent = rawContent.trim();
    const codeBlockMatch = cleanedContent.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/m);
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (err) {
      console.error("JSON parse failed:", err.message, "Content:", cleanedContent);
      return modelBadJson(allowedOrigin);
    }

    const validationResult = validateScoresShape(parsed, expectedIds);
    if (!validationResult.ok) {
      return modelBadJson(allowedOrigin);
    }

    return jsonResponse({ scores: parsed.scores, reason: validationResult.reason, meta: { provider: "openrouter", model } }, 200, allowedOrigin);
  },
};
