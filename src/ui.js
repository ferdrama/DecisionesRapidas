import { formatScore, formatDateTime } from "./utils.js";
import { ListStorage, HistoryStorage } from "./storage.js";

// DOM Elements Cache
const getEl = (id) => document.getElementById(id);
const query = (sel) => document.querySelectorAll(sel);

const els = {
  decision: getEl("decision"),
  button: getEl("decideButton"),
  menuButton: getEl("menuButton"),
  modeMenu: getEl("modeMenu"),
  modeChip: getEl("modeChip"),
  listModal: getEl("listModal"),
  listForm: getEl("listForm"),
  listNameInput: getEl("listName"),
  listItemsInput: getEl("listItems"),
  deleteBtn: getEl("deleteBtn"),
  listsList: getEl("listsList"),
  modalTitle: getEl("modalTitle"),
  historyModal: getEl("historyModal"),
  historyList: getEl("historyList"),
  questionBlock: getEl("questionBlock"),
  questionInput: getEl("questionInput"),
  weightsStatus: getEl("weightsStatus"),
  decisionMeta: getEl("decisionMeta"),
  listAiRow: getEl("listAiRow"),
  listAiToggle: getEl("listAiToggle"),
  weightsChart: getEl("weightsChart"),
  weightsEmpty: getEl("weightsEmpty"),
  weightsBadge: getEl("weightsBadge"),
  weightsHelper: getEl("weightsHelper"),
  weightsCard: getEl("weightsCard"),
};

// Basic UI Helpers
export const markRadios = (mode) => {
  query('input[name="mode"]').forEach((input) => {
    input.checked = input.value === mode;
  });
};

export const setState = (option, suspense = false) => {
  els.decision.textContent = option.label;
  els.decision.classList.toggle("yes", option.bodyClass === "yes");
  els.decision.classList.toggle("no", option.bodyClass === "no");
  els.decision.classList.toggle("dice", option.bodyClass === "dice");
  els.decision.classList.toggle("suspense", suspense);
  document.body.classList.remove("yes", "no", "dice", "custom");
  if (option.bodyClass) {
    document.body.classList.add(option.bodyClass);
  }
};

export const updateModeChip = (label) => {
  els.modeChip.textContent = `Modo: ${label}`;
};

export const setListAiToggle = (checked) => {
  els.listAiToggle.checked = checked;
};

export const getListAiToggleValue = () => els.listAiToggle.checked;

export const updateModeUI = (currentMode, isList) => {
  const isAI = currentMode === "binaryAI";

  els.questionBlock.toggleAttribute("hidden", !isAI);
  els.listAiRow.toggleAttribute("hidden", !isList);
  if (!isList) {
    els.listAiToggle.checked = false;
  }

  els.button.disabled = false;
  els.button.textContent = "Decidir";

  const shouldResetWeights = !isAI && !(isList && els.listAiToggle.checked);
  if (shouldResetWeights) {
    els.questionInput.value = "";
    resetWeightsState();
  }

  if (isAI || (isList && els.listAiToggle.checked)) {
    els.decision.textContent = "Listo";
    if (isList && els.listAiToggle.checked) {
      els.weightsStatus.hidden = false;
      els.weightsStatus.textContent = "IA activada: usaremos el nombre y las opciones de la lista.";
      renderDecisionMeta(null, "");
    }
  }
};

export const setButtonDisabled = (disabled, text) => {
  els.button.disabled = disabled;
  if (text) els.button.textContent = text;
};

export const removeSuspense = () => {
  els.decision.classList.remove("suspense");
};

// Lists
export const renderLists = (currentMode) => {
  const lists = ListStorage.getLists();
  
  if (lists.length === 0) {
    els.listsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0;">Sin listas personalizadas</p>';
    return;
  }

  els.listsList.innerHTML = lists
    .map(
      (list) =>
        `<div class="list-item ${currentMode === list.id ? "active" : ""}" data-id="${list.id}">
      <span class="list-item-name">${list.name}</span>
      <div class="list-actions">
        <button class="list-btn edit" data-id="${list.id}" aria-label="Editar ${list.name}">Editar</button>
        <button class="list-btn delete" data-id="${list.id}" aria-label="Eliminar ${list.name}">Eliminar</button>
      </div>
    </div>`
    )
    .join("");
};

// Modals
export const openListModal = (listId = null) => {
  if (listId) {
    const lists = ListStorage.getLists();
    const list = lists.find((l) => l.id === listId);
    if (list) {
      els.modalTitle.textContent = "Editar Lista";
      els.listNameInput.value = list.name;
      els.listItemsInput.value = list.items.join("\n");
      els.deleteBtn.removeAttribute("hidden");
    }
  } else {
    els.modalTitle.textContent = "Nueva Lista";
    els.listNameInput.value = "";
    els.listItemsInput.value = "";
    els.deleteBtn.setAttribute("hidden", "");
  }
  els.listModal.removeAttribute("hidden");
};

export const closeListModal = () => {
  els.listModal.setAttribute("hidden", "");
};

export const getListFormData = () => {
  const name = els.listNameInput.value.trim();
  const items = els.listItemsInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item);
  return { name, items };
};

// History
export const renderHistory = () => {
  const history = HistoryStorage.getHistory();

  if (history.length === 0) {
    els.historyList.innerHTML = '<p class="empty-state">Aún no hay decisiones registradas</p>';
    return;
  }

  els.historyList.innerHTML = history
    .map(
      (item) => `
        <div class="history-item" data-id="${item.id}">
          <div>
            <div class="history-main">
              <span class="history-tag">${item.type}</span>
              <span>${item.result}</span>
            </div>
            ${item.question ? `<div class="history-meta">${item.question}</div>` : ""}
            <div class="history-meta">${formatDateTime(item.timestamp)}</div>
          </div>
          <div class="history-actions">
            <button class="history-delete" data-id="${item.id}">Borrar</button>
          </div>
        </div>
      `
    )
    .join("");
};

export const openHistoryModal = () => {
  renderHistory();
  els.historyModal.removeAttribute("hidden");
};

export const closeHistoryModal = () => {
  els.historyModal.setAttribute("hidden", "");
};

// Weights & AI
export const getQuestionValue = () => els.questionInput.value.trim();
export const focusQuestionInput = () => els.questionInput.focus();

export const setWeightsStatus = (text, hidden) => {
  els.weightsStatus.textContent = text;
  els.weightsStatus.hidden = hidden;
};

export const renderDecisionMeta = (scores, reasonText = "") => {
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    els.decisionMeta.textContent = "—";
    els.decisionMeta.hidden = true;
    return;
  }

  const hasYesNo = scores.some((s) => s.id === "YES") && scores.some((s) => s.id === "NO");
  const reasonPart = reasonText ? ` · 🧧 ${reasonText}` : "";

  if (hasYesNo && scores.length === 2) {
    const yes = scores.find((s) => s.id === "YES")?.score ?? "-";
    const no = scores.find((s) => s.id === "NO")?.score ?? "-";
    els.decisionMeta.innerHTML = `<strong>⚖️ Sí ${yes} · No ${no}</strong>${reasonPart}`;
    els.decisionMeta.hidden = false;
    return;
  }

  const sorted = [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const summary = sorted.map((entry) => `${entry.label || entry.id} ${entry.score ?? "-"}`).join(" · ");

  els.decisionMeta.innerHTML = `<strong>⚖️ ${summary}</strong>${reasonPart}`;
  els.decisionMeta.hidden = false;
};

export const updateWeightsBadge = (state = "idle") => {
  if (!els.weightsBadge) return;
  els.weightsBadge.classList.remove("badge-idle", "badge-ai", "badge-manual", "badge-error");
  if (state === "ai") {
    els.weightsBadge.textContent = "IA";
    els.weightsBadge.classList.add("badge-ai");
    return;
  }
  if (state === "manual") {
    els.weightsBadge.textContent = "Manual";
    els.weightsBadge.classList.add("badge-manual");
    return;
  }
  if (state === "error") {
    els.weightsBadge.textContent = "Error";
    els.weightsBadge.classList.add("badge-error");
    return;
  }
  els.weightsBadge.textContent = "Esperando";
  els.weightsBadge.classList.add("badge-idle");
};

export const clearWeightsChart = (emptyMessage = "Sin datos de pesos todavía.") => {
  if (els.weightsChart) {
    els.weightsChart.innerHTML = "";
    els.weightsChart.setAttribute("hidden", "");
  }
  if (els.weightsEmpty) {
    els.weightsEmpty.hidden = !emptyMessage;
    if (emptyMessage) els.weightsEmpty.textContent = emptyMessage;
  }
  if (els.weightsCard) {
    els.weightsCard.setAttribute("hidden", "");
  }
  updateWeightsBadge("idle");
  if (els.weightsHelper) {
    els.weightsHelper.textContent = emptyMessage || "Cuando uses el modo IA verás aquí los pesos devueltos.";
  }
};

export const renderWeightsChart = (scores) => {
  if (!els.weightsChart || !els.weightsEmpty) return;
  if (!scores || !scores.length) {
    clearWeightsChart();
    return;
  }

  const gradients = [
    "linear-gradient(90deg, #5eead4, #8b5cf6, #f472b6)",
    "linear-gradient(90deg, #38bdf8, #6366f1, #a855f7)",
    "linear-gradient(90deg, #fbbf24, #fb7185, #a855f7)",
    "linear-gradient(90deg, #34d399, #22d3ee, #6366f1)",
  ];

  const maxAbs = Math.max(...scores.map((entry) => Math.abs(Number(entry.score) || 0)), 0.0001);

  els.weightsChart.innerHTML = scores
    .map((entry, idx) => {
      const label = entry.label || entry.id || `Opción ${idx + 1}`;
      const scoreVal = Number(entry.score ?? 0);
      const width = Math.max(6, Math.min(100, (Math.abs(scoreVal) / maxAbs) * 100));
      const gradient = gradients[idx % gradients.length];
      const isNegative = scoreVal < 0;

      return `
        <div class="weight-row">
          <div class="weight-label" title="${label}">${label}</div>
          <div class="weight-bar">
            <div class="weight-fill${isNegative ? " negative" : ""}" style="width: ${width}%; background: ${gradient};"></div>
            <span class="weight-value">${formatScore(scoreVal)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  els.weightsChart.removeAttribute("hidden");
  els.weightsEmpty.hidden = true;
  if (els.weightsCard) {
    els.weightsCard.removeAttribute("hidden");
  }
};

export const resetWeightsState = (emptyMessage) => {
  els.weightsStatus.textContent = "";
  els.weightsStatus.hidden = true;
  renderDecisionMeta(null, "");
  clearWeightsChart(emptyMessage);
};

export const setWeightsState = (scores, statusText, fromAI, reasonText = "") => {
  els.weightsStatus.hidden = false;
  renderDecisionMeta(scores, reasonText);
  els.weightsStatus.textContent = statusText;
  renderWeightsChart(scores);
  updateWeightsBadge(fromAI ? "ai" : "manual");
  if (els.weightsHelper) {
    if (reasonText) {
      els.weightsHelper.textContent = `🍪 ${reasonText}`;
    } else if (statusText) {
      els.weightsHelper.textContent = `ℹ️ ${statusText}`;
    } else {
      els.weightsHelper.textContent = "Distribución de pesos";
    }
  }
};

export const setWeightsHelper = (text) => {
  if (els.weightsHelper) els.weightsHelper.textContent = text;
};

// Menu
export const toggleMenu = () => {
  const hidden = els.modeMenu.hasAttribute("hidden");
  if (hidden) {
    els.modeMenu.removeAttribute("hidden");
  } else {
    els.modeMenu.setAttribute("hidden", "");
  }
  els.menuButton.setAttribute("aria-expanded", hidden ? "true" : "false");
};

export const closeMenu = () => {
  els.modeMenu.setAttribute("hidden", "");
  els.menuButton.setAttribute("aria-expanded", "false");
};

export const isMenuOpen = () => !els.modeMenu.hasAttribute("hidden");
export const getMenuElement = () => els.modeMenu;
export const getMenuButton = () => els.menuButton;
