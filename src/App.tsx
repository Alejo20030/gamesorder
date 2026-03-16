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
      
      

      const zones = currentQuestion.explanations.map((_, index) => ({
        id: `z${index + 1}`,
        label: "",
      }));

      const shuffled = shuffleArray(currentQuestion.explanations);
      const items = shuffled.map((e, index) => ({
        id: e._id,
        text: e.explanationText,
        correctZoneId: zones[index].id,
      }));

      const normalized: DragAndDropConfig = {
        sentence: currentQuestion.questionText + "\n\n" + 
        zones.map((z) => `[${z.id}]`).join(" ______ "),
        zones,
        items,
      };

      
      setCurrentConfig(normalized);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleNext = (userAnswers: Record<string, string>) => {
    console.log("Handling next ejecutado");
    if (!currentConfig || !gameData) return;

    const isCorrect = currentConfig.items.every((item) => {
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
