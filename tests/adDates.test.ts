import { describe, expect, it } from "vitest";
import { adDates } from "../src/lib/adDates";

describe("adDates", () => {
  it("turns a circa year into AD", () => {
    expect(adDates("c. 340–397")).toBe("AD 340–397");
    expect(adDates("c. 213–c. 270")).toBe("AD 213–270");
    expect(adDates("d. c. 311")).toBe("died AD 311");
    expect(adDates("fl. c. 96")).toBe("fl. AD 96");
  });

  it("marks a bare year as AD, spells a century, and leaves BC alone", () => {
    expect(adDates("354–430")).toBe("AD 354–430");
    expect(adDates("d. 258")).toBe("died AD 258");
    expect(adDates("d. c. 110")).toBe("died AD 110");
    expect(adDates("325–787")).toBe("AD 325–787");
    expect(adDates("fl. mid-3rd c.")).toBe("fl. mid-3rd century AD");
    expect(adDates("fl. 3rd–5th c.")).toBe("fl. 3rd–5th centuries AD");
    expect(adDates("fl. early 2nd c.")).toBe("fl. early 2nd century AD");
    expect(adDates("late 1st–early 2nd c.")).toBe("late 1st–early 2nd centuries AD");
    expect(adDates("1st–9th c.")).toBe("1st–9th centuries AD");
    expect(adDates("c. 4 BC")).toBe("c. 4 BC");
    expect(adDates("")).toBe("");
  });
});
