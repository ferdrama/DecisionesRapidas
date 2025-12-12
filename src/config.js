export const API_BASE = (window.DR_API_BASE || "https://decisiones-rapidas-worker.nomedesenlacabeza-905.workers.dev").replace(/\/+$/, "");

export const MODES = {
  binary: [
    { label: "sí", bodyClass: "yes" },
    { label: "no", bodyClass: "no" },
  ],
  binaryAI: [
    { label: "sí", bodyClass: "yes" },
    { label: "no", bodyClass: "no" },
  ],
  dice: Array.from({ length: 6 }, (_, idx) => ({ label: String(idx + 1), bodyClass: "dice" })),
};
