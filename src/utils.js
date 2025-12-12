export const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatScore = (score) => {
  if (!Number.isFinite(score)) return "–";
  if (Math.abs(score) >= 1000) return score.toFixed(0);
  const rounded = Math.abs(score % 1) < 0.01 ? score.toFixed(0) : score.toFixed(2);
  return rounded.replace(/\.00$/, "");
};

export const chooseFinalOption = (options) => options[Math.floor(Math.random() * options.length)];

export const pickWithWeights = (scores) => {
  const total = scores.reduce((sum, entry) => sum + Math.max(0, entry.score), 0);
  if (total <= 0) return null;
  const roll = Math.random() * total;
  let acc = 0;
  for (const entry of scores) {
    acc += Math.max(0, entry.score);
    if (roll <= acc) return entry.id;
  }
  return scores[scores.length - 1].id;
};
