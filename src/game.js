import { MODES } from "./config.js";
import { ListStorage, HistoryStorage } from "./storage.js";
import { chooseFinalOption, pickWithWeights } from "./utils.js";
import { fetchWeights, describeWeightsError } from "./api.js";
import * as UI from "./ui.js";

let currentMode = "binary";
let spinning = false;
let intervalId;

export const getCurrentMode = () => currentMode;
export const isSpinning = () => spinning;

export const isCustomListMode = () => !["binary", "binaryAI", "dice"].includes(currentMode);

export const getModeLabel = () => {
  if (currentMode === "dice") return "Dado de seis caras";
  if (currentMode === "binaryAI") return "Sí / No con IA";
  if (currentMode === "binary") return "Sí / No";
  const list = ListStorage.getLists().find((l) => l.id === currentMode);
  return list ? list.name : "Lista personalizada";
};

export const setMode = (mode) => {
  if (!MODES[mode] && !ListStorage.getLists().find(l => l.id === mode)) return;
  
  currentMode = mode;
  UI.markRadios(mode);
  UI.setState({ label: "Listo", bodyClass: "" });
  UI.setListAiToggle(false);
  UI.updateModeChip(getModeLabel());
  UI.renderLists(currentMode);
  UI.updateModeUI(currentMode, isCustomListMode());
};

const recordDecision = (option, question = null) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: getModeLabel(),
    result: option.label,
    timestamp: new Date().toISOString(),
    question: question || undefined,
  };
  HistoryStorage.addEntry(entry);
  UI.renderHistory();
};

const decideWithAI = async () => {
  const question = UI.getQuestionValue();

  if (!question) {
    UI.setWeightsStatus("Escribe una pregunta antes de continuar.", false);
    UI.focusQuestionInput();
    return;
  }

  UI.setButtonDisabled(true, "Consultando IA...");
  UI.setState({ label: "Pensando...", bodyClass: "" }, true);
  UI.setWeightsStatus("Consultando IA...", false);
  UI.renderDecisionMeta(null, "");
  UI.clearWeightsChart("Consultando IA...");
  UI.updateWeightsBadge("ai");
  UI.setWeightsHelper("Esperando respuesta de la IA");

  let spinIndex = 0;
  const spinOptions = MODES.binary;
  const spinInterval = setInterval(() => {
    const option = spinOptions[spinIndex % spinOptions.length];
    UI.setState(option, true);
    spinIndex += 1;
  }, 140);

  try {
    const choices = [
      { id: "YES", label: "Sí" },
      { id: "NO", label: "No" },
    ];
    const { scores, reason } = await fetchWeights(question, choices);

    const scoresWithLabels = scores.map((entry) => ({
      ...entry,
      label: entry.label || choices.find((c) => c.id === entry.id)?.label || entry.id,
    }));

    UI.setWeightsState(scoresWithLabels, "Pesos devueltos por IA.", true, reason);

    const choiceId = pickWithWeights(scoresWithLabels);
    if (!choiceId) {
      UI.setWeightsStatus("No hay pesos válidos.", false);
      return;
    }

    const finalOption = choiceId === "YES" ? { label: "sí", bodyClass: "yes" } : { label: "no", bodyClass: "no" };
    UI.setState(finalOption, false);
    recordDecision(finalOption, question);
    UI.setWeightsStatus("", true); // hidden
  } catch (error) {
    UI.resetWeightsState("No se pudieron obtener pesos.");
    UI.updateWeightsBadge("error");
    const code = error?.message || "MODEL_ERROR";
    UI.setWeightsStatus(describeWeightsError(code), false);
    UI.setState({ label: "Error", bodyClass: "" }, false);
  } finally {
    clearInterval(spinInterval);
    UI.setButtonDisabled(false, "Decidir");
    UI.removeSuspense();
  }
};

const decideListWithAI = async () => {
  const list = ListStorage.getLists().find((l) => l.id === currentMode);
  if (!list || !list.items?.length) {
    UI.setWeightsStatus("Esta lista no tiene opciones.", false);
    return;
  }

  UI.setButtonDisabled(true, "Consultando IA...");
  UI.setState({ label: "Pensando...", bodyClass: "" }, true);
  UI.setWeightsStatus(`Consultando IA para "${list.name}"...`, false);
  UI.renderDecisionMeta(null, "");
  UI.clearWeightsChart(`Consultando IA para "${list.name}"...`);
  UI.updateWeightsBadge("ai");
  UI.setWeightsHelper(`Esperando pesos para "${list.name}"`);

  const spinOptions = MODES[currentMode] || list.items.map((item) => ({ label: item, bodyClass: "custom" }));
  let spinIndex = 0;
  const spinInterval = setInterval(() => {
    const option = spinOptions[spinIndex % spinOptions.length];
    UI.setState(option, true);
    spinIndex += 1;
  }, 140);

  try {
    const choices = list.items.map((item, idx) => ({ id: `ITEM_${idx}`, label: item }));
    const { scores, reason } = await fetchWeights(list.name, choices);

    const scoresWithLabels = scores.map((entry) => ({
      ...entry,
      label: entry.label || choices.find((c) => c.id === entry.id)?.label || entry.id,
    }));

    UI.setWeightsState(scoresWithLabels, `Pesos devueltos por IA para "${list.name}".`, true, reason);

    const choiceId = pickWithWeights(scoresWithLabels);
    if (!choiceId) {
      UI.setWeightsStatus("No hay pesos válidos.", false);
      return;
    }

    const winning = choices.find((c) => c.id === choiceId) || { label: choiceId };
    const finalOption = { label: winning.label, bodyClass: "custom" };
    UI.setState(finalOption, false);
    recordDecision(finalOption, list.name);
    UI.setWeightsStatus("", true); // hidden
  } catch (error) {
    UI.resetWeightsState();
    const code = error?.message || "MODEL_ERROR";
    UI.setWeightsStatus(describeWeightsError(code), false);
    UI.setState({ label: "Error", bodyClass: "" }, false);
  } finally {
    clearInterval(spinInterval);
    UI.setButtonDisabled(false, "Decidir");
    UI.removeSuspense();
  }
};

export const saveList = (id, name, items) => {
  const list = { id, name, items };
  const saved = ListStorage.saveList(list);
  
  if (currentMode === saved.id) {
    UI.setState({ label: "Listo", bodyClass: "" });
    UI.updateModeChip(getModeLabel());
  }
  UI.renderLists(currentMode);
};

export const deleteList = (id) => {
  const list = ListStorage.getLists().find((l) => l.id === id);
  if (!list) return;
  if (!confirm(`¿Eliminar la lista "${list.name}"?`)) return;

  ListStorage.deleteList(id);

  if (currentMode === id) {
    setMode("binary");
  } else {
    UI.renderLists(currentMode);
  }
};

export const clearHistory = () => {
  if (!HistoryStorage.getHistory().length) return;
  if (!confirm("¿Borrar todo el historial?")) return;
  HistoryStorage.clear();
  UI.renderHistory();
};

export const deleteHistoryEntry = (id) => {
  HistoryStorage.deleteEntry(id);
  UI.renderHistory();
};

export const startSpin = () => {
  if (spinning) return;

  // Dispatch based on mode
  if (currentMode === "binaryAI") {
    decideWithAI();
    return;
  }
  if (isCustomListMode() && UI.getListAiToggleValue()) {
    decideListWithAI();
    return;
  }

  spinning = true;
  UI.setButtonDisabled(true, "Pensando...");

  let spinOptions = MODES[currentMode];
  if (!spinOptions) {
    const list = ListStorage.getLists().find((l) => l.id === currentMode);
    if (list) {
      spinOptions = list.items.map((item) => ({ label: item, bodyClass: "custom" }));
    } else {
      setMode("binary");
      spinOptions = MODES.binary;
    }
  }

  let index = 0;
  intervalId = setInterval(() => {
    const option = spinOptions[index % spinOptions.length];
    UI.setState(option, true);
    index += 1;
  }, 140);

  const suspenseTime = 1700 + Math.random() * 1200;
  setTimeout(() => {
    clearInterval(intervalId);
    const final = chooseFinalOption(spinOptions);
    UI.setState(final, false);
    recordDecision(final);
    UI.setButtonDisabled(false, "Decidir");
    spinning = false;
  }, suspenseTime);
};
