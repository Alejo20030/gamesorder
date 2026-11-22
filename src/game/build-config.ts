import type { DragAndDropConfig } from "../interfaces/drag-and-drop-config.interface";

export interface Explanation {
  _id: string;
  explanationText: string;
  questionId?: string;
  createdBy?: string | null;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: string;
}

export interface Question {
  _id: string;
  questionText: string;
  explanations: Explanation[];
}

export type BuildConfigResult =
  | { ok: true; config: DragAndDropConfig }
  | { ok: false; reason: string };

export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export function cleantext(text: string) {
  return text.trim();
}

/** Strip only leading/trailing punctuation so domains/URLs keep internal dots. */
export function stripEdgePunctuation(token: string): string {
  return token.replace(/^[.,!?;:"'()¿¡]+|[.,!?;:"'()¿¡]+$/g, "");
}

export function splitTokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function tokenize(text: string): string[] {
  return splitTokens(text)
    .map(stripEdgePunctuation)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 0);
}

export function getKeywords(text: unknown, max: number = 2): string[] {
  if (typeof text !== "string") return [];
  const cleaned = cleantext(text);
  if (!cleaned) return [];

  const surfaceTokens = splitTokens(cleaned)
    .map(stripEdgePunctuation)
    .filter((token) => token.length > 0);

  const uniqueTokens: string[] = [];
  const seen = new Set<string>();

  for (const token of surfaceTokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTokens.push(token);
  }

  return shuffleArray(uniqueTokens).slice(0, Math.min(max, uniqueTokens.length));
}

export function createSentenceWithBlanks(base: string, keywords: string[]) {
  const cleanedBase = cleantext(base);
  if (!cleanedBase || keywords.length === 0) {
    return cleanedBase;
  }

  // No spaces: treat the whole explanation as a single blankable unit (e.g. URLs).
  if (!/\s/.test(cleanedBase)) {
    const matchesWholePhrase = keywords.some(
      (keyword) => keyword.toLowerCase() === cleanedBase.toLowerCase(),
    );
    return matchesWholePhrase ? "[z1]" : cleanedBase;
  }

  const zoneByKeyword = new Map(
    keywords.map((word, index) => [word.toLowerCase(), index + 1]),
  );

  return splitTokens(cleanedBase)
    .map((token) => {
      const normalized = stripEdgePunctuation(token).toLowerCase();
      const zoneIndex = zoneByKeyword.get(normalized);
      return zoneIndex != null ? `[z${zoneIndex}]` : token;
    })
    .join(" ");
}

export function buildConfig(
  question: Question,
  options: { shuffle?: boolean } = {},
): BuildConfigResult {
  const shouldShuffle = options.shuffle ?? true;
  const shuffleFn = shouldShuffle ? shuffleArray : <T>(items: T[]) => [...items];

  const explanations =
    question.explanations?.filter((e) => e?.explanationText?.trim()) ?? [];

  if (explanations.length === 0) {
    return { ok: false, reason: "La pregunta no tiene explicaciones válidas." };
  }

  let sentenceBase = cleantext(explanations[0].explanationText);
  let keywords = getKeywords(sentenceBase);

  if (keywords.length === 0) {
    for (const explanation of explanations.slice(1)) {
      const candidate = cleantext(explanation.explanationText);
      const candidateKeywords = getKeywords(candidate, 2);
      if (candidateKeywords.length > 0) {
        sentenceBase = candidate;
        keywords = candidateKeywords;
        break;
      }
    }
  }

  if (keywords.length === 0) {
    return {
      ok: false,
      reason: "No se pudieron extraer palabras de las explicaciones.",
    };
  }

  const sentence = createSentenceWithBlanks(sentenceBase, keywords);

  const zones = keywords.map((_, index) => ({
    id: `z${index + 1}`,
    label: "",
  }));

  const timestamp = Date.now();
  const correctItems = keywords.map((word, index) => ({
    id: `correct-${index}-${timestamp}`,
    text: word,
    correctZoneId: `z${index + 1}`,
  }));

  const correctWordSet = new Set(
    correctItems.map((item) => item.text.toLowerCase()),
  );
  const maxOptions = keywords.length * 2;
  const availableDistractorSlots = Math.max(0, maxOptions - correctItems.length);

  const distractorCandidates = question.explanations
    .slice(1)
    .flatMap((e) => getKeywords(e?.explanationText, Math.max(2, keywords.length)))
    .filter((word) => !correctWordSet.has(word.toLowerCase()));

  const uniqueDistractorWords: string[] = [];
  const seenDistractors = new Set<string>();
  for (const word of distractorCandidates) {
    const key = word.toLowerCase();
    if (seenDistractors.has(key)) continue;
    seenDistractors.add(key);
    uniqueDistractorWords.push(word);
  }

  const selectedDistractorWords = shuffleFn(uniqueDistractorWords).slice(
    0,
    availableDistractorSlots,
  );

  const distractors = selectedDistractorWords.map((word, index) => ({
    id: `wrong-${index}-${timestamp}`,
    text: word,
    correctZoneId: "wrong",
  }));

  return {
    ok: true,
    config: {
      sentence,
      zones,
      items: shuffleFn([...correctItems, ...distractors]),
    },
  };
}
