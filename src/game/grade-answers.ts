import type { DragAndDropConfig } from "../interfaces/drag-and-drop-config.interface";

export function sentenceZoneIds(sentence: string | undefined): string[] {
  if (!sentence) return [];
  const ids = [...sentence.matchAll(/\[(z\d+)\]/g)].map((match) => match[1]);
  return [...new Set(ids)];
}

export function gradeAnswers(
  config: DragAndDropConfig,
  answers: Record<string, string>,
): boolean {
  const zoneIds = sentenceZoneIds(config.sentence);
  if (zoneIds.length === 0) return false;

  return zoneIds.every((zoneId) => {
    const correctItem = config.items.find(
      (item) => item.correctZoneId === zoneId,
    );
    return Boolean(correctItem) && answers[zoneId] === correctItem?.id;
  });
}

export function solvedSentence(config: DragAndDropConfig): string {
  if (!config.sentence) return "";

  return config.sentence.replace(/\[(z\d+)\]/g, (_, zoneId: string) => {
    return (
      config.items.find((item) => item.correctZoneId === zoneId)?.text ?? ""
    );
  });
}
