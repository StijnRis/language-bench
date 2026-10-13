import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { implDir, readSource } from "./discover";
import type { Language } from "./schema";

describe("implDir", () => {
  it("uses the shared source unless an @<minVersion> folder applies", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "lb-"));
    const base = path.join(root, "languages", "x", "impl", "p");
    for (const d of ["", "@2", "@10"]) {
      fs.mkdirSync(path.join(base, d), { recursive: true });
      fs.writeFileSync(path.join(base, d, "main.x"), d || "shared");
    }
    fs.mkdirSync(path.join(base, "@5")); // no source file inside: ignored
    const lang = { id: "x", sourceFile: "main.x" } as Language;
    expect(readSource(root, lang, "p", "1.9")).toBe("shared");
    expect(readSource(root, lang, "p", "2")).toBe("@2");
    expect(readSource(root, lang, "p", "9.9")).toBe("@2"); // numeric, not textual, comparison
    expect(readSource(root, lang, "p", "10.1")).toBe("@10");
    expect(readSource(root, lang, "p")).toBe("shared");
    expect(implDir(root, lang, "q", "3")).toBe(path.join(root, "languages", "x", "impl", "q"));
  });
});
