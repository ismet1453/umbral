/** Stable pseudo-wallet id for name-only (guest) play — no Phantom required. */
export function guestWalletForName(hunterName: string): string {
  const n = hunterName.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < n.length; i++) {
    h = (Math.imul(31, h) + n.charCodeAt(i)) | 0;
  }
  return `guest:${Math.abs(h).toString(36)}`;
}

export function isGuestWallet(address: string): boolean {
  return address.startsWith("guest:");
}

export function resolvePlayWallet(
  hunterName: string,
  phantomAddress: string | null
): string {
  return phantomAddress ?? guestWalletForName(hunterName);
}
