import { useDroppable } from "@dnd-kit/core";
import type { DropZone } from "../../interfaces/drop-zone.interface";
import type { DragItem } from "../../interfaces/drag-item.interface";

interface Props {
  id: string;
  zone: DropZone;
  items: DragItem[];
  status?: "correct" | "incorrect";
}

export default function DropZoneCard({ id, items, status }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const word = items[0]?.text;

  return (
    <span
      ref={setNodeRef}
      className={`blank ${word ? "is-filled" : ""} ${isOver ? "is-over" : ""} ${
        status ? `is-${status}` : ""
      }`}
      aria-label={
        status === "correct"
          ? `Correcto: ${word}`
          : status === "incorrect"
            ? `Incorrecto${word ? `: ${word}` : ""}`
            : word
              ? `Palabra colocada: ${word}`
              : "Espacio vacío"
      }
    >
      {word ?? <span className="blank-hint">···</span>}
    </span>
  );
}
