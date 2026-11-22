import { useCallback, useEffect, useRef, useState } from "react";
import DragDropGame, {
  type RoundResult,
} from "./components/DragDrop/DragDropGame";
import type { DragAndDropConfig } from "./interfaces/drag-and-drop-config.interface";
import { buildConfig, type Question } from "./game/build-config";
import { gradeAnswers, solvedSentence } from "./game/grade-answers";
import "./index.css";

const GAME_VERSION = "v1.2";

interface GameData {
  timeLimit: number;
  attempt: number;
  currentQuestionId: string;
}

function VersionMark({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={`version-mark${floating ? " is-floating" : ""}`}
      aria-label={`Versión ${GAME_VERSION}`}
    >
      <span>versión</span>
      {GAME_VERSION}
    </div>
  );
}

function GameLoading() {
  return (
    <div className="game-loading">
      <VersionMark floating />
      <div className="game-loading-blobs" aria-hidden="true">
        <div className="blob blob-blue"></div>
        <div className="blob blob-purple"></div>
        <div className="blob blob-pink"></div>
      </div>

      <div className="game-loading-content">
        <div className="game-loading-brain">
          <span>🧠</span>
        </div>

        <h1>Pensando en una explicación...</h1>
        <p>Preparando tu desafío mental</p>

        <div className="loading-dots" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export default function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentConfig, setCurrentConfig] = useState<DragAndDropConfig | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<Record<
    string,
    string
  > | null>(null);
  const [continuing, setContinuing] = useState(false);
  const loadedQuestionIdRef = useRef<string | null>(null);

  const notifyHostSkipped = useCallback(
    (questionId: string, questionText: string, reason: string) => {
      window.parent.postMessage(
        {
          answeredCorrectly: false,
          questionId,
          questionText,
          userAnswer: JSON.stringify({ skipped: true, reason }),
        },
        "*",
      );
    },
    [],
  );

  const handleReloadWords = useCallback(() => {
    if (!currentQuestion || result) return;
    const next = buildConfig(currentQuestion);
    if (next.ok) {
      setLoadError(null);
      setResult(null);
      setPendingAnswers(null);
      setCurrentConfig(next.config);
    } else {
      setLoadError(next.reason);
    }
  }, [currentQuestion, result]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      const incoming = (data as { currentQuestion?: Question }).currentQuestion;
      if (!incoming?._id) return;
      if (incoming._id === loadedQuestionIdRef.current) return;

      console.log("Mensaje recibido del host:", data);
      loadedQuestionIdRef.current = incoming._id;
      setCurrentQuestion(incoming);
      setTimeLeft(300);
      setLoadError(null);
      setResult(null);
      setPendingAnswers(null);
      setContinuing(false);

      setGameData({
        timeLimit: 300,
        attempt: 1,
        currentQuestionId: incoming._id,
      });

      const next = buildConfig(incoming);
      if (!next.ok) {
        setCurrentConfig(null);
        setLoadError(next.reason);
        return;
      }

      setCurrentConfig(next.config);
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

  const handleSettle = useCallback(
    (userAnswers: Record<string, string>) => {
      if (!currentConfig) return;

      const isCorrect = gradeAnswers(currentConfig, userAnswers);
      const unfinished = Object.values(userAnswers).some((answer) => !answer);
      const solution = solvedSentence(currentConfig);

      setPendingAnswers(userAnswers);
      setResult({
        isCorrect,
        title: isCorrect ? "¡Correcto!" : "Incorrecto",
        message: isCorrect
          ? "La frase quedó bien armada."
          : unfinished
            ? "Se acabó el tiempo."
            : "Esta no era la frase.",
        solution: isCorrect ? undefined : solution,
      });
    },
    [currentConfig],
  );

  const handleContinue = useCallback(() => {
    if (!currentConfig || !gameData || !result || !pendingAnswers || continuing) {
      return;
    }

    setContinuing(true);
    window.parent.postMessage(
      {
        answeredCorrectly: result.isCorrect,
        questionId: gameData.currentQuestionId ?? "unknown",
        questionText: currentConfig.sentence,
        userAnswer: JSON.stringify(pendingAnswers),
      },
      "*",
    );
  }, [continuing, currentConfig, gameData, pendingAnswers, result]);

  useEffect(() => {
    if (!currentConfig || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameData?.currentQuestionId, currentConfig, result]);

  if (!gameData) {
    return <GameLoading />;
  }

  if (!currentConfig) {
    return (
      <div className="game-shell">
        <div className="game-top">
          <p className="game-kicker">Orden de palabras</p>
          <VersionMark />
        </div>
        <div className="status-card">
          <p className="game-kicker">No se pudo armar</p>
          <h2>Esta pregunta no entra en el juego</h2>
          <p>
            {loadError ?? "No fue posible generar el juego con esta pregunta."}
          </p>
          <button
            type="button"
            className="continue-button"
            onClick={() =>
              notifyHostSkipped(
                gameData.currentQuestionId,
                currentQuestion?.questionText ?? "unknown",
                loadError ?? "unsupported question",
              )
            }
          >
            Continuar con la siguiente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-shell">
      <header className="game-top">
        <div>
          <p className="game-kicker">Orden de palabras</p>
          <h1 className="game-title">Completa la frase</h1>
          <p className="game-lead">
            Arrastra cada palabra al espacio correcto para completar la frase.
          </p>
        </div>
        <div className="game-actions">
          <VersionMark />
          <div
            className={`timer-pill${timeLeft <= 30 ? " is-low" : ""}`}
            role="timer"
            aria-live="polite"
            aria-label={`Tiempo restante ${formatTime(timeLeft)}`}
          >
            <span>Tiempo</span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
          <button
            type="button"
            onClick={handleReloadWords}
            className="reload-button"
            aria-label="Cambiar palabras"
            disabled={Boolean(result)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 0 1 15.3-6.3L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15.3 6.3L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Cambiar palabras
          </button>
        </div>
      </header>

      <DragDropGame
        config={currentConfig}
        timeUp={timeLeft === 0}
        result={result}
        onSettle={handleSettle}
        onContinue={handleContinue}
        continuing={continuing}
      />
    </div>
  );
}
