import { describe, expect, it } from "vitest";
import {
  buildConfig,
  cleantext,
  createSentenceWithBlanks,
  getKeywords,
  tokenize,
  type Question,
} from "./build-config";

function makeQuestion(
  explanations: string[],
  questionText = "¿Pregunta de prueba?",
): Question {
  return {
    _id: "q1",
    questionText,
    explanations: explanations.map((explanationText, index) => ({
      _id: `e${index + 1}`,
      explanationText,
      questionId: "q1",
    })),
  };
}

describe("cleantext", () => {
  it("turns markdown into the words the player should see", () => {
    const plain = cleantext(
      "La **fotosíntesis** ocurre en las hojas\n\n![diagrama](https://cdn.example/a.png)",
    );

    expect(plain).toBe("La fotosíntesis ocurre en las hojas diagrama");
    expect(plain).not.toContain("https://");
    expect(plain).not.toContain("**");
  });

  it("keeps a bare URL, including underscores", () => {
    const url = "https://github.com/BasicWolf/hexagonal_architecture_django";
    expect(cleantext(url)).toBe(url);
  });
});

describe("tokenize", () => {
  it("splits a normal sentence into words", () => {
    expect(tokenize("La fotosíntesis ocurre en las hojas")).toEqual([
      "la",
      "fotosíntesis",
      "ocurre",
      "en",
      "las",
      "hojas",
    ]);
  });

  it("keeps domain dots so keywords can match the original sentence", () => {
    expect(tokenize("Visita github.com para aprender")).toContain("github.com");
  });
});

describe("getKeywords", () => {
  it("returns up to two keywords from a normal sentence", () => {
    const keywords = getKeywords(
      "La fotosíntesis ocurre en las hojas verdes",
      2,
    );

    expect(keywords).toHaveLength(2);
    keywords.forEach((keyword) => {
      expect(
        "La fotosíntesis ocurre en las hojas verdes".toLowerCase(),
      ).toContain(keyword.toLowerCase());
    });
  });

  it("returns the full URL when the explanation has no spaces", () => {
    const url = "https://github.com/BasicWolf/hexagonal-architecture-django";
    expect(getKeywords(url, 2)).toEqual([url]);
  });
});

describe("createSentenceWithBlanks", () => {
  it("replaces selected words with blank markers", () => {
    const sentence = createSentenceWithBlanks(
      "La fotosíntesis ocurre en las hojas",
      ["fotosíntesis", "hojas"],
    );

    expect(sentence).toContain("[z1]");
    expect(sentence).toContain("[z2]");
    expect(sentence).not.toMatch(/fotosíntesis/i);
    expect(sentence).not.toMatch(/hojas/i);
  });

  it("creates a blank for a URL with no spaces", () => {
    const url = "https://github.com/BasicWolf/hexagonal-architecture-django";
    const keywords = getKeywords(url, 2);
    const sentence = createSentenceWithBlanks(url, keywords);

    expect(sentence).toBe("[z1]");
  });

  it("creates a blank for a domain that contains dots", () => {
    const sentence = createSentenceWithBlanks(
      "Visita github.com para aprender",
      ["github.com"],
    );

    expect(sentence).toBe("Visita [z1] para aprender");
  });
});

describe("buildConfig", () => {
  it("builds blanks for a normal prose explanation", () => {
    const result = buildConfig(
      makeQuestion([
        "La fotosíntesis ocurre en las hojas",
        "El oxígeno se libera como subproducto",
      ]),
      { shuffle: false },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.config.sentence).toMatch(/\[z\d+\]/);
    expect(result.config.zones.length).toBeGreaterThan(0);
    expect(
      result.config.items.some((item) => item.correctZoneId !== "wrong"),
    ).toBe(true);
  });

  it("builds a playable config when explanations are URLs without spaces", () => {
    const firstUrl =
      "https://github.com/BasicWolf/hexagonal-architecture-django";
    const result = buildConfig(
      makeQuestion(
        [
          firstUrl,
          "https://github.com/thombergs/buckpal",
          "https://github.com/CodelyTV/typescript-ddd-example",
        ],
        "¿Ejemplo práctico de creación de una aplicación implementando arquitectura hexagonal?",
      ),
      { shuffle: false },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.config.sentence).toContain("[z1]");
    expect(result.config.sentence).not.toBe(firstUrl);
    expect(result.config.zones).toHaveLength(1);

    const correctItem = result.config.items.find(
      (item) => item.correctZoneId === "z1",
    );
    expect(correctItem?.text).toBe(firstUrl);

    const distractors = result.config.items.filter(
      (item) => item.correctZoneId === "wrong",
    );
    expect(distractors.length).toBeGreaterThan(0);
    distractors.forEach((item) => {
      expect(item.text).toMatch(/^https:\/\//);
      expect(item.text).toContain(".");
    });
  });

  it("builds blanks when a sentence includes a domain with dots", () => {
    const result = buildConfig(
      makeQuestion([
        "Visita github.com para ver el ejemplo",
        "buckpal.io también es útil",
      ]),
      { shuffle: false },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.config.sentence).toMatch(/\[z\d+\]/);

    const correctTexts = result.config.items
      .filter((item) => item.correctZoneId !== "wrong")
      .map((item) => item.text);

    const sentence = result.config.sentence ?? "";
    correctTexts.forEach((text) => {
      expect(sentence.toLowerCase()).not.toContain(text.toLowerCase());
    });
  });

  it("fails when there are no valid explanations", () => {
    const result = buildConfig(makeQuestion(["", "   "]));

    expect(result).toEqual({
      ok: false,
      reason: "La pregunta no tiene explicaciones válidas.",
    });
  });
});
