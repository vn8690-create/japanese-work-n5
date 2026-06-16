export const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export const sample = (items, count) => shuffle(items).slice(0, count);

export const prepareQuiz = async (count, loadJson) => {
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
      source: "reading"
    }))
  );

  return sample([...vocab.questions, ...kanji.questions, ...grammar.questions, ...readingQuestions], count).map((question) => ({
    ...question,
    options: shuffle(question.options)
  }));
};

export const prepareReviewQuiz = (questions) =>
  shuffle(questions).map((question) => ({
    ...question,
    options: shuffle(question.options)
  }));
