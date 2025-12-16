import { useEffect, useState } from "react";
import DragDropGame from "./components/DragDrop/DragDropGame";
import { DragAndDropConfig } from "./interfaces/drag-and-drop-config.interface";
import "./index.css";

export default function App() {
  const [questions, setQuestions] = useState<DragAndDropConfig[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    async function loadGame() {
      try {
        const data = await import("./game.config.json");
        setQuestions(data.default.questions);
      } catch (err) {
        console.error("Error cargando configuración:", err);
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, []);

  const handleNext = (userAnswers: Record<string, string>) => {
    setAnswers(prev => [...prev, userAnswers]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Cargando juego…
      </div>
    );
  }

  /* ================= RESULTADO FINAL ================= */
  if (showResult && !showAnswers) {
    let score = 0;

    answers.forEach((ans, index) => {
      const question = questions[index];

      const allZonescorrect = question.zones.every(zone => {
        const userItemId = ans[zone.id];


        const correctItem = question.items.find(
          item => item.id === userItemId && item.correctZoneId === zone.id
        );

        return !!correctItem;
      }
        
      );

      if (allZonescorrect) score++;
    });

    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>Resultado final</h2>

        <p>
          Respuestas correctas: <b>{score}</b> de{" "}
          <b>{questions.length}</b>
        </p>

        <h3>Calificación: {percentage}%</h3>

        <button
          onClick={() => setShowAnswers(true)}
          style={{
            marginTop: "30px",
            padding: "10px 26px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            cursor: "pointer",
          }}
        >
          Ver respuestas correctas
        </button>
      </div>
    );
  }

  /* ================= VER RESPUESTAS ================= */
  if (showAnswers) {
    return (
      <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
          Corrección del ejercicio
        </h2>

        {questions.map((q, index) => {
          const userAnswer = answers[index];

          return (
            <div
              key={q.id}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "30px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
            >
              <h3>{q.title}</h3>
              <p style={{ marginBottom: "16px" }}>{q.sentence}</p>

              {q.items.map(item => {
                const userItemId = userAnswer[item.correctZoneId];
                const userItem = q.items.find(i => i.id === userItemId);

                return (
                  <p key={item.id}>
                    <b>{item.correctZoneId}:</b>{" "}
                    {userItem?.text ?? "—"}{" "}
                    {userItemId === item.id
                      ? "✅"
                      : `❌ (Correcta: ${item.text})`}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "850px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Pregunta {currentIndex + 1} de {questions.length}
        </h2>

        <DragDropGame
          key={currentIndex} 
          config={questions[currentIndex]}
          onFinish={handleNext}
        />
      </div>
    </div>
  );
}
