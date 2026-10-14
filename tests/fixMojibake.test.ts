import { describe, expect, it } from "vitest";
import { countMojibake, repairMojibake } from "../scripts/fix-mojibake";

describe("mojibake repair", () => {
  it("turns double-encoded Latin letters back into UTF-8", () => {
    expect(repairMojibake("\u00c3\u2020ons")).toEqual({ text: "Æons", replacements: 1 });
    expect(repairMojibake("C\u00c3\u00a6sar").text).toBe("Cæsar");
    expect(repairMojibake("\u00c3\u00a9tude").text).toBe("étude");
    expect(repairMojibake("\u00c2\u00a7 4").text).toBe("§ 4");
  });

  it("repairs a curly quote that was encoded twice", () => {
    // â € ™ is the Windows-1252 reading of the UTF-8 bytes of ’.
    expect(repairMojibake("it\u00e2\u20ac\u2122s")).toEqual({ text: "it\u2019s", replacements: 1 });
  });

  it("leaves text that is already UTF-8", () => {
    const fine = "Æons, it\u2019s a \u201creal\u201d em dash \u2014 and Cæsar.";
    expect(repairMojibake(fine)).toEqual({ text: fine, replacements: 0 });
    expect(countMojibake(fine)).toBe(0);
  });

  it("peels a second encoding layer", () => {
    // é encoded twice lands as Ã ƒ Â ©.
    const repaired = repairMojibake("\u00c3\u0192\u00c2\u00a9");
    expect(repaired.text).toBe("é");
    expect(repaired.replacements).toBe(3);
  });
});
