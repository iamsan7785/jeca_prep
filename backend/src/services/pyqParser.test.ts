import { describe, expect, it } from "vitest";
import { parseJeCaPdfText } from "./pyqParser.js";

describe("parseJeCaPdfText", () => {
  it("extracts official paper questions and option values from a readable JECA PDF text block", () => {
    const source = `
      JECA-2023
      Category-1 (Q. 1 to 80)
      1. What is the output of the following program ?
      #include <stdio.h>
      (A) 41, 42.000000 (B) 41, 42
      (C) 41, 41.000000 (D) 41, 41

      2. What is the output of the following program ?
      #include <stdio.h>
      (A) -6, -7.000000 (B) -5, -6
      (C) -6, -6.000000 (D) -6, -6

      Category-2 (Q. 81 to 100)
      81. In C programming, which file operations are valid ?
      (A) fopen (B) fclose
      (C) fprintf (D) fscanf
    `;

    const parsed = parseJeCaPdfText(source, 2023);

    expect(parsed.paper.year).toBe(2023);
    expect(parsed.questions).toHaveLength(3);
    expect(parsed.questions[0].questionNumber).toBe(1);
    expect(parsed.questions[0].questionText).toContain("What is the output");
    expect(parsed.questions[0].optionA).toContain("41, 42.000000");
    expect(parsed.questions[0].marks).toBe(1);
    expect(parsed.questions[0].negativeMarks).toBe(0.25);
    expect(parsed.questions[2].questionNumber).toBe(81);
    expect(parsed.questions[2].marks).toBe(2);
    expect(parsed.questions[2].negativeMarks).toBe(0);
    expect(parsed.questions[0].correctOption).toBeNull();
  });
});
