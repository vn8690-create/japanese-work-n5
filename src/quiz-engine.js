export const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export const sample = (items, count) => shuffle(items).slice(0, count);

const normalizeLevel = (level) => String(level || "N5").replace(" dasar", "");

const matchesLevel = (item, level) => level === "all" || normalizeLevel(item.level) === level;

const bySource = (questions, source) => source === "mix" ? questions : questions.filter((question) => question.source === source);

const avoidRecent = (questions, recentIds, count) => {
  const recent = new Set(recentIds || []);
  const fresh = questions.filter((question) => !recent.has(question.id));
  return fresh.length >= Math.min(count, questions.length) ? fresh : questions;
};

const balancedSample = (questions, count) => {
  const groups = ["kosakata", "kanji", "bunpou", "reading"].map((source) => questions.filter((question) => question.source === source));
  const picked = [];
  while (picked.length < count && groups.some((group) => group.length)) {
    for (const group of groups) {
      if (picked.length >= count) break;
      const next = group.splice(Math.floor(Math.random() * group.length), 1)[0];
      if (next) picked.push(next);
    }
  }
  return picked;
};

export const prepareQuiz = async (count, loadJson, level = "all", options = {}) => {
  const [vocab, kanji, grammar, reading] = await Promise.all([
    loadJson("qVocab"),
    loadJson("qKanji"),
    loadJson("qGrammar"),
    loadJson("qReading")
  ]);

  const readingQuestions = reading.passages.flatMap((passage) =>
    passage.questions.map((question) => ({
      ...question,
      passage: passage.text,
      passageTitle: passage.title,
      source: "reading",
      level: normalizeLevel(question.level || passage.level)
    }))
  );

  const questions = [...vocab.questions, ...kanji.questions, ...grammar.questions, ...readingQuestions]
    .map((question) => ({ ...question, level: normalizeLevel(question.level) }))
    .filter((question) => matchesLevel(question, level));

  const source = options.source || "mix";
  const filtered = avoidRecent(bySource(questions, source), options.recentIds, count);
  const picked = source === "mix" ? balancedSample(filtered, Math.min(count, filtered.length)) : sample(filtered, Math.min(count, filtered.length));

  return picked.map((question) => ({
    ...question,
    options: shuffle(question.options)
  }));
};

export const prepareReviewQuiz = (questions) =>
  shuffle(questions).map((question) => ({
    ...question,
    options: shuffle(question.options)
  }));
