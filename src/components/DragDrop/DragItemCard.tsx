import { useDraggable } from "@dnd-kit/core";
import { DragItem } from "../../interfaces/drag-item.interface";

interface Props {
  item: DragItem;
  disabled?: boolean;
}

export default function DragItemCard({ item, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`word-tile ${disabled ? "is-used" : ""} ${
        transform ? "is-dragging" : ""
      }`}
      style={style}
    >
      {item.text}
    </div>
  );
}
