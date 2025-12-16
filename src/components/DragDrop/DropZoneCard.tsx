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
        inline-block
        min-w-[110px]
        px-2 py-1
        text-center
        font-semibold
        border-b-2
        rounded-md
        transition-all
        duration-200

        ${word ? "border-indigo-500 text-indigo-700" : "border-gray-400 text-gray-600"}
        ${isOver ? "bg-indigo-100 shadow-sm scale-[1.03]" : ""}
      `}
    >
      {word ?? ""}
    </span>
  );
}
