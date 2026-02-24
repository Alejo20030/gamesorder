import type { DragItem } from "./drag-item.interface";
import type { DropZone } from "./drop-zone.interface";

export interface DragAndDropConfig {
  title: string;
  instruction: string;
  sentence?: string;
  items: DragItem[];
  zones: DropZone[];
}