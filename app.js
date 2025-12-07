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

const modes = {
  binary: [
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

const recordDecision = (option) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: getModeLabel(),
    result: option.label,
    timestamp: new Date().toISOString(),
  };
  HistoryManager.addEntry(entry);
  renderHistory();
};

const startSpin = () => {
  if (spinning) return;
  spinning = true;
  button.disabled = true;
  button.textContent = "Pensando...";

  const options = modes[currentMode] || modes.binary;
  if (!modes[currentMode]) {
    currentMode = "binary";
    markRadios("binary");
    updateModeChip();
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
  updateModeChip();
  renderLists();
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
  updateModeChip();
  modeMenu.setAttribute("hidden", "");
  menuButton.setAttribute("aria-expanded", "false");
  renderLists();
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
    }
  });
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.error("SW registration failed", error));
  });
}
