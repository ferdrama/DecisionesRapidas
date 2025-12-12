import * as Game from "./game.js";
import * as UI from "./ui.js";

// State for UI interactions
let editingListId = null;

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
