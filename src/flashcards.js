import { shuffle } from "./quiz-engine.js";

export const buildFlashcards = async (loadJson) => {
  const [vocab, kanji, grammar] = await Promise.all([loadJson("vocab"), loadJson("kanji"), loadJson("grammar")]);
  return shuffle([
    ...vocab.map((item) => ({ front: item.jp, speak: item.jp, back: `${item.kana} - ${item.meaning}`, id: `vocab:${item.id}` })),
    ...kanji.map((item) => ({ front: item.kanji, speak: item.example.jp, back: `${item.meaning} - ${item.example.jp}`, id: `kanji:${item.id}` })),
    ...grammar.map((item) => ({ front: item.pattern, speak: item.example.jp, back: `${item.title} - ${item.example.id}`, id: `grammar:${item.id}` }))
  ]);
};
