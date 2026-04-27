export type SoundKind = "new-lead" | "message" | "success";

const FILES: Record<SoundKind, string> = {
  "new-lead": "/sounds/new-lead.wav",
  message: "/sounds/message.wav",
  success: "/sounds/success.wav",
};

const STORAGE_KEY = "okoncrm.sound.enabled";
const VOLUME_KEY = "okoncrm.sound.volume";

const cache = new Map<SoundKind, HTMLAudioElement>();

function getAudio(kind: SoundKind) {
  if (typeof window === "undefined") return null;
  let a = cache.get(kind);
  if (!a) {
    a = new Audio(FILES[kind]);
    a.preload = "auto";
    cache.set(kind, a);
  }
  return a;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
}

export function getSoundVolume() {
  if (typeof window === "undefined") return 0.6;
  const v = localStorage.getItem(VOLUME_KEY);
  return v === null ? 0.6 : Math.max(0, Math.min(1, parseFloat(v)));
}

export function setSoundVolume(v: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOLUME_KEY, String(v));
}

export function playSound(kind: SoundKind) {
  if (!isSoundEnabled()) return;
  const a = getAudio(kind);
  if (!a) return;
  try {
    a.currentTime = 0;
    a.volume = getSoundVolume();
    void a.play().catch(() => {
      /* user hasn't interacted yet — ignore */
    });
  } catch {
    /* noop */
  }
}
