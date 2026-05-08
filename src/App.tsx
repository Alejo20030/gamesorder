import { useCallback, useEffect, useState } from "react";
import DragDropGame from "./components/DragDrop/DragDropGame";
import type { DragAndDropConfig } from "./interfaces/drag-and-drop-config.interface";
import "./index.css";

export interface Explanation {
  _id: string;
  explanationText: string;
  questionId: string;
  createdBy: string | null;
  status: string;
  createdAt: Date;
  updatedAt: string;
}

export interface Question {
  _id: string;
  questionText: string;
  explanations: Explanation[];
}

interface GameData {
  timeLimit: number;
  attempt: number;
  currentQuestionId: string;
}

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function cleantext(text: string) {
  return text.trim();
}

function getKeywords(text: unknown, max: number = 2): string[] {
  if (typeof text !== "string") return [];
  const cleaned = cleantext(text);
  if (!cleaned) return [];

  const stopWords = [
    "para",
    "como",
    "este",
    "esta",
    "porque",
    "donde",
    "quien",
    "que",
    "cual",
    "cuando",
    "cuanto",
    "con",
    "sin",
    "sobre",
    "entre",
    "hasta",
    "desde",
    "siempre",
    "tambien",
    "puede",
    "debe",
    "hacer",
    "tener",
    "usar",
    "mejorar",
    "analizar",
    "tiempos",
  ];
  const words = cleaned
    .split(/\s+/)
    .map((w) => w?.replace(/[.,]/g, "").toLowerCase())
    .filter(
      (w): w is string =>
        typeof w === "string" && w.length > 3 && !stopWords.includes(w),
    );

  const unique = Array.from(new Set(words));
  return shuffleArray(unique).slice(0, max);
}

function createSentenceWithBlanks(base: string, keywords: string[]) {
  let sentence = base;

  keywords.forEach((word, index) => {
    const regex = new RegExp(word, "i");
    sentence = sentence.replace(regex, `[z${index + 1}]`);
  });

  return sentence;
}

function buildConfig(question: Question): DragAndDropConfig | null {
  const correctExplanation = question.explanations?.[0];
  if (!correctExplanation?.explanationText) return null;

  const cleanedExplanation = cleantext(correctExplanation.explanationText);
  const keywords = getKeywords(cleanedExplanation);
  if (keywords.length === 0) return null;

  const sentence = createSentenceWithBlanks(cleanedExplanation, keywords);

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

  const correctWordSet = new Set(correctItems.map((item) => item.text));
  const maxOptions = keywords.length * 2;
  const availableDistractorSlots = Math.max(0, maxOptions - correctItems.length);

  const distractorCandidates = question.explanations
    .slice(1)
    .flatMap((e) => getKeywords(e?.explanationText, Math.max(2, keywords.length)))
    .filter((word) => !correctWordSet.has(word));

  const uniqueDistractorWords = Array.from(new Set(distractorCandidates));
  const selectedDistractorWords = shuffleArray(uniqueDistractorWords).slice(
    0,
    availableDistractorSlots,
  );

  const distractors = selectedDistractorWords.map((word, index) => ({
      id: `wrong-${index}-${timestamp}`,
      text: word,
      correctZoneId: "wrong",
    }));

  return {
    sentence,
    zones,
    items: shuffleArray([...correctItems, ...distractors]),
  };
}

export default function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentConfig, setCurrentConfig] = useState<DragAndDropConfig | null>(
    null,
  );

  const handleReloadWords = useCallback(() => {
    if (!currentQuestion) return;
    const regeneratedConfig = buildConfig(currentQuestion);
    if (regeneratedConfig) {
      setCurrentConfig(regeneratedConfig);
    }
  }, [currentQuestion]);

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{
        currentQuestion: Question;
        otherQuestions: Question[];
      }>,
    ) => {
      console.log("Mensaje recibido del host:", event.data);

      const { currentQuestion } = event.data;

      if (!currentQuestion) return;
      setCurrentQuestion(currentQuestion);

      setGameData({
        timeLimit: 300,
        attempt: 1,
        currentQuestionId: currentQuestion._id,
      });

      const normalized = buildConfig(currentQuestion);
      if (!normalized) return;
      setCurrentConfig(normalized);
    };

    window.addEventListener("message", handleMessage);

    const readyTimer = setTimeout(() => {
      console.log("Enviando mensaje de GAME_READY al host");
      window.parent.postMessage({ type: "GAME_READY" }, "*");
    }, 200);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(readyTimer);
    };
  }, []);

  const handleNext = useCallback((userAnswers: Record<string, string>) => {
    if (!currentConfig || !gameData) return;

    const isCorrect = currentConfig.items
      .filter((item) => item.correctZoneId !== "wrong")
      .every((item) => {
        const selectedItemId = userAnswers[item.correctZoneId];
        return selectedItemId === item.id;
      });

    window.parent.postMessage(
      {
        answeredCorrectly: isCorrect,
        questionId: gameData.currentQuestionId ?? "unknown",
        questionText: currentConfig.sentence,
        userAnswer: JSON.stringify(userAnswers),
      },
      "*",
    );
  }, [currentConfig, gameData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          handleNext({});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameData?.currentQuestionId, handleNext]);

  if (!gameData || !currentConfig) {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>Esperando datos del host...</h2>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[85vh] bg-white rounded-2xl shadow-xl p-10 flex flex-col">
        <h2 className="text-3xl font-bold text-center mb-2">
          Completa la frase
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Arrastra cada palabra al espacio correcto para completar la frase.
        </p>

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleReloadWords}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            aria-label="Cambiar palabras"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M3 12a9 9 0 0 1 15.3-6.3L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15.3 6.3L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Cambiar palabras
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <DragDropGame
            config={currentConfig}
            onFinish={handleNext}
            timeLeft={timeLeft}
          />
        </div>
      </div>
    </div>
  );
}
