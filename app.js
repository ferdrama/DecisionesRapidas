const decisionEl = document.getElementById("decision");
const button = document.getElementById("decideButton");
const options = [
  { label: "sí", bodyClass: "yes" },
  { label: "no", bodyClass: "no" },
];

let spinning = false;
let intervalId;

const setState = (option, suspense = false) => {
  decisionEl.textContent = option.label;
  decisionEl.classList.toggle("yes", option.bodyClass === "yes");
  decisionEl.classList.toggle("no", option.bodyClass === "no");
  decisionEl.classList.toggle("suspense", suspense);
  document.body.classList.remove("yes", "no");
  if (option.bodyClass) {
    document.body.classList.add(option.bodyClass);
  }
};

const chooseFinalOption = () => options[Math.floor(Math.random() * options.length)];

const startSpin = () => {
  if (spinning) return;
  spinning = true;
  button.disabled = true;
  button.textContent = "Pensando...";

  let index = 0;
  intervalId = setInterval(() => {
    const option = options[index % options.length];
    setState(option, true);
    index += 1;
  }, 140);

  const suspenseTime = 1700 + Math.random() * 1200;
  setTimeout(() => {
    clearInterval(intervalId);
    const final = chooseFinalOption();
    setState(final, false);
    button.disabled = false;
    button.textContent = "Decidir";
    spinning = false;
  }, suspenseTime);
};

button.addEventListener("click", startSpin);
setState({ label: "Listo", bodyClass: "" });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("SW registration failed", error));
  });
}
