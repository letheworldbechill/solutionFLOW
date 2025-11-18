const stepsOrder = ["emotion", "situation", "solution"];
const STORAGE_KEY_PROBLEMS = "sf_problems_v1";
const STORAGE_KEY_CURRENT = "sf_current_problem_id";
const STORAGE_KEY_THEME = "sf_theme";

let problems = [];
let currentProblem = null;
let activeStep = "emotion";
let isProgrammaticScroll = false;

// DOM
const slider = document.getElementById("slider");
const swipeTabs = document.querySelectorAll(".swipe-tab");
const progressInner = document.getElementById("progress-inner");

const textareaEmotion = document.getElementById("text-emotion");
const textareaSituation = document.getElementById("text-situation");
const textareaSolution = document.getElementById("text-solution");
const cardEmotion = document.getElementById("card-emotion");
const cardSituation = document.getElementById("card-situation");
const cardSolution = document.getElementById("card-solution");

const statusEl = document.getElementById("status");
const newProblemBtn = document.getElementById("new-problem-btn");
const summaryEl = document.getElementById("summary");
const summaryEmotion = document.getElementById("summary-emotion");
const summarySituation = document.getElementById("summary-situation");
const summarySolution = document.getElementById("summary-solution");
const historyListEl = document.getElementById("history-list");

const detailOverlay = document.getElementById("detail-overlay");
const detailEmotion = document.getElementById("detail-emotion");
const detailSituation = document.getElementById("detail-situation");
const detailSolution = document.getElementById("detail-solution");
const detailClose = document.getElementById("detail-close");

const themeChips = document.querySelectorAll(".chip");



// ---------- Storage ----------
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

// ---------- Slider Helfer ----------
const stepsOrder = ["emotion", "situation", "solution"];

function indexForStep(step) {
  return stepsOrder.indexOf(step);
}

function getAllowedIndex() {
  if (!currentProblem) return 0;
  let idx = 0;
  if (currentProblem.emotionDone) idx = 1;
  if (currentProblem.situationDone) idx = 2;
  return idx;
}

function goToSlide(index) {
  const width = slider.clientWidth;
  isProgrammaticScroll = true;
  slider.scrollTo({ left: index * width, behavior: "smooth" });
  setTimeout(() => { isProgrammaticScroll = false; }, 350);
  activeStep = stepsOrder[index];
  renderActiveStep();
}

slider.addEventListener("scroll", () => {
  if (isProgrammaticScroll) return;
  const width = slider.clientWidth || 1;
  const rawIndex = slider.scrollLeft / width;
  const index = Math.round(rawIndex);
  const allowed = getAllowedIndex();
  if (index > allowed) {
    goToSlide(allowed);
    return;
  }
  activeStep = stepsOrder[Math.max(0, Math.min(index, stepsOrder.length - 1))];
  renderActiveStep();
});

swipeTabs.forEach((tab, idx) => {
  tab.addEventListener("click", () => {
    const allowed = getAllowedIndex();
    const target = Math.min(idx, allowed);
    goToSlide(target);
  });
});

// ---------- PX Glow ----------
function trackGlow(el) {
  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

document.querySelectorAll(".px-card").forEach(trackGlow);

// ---------- Rendering ----------
function renderActiveStep() {
  if (!currentProblem) return;

  textareaEmotion.value = currentProblem.emotion || "";
  textareaSituation.value = currentProblem.situation || "";
  textareaSolution.value = currentProblem.solution || "";

  textareaEmotion.disabled = currentProblem.emotionDone || currentProblem.completed;
  textareaSituation.disabled =
    !currentProblem.emotionDone || currentProblem.situationDone || currentProblem.completed;
  textareaSolution.disabled =
    !currentProblem.situationDone || currentProblem.solutionDone || currentProblem.completed;

  cardEmotion.classList.toggle("completed", !!currentProblem.emotionDone);
  cardSituation.classList.toggle("completed", !!currentProblem.situationDone);
  cardSolution.classList.toggle("completed", !!currentProblem.solutionDone);

  updateSwipeTabs();
  updateProgress();
  renderSummary();
  renderStatus();
  renderHistory();
}

function updateSwipeTabs() {
  swipeTabs.forEach(tab => {
    const step = tab.dataset.step;
    const isActive = step === activeStep;
    const isDone = currentProblem && currentProblem[step + "Done"];
    tab.classList.toggle("active", isActive);
    tab.classList.toggle("completed", !!isDone);
  });
}

function updateProgress() {
  if (!currentProblem) {
    progressInner.style.width = "0%";
    return;
  }
  let doneCount = 0;
  stepsOrder.forEach(s => {
    if (currentProblem[s + "Done"]) doneCount++;
  });
  const pct = (doneCount / stepsOrder.length) * 100;
  progressInner.style.width = pct + "%";
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

// ---------- Interaktion ----------
function confirmStep(step) {
  if (!currentProblem || currentProblem.completed) return;

  const map = {
    emotion: textareaEmotion,
    situation: textareaSituation,
    solution: textareaSolution
  };
  const el = map[step];
  const val = el.value.trim();
  if (!val) {
    alert("Bitte fülle das Feld aus.");
    return;
  }

  currentProblem[step] = val;
  currentProblem[step + "Done"] = true;

  if (currentProblem.emotionDone && currentProblem.situationDone && currentProblem.solutionDone) {
    currentProblem.completed = true;
  }

  saveProblems();
  renderActiveStep();

  const currentIndex = indexForStep(step);
  const allowed = getAllowedIndex();
  const nextIndex = Math.min(currentIndex + 1, allowed);
  if (nextIndex !== currentIndex) {
    goToSlide(nextIndex);
  }
}

function handleNewProblem() {
  if (currentProblem && !currentProblem.completed) {
    const ok = confirm("Das aktuelle Problem ist noch nicht abgeschlossen. Trotzdem neues Problem starten?");
    if (!ok) return;
  }
  createNewProblem();
  activeStep = "emotion";
  goToSlide(0);
}

newProblemBtn.addEventListener("click", handleNewProblem);

function openDetailView(problem) {
  detailEmotion.textContent = problem.emotion;
  detailSituation.textContent = problem.situation;
  detailSolution.textContent = problem.solution;
  detailOverlay.classList.remove("hidden");
}

function closeDetailView() {
  detailOverlay.classList.add("hidden");
}

detailClose.addEventListener("click", closeDetailView);
detailOverlay.addEventListener("click", e => {
  if (e.target === detailOverlay) closeDetailView();
});

function applyTheme(theme) {
  document.documentElement.setAttribute("data-clear4-theme", theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  themeChips.forEach(chip => {
    chip.classList.toggle("active", chip.dataset.theme === theme);
  });
}

themeChips.forEach(chip => {
  chip.addEventListener("click", () => applyTheme(chip.dataset.theme));
});

// ---------- Init ----------
function initApp() {
  const storedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "JOY";
  applyTheme(storedTheme);

  loadProblems();
  currentProblem = getCurrentProblem();
  if (!currentProblem || currentProblem.completed) {
    createNewProblem();
  }

  renderActiveStep();
  goToSlide(indexForStep(activeStep));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .catch(err => console.error("SW registration failed", err));
    });
  }
}

// Start mit Passwort-Gate
// Start direkt ohne Passwort
initApp();

