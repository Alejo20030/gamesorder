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
  timeLeft?: number;
}

export default function DragDropGame({ config, onFinish, timeLeft }: Props) {
  const [placedItems, setPlacedItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(config.zones.map((z) => [z.id, []]))
  );

  const [finished, setFinished] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  
  useEffect(() => {
    setPlacedItems(
      Object.fromEntries(config.zones.map((z) => [z.id, []]))
    );
    setFinished(false);
  }, [config]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (finished) return;

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

  }

  useEffect(() => {
      const allZonesFilled = config.zones.every(
        (zone) => placedItems[zone.id].length === 1
      );

      if (!finished && allZonesFilled) {
        setFinished(true);

        const answers: Record<string, string> = {};
        config.zones.forEach((zone) => {
          answers[zone.id] = placedItems[zone.id][0];
        });

        setFinished(true);
        onFinish(answers);
      }
  }, [placedItems, config, finished]);

      
  

  const renderSentence = () => {
    if (!config.sentence) return null;

    return config.sentence.split(/(\[z\d+\])/g).map((part, index) => {
      const match = part.match(/\[(z\d+)\]/);

      if (match) {
        const zoneId = match[1];
        const itemId = placedItems[zoneId]?.[0];
        const item = config.items.find((i) => i.id === itemId);

        return (
          <DropZoneCard
            key={index}
            id={zoneId}
            zone={config.zones.find((z) => z.id === zoneId)!}
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
        <p style={{ textAlign: "center", marginBottom: "10px" }}>
          ⏱ Tiempo restante: <b>{timeLeft}s</b>
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
          {config.items.map((item) => {
            const placed = Object.values(placedItems)
              .flat()
              .includes(item.id);

            return (
              <DragItemCard
                key={item.id}
                item={item}
                disabled={placed || finished}
              />
            );
          })}
        </div>

        
      </div>
    </DndContext>
  );
}