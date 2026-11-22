import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";

import DragItemCard from "./DragItemCard";
import DropZoneCard from "./DropZoneCard";
import type { DragAndDropConfig } from "../../interfaces/drag-and-drop-config.interface";
import { sentenceZoneIds } from "../../game/grade-answers";

export interface RoundResult {
  isCorrect: boolean;
  title: string;
  message: string;
  solution?: string;
}

interface Props {
  config: DragAndDropConfig;
  timeUp: boolean;
  result: RoundResult | null;
  onSettle: (answers: Record<string, string>) => void;
  onContinue: () => void;
  continuing: boolean;
}

export default function DragDropGame({
  config,
  timeUp,
  result,
  onSettle,
  onContinue,
  continuing,
}: Props) {
  const [placedItems, setPlacedItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(config.zones.map((z) => [z.id, []])),
  );
  const [roundConfig, setRoundConfig] = useState(config);
  const [locked, setLocked] = useState(false);

  if (config !== roundConfig) {
    setRoundConfig(config);
    setPlacedItems(Object.fromEntries(config.zones.map((z) => [z.id, []])));
    setLocked(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (locked || result) return;

    const itemId = event.active.id as string;
    const zoneId = event.over?.id as string | undefined;

    if (!zoneId) return;

    const zoneExists = config.zones.some((z) => z.id === zoneId);
    if (!zoneExists) return;

    setPlacedItems((prev) => {
      const updated = { ...prev };

      for (const zone in updated) {
        updated[zone] = updated[zone].filter((id) => id !== itemId);
      }

      updated[zoneId] = [itemId];

      return updated;
    });
  };

  useEffect(() => {
    if (locked || result) return;

    const zoneIds = sentenceZoneIds(config.sentence);
    const allZonesFilled =
      zoneIds.length > 0 &&
      zoneIds.every((zoneId) => (placedItems[zoneId]?.length ?? 0) === 1);

    if (!allZonesFilled && !timeUp) return;

    setLocked(true);

    const answers: Record<string, string> = {};
    zoneIds.forEach((zoneId) => {
      answers[zoneId] = placedItems[zoneId]?.[0] ?? "";
    });

    onSettle(answers);
  }, [placedItems, config, timeUp, locked, result, onSettle]);

  const renderSentence = () => {
    if (!config.sentence) return null;

    return config.sentence.split(/(\[z\d+\])/g).map((part, index) => {
      const match = part.match(/\[(z\d+)\]/);

      if (match) {
        const zoneId = match[1];
        const itemId = placedItems[zoneId]?.[0];
        const item = config.items.find((i) => i.id === itemId);
        const correctItem = config.items.find(
          (candidate) => candidate.correctZoneId === zoneId,
        );
        const status = result
          ? itemId && itemId === correctItem?.id
            ? "correct"
            : "incorrect"
          : undefined;

        return (
          <DropZoneCard
            key={index}
            id={zoneId}
            zone={config.zones.find((z) => z.id === zoneId)!}
            items={item ? [item] : []}
            status={status}
          />
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const placedCount = Object.values(placedItems).flat().length;
  const zoneCount = sentenceZoneIds(config.sentence).length;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="play-area">
        <section className="sentence-sheet">
          <p className="section-label">
            Frase
            <span className="section-count">
              {Math.min(placedCount, zoneCount)}/{zoneCount}
            </span>
          </p>
          <div className="sentence">{renderSentence()}</div>
        </section>

        {result && (
          <section
            className={`result-panel ${result.isCorrect ? "is-correct" : "is-incorrect"}`}
            role="status"
            aria-live="polite"
          >
            <p className="result-kicker">{result.isCorrect ? "Bien" : "Revisa"}</p>
            <h2>{result.title}</h2>
            <p>{result.message}</p>
            {result.solution && (
              <p className="result-solution">{result.solution}</p>
            )}
            <button
              type="button"
              className="continue-button"
              onClick={onContinue}
              disabled={continuing}
            >
              {continuing ? "Cargando la siguiente..." : "Continuar"}
            </button>
          </section>
        )}

        <section className={`word-tray${result ? " is-locked" : ""}`}>
          <p className="section-label">
            Palabras
            <span className="section-count">{config.items.length}</span>
          </p>
          <div className="word-tray-items">
            {config.items.map((item) => {
              const placed = Object.values(placedItems).flat().includes(item.id);

              return (
                <DragItemCard
                  key={item.id}
                  item={item}
                  disabled={placed || locked || Boolean(result)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </DndContext>
  );
}
