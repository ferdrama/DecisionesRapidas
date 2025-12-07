const decisionEl = document.getElementById("decision");
const button = document.getElementById("decideButton");
const menuButton = document.getElementById("menuButton");
const modeMenu = document.getElementById("modeMenu");
const modeInputs = document.querySelectorAll('input[name="mode"]');
const modeChip = document.getElementById("modeChip");

// Modal elements
const listModal = document.getElementById("listModal");
const listForm = document.getElementById("listForm");
const listNameInput = document.getElementById("listName");
const listItemsInput = document.getElementById("listItems");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
const createListBtn = document.getElementById("createListBtn");
const listsList = document.getElementById("listsList");
const modalTitle = document.getElementById("modalTitle");
const historyModal = document.getElementById("historyModal");
const historyListEl = document.getElementById("historyList");
const openHistoryBtn = document.getElementById("openHistoryBtn");
const closeHistoryModal = document.getElementById("closeHistoryModal");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const questionBlock = document.getElementById("questionBlock");
const questionInput = document.getElementById("questionInput");
const weightsStatusEl = document.getElementById("weightsStatus");
const decisionMetaEl = document.getElementById("decisionMeta");
const listAiRow = document.getElementById("listAiRow");
const listAiToggle = document.getElementById("listAiToggle");

const API_BASE = (window.DR_API_BASE || "https://decisiones-rapidas-worker.nomedesenlacabeza-905.workers.dev").replace(/\/+$/, "");

let lastScores = null;
let lastScoresFromAI = false;
let lastReason = "";
const isCustomListMode = () => !["binary", "binaryAI", "dice"].includes(currentMode);

const modes = {
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

let currentMode = "binary";
let spinning = false;
let intervalId;
let editingListId = null;

const markRadios = (mode) => {
  modeInputs.forEach((input) => {
    input.checked = input.value === mode;
  });
};

// LocalStorage Management
const StorageManager = {
  getLists() {
    const data = localStorage.getItem("customLists");
    return data ? JSON.parse(data) : [];
  },
  saveList(list) {
    const lists = this.getLists();
    const index = lists.findIndex((l) => l.id === list.id);
    if (index >= 0) {
      lists[index] = list;
    } else {
      list.id = Date.now().toString();
      lists.push(list);
    }
    localStorage.setItem("customLists", JSON.stringify(lists));
    return list;
  },
  deleteList(id) {
    const lists = this.getLists().filter((l) => l.id !== id);
    localStorage.setItem("customLists", JSON.stringify(lists));
  },
};

const HistoryManager = {
  getHistory() {
    const data = localStorage.getItem("decisionHistory");
    return data ? JSON.parse(data) : [];
  },
  addEntry(entry) {
    const history = this.getHistory();
    history.unshift(entry);
    localStorage.setItem("decisionHistory", JSON.stringify(history));
  },
  deleteEntry(id) {
    const history = this.getHistory().filter((item) => item.id !== id);
    localStorage.setItem("decisionHistory", JSON.stringify(history));
  },
  clear() {
    localStorage.removeItem("decisionHistory");
  },
};

const buildListOptions = (list) => list.items.map((item) => ({ label: item, bodyClass: "custom" }));

const getListById = (id) => StorageManager.getLists().find((l) => l.id === id);

const getModeLabel = () => {
  if (currentMode === "dice") return "Dado de seis caras";
  if (currentMode === "binaryAI") return "Sí / No con IA";
  if (currentMode === "binary") return "Sí / No";
  const list = getListById(currentMode);
  return list ? list.name : "Lista personalizada";
};

const updateModeChip = () => {
  modeChip.textContent = `Modo: ${getModeLabel()}`;
};

const setState = (option, suspense = false) => {
  decisionEl.textContent = option.label;
  decisionEl.classList.toggle("yes", option.bodyClass === "yes");
  decisionEl.classList.toggle("no", option.bodyClass === "no");
  decisionEl.classList.toggle("dice", option.bodyClass === "dice");
  decisionEl.classList.toggle("suspense", suspense);
  document.body.classList.remove("yes", "no", "dice", "custom");
  if (option.bodyClass) {
    document.body.classList.add(option.bodyClass);
  }
};

const updateModeUI = () => {
  const isAI = currentMode === "binaryAI";
  const isList = isCustomListMode();

  questionBlock.toggleAttribute("hidden", !isAI);
  listAiRow.toggleAttribute("hidden", !isList);
  if (!isList) {
    listAiToggle.checked = false;
  }

  button.disabled = false;
  button.textContent = "Decidir";

  const shouldResetWeights = !isAI && !(isList && listAiToggle.checked);
  if (shouldResetWeights) {
    questionInput.value = "";
    resetWeightsState();
  }

  if (isAI || (isList && listAiToggle.checked)) {
    decisionEl.textContent = "Listo";
    if (isList && listAiToggle.checked) {
      weightsStatusEl.hidden = false;
      weightsStatusEl.textContent = "IA activada: usaremos el nombre y las opciones de la lista.";
      renderDecisionMeta(null, "");
    }
  }
};

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const chooseFinalOption = (options) => options[Math.floor(Math.random() * options.length)];

const recordDecision = (option, question = null) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: getModeLabel(),
    result: option.label,
    timestamp: new Date().toISOString(),
    question: question || undefined,
  };
  HistoryManager.addEntry(entry);
  renderHistory();
};

const fetchWeights = async (question, choices) => {
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

const renderDecisionMeta = (scores, reasonText = "") => {
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    decisionMetaEl.textContent = "—";
    decisionMetaEl.hidden = true;
    return;
  }

  const hasYesNo = scores.some((s) => s.id === "YES") && scores.some((s) => s.id === "NO");
  const reasonPart = reasonText ? ` · 🧧 ${reasonText}` : "";

  if (hasYesNo && scores.length === 2) {
    const yes = scores.find((s) => s.id === "YES")?.score ?? "-";
    const no = scores.find((s) => s.id === "NO")?.score ?? "-";
    decisionMetaEl.innerHTML = `<strong>⚖️ Sí ${yes} · No ${no}</strong>${reasonPart}`;
    decisionMetaEl.hidden = false;
    return;
  }

  const sorted = [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const summary = sorted.map((entry) => `${entry.label || entry.id} ${entry.score ?? "-"}`).join(" · ");

  decisionMetaEl.innerHTML = `<strong>⚖️ ${summary}</strong>${reasonPart}`;
  decisionMetaEl.hidden = false;
};

const resetWeightsState = () => {
  lastScores = null;
  lastScoresFromAI = false;
  lastReason = "";
  weightsStatusEl.textContent = "";
  weightsStatusEl.hidden = true;
  renderDecisionMeta(null, "");
};

const setWeightsState = (scores, statusText, fromAI, reasonText = "") => {
  lastScores = scores;
  lastScoresFromAI = fromAI;
  lastReason = reasonText;
  weightsStatusEl.hidden = false;
  renderDecisionMeta(scores, reasonText);
  weightsStatusEl.textContent = statusText;
};

const describeWeightsError = (code) => {
  if (code === "MODEL_BAD_JSON") return "La IA no devolvió JSON válido (MODEL_BAD_JSON).";
  if (code === "MODEL_TIMEOUT") return "La petición a la IA tardó demasiado (MODEL_TIMEOUT).";
  return `No se pudieron obtener pesos (${code}).`;
};

const pickWithWeights = (scores) => {
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

const decideWithAI = async () => {
  const question = questionInput.value.trim();

  if (!question) {
    weightsStatusEl.hidden = false;
    weightsStatusEl.textContent = "Escribe una pregunta antes de continuar.";
    questionInput.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Consultando IA...";
  decisionEl.textContent = "Pensando...";
  decisionEl.classList.add("suspense");
  weightsStatusEl.hidden = false;
  weightsStatusEl.textContent = "Consultando IA...";
  renderDecisionMeta(null, "");

  let spinIndex = 0;
  const spinOptions = modes.binary;
  const spinInterval = setInterval(() => {
    const option = spinOptions[spinIndex % spinOptions.length];
    setState(option, true);
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

    setWeightsState(scoresWithLabels, "Pesos devueltos por IA.", true, reason);

    const choiceId = pickWithWeights(scoresWithLabels);
    if (!choiceId) {
      weightsStatusEl.textContent = "No hay pesos válidos.";
      return;
    }

    const finalOption = choiceId === "YES" ? { label: "sí", bodyClass: "yes" } : { label: "no", bodyClass: "no" };
    setState(finalOption, false);
    recordDecision(finalOption, question);
    weightsStatusEl.hidden = true;
  } catch (error) {
    resetWeightsState();
    const code = error?.message || "MODEL_ERROR";
    weightsStatusEl.hidden = false;
    weightsStatusEl.textContent = describeWeightsError(code);
    decisionEl.textContent = "Error";
  } finally {
    clearInterval(spinInterval);
    button.disabled = false;
    button.textContent = "Decidir";
    decisionEl.classList.remove("suspense");
  }
};

const decideListWithAI = async () => {
  const list = getListById(currentMode);
  if (!list || !list.items?.length) {
    weightsStatusEl.hidden = false;
    weightsStatusEl.textContent = "Esta lista no tiene opciones.";
    return;
  }

  button.disabled = true;
  button.textContent = "Consultando IA...";
  decisionEl.textContent = "Pensando...";
  decisionEl.classList.add("suspense");
  weightsStatusEl.hidden = false;
  weightsStatusEl.textContent = `Consultando IA para "${list.name}"...`;
  renderDecisionMeta(null, "");

  const spinOptions = modes[currentMode] || buildListOptions(list);
  let spinIndex = 0;
  const spinInterval = setInterval(() => {
    const option = spinOptions[spinIndex % spinOptions.length];
    setState(option, true);
    spinIndex += 1;
  }, 140);

  try {
    const choices = list.items.map((item, idx) => ({ id: `ITEM_${idx}`, label: item }));
    const { scores, reason } = await fetchWeights(list.name, choices);

    const scoresWithLabels = scores.map((entry) => ({
      ...entry,
      label: entry.label || choices.find((c) => c.id === entry.id)?.label || entry.id,
    }));

    setWeightsState(scoresWithLabels, `Pesos devueltos por IA para "${list.name}".`, true, reason);

    const choiceId = pickWithWeights(scoresWithLabels);
    if (!choiceId) {
      weightsStatusEl.textContent = "No hay pesos válidos.";
      return;
    }

    const winning = choices.find((c) => c.id === choiceId) || { label: choiceId };
    const finalOption = { label: winning.label, bodyClass: "custom" };
    setState(finalOption, false);
    recordDecision(finalOption, list.name);
    weightsStatusEl.hidden = true;
  } catch (error) {
    resetWeightsState();
    const code = error?.message || "MODEL_ERROR";
    weightsStatusEl.hidden = false;
    weightsStatusEl.textContent = describeWeightsError(code);
    decisionEl.textContent = "Error";
  } finally {
    clearInterval(spinInterval);
    button.disabled = false;
    button.textContent = "Decidir";
    decisionEl.classList.remove("suspense");
  }
};

const startSpin = () => {
  if (currentMode === "binaryAI") {
    decideWithAI();
    return;
  }
  if (isCustomListMode() && listAiToggle.checked) {
    decideListWithAI();
    return;
  }
  if (spinning) return;
  spinning = true;
  button.disabled = true;
  button.textContent = "Pensando...";

  const options = modes[currentMode] || modes.binary;
  if (!modes[currentMode]) {
    currentMode = "binary";
    markRadios("binary");
    updateModeChip();
    updateModeUI();
  }
  let index = 0;
  intervalId = setInterval(() => {
    const option = options[index % options.length];
    setState(option, true);
    index += 1;
  }, 140);

  const suspenseTime = 1700 + Math.random() * 1200;
  setTimeout(() => {
    clearInterval(intervalId);
    const final = chooseFinalOption(options);
    setState(final, false);
    recordDecision(final);
    button.disabled = false;
    button.textContent = "Decidir";
    spinning = false;
  }, suspenseTime);
};

const setMode = (mode) => {
  if (!modes[mode]) return;
  currentMode = mode;
  markRadios(mode);
  setState({ label: "Listo", bodyClass: "" });
  listAiToggle.checked = false;
  updateModeChip();
  renderLists();
  updateModeUI();
};

const toggleMenu = () => {
  const hidden = modeMenu.hasAttribute("hidden");
  if (hidden) {
    modeMenu.removeAttribute("hidden");
  } else {
    modeMenu.setAttribute("hidden", "");
  }
  menuButton.setAttribute("aria-expanded", hidden ? "true" : "false");
};

// Modal functions
const openModal = (listId = null) => {
  editingListId = listId;
  if (listId) {
    const lists = StorageManager.getLists();
    const list = lists.find((l) => l.id === listId);
    if (list) {
      modalTitle.textContent = "Editar Lista";
      listNameInput.value = list.name;
      listItemsInput.value = list.items.join("\n");
      deleteBtn.removeAttribute("hidden");
    }
  } else {
    modalTitle.textContent = "Nueva Lista";
    listNameInput.value = "";
    listItemsInput.value = "";
    deleteBtn.setAttribute("hidden", "");
  }
  listModal.removeAttribute("hidden");
};

const closeListModal = () => {
  listModal.setAttribute("hidden", "");
  editingListId = null;
};

const saveList = (e) => {
  e.preventDefault();
  const name = listNameInput.value.trim();
  const items = listItemsInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item);

  if (!name || items.length === 0) {
    alert("Por favor, completa el nombre y al menos una opción");
    return;
  }

  const list = {
    id: editingListId,
    name,
    items,
  };

  const saved = StorageManager.saveList(list);
  modes[saved.id] = buildListOptions(saved);

  if (currentMode === saved.id) {
    setState({ label: "Listo", bodyClass: "" });
    updateModeChip();
  }
  closeListModal();
  renderLists();
};

const deleteList = () => {
  if (!editingListId) return;
  deleteListById(editingListId);
};

const deleteListById = (id) => {
  const list = getListById(id);
  if (!list) return;
  if (!confirm(`¿Eliminar la lista "${list.name}"?`)) return;

  StorageManager.deleteList(id);
  delete modes[id];

  if (currentMode === id) {
    setMode("binary");
  } else {
    renderLists();
  }
  closeListModal();
};

const selectCustomList = (list) => {
  modes[list.id] = buildListOptions(list);
  currentMode = list.id;
  markRadios(null);
  setState({ label: "Listo", bodyClass: "" });
  listAiToggle.checked = false;
  resetWeightsState();
  updateModeChip();
  modeMenu.setAttribute("hidden", "");
  menuButton.setAttribute("aria-expanded", "false");
  renderLists();
  updateModeUI();
};

const renderLists = () => {
  const lists = StorageManager.getLists();
  
  if (lists.length === 0) {
    listsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0;">Sin listas personalizadas</p>';
    return;
  }

  listsList.innerHTML = lists
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

  document.querySelectorAll(".list-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const list = getListById(id);
      if (list) {
        selectCustomList(list);
      }
    });
  });

  document.querySelectorAll(".list-btn.edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(btn.dataset.id);
    });
  });

  document.querySelectorAll(".list-btn.delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteListById(btn.dataset.id);
    });
  });
};

const renderHistory = () => {
  const history = HistoryManager.getHistory();

  if (history.length === 0) {
    historyListEl.innerHTML = '<p class="empty-state">Aún no hay decisiones registradas</p>';
    return;
  }

  historyListEl.innerHTML = history
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

const openHistory = () => {
  renderHistory();
  historyModal.removeAttribute("hidden");
  modeMenu.setAttribute("hidden", "");
  menuButton.setAttribute("aria-expanded", "false");
};

const closeHistory = () => {
  historyModal.setAttribute("hidden", "");
};

// Event listeners
menuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu();
});

document.addEventListener("click", (event) => {
  if (!modeMenu.hasAttribute("hidden") && !modeMenu.contains(event.target) && event.target !== menuButton) {
    modeMenu.setAttribute("hidden", "");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

modeInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    if (event.target.checked) {
      editingListId = null;
      setMode(event.target.value);
      modeMenu.setAttribute("hidden", "");
      menuButton.setAttribute("aria-expanded", "false");
      if (currentMode === "binaryAI") {
        decisionEl.textContent = "Listo";
        weightsStatusEl.textContent = "Escribe una pregunta y pulsa “Decidir” en este modo.";
        renderDecisionMeta(null, "");
      }
    }
  });
});

listAiToggle.addEventListener("change", () => {
  if (!isCustomListMode()) {
    resetWeightsState();
    return;
  }
  if (listAiToggle.checked) {
    weightsStatusEl.hidden = false;
    weightsStatusEl.textContent = "IA activada: usaremos el nombre y las opciones de la lista.";
    renderDecisionMeta(null, "");
  } else {
    resetWeightsState();
  }
});

createListBtn.addEventListener("click", () => {
  openModal();
});

closeModal.addEventListener("click", closeListModal);
cancelBtn.addEventListener("click", closeListModal);
deleteBtn.addEventListener("click", deleteList);

listForm.addEventListener("submit", saveList);

listModal.addEventListener("click", (e) => {
  if (e.target === listModal) {
    closeListModal();
  }
});

openHistoryBtn.addEventListener("click", () => {
  openHistory();
});

closeHistoryModal.addEventListener("click", closeHistory);

historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) {
    closeHistory();
  }
});

clearHistoryBtn.addEventListener("click", () => {
  if (!HistoryManager.getHistory().length) return;
  if (!confirm("¿Borrar todo el historial?")) return;
  HistoryManager.clear();
  renderHistory();
});

historyListEl.addEventListener("click", (e) => {
  const deleteBtnEl = e.target.closest(".history-delete");
  if (!deleteBtnEl) return;
  HistoryManager.deleteEntry(deleteBtnEl.dataset.id);
  renderHistory();
});

button.addEventListener("click", startSpin);
setState({ label: "Listo", bodyClass: "" });
updateModeChip();
renderLists();
renderHistory();
updateModeUI();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.error("SW registration failed", error));
  });
}
