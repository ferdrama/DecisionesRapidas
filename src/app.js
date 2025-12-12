import * as Game from "./game.js";
import * as UI from "./ui.js";

// State for UI interactions
let editingListId = null;

let checkingForUpdates = false;

let toastHideTimeoutId = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const showToast = (message, { durationMs = 2400 } = {}) => {
  const toastEl = document.getElementById("updateToast");
  if (!toastEl) {
    alert(message);
    return;
  }

  if (!toastEl.dataset.defaultText) {
    toastEl.dataset.defaultText = toastEl.textContent || "";
  }

  if (toastHideTimeoutId) {
    clearTimeout(toastHideTimeoutId);
    toastHideTimeoutId = null;
  }

  toastEl.textContent = message;
  toastEl.hidden = false;
  requestAnimationFrame(() => toastEl.classList.add("show"));

  toastHideTimeoutId = setTimeout(() => {
    toastEl.classList.remove("show");
    // Wait for CSS transition to finish.
    setTimeout(() => {
      toastEl.hidden = true;
      toastEl.textContent = toastEl.dataset.defaultText || "";
    }, 220);
  }, durationMs);
};

const withTimeout = async (promise, timeoutMs, timeoutMessage = "timeout") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const waitForState = (worker, expectedState, timeoutMs = 4000) => {
  if (!worker) return Promise.resolve(false);
  if (worker.state === expectedState) return Promise.resolve(true);

  return new Promise((resolve) => {
    let done = false;
    const onStateChange = () => {
      if (done) return;
      if (worker.state === expectedState) {
        done = true;
        clearTimeout(timeoutId);
        worker.removeEventListener("statechange", onStateChange);
        resolve(true);
      }
    };

    const timeoutId = setTimeout(() => {
      if (done) return;
      done = true;
      worker.removeEventListener("statechange", onStateChange);
      resolve(false);
    }, timeoutMs);

    worker.addEventListener("statechange", onStateChange);
  });
};

const detectUpdateAvailability = async (registration) => {
  if (!registration) return { available: false };

  if (registration.waiting) {
    return { available: true, waiting: registration.waiting };
  }

  // Attach updatefound listener before triggering update().
  let updateFound = false;
  const onUpdateFound = () => {
    updateFound = true;
  };
  registration.addEventListener("updatefound", onUpdateFound, { once: true });

  try {
    await withTimeout(registration.update(), 5000, "update_timeout");
  } catch (err) {
    return { available: false, error: err };
  }

  // Give the browser a brief moment to populate installing/waiting.
  await sleep(50);

  if (registration.waiting) {
    return { available: true, waiting: registration.waiting };
  }

  // If an update was found, wait for the installing worker to finish.
  if (updateFound && registration.installing) {
    await waitForState(registration.installing, "installed", 5000);
    if (registration.waiting) {
      return { available: true, waiting: registration.waiting };
    }
  }

  return { available: false };
};

const checkForUpdates = async () => {
  if (checkingForUpdates) return;
  checkingForUpdates = true;

  const btn = document.getElementById("checkUpdatesBtn");
  const prevText = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Comprobando...";
  }

  try {
    if (!("serviceWorker" in navigator)) {
      showToast("Las actualizaciones no están disponibles en este navegador.");
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      showToast("No hay Service Worker registrado para esta app.");
      return;
    }

    const result = await detectUpdateAvailability(registration);

    if (result.error) {
      if (result.error?.message === "update_timeout") {
        showToast("La comprobación está tardando demasiado. Inténtalo de nuevo en unos instantes.");
      } else if (navigator.onLine === false) {
        showToast("No se pudo comprobar actualizaciones sin conexión.");
      } else {
        showToast("No se pudo comprobar actualizaciones en este momento.");
      }
      return;
    }

    if (!result.available || !result.waiting) {
      showToast("Estás al día. No hay actualizaciones disponibles.");
      return;
    }

    const shouldUpdate = confirm("Hay una nueva versión disponible. ¿Actualizar ahora?");
    if (!shouldUpdate) {
      return;
    }

    // Ask the waiting service worker to activate.
    result.waiting.postMessage({ type: "SKIP_WAITING" });

    // The existing controllerchange/SW_ACTIVATED flow in index.html will reload once.
    showToast("Actualizando... La app se recargará en unos instantes.", { durationMs: 5000 });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText || "Comprobar actualizaciones";
    }
    checkingForUpdates = false;
  }
};

// Event Listeners
const setupEventListeners = () => {
  // Menu
  const menuButton = UI.getMenuButton();
  const modeMenu = UI.getMenuElement();

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    UI.toggleMenu();
  });

  document.addEventListener("click", (event) => {
    if (UI.isMenuOpen() && !modeMenu.contains(event.target) && event.target !== menuButton) {
      UI.closeMenu();
    }
  });

  // Mode Selection
  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        editingListId = null;
        Game.setMode(event.target.value);
        UI.closeMenu();
      }
    });
  });

  // List AI Toggle
  const listAiToggle = document.getElementById("listAiToggle");
  listAiToggle.addEventListener("change", () => {
    if (!Game.isCustomListMode()) {
      UI.resetWeightsState();
      return;
    }
    if (listAiToggle.checked) {
      UI.setWeightsStatus("IA activada: usaremos el nombre y las opciones de la lista.", false);
      UI.renderDecisionMeta(null, "");
      UI.clearWeightsChart("IA activada: espera resultados");
      UI.updateWeightsBadge("ai");
      UI.setWeightsHelper('Pulsa "Decidir" para ver los pesos de la IA');
    } else {
      UI.resetWeightsState();
    }
  });

  // List Management
  document.getElementById("createListBtn").addEventListener("click", () => {
    editingListId = null;
    UI.openListModal();
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    UI.closeListModal();
    editingListId = null;
  });
  document.getElementById("cancelBtn").addEventListener("click", () => {
    UI.closeListModal();
    editingListId = null;
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (editingListId) {
      Game.deleteList(editingListId);
      UI.closeListModal();
      editingListId = null;
    }
  });

  document.getElementById("listForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const { name, items } = UI.getListFormData();
    if (!name || items.length === 0) {
      alert("Por favor, completa el nombre y al menos una opción");
      return;
    }
    Game.saveList(editingListId, name, items);
    UI.closeListModal();
    editingListId = null;
  });

  document.getElementById("listModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("listModal")) {
      UI.closeListModal();
      editingListId = null;
    }
  });

  // Lists List Delegation
  document.getElementById("listsList").addEventListener("click", (e) => {
    const item = e.target.closest(".list-item");
    if (!item) return;

    // Check for buttons
    if (e.target.closest(".list-btn.edit")) {
      e.stopPropagation();
      editingListId = e.target.closest(".list-btn.edit").dataset.id;
      UI.openListModal(editingListId);
      return;
    }
    if (e.target.closest(".list-btn.delete")) {
      e.stopPropagation();
      Game.deleteList(e.target.closest(".list-btn.delete").dataset.id);
      return;
    }

    // Select list
    Game.setMode(item.dataset.id);
    UI.closeMenu();
  });

  // History
  document.getElementById("openHistoryBtn").addEventListener("click", () => {
    UI.openHistoryModal();
    UI.closeMenu();
  });

  // Manual update check
  document.getElementById("checkUpdatesBtn").addEventListener("click", async () => {
    UI.closeMenu();
    await checkForUpdates();
  });

  document.getElementById("closeHistoryModal").addEventListener("click", UI.closeHistoryModal);

  document.getElementById("historyModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("historyModal")) {
      UI.closeHistoryModal();
    }
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", Game.clearHistory);

  document.getElementById("historyList").addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".history-delete");
    if (!deleteBtn) return;
    Game.deleteHistoryEntry(deleteBtn.dataset.id);
  });

  // Main Button
  document.getElementById("decideButton").addEventListener("click", Game.startSpin);
};

// Initialization
const init = () => {
  UI.setState({ label: "Listo", bodyClass: "" });
  UI.updateModeChip(Game.getModeLabel());
  UI.renderLists(Game.getCurrentMode());
  UI.renderHistory();
  UI.updateModeUI(Game.getCurrentMode(), Game.isCustomListMode());
  setupEventListeners();
};

init();
