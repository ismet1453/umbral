import { describe, expect, it } from "vitest";
import {
  createSalt,
  hashCommitment,
  verifyCommitment,
} from "../src/crypto/commitReveal";

describe("commitReveal", () => {
  it("hashes and verifies a commitment", () => {
    const salt = createSalt();
    const commitment = hashCommitment("left", salt);

    expect(verifyCommitment(commitment, "left", salt)).toBe(true);
    expect(verifyCommitment(commitment, "center", salt)).toBe(false);
  });
});
