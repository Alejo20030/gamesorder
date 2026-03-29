import { useDroppable } from "@dnd-kit/core";
import type { DropZone } from "../../interfaces/drop-zone.interface";
import type { DragItem } from "../../interfaces/drag-item.interface";

interface Props {
  id: string;
  zone: DropZone;
  items: DragItem[];
}

export default function DropZoneCard({ id, items }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const word = items[0]?.text;

  return (
    <span
      ref={setNodeRef}
      className={`
        inline-flex
        items-center
        justify-center
        min-w-[120px]
        min-h-[40px]
        px-3 py-1
        text-center
        font-semibold
        rounded-lg
        border-none
        transition-all
        duration-200

        ${word 
          ? "border-indigo-500 text-indigo-700 bg-indigo-50" 
          : "border-dashed border-gray-400 text-gray-400 bg-gray-50"}
          
        ${isOver ? "bg-indigo-100 scale-105 shadow-md" : ""}
      `}
    >
      {word ?? "______"}
    </span>
  );
}
