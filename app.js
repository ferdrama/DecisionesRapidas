const decisionEl = document.getElementById("decision");
const button = document.getElementById("decideButton");
const menuButton = document.getElementById("menuButton");
const modeMenu = document.getElementById("modeMenu");
const modeInputs = document.querySelectorAll('input[name="mode"]');

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

const setState = (option, suspense = false) => {
  decisionEl.textContent = option.label;
  decisionEl.classList.toggle("yes", option.bodyClass === "yes");
  decisionEl.classList.toggle("no", option.bodyClass === "no");
  decisionEl.classList.toggle("dice", option.bodyClass === "dice");
  decisionEl.classList.toggle("suspense", suspense);
  document.body.classList.remove("yes", "no", "dice");
  if (option.bodyClass) {
    document.body.classList.add(option.bodyClass);
  }
};

const chooseFinalOption = (options) => options[Math.floor(Math.random() * options.length)];

const startSpin = () => {
  if (spinning) return;
  spinning = true;
  button.disabled = true;
  button.textContent = "Pensando...";

  const options = modes[currentMode];
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
    button.disabled = false;
    button.textContent = "Decidir";
    spinning = false;
  }, suspenseTime);
};

const setMode = (mode) => {
  if (!modes[mode]) return;
  currentMode = mode;
  setState({ label: "Listo", bodyClass: "" });
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
      setMode(event.target.value);
      modeMenu.setAttribute("hidden", "");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
});

button.addEventListener("click", startSpin);
setState({ label: "Listo", bodyClass: "" });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => console.error("SW registration failed", error));
  });
}
