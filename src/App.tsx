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
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentConfig, setCurrentConfig] = useState<DragAndDropConfig | null>(null);
  
 

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{
        currentQuestion: Question;
        otherQuestions: Question[];
      }>,
    ) => {
      console.log("Mensaje recibido del host:", event.data);
      console.log("Origen del mensaje:");

      if (event.data?.type ==="TIME_UPDATE") {
        setTimeLeft(event.data.payload.timeLeft);
        
        return;
      }

        


      
      const { currentQuestion } = event.data;

      if (!currentQuestion) return;

      setGameData({
        timeLimit: 300,
        userId: "user123",
        courseId: "course456",
        attempt: 1,
      });
      

     
        const zones = currentQuestion.explanations.map((_, index) => ({
          id: `z${index + 1}`,
          label: "",
        }));

        const items = currentQuestion.explanations.map((e, index) => ({
          id: e._id,
          text: e.explanationText,
          correctZoneId: zones[index].id,
        }));

        const normalized: DragAndDropConfig = {
          sentence: currentQuestion.questionText,
          zones,
          items,
        };

        const placeholders = zones.map((z) => `[${z.id}]`).join(" _____ ");
        const sentence = `${placeholders}`;

       

        setCurrentConfig(normalized);

      
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleNext = (userAnswers: Record<string, string>) => {
    

    window.parent.postMessage(
      {
        type: "QUESTION_ANSWERED",
        payload: {
          answers: userAnswers,
          
        },
      },
      "*",
    );

    
  };
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
