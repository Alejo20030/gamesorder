import type { DragItem } from "./drag-item.interface";
import type { DropZone } from "./drop-zone.interface";

export interface DragAndDropConfig {
  sentence?: string;
  items: DragItem[];
  zones: DropZone[];
}
