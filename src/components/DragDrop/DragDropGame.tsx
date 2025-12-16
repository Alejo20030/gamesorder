import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

import DragItemCard from "./DragItemCard";
import DropZoneCard from "./DropZoneCard";

import type { DragAndDropConfig } from "../../interfaces/drag-and-drop-config.interface";

interface Props {
  config: DragAndDropConfig;
  onFinish: (answers: Record<string, string>) => void;
}

export default function DragDropGame({ config, onFinish }: Props) {
  const [placedItems, setPlacedItems] = useState<Record<string, string[]>>(
    () => Object.fromEntries(config.zones.map(z => [z.id, []]))
  );

  const [timeLeft, setTimeLeft] = useState(config.time ?? 30);
  const [finished, setFinished] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  
  useEffect(() => {
    if (finished) return;

    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, finished]);

  
  const handleDragEnd = (event: DragEndEvent) => {
    if (finished) return;

    const itemId = event.active.id as string;
    const zoneId = event.over?.id as string;

    if (!zoneId) return;

    setPlacedItems(prev => {
      const updated: Record<string, string[]> = {};

      for (const zone in prev) {
        updated[zone] = prev[zone].filter(id => id !== itemId);
      }

      updated[zoneId].push(itemId);

      const allZonesFilled = config.zones.every(
        zone => updated[zone.id].length > 0
      );

      if (allZonesFilled) {
        setFinished(true);
      }

      return updated;
    });
  };

  
  const handleNext = () => {
    const answers: Record<string, string> = {};

    for (const zone in placedItems) {
      if (placedItems[zone][0]) {
        answers[zone] = placedItems[zone][0];
      }
    }

    onFinish(answers);
  };

 
  const renderSentence = () => {
    return config.sentence.split(/(\[z\d+\])/g).map((part, index) => {
      const match = part.match(/\[(z\d+)\]/);

      if (match) {
        const zoneId = match[1];
        const itemId = placedItems[zoneId][0];
        const item = config.items.find(i => i.id === itemId);

        return (
          <DropZoneCard
            key={index}
            id={zoneId}
            zone={config.zones.find(z => z.id === zoneId)!}
            items={item ? [item] : []}
          />
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>
          {config.title}
        </h1>

        <p style={{ textAlign: "center", marginBottom: "10px" }}>
          ⏱ Tiempo restante: <b>{timeLeft}s</b>
        </p>

        <p style={{ textAlign: "center", marginBottom: "30px" }}>
          {config.instruction}
        </p>

        <div
          style={{
            textAlign: "center",
            fontSize: "20px",
            marginBottom: "30px",
          }}
        >
          {renderSentence()}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {config.items.map(item => {
            const placed = Object.values(placedItems).flat().includes(item.id);

            return (
              <DragItemCard
                key={item.id}
                item={item}
                disabled={placed || finished}
              />
            );
          })}
        </div>

        {finished && (
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              onClick={handleNext}
              style={{
                padding: "10px 28px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: "#4f46e5",
                color: "white",
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
}
