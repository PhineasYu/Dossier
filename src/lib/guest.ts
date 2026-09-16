const GUEST_KEY = "dossier-guest";

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuestMode() {
  try {
    window.localStorage.setItem(GUEST_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function leaveGuestMode() {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}
