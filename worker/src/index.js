const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const withCors = (response) => {
  const headers = new Headers(response.headers || {});
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const jsonResponse = (data, status = 200) =>
  withCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const emptyResponse = (status = 204) => withCors(new Response(null, { status }));

const isValidString = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

const validatePayload = (payload) => {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid JSON body" };
  const { question, choices } = payload;

  if (!isValidString(question, 1, 1000)) {
    return { ok: false, error: "question must be a non-empty string up to 1000 characters" };
  }

  if (!Array.isArray(choices) || choices.length !== 2) {
    return { ok: false, error: "choices must contain exactly 2 items" };
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

  const requiredIds = new Set(["YES", "NO"]);
  if (uniqueIds.size !== requiredIds.size || ids.some((id) => !requiredIds.has(id))) {
    return { ok: false, error: "choices ids must be YES and NO" };
  }

  return { ok: true, value: { question: question.trim(), choices: parsedChoices } };
};

const buildMessages = (question, choices) => {
  const choiceLines = choices.map((c) => `- ${c.id}: ${c.label}`).join("\n");
  const system =
    "Eres un asistente que responde SOLO con JSON plano. No uses Markdown ni texto adicional. " +
    'Devuelve exactamente {"scores":[{"id":"YES","score":<entero 0-100>},{"id":"NO","score":<entero 0-100>}]}.' +
    " Usa los ids tal cual. Los scores deben ser enteros entre 0 y 100. No añadas comentarios.";

  const user = `Pregunta: ${question}\nOpciones:\n${choiceLines}\nDevuelve el JSON con scores.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

const validateScoresShape = (data, expectedIds) => {
  if (!data || typeof data !== "object" || !Array.isArray(data.scores) || data.scores.length !== expectedIds.length) {
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

  return { ok: true };
};

const modelBadJson = () => jsonResponse({ error: "MODEL_BAD_JSON" }, 502);

const callOpenRouter = async (body, env) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
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
    if (request.method === "OPTIONS") {
      return emptyResponse();
    }

    if (url.pathname !== "/api/weights") {
      return withCors(new Response("Not Found", { status: 404 }));
    }

    if (request.method !== "POST") {
      return withCors(new Response("Method Not Allowed", { status: 405 }));
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({ error: "CONFIG_OPENROUTER_API_KEY_MISSING" }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const validation = validatePayload(payload);
    if (!validation.ok) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { question, choices } = validation.value;
    const expectedIds = choices.map((c) => c.id);
    const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const messages = buildMessages(question, choices);

    const requestBody = {
      model,
      messages,
      temperature: 0,
      max_tokens: 220,
    };

    const modelResult = await callOpenRouter(requestBody, env);
    if (!modelResult || !modelResult.payload) {
      return jsonResponse({ error: "MODEL_ERROR" }, 502);
    }

    const rawContent = modelResult.payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      return modelBadJson();
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent.trim());
    } catch (err) {
      return modelBadJson();
    }

    const validationResult = validateScoresShape(parsed, expectedIds);
    if (!validationResult.ok) {
      return modelBadJson();
    }

    return jsonResponse({ scores: parsed.scores, meta: { provider: "openrouter", model } });
  },
};
