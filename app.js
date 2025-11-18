// ================= CONFIG & CONSTANTS =================

const steps = {
  emotion: {
    label: "Auslöser der Emotion",
    subtitle: "Unangenehme Welle ernst nehmen und benennen."
  },
  situation: {
    label: "Entstehungskontext des Auslösers",
    subtitle: "Situation so objektiv wie möglich betrachten."
  },
  solution: {
    label: "Hindernisse & mögliche Lösungen",
    subtitle: "Wie gehe ich konstruktiv mit dieser Situation um?"
  }
};

const STORAGE_KEY_PROBLEMS = "sf_problems_v1";
const STORAGE_KEY_CURRENT = "sf_current_problem_id";
const STORAGE_KEY_THEME = "sf_theme";

let problems = [];
let currentProblem = null;
let activeStep = "emotion";

// ================= UTIL / STORAGE =================

function loadProblems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROBLEMS);
    problems = stored ? JSON.parse(stored) : [];
  } catch (e) {
    problems = [];
  }
}

function saveProblems() {
  localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(problems));
}

function generateId() {
  return "p_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function getCurrentProblem() {
  const id = localStorage.getItem(STORAGE_KEY_CURRENT);
  if (!id) return null;
  return problems.find(p => p.id === id) || null;
}

function setCurrentProblem(problem) {
  currentProblem = problem;
  localStorage.setItem(STORAGE_KEY_CURRENT, problem.id);
  saveProblems();
}

function createNewProblem() {
  const p = {
    id: generateId(),
    emotion: "",
    situation: "",
    solution: "",
    emotionDone: false,
    situationDone: false,
    solutionDone: false,
    completed: false,
    createdAt: new Date().toISOString()
  };
  problems.push(p);
  setCurrentProblem(p);
}

// ================= DOM HOOKS =================

const stepCard = document.getElementById("step-card");
const stepLabelEl = document.getElementById("step-label");
const stepSubtitleEl = document.getElementById("step-subtitle");
const stepTextEl = document.getElementById("step-text");
const confirmBtn = document.getElementById("confirm-btn");

const tabEmotion = document.getElementById("tab-emotion");
const tabSituation = document.getElementById("tab-situation");
const tabSolution = document.getElementById("tab-solution");

const summaryEl = document.getElementById("summary");
const summaryEmotion = document.getElementById("summary-emotion");
const summarySituation = document.getElementById("summary-situation");
const summarySolution = document.getElementById("summary-solution");
const statusEl = document.getElementById("status");
const newProblemBtn = document.getElementById("new-problem-btn");
const historyListEl = document.getElementById("history-list");

const themeChips = document.querySelectorAll(".chip");

// Detail modal
const detailOverlay = document.getElementById("detail-overlay");
const detailEmotion = document.getElementById("detail-emotion");
const detailSituation = document.getElementById("detail-situation");
const detailSolution = document.getElementById("detail-solution");
const detailClose = document.getElementById("detail-close");

// ================= PX-GLOW =================

function trackGlow(el) {
  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

document.querySelectorAll(".px-card").forEach(trackGlow);

// ================= RENDERING =================

function renderActiveStep() {
  const cfg = steps[activeStep];
  stepLabelEl.textContent = cfg.label;
  stepSubtitleEl.textContent = cfg.subtitle;

  // Tabs state
  [tabEmotion, tabSituation, tabSolution].forEach(btn => {
    btn.classList.remove("active");
  });
  const map = { emotion: tabEmotion, situation: tabSituation, solution: tabSolution };
  map[activeStep].classList.add("active");

  if (!currentProblem) return;

  stepCard.classList.remove("completed");
  stepTextEl.disabled = false;
  confirmBtn.disabled = false;

  stepTextEl.value = currentProblem[activeStep] || "";

  const doneKey = activeStep + "Done";
  if (currentProblem[doneKey]) {
    stepCard.classList.add("completed");
    stepTextEl.disabled = true;
    confirmBtn.disabled = true;
  }

  if (currentProblem.completed) {
    stepCard.classList.add("completed");
    stepTextEl.disabled = true;
    confirmBtn.disabled = true;
  }

  renderTabsState();
  renderSummary();
  renderStatus();
  renderHistory();
}

function renderTabsState() {
  if (!currentProblem) return;

  function setState(tab, done) {
    tab.classList.remove("completed");
    if (done) tab.classList.add("completed");
  }

  setState(tabEmotion, currentProblem.emotionDone);
  setState(tabSituation, currentProblem.situationDone);
  setState(tabSolution, currentProblem.solutionDone);
}

function renderSummary() {
  if (!currentProblem || !currentProblem.completed) {
    summaryEl.classList.remove("visible");
    return;
  }
  summaryEmotion.textContent = currentProblem.emotion;
  summarySituation.textContent = currentProblem.situation;
  summarySolution.textContent = currentProblem.solution;
  summaryEl.classList.add("visible");
}

function renderStatus() {
  if (!currentProblem) {
    statusEl.textContent = "";
    statusEl.classList.remove("completed");
    return;
  }
  if (currentProblem.completed) {
    statusEl.textContent = "Dieses Problem ist abgeschlossen und wird nicht mehr verändert.";
    statusEl.classList.add("completed");
  } else {
    statusEl.textContent = "Schritte nacheinander ausfüllen und jeweils bestätigen.";
    statusEl.classList.remove("completed");
  }
}

function renderHistory() {
  const completed = problems
    .filter(p => p.completed)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  historyListEl.innerHTML = "";

  if (completed.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "Noch keine abgeschlossenen Probleme.";
    historyListEl.appendChild(empty);
    return;
  }

  completed.forEach(p => {
    const item = document.createElement("div");
    item.className = "history-item px-card px-hoverlift";

    const header = document.createElement("div");
    header.className = "history-item-header";

    const emo = document.createElement("div");
    emo.className = "history-emotion";
    emo.textContent = (p.emotion || "Ohne Titel").split("\n")[0];

    const date = document.createElement("div");
    date.className = "history-date";
    const d = new Date(p.createdAt);
    try {
      date.textContent = d.toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      });
    } catch {
      date.textContent = d.toISOString().slice(0, 10);
    }

    header.appendChild(emo);
    header.appendChild(date);

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = "Abgeschlossen · 3/3 Schritte";

    item.appendChild(header);
    item.appendChild(meta);

    item.addEventListener("click", () => openDetailView(p));

    historyListEl.appendChild(item);
    trackGlow(item);
  });
}

// ================= INTERACTION LOGIC =================

function handleConfirm() {
  if (!currentProblem || currentProblem.completed) return;
  const text = stepTextEl.value.trim();
  if (!text) {
    alert("Schreib zuerst etwas in das Feld, bevor du bestätigst.");
    return;
  }

  currentProblem[activeStep] = text;
  currentProblem[activeStep + "Done"] = true;

  if (
    currentProblem.emotionDone &&
    currentProblem.situationDone &&
    currentProblem.solutionDone
  ) {
    currentProblem.completed = true;
  }

  saveProblems();
  renderActiveStep();
}

function handleNewProblem() {
  if (currentProblem && !currentProblem.completed) {
    const ok = confirm(
      "Das aktuelle Problem ist noch nicht abgeschlossen. Trotzdem neues Problem starten?"
    );
    if (!ok) return;
  }
  createNewProblem();
  activeStep = "emotion";
  renderActiveStep();
}

// Detail view

function openDetailView(problem) {
  detailEmotion.textContent = problem.emotion;
  detailSituation.textContent = problem.situation;
  detailSolution.textContent = problem.solution;
  detailOverlay.classList.remove("hidden");
}

function closeDetailView() {
  detailOverlay.classList.add("hidden");
}

// Theme switch

function applyTheme(theme) {
  document.documentElement.setAttribute("data-clear4-theme", theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  themeChips.forEach(chip => {
    chip.classList.toggle("active", chip.dataset.theme === theme);
  });
}

// ================= EVENT LISTENERS =================

tabEmotion.addEventListener("click", () => {
  activeStep = "emotion";
  renderActiveStep();
});

tabSituation.addEventListener("click", () => {
  activeStep = "situation";
  renderActiveStep();
});

tabSolution.addEventListener("click", () => {
  activeStep = "solution";
  renderActiveStep();
});

confirmBtn.addEventListener("click", handleConfirm);
newProblemBtn.addEventListener("click", handleNewProblem);

detailClose.addEventListener("click", closeDetailView);
detailOverlay.addEventListener("click", e => {
  if (e.target === detailOverlay) closeDetailView();
});

themeChips.forEach(chip => {
  chip.addEventListener("click", () => {
    applyTheme(chip.dataset.theme);
  });
});

// ================= INIT =================

(function init() {
  const storedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "JOY";
  applyTheme(storedTheme);

  loadProblems();
  currentProblem = getCurrentProblem();
  if (!currentProblem || currentProblem.completed) {
    createNewProblem();
  }

  renderActiveStep();

  // Service Worker Registrierung
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .catch(err => console.error("SW registration failed", err));
    });
  }
})();
