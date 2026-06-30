import { createHash, randomBytes } from "node:crypto";
import type { Direction } from "../types";

export function createSalt(): string {
  return randomBytes(16).toString("hex");
}

export function buildCommitPayload(direction: Direction, salt: string): string {
  return `${direction}:${salt}`;
}

export function hashCommitment(direction: Direction, salt: string): string {
  return createHash("sha256")
    .update(buildCommitPayload(direction, salt))
    .digest("hex");
}

export function verifyCommitment(
  commitment: string,
  direction: Direction,
  salt: string
): boolean {
  return hashCommitment(direction, salt) === commitment;
}
