import { useEffect, useState } from "react";
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

export default function App() {
  const [gameData, setGameData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentConfig, setCurrentConfig] = useState<DragAndDropConfig | null>(
    null,
  );

  function shuffleArray<T>(array: T[]): T[] {
          return [...array].sort(() => Math.random() - 0.5);
        }

  

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{
        currentQuestion: Question;
        otherQuestions: Question[];
      }>,
    ) => {
      console.log("Mensaje recibido del host:", event.data);
      console.log("Origen del mensaje:");

      

      const { currentQuestion } = event.data;

      if (!currentQuestion) return;

      setGameData({
        timeLimit: 300,
        userId: "user123",
        courseId: "course456",
        attempt: 1,
        currentQuestionId: currentQuestion._id,
      });
      
      
      function cleantext(text: string) {
        return text.trim();
      }

      function getKeywords(text: string, max: number = 2): string[] {
        const cleaned = cleantext(text);

        const stopWords = ["para", "como", "este", "esta", "porque", "donde",
          "quien", "que", "cual", "cuando", "cuanto",
          "con", "sin", "sobre", "entre", "hasta", "desde",
          "siempre", "tambien", "puede", "debe", "hacer",
          "tener", "usar", "mejorar", "analizar","tiempos"];
        const words = cleaned
          .toLowerCase()
          .split(" ")
          .map((w) => w.replace(/[.,]/g, ""))
          .filter((w) => w.length > 5 && !stopWords.includes(w));

          const unique = Array.from(new Set(words));
          return unique.slice(0, max);
      }

      function createSentenceWithBlanks(base: string, keywords: string[]) {
        let sentence = base;

        keywords.forEach((word, index) => {
          const regex = new RegExp(word, "i");
          sentence = sentence.replace(regex, `[z${index + 1}]`);
        });

        return sentence;
      }

      const correctExplanation = currentQuestion.explanations[0];
      const cleanedExplanation = cleantext(correctExplanation.explanationText);
      const keywords = getKeywords(cleanedExplanation);
      const sentence = createSentenceWithBlanks(
        cleanedExplanation,
         keywords);

      const zones = keywords.map((_, index) => ({
        id: `z${index + 1}`,
        label: ""
      }));

      const correctItems = keywords.map((word, index) => ({
        id: `correct-${index}`,
        text: word,
        correctZoneId: `z${index + 1}`,
      }));

      const distractors= currentQuestion.explanations
        .slice(1)
        .flatMap((e) => getKeywords(e.explanationText, 1))
        .map((word, index) => ({
          id: `wrong-${index}`,
          text: word,
          correctZoneId: "wrong",
        }));

      const items = shuffleArray([...correctItems, ...distractors]); 

      const normalized: DragAndDropConfig = {
        sentence,
        zones,
        items,
      };

      
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

  const handleNext = (userAnswers: Record<string, string>) => {
    console.log("Handling next ejecutado");
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
  };

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
  }, [gameData?.currentQuestionId]);

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
