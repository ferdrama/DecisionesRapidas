import { API_BASE } from "./config.js";

export const fetchWeights = async (question, choices) => {
  const response = await fetch(`${API_BASE}/api/weights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, choices }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const code = data?.error || `HTTP_${response.status}`;
    throw new Error(code);
  }

  if (!data?.scores || !Array.isArray(data.scores) || typeof data.reason !== "string") {
    throw new Error("MODEL_BAD_JSON");
  }

  return { scores: data.scores, reason: data.reason };
};

export const describeWeightsError = (code) => {
  if (code === "MODEL_BAD_JSON") return "La IA no devolvió JSON válido (MODEL_BAD_JSON).";
  if (code === "MODEL_TIMEOUT") return "La petición a la IA tardó demasiado (MODEL_TIMEOUT).";
  return `No se pudieron obtener pesos (${code}).`;
};
