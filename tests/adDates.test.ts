import { describe, expect, it } from "vitest";
import { adDates } from "../src/lib/adDates";

describe("adDates", () => {
  it("turns a circa year into AD", () => {
    expect(adDates("c. 340–397")).toBe("AD 340–397");
    expect(adDates("c. 213–c. 270")).toBe("AD 213–270");
    expect(adDates("d. c. 311")).toBe("d. AD 311");
    expect(adDates("fl. c. 96")).toBe("fl. AD 96");
  });

  it("marks a bare year as AD, and leaves centuries and BC alone", () => {
    expect(adDates("354–430")).toBe("AD 354–430");
    expect(adDates("d. 258")).toBe("d. AD 258");
    expect(adDates("325–787")).toBe("AD 325–787");
    expect(adDates("fl. 2nd c.")).toBe("fl. 2nd c.");
    expect(adDates("late 1st–early 2nd c.")).toBe("late 1st–early 2nd c.");
    expect(adDates("c. 4 BC")).toBe("c. 4 BC");
    expect(adDates("")).toBe("");
  });
});
