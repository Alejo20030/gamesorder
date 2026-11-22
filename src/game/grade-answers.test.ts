import { describe, expect, it } from "vitest";
import type { DragAndDropConfig } from "../interfaces/drag-and-drop-config.interface";
import { gradeAnswers, sentenceZoneIds, solvedSentence } from "./grade-answers";

const config: DragAndDropConfig = {
  sentence: "La [z1] ocurre en las [z2]",
  zones: [
    { id: "z1", label: "" },
    { id: "z2", label: "" },
  ],
  items: [
    { id: "a", text: "fotosíntesis", correctZoneId: "z1" },
    { id: "b", text: "hojas", correctZoneId: "z2" },
    { id: "c", text: "oxígeno", correctZoneId: "wrong" },
  ],
};

describe("sentenceZoneIds", () => {
  it("returns each blank once, in order", () => {
    expect(sentenceZoneIds("La [z1] y otra [z1] en [z2]")).toEqual([
      "z1",
      "z2",
    ]);
  });
});

describe("gradeAnswers", () => {
  it("accepts the correct word in every blank", () => {
    expect(gradeAnswers(config, { z1: "a", z2: "b" })).toBe(true);
  });

  it("rejects a distractor or an empty blank", () => {
    expect(gradeAnswers(config, { z1: "c", z2: "b" })).toBe(false);
    expect(gradeAnswers(config, { z1: "a", z2: "" })).toBe(false);
  });
});

describe("solvedSentence", () => {
  it("fills the blanks with the correct words", () => {
    expect(solvedSentence(config)).toBe("La fotosíntesis ocurre en las hojas");
  });
});
