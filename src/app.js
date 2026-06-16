const DATA = {
  vocab: "./data/vocabulary-n5.json",
  kanji: "./data/kanji-n5.json",
  grammar: "./data/grammar-n5.json",
  conversations: "./data/conversations-work-n5.json",
  scenarios: "./data/scenarios-work-n5.json",
  qVocab: "./data/questions/kosakata-n5.json",
  qKanji: "./data/questions/kanji-n5.json",
  qGrammar: "./data/questions/bunpou-n5.json",
  qReading: "./data/questions/reading-n5.json"
};

const navItems = [
  ["home", "Beranda"],
  ["daily", "Hari Ini"],
  ["vocab", "Kosakata"],
  ["kanji", "Kanji"],
  ["grammar", "Tata Bahasa"],
  ["conversation", "Percakapan"],
  ["scenario", "Skenario"],
  ["practice", "Latihan"],
  ["flashcard", "Flashcard"],
  ["progress", "Progress"]
];

const modules = [
  { id: "daily", title: "Belajar Hari Ini", mark: "7m", detail: "Rutinitas pendek: 5 kata, 1 grammar, review kartu, dan quiz cepat." },
  { id: "vocab", title: "Kosakata", mark: "Ko", detail: "120 kata N5-N4 dasar untuk kantor, pabrik, dokumen, kesehatan, dan hidup harian." },
  { id: "kanji", title: "Kanji", mark: "Ka", detail: "80 kanji dasar dengan onyomi, kunyomi, arti, dan contoh kerja." },
  { id: "grammar", title: "Tata Bahasa", mark: "Gr", detail: "50 pola N5-N4 dasar yang praktis untuk instruksi, izin, laporan, dan pendapat." },
  { id: "conversation", title: "Percakapan", mark: "Pc", detail: "25 dialog kerja: shift, laporan, sakit, bank, hotel, kaigo, konbini, dan interview." },
  { id: "scenario", title: "Skenario Kerja", mark: "Sk", detail: "10 jalur situasi: pabrik, kaigo, restoran, konbini, konstruksi, hotel, gudang, dan hidup harian." },
  { id: "practice", title: "Latihan Soal", mark: "Qs", detail: "100 soal acak, review jawaban salah, dan reading berbasis passage." },
  { id: "flashcard", title: "Flashcard SRS", mark: "SR", detail: "Pilih Sulit, Lumayan, atau Mudah agar jadwal ulang menyesuaikan." }
];

const state = {
  route: "home",
  cache: new Map(),
  pages: { vocab: 1, kanji: 1, grammar: 1, conversation: 1, scenario: 1 },
  search: "",
  quiz: null,
  flashcards: [],
  flashIndex: 0,
  flashRevealed: false,
  screenshotMode: false,
  kanjiIndex: 0,
  kanjiAuto: false,
  kanjiTimer: null
};

const $ = (selector) => document.querySelector(selector);
const view = $("#view");
const nav = $("#navTabs");
const pageSize = 10;

const defaultProgress = {
  studied: {},
  quizRuns: 0,
  bestScore: 0,
  lastScore: 0,
  darkMode: false,
  streak: 0,
  lastStudyDate: "",
  dailyDone: {},
  srs: {},
  wrongQuestions: []
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const loadProgress = () => {
  try {
    return { ...defaultProgress, ...JSON.parse(localStorage.getItem("nihongoProgress")) };
  } catch {
    return { ...defaultProgress };
  }
};

let progress = loadProgress();

const saveProgress = () => localStorage.setItem("nihongoProgress", JSON.stringify(progress));

const touchStudyDay = () => {
  const today = todayKey();
  if (progress.lastStudyDate === today) return;
  progress.streak = progress.lastStudyDate === yesterdayKey() ? progress.streak + 1 : 1;
  progress.lastStudyDate = today;
};

const markStudied = (type, id) => {
  touchStudyDay();
  progress.studied[`${type}:${id}`] = Date.now();
  saveProgress();
};

const studiedCount = (prefix) => Object.keys(progress.studied).filter((key) => key.startsWith(`${prefix}:`)).length;

const dueCardsCount = () => {
  const now = Date.now();
  return Object.values(progress.srs || {}).filter((card) => !card.dueAt || card.dueAt <= now).length;
};

const setTheme = (dark) => {
  progress.darkMode = dark;
  saveProgress();
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};

const fetchJson = async (key) => {
  if (state.cache.has(key)) return state.cache.get(key);
  const response = await fetch(DATA[key]);
  if (!response.ok) throw new Error(`Gagal memuat ${key}`);
  const json = await response.json();
  state.cache.set(key, json);
  return json;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const speakJapanese = (text) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
};

const scoreBadge = (percent) => {
  if (percent >= 90) return { title: "N5 Fighter", detail: "Siap tempur buat target kerja Jepang." };
  if (percent >= 75) return { title: "Siap Kerja Jepang", detail: "Fondasi kamu sudah kuat, lanjut konsisten." };
  if (percent >= 55) return { title: "Semangat Naik Level", detail: "Bagus, tinggal review bagian yang salah." };
  return { title: "Pejuang Nihongo", detail: "Mulai dari kecil, ulangi lagi besok." };
};

const routeTo = (route) => {
  clearKanjiTimer();
  state.route = route;
  location.hash = route;
  render();
};

const clearKanjiTimer = () => {
  if (state.kanjiTimer) {
    window.clearTimeout(state.kanjiTimer);
    state.kanjiTimer = null;
  }
};

const setNav = () => {
  nav.innerHTML = navItems
    .map(([id, label]) => `<button class="chip ${state.route === id ? "active" : ""}" data-route="${id}">${label}</button>`)
    .join("");
};

nav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-route]");
  if (button) routeTo(button.dataset.route);
});

$("#themeButton").addEventListener("click", () => setTheme(!progress.darkMode));
$("#menuButton").addEventListener("click", () => nav.scrollIntoView({ behavior: "smooth", block: "start" }));

const loading = (label = "Memuat data...") => {
  view.innerHTML = `<div class="loading">${label}</div>`;
};

const moduleCard = (module) => `
  <button class="module-card" data-route="${module.id}">
    <span class="mark">${module.mark}</span>
    <span><h3>${module.title}</h3><p>${module.detail}</p></span>
    <span aria-hidden="true">›</span>
  </button>`;

const renderHome = () => {
  const totalStudied = Object.keys(progress.studied).length;
  const doneToday = Boolean(progress.dailyDone?.[todayKey()]);
  view.innerHTML = `
    <section class="hero">
      <div>
        <h2>Belajar Jepang yang langsung kepakai di tempat kerja.</h2>
        <p>Materi N5-N4 dasar untuk pemula Indonesia: kata praktis, kanji, pola kalimat, dialog kerja, flashcard SRS, dan tes acak.</p>
        <div class="actions">
          <button class="primary" data-route="daily">${doneToday ? "Lihat rutinitas" : "Mulai 7 menit"}</button>
          <button class="ghost" data-route="scenario">Pilih skenario kerja</button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${progress.streak}</strong><span>Streak hari</span></div>
        <div class="stat"><strong>${totalStudied}</strong><span>Item dipelajari</span></div>
        <div class="stat"><strong>${progress.bestScore}%</strong><span>Skor terbaik</span></div>
      </div>
    </section>
    <section class="grid cards">${modules.map(moduleCard).join("")}</section>
  `;
};

const renderDaily = async () => {
  loading("Menyiapkan misi hari ini...");
  const [vocab, grammar] = await Promise.all([fetchJson("vocab"), fetchJson("grammar")]);
  const day = new Date().getDate();
  const dailyVocab = Array.from({ length: 5 }, (_, index) => vocab[(day + index) % vocab.length]);
  const dailyGrammar = grammar[day % grammar.length];
  const doneToday = Boolean(progress.dailyDone?.[todayKey()]);
  view.innerHTML = `
    <section class="hero">
      <div>
        <h2>${doneToday ? "Misi hari ini selesai." : "Misi 7 menit hari ini"}</h2>
        <p>Belajar pendek lebih gampang jadi kebiasaan. Cocok sebelum kerja, saat istirahat, atau sebelum tidur.</p>
      </div>
      <div class="stats">
        <div class="stat"><strong>${progress.streak}</strong><span>Streak</span></div>
        <div class="stat"><strong>${dueCardsCount()}</strong><span>Kartu jatuh tempo</span></div>
        <div class="stat"><strong>${progress.wrongQuestions.length}</strong><span>Soal salah</span></div>
      </div>
    </section>
    <section class="grid">
      <article class="item">
        <h3>5 kosakata cepat</h3>
        ${dailyVocab.map((item) => `<p><button class="mini-sound" data-speak="${escapeHtml(item.jp)}">Dengar</button> <strong>${item.jp}</strong> ${item.kana} - ${item.meaning}</p>`).join("")}
      </article>
      <article class="item">
        <h3>1 pola kalimat</h3>
        <div class="japanese">${dailyGrammar.pattern}</div>
        <p>${dailyGrammar.explanation}</p>
        <p><button class="mini-sound" data-speak="${escapeHtml(dailyGrammar.example.jp)}">Dengar</button> ${dailyGrammar.example.jp}</p>
        <p>${dailyGrammar.example.id}</p>
      </article>
      <article class="item">
        <h3>Loop harian</h3>
        <p class="hint">Urutan yang disarankan: baca 5 kata, dengar contoh, review flashcard, lalu tes 10 soal.</p>
        <div class="actions">
          <button class="ghost" data-route="flashcard">Review flashcard</button>
          <button class="ghost" id="dailyQuiz">Tes 10 soal</button>
          <button class="primary" id="finishDaily">${doneToday ? "Sudah selesai" : "Tandai selesai"}</button>
        </div>
      </article>
    </section>`;
  bindSpeakButtons();
  $("#dailyQuiz").addEventListener("click", () => startQuiz(10));
  $("#finishDaily").addEventListener("click", () => {
    touchStudyDay();
    progress.dailyDone[todayKey()] = Date.now();
    saveProgress();
    renderDaily();
  });
};

const paginate = (items, route) => {
  const maxPage = Math.max(1, Math.ceil(items.length / pageSize));
  state.pages[route] = Math.min(state.pages[route] || 1, maxPage);
  const start = (state.pages[route] - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), maxPage };
};

const pagination = (route, maxPage) => `
  <div class="pagination">
    <button class="page-button" data-page="${route}:prev" ${state.pages[route] <= 1 ? "disabled" : ""}>Sebelumnya</button>
    <span class="hint">Halaman ${state.pages[route]} / ${maxPage}</span>
    <button class="page-button" data-page="${route}:next" ${state.pages[route] >= maxPage ? "disabled" : ""}>Berikutnya</button>
  </div>`;

const bindPaging = () => {
  view.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const [route, direction] = button.dataset.page.split(":");
      state.pages[route] += direction === "next" ? 1 : -1;
      render();
    });
  });
};

const bindSpeakButtons = () => {
  view.querySelectorAll("[data-speak]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      speakJapanese(button.dataset.speak);
    });
  });
};

const renderVocab = async () => {
  loading();
  const data = await fetchJson("vocab");
  const query = state.search.trim().toLowerCase();
  const filtered = query
    ? data.filter((item) => [item.jp, item.kana, item.romaji, item.id, item.meaning, item.category].join(" ").toLowerCase().includes(query))
    : data;
  const { pageItems, maxPage } = paginate(filtered, "vocab");
  view.innerHTML = `
    <div class="toolbar">
      <input class="search" id="searchBox" placeholder="Cari kosakata, contoh: kerja, absen, yasumi..." value="${escapeHtml(state.search)}" />
      <div class="hint">${filtered.length} kata ditemukan</div>
    </div>
    <div class="grid">
      ${pageItems
        .map(
          (item) => `
        <article class="item" data-study="vocab:${item.id}">
          <div class="japanese">${item.jp} <span class="romaji">${item.kana}</span></div>
          <h3>${item.meaning}</h3>
          <p><button class="mini-sound" data-speak="${escapeHtml(item.example.jp)}">Dengar</button> ${item.romaji} - ${item.example.jp}</p>
          <p>${item.example.id}</p>
          <div class="tag-row"><span class="tag">${item.category}</span><span class="tag">${item.level}</span></div>
        </article>`
        )
        .join("") || `<div class="empty">Tidak ada hasil.</div>`}
    </div>
    ${pagination("vocab", maxPage)}
  `;
  $("#searchBox").addEventListener("input", (event) => {
    state.search = event.target.value;
    state.pages.vocab = 1;
    renderVocab();
  });
  bindSpeakButtons();
  bindStudyMarks();
  bindPaging();
};

const renderKanji = async () => {
  clearKanjiTimer();
  loading();
  const data = await fetchJson("kanji");
  state.kanjiIndex = Math.max(0, Math.min(state.kanjiIndex, data.length - 1));
  const item = data[state.kanjiIndex];
  const percent = Math.round(((state.kanjiIndex + 1) / data.length) * 100);
  view.innerHTML = `
    <section class="study-stage">
      <div class="study-topline">
        <span>Kanji ${state.kanjiIndex + 1}/${data.length}</span>
        <span>${percent}%</span>
      </div>
      <div class="progress-track"><span style="width:${percent}%"></span></div>
      <article class="kanji-card" data-study="kanji:${item.id}">
        <p class="kanji-label">${item.level} - ${item.category}</p>
        <div class="kanji-symbol">${item.kanji}</div>
        <h2>${item.meaning}</h2>
        <div class="reading-grid">
          <div><span>Onyomi</span><strong>${item.onyomi || "-"}</strong></div>
          <div><span>Kunyomi</span><strong>${item.kunyomi || "-"}</strong></div>
        </div>
        <div class="example-panel">
          <p><button class="mini-sound" data-speak="${escapeHtml(item.example.jp)}">Dengar</button> <strong>${item.example.jp}</strong></p>
          <p>${item.example.id}</p>
        </div>
      </article>
      <div class="study-controls">
        <button class="ghost" id="prevKanji" ${state.kanjiIndex === 0 ? "disabled" : ""}>Sebelumnya</button>
        <button class="primary" id="nextKanji">${state.kanjiIndex === data.length - 1 ? "Ulang dari awal" : "Berikutnya"}</button>
      </div>
      <div class="study-controls compact">
        <button class="ghost" id="speakKanji" data-speak="${escapeHtml(item.example.jp)}">Dengar contoh</button>
        <button class="ghost ${state.kanjiAuto ? "active-control" : ""}" id="autoKanji">${state.kanjiAuto ? "Auto aktif" : "Auto next"}</button>
      </div>
    </section>
  `;
  bindSpeakButtons();
  markStudied("kanji", item.id);
  $("#prevKanji").addEventListener("click", () => {
    clearKanjiTimer();
    state.kanjiIndex = Math.max(0, state.kanjiIndex - 1);
    renderKanji();
  });
  $("#nextKanji").addEventListener("click", () => {
    clearKanjiTimer();
    state.kanjiIndex = (state.kanjiIndex + 1) % data.length;
    renderKanji();
  });
  $("#autoKanji").addEventListener("click", () => {
    clearKanjiTimer();
    state.kanjiAuto = !state.kanjiAuto;
    renderKanji();
  });
  if (state.kanjiAuto) {
    state.kanjiTimer = window.setTimeout(() => {
      state.kanjiIndex = (state.kanjiIndex + 1) % data.length;
      renderKanji();
    }, 5200);
  }
};

const renderGrammar = async () => {
  loading();
  const data = await fetchJson("grammar");
  const { pageItems, maxPage } = paginate(data, "grammar");
  view.innerHTML = `
    <div class="grid">
      ${pageItems
        .map(
          (item) => `
        <article class="item" data-study="grammar:${item.id}">
          <div class="japanese">${item.pattern}</div>
          <h3>${item.title}</h3>
          <p>${item.explanation}</p>
          <p><button class="mini-sound" data-speak="${escapeHtml(item.example.jp)}">Dengar</button> ${item.example.jp}</p>
          <p>${item.example.id}</p>
          <div class="tag-row"><span class="tag">${item.level}</span><span class="tag">${item.use}</span></div>
        </article>`
        )
        .join("")}
    </div>
    ${pagination("grammar", maxPage)}
  `;
  bindSpeakButtons();
  bindStudyMarks();
  bindPaging();
};

const renderConversation = async () => {
  loading();
  const data = await fetchJson("conversations");
  const { pageItems, maxPage } = paginate(data, "conversation");
  view.innerHTML = `
    <div class="grid">
      ${pageItems
        .map(
          (dialog) => `
        <article class="dialog-card item" data-study="conversation:${dialog.id}">
          <h3>${dialog.title}</h3>
          <p>${dialog.context}</p>
          ${dialog.lines
            .map(
              (line) => `
            <div class="dialog-line">
              <span class="speaker">${line.speaker}</span>
              <span class="japanese"><button class="mini-sound" data-speak="${escapeHtml(line.jp)}">Dengar</button> ${line.jp}</span>
              <span>${line.id}</span>
            </div>`
            )
            .join("")}
        </article>`
        )
        .join("")}
    </div>
    ${pagination("conversation", maxPage)}
  `;
  bindSpeakButtons();
  bindStudyMarks();
  bindPaging();
};

const renderScenario = async () => {
  loading();
  const data = await fetchJson("scenarios");
  const { pageItems, maxPage } = paginate(data, "scenario");
  view.innerHTML = `
    <section class="grid">
      ${pageItems
        .map(
          (item) => `
        <article class="item" data-study="scenario:${item.id}">
          <h3>${item.sector}</h3>
          <p>${item.goal}</p>
          <p class="hint">${item.dailyMission}</p>
          ${item.phrases.map((phrase) => `<p><button class="mini-sound" data-speak="${escapeHtml(phrase.jp)}">Dengar</button> <strong>${phrase.jp}</strong><br>${phrase.id}</p>`).join("")}
          <div class="tag-row"><span class="tag">kerja</span><span class="tag">praktis</span></div>
        </article>`
        )
        .join("")}
    </section>
    ${pagination("scenario", maxPage)}
  `;
  bindSpeakButtons();
  bindStudyMarks();
  bindPaging();
};

const bindStudyMarks = () => {
  view.querySelectorAll("[data-study]").forEach((node) => {
    node.addEventListener(
      "click",
      () => {
        const [type, id] = node.dataset.study.split(":");
        markStudied(type, id);
        node.querySelector(".tag-row")?.insertAdjacentHTML("beforeend", `<span class="tag">dipelajari</span>`);
      },
      { once: true }
    );
  });
};

const rememberWrong = (question) => {
  progress.wrongQuestions = [question, ...progress.wrongQuestions.filter((item) => item.id !== question.id)].slice(0, 30);
  saveProgress();
};

const clearWrong = (id) => {
  progress.wrongQuestions = progress.wrongQuestions.filter((item) => item.id !== id);
  saveProgress();
};

const startQuiz = async (count) => {
  state.screenshotMode = false;
  document.body.classList.remove("screenshot-mode");
  loading("Menyiapkan soal acak...");
  const { prepareQuiz } = await import("./quiz-engine.js");
  state.quiz = {
    questions: await prepareQuiz(count, fetchJson),
    index: 0,
    score: 0,
    answered: false,
    chosen: null,
    mode: "random"
  };
  state.route = "practice";
  location.hash = "practice";
  renderPractice();
};

const startWrongReview = async () => {
  if (!progress.wrongQuestions.length) return;
  state.screenshotMode = false;
  document.body.classList.remove("screenshot-mode");
  const { prepareReviewQuiz } = await import("./quiz-engine.js");
  state.quiz = {
    questions: prepareReviewQuiz(progress.wrongQuestions),
    index: 0,
    score: 0,
    answered: false,
    chosen: null,
    mode: "review"
  };
  renderPractice();
};

const renderPractice = async () => {
  if (!state.quiz) {
    view.innerHTML = `
      <section class="quiz-box">
        <h2>Latihan Soal</h2>
        <p class="hint">Soal diambil acak dari JSON kosakata, kanji, bunpou, dan reading. Jawaban salah masuk ke review.</p>
        <div class="actions">
          <button class="primary" data-quiz="10">Tes cepat 10 soal</button>
          <button class="ghost" data-quiz="40">Tes normal 40 soal</button>
          <button class="ghost" id="reviewWrong" ${progress.wrongQuestions.length ? "" : "disabled"}>Review salah (${progress.wrongQuestions.length})</button>
        </div>
      </section>`;
    view.querySelectorAll("[data-quiz]").forEach((button) => button.addEventListener("click", () => startQuiz(Number(button.dataset.quiz))));
    $("#reviewWrong").addEventListener("click", startWrongReview);
    return;
  }

  const quiz = state.quiz;
  const question = quiz.questions[quiz.index];
  const finished = quiz.index >= quiz.questions.length;
  if (finished) {
    const percent = Math.round((quiz.score / quiz.questions.length) * 100);
    const badge = scoreBadge(percent);
    touchStudyDay();
    progress.quizRuns += 1;
    progress.lastScore = percent;
    progress.bestScore = Math.max(progress.bestScore, percent);
    saveProgress();
    state.quiz = null;
    view.innerHTML = `
      <section class="result-wrap">
        <div class="result-card" id="resultCard">
          <p class="result-brand">Nihongo Kerja</p>
          <div class="result-badge">${badge.title}</div>
          <div class="result-score">${percent}%</div>
          <p class="result-line">${quiz.score}/${quiz.questions.length} benar</p>
          <div class="result-mini-stats">
            <span>Streak ${progress.streak} hari</span>
            <span>Best ${progress.bestScore}%</span>
            <span>${quiz.mode === "review" ? "Review salah" : "Latihan N5"}</span>
          </div>
          <p class="result-copy">${badge.detail}</p>
          <p class="result-footer">Belajar Jepang untuk kerja di Jepang</p>
        </div>
        <p class="hint screenshot-hint">Aktifkan mode screenshot, lalu ambil tangkapan layar dari HP untuk upload ke Facebook atau TikTok.</p>
        <div class="actions result-actions">
          <button class="primary" id="screenshotMode">Mode Screenshot</button>
          <button class="primary" data-quiz="10">Ulang 10 soal</button>
          <button class="ghost" data-quiz="40">Ulang 40 soal</button>
          <button class="ghost" id="reviewWrong" ${progress.wrongQuestions.length ? "" : "disabled"}>Review salah</button>
        </div>
      </section>`;
    view.querySelectorAll("[data-quiz]").forEach((button) => button.addEventListener("click", () => startQuiz(Number(button.dataset.quiz))));
    $("#reviewWrong").addEventListener("click", startWrongReview);
    $("#screenshotMode").addEventListener("click", () => {
      state.screenshotMode = !state.screenshotMode;
      document.body.classList.toggle("screenshot-mode", state.screenshotMode);
      $("#screenshotMode").textContent = state.screenshotMode ? "Keluar Screenshot" : "Mode Screenshot";
    });
    setNav();
    return;
  }

  view.innerHTML = `
    <section class="quiz-box">
      <p class="question-count">Soal ${quiz.index + 1} / ${quiz.questions.length} - ${question.source}</p>
      ${question.passage ? `<div class="passage"><strong>${question.passageTitle}</strong><p>${question.passage}</p></div>` : ""}
      <h2>${question.prompt}</h2>
      <div class="answer-list">
        ${question.options
          .map(
            (option) => `
          <button class="answer ${quiz.answered && option === question.answer ? "correct" : ""} ${quiz.answered && option === quiz.chosen && option !== question.answer ? "wrong" : ""}" data-answer="${escapeHtml(option)}">
            ${option}
          </button>`
          )
          .join("")}
      </div>
      ${quiz.answered ? `<p class="hint">${question.explanation}</p><button class="primary" id="nextQuestion">Lanjut</button>` : ""}
    </section>`;

  view.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (quiz.answered) return;
      quiz.answered = true;
      quiz.chosen = button.dataset.answer;
      if (quiz.chosen === question.answer) {
        quiz.score += 1;
        clearWrong(question.id);
      } else {
        rememberWrong(question);
      }
      renderPractice();
    });
  });
  $("#nextQuestion")?.addEventListener("click", () => {
    quiz.index += 1;
    quiz.answered = false;
    quiz.chosen = null;
    renderPractice();
  });
};

const sortCardsForSrs = (cards) => {
  const now = Date.now();
  const due = cards.filter((card) => !progress.srs[card.id]?.dueAt || progress.srs[card.id].dueAt <= now);
  const later = cards.filter((card) => progress.srs[card.id]?.dueAt > now);
  return [...due, ...later];
};

const reviewCard = (card, rating) => {
  const current = progress.srs[card.id] || { interval: 0, reviews: 0 };
  const nextDays = rating === "hard" ? 1 : rating === "ok" ? Math.max(2, current.interval + 2) : Math.max(4, current.interval + 5);
  progress.srs[card.id] = {
    interval: nextDays,
    reviews: current.reviews + 1,
    lastRating: rating,
    dueAt: Date.now() + nextDays * 24 * 60 * 60 * 1000
  };
  const [type, id] = card.id.split(":");
  markStudied(type, id);
};

const renderFlashcard = async () => {
  if (!state.flashcards.length) {
    loading("Memuat kartu...");
    const { buildFlashcards } = await import("./flashcards.js");
    state.flashcards = sortCardsForSrs(await buildFlashcards(fetchJson));
  }
  const card = state.flashcards[state.flashIndex % state.flashcards.length];
  const meta = progress.srs[card.id];
  view.innerHTML = `
    <section>
      <div class="flashcard" id="flashcard">
        <div>
          <div class="front">${card.front}</div>
          ${state.flashRevealed ? `<div class="back">${card.back}</div>` : `<p class="hint">Ketuk untuk melihat jawaban</p>`}
          <p class="hint">${meta?.dueAt ? `Review berikutnya: ${new Date(meta.dueAt).toLocaleDateString("id-ID")}` : "Kartu baru"}</p>
        </div>
      </div>
      <div class="actions" style="margin-top:12px">
        <button class="ghost" data-speak="${escapeHtml(card.speak || card.front)}">Dengar</button>
        <button class="ghost" data-rating="hard">Sulit</button>
        <button class="ghost" data-rating="ok">Lumayan</button>
        <button class="primary" data-rating="easy">Mudah</button>
      </div>
    </section>`;
  $("#flashcard").addEventListener("click", () => {
    state.flashRevealed = !state.flashRevealed;
    renderFlashcard();
  });
  bindSpeakButtons();
  view.querySelectorAll("[data-rating]").forEach((button) => {
    button.addEventListener("click", () => {
      reviewCard(card, button.dataset.rating);
      state.flashRevealed = false;
      state.flashIndex += 1;
      renderFlashcard();
    });
  });
};

const renderProgress = () => {
  view.innerHTML = `
    <section class="hero">
      <div>
        <h2>Progress Belajar</h2>
        <p>Progress disimpan di perangkat ini dengan localStorage, jadi tetap ringan dan tidak butuh akun.</p>
      </div>
      <div class="stats">
        <div class="stat"><strong>${progress.streak}</strong><span>Streak</span></div>
        <div class="stat"><strong>${dueCardsCount()}</strong><span>Kartu jatuh tempo</span></div>
        <div class="stat"><strong>${progress.wrongQuestions.length}</strong><span>Soal salah</span></div>
      </div>
    </section>
    <section class="grid">
      <article class="item"><h3>Materi dipelajari</h3><p>Kosakata: ${studiedCount("vocab")} - Kanji: ${studiedCount("kanji")} - Bunpou: ${studiedCount("grammar")} - Skenario: ${studiedCount("scenario")}</p></article>
      <article class="item"><h3>Tes</h3><p>Terakhir: ${progress.lastScore}% - Terbaik: ${progress.bestScore}% - Selesai: ${progress.quizRuns} kali</p></article>
      <button class="ghost" id="resetProgress">Reset progress</button>
    </section>`;
  $("#resetProgress").addEventListener("click", () => {
    progress = { ...defaultProgress, darkMode: progress.darkMode };
    saveProgress();
    renderProgress();
  });
};

view.addEventListener("click", (event) => {
  const card = event.target.closest("[data-route]");
  if (card) routeTo(card.dataset.route);
});

const render = async () => {
  setNav();
  if (state.route !== "kanji") clearKanjiTimer();
  if (state.route !== "practice") {
    state.screenshotMode = false;
    document.body.classList.remove("screenshot-mode");
  }
  try {
    if (state.route === "home") renderHome();
    if (state.route === "daily") await renderDaily();
    if (state.route === "vocab") await renderVocab();
    if (state.route === "kanji") await renderKanji();
    if (state.route === "grammar") await renderGrammar();
    if (state.route === "conversation") await renderConversation();
    if (state.route === "scenario") await renderScenario();
    if (state.route === "practice") await renderPractice();
    if (state.route === "flashcard") await renderFlashcard();
    if (state.route === "progress") renderProgress();
    view.focus({ preventScroll: true });
  } catch (error) {
    view.innerHTML = `<div class="empty">Data gagal dimuat. Coba muat ulang halaman.</div>`;
    console.error(error);
  }
};

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "home";
  render();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

setTheme(progress.darkMode);
state.route = location.hash.replace("#", "") || "home";
render();
