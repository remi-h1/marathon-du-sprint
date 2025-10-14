// src/audioManager.ts

export const AUDIO_TRACKS = {
  START: "/assets/Conquest_of_paradise_Vangelis.mp3",
  RUNNING: "/assets/jogging-outside-for-marathon-training-2.mp3",
  ENCOURAGEMENTS: "/assets/024420_marathon-germany-75553.mp3",
  VICTORY: "/assets/victory.m4a",
};

const audioCache = new Map<string, HTMLAudioElement>();
let currentSrc: string | null = null;

/**
 * Joue une piste audio, en remplaçant proprement la précédente
 */
export async function playAudio(src: string, loop = false, volume = 0.6) {
  if (!src) return;

  // Si c’est déjà la même piste en lecture, on ne relance pas
  if (currentSrc === src) return;

  // Stoppe proprement toutes les autres pistes
  stopAllAudio();

  // Attente courte pour éviter la collision pause/play
  await new Promise((r) => setTimeout(r, 100));

  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    audioCache.set(src, audio);
  }

  currentSrc = src;

  try {
    await audio.play();
  } catch (err) {
    console.warn("Impossible de jouer l’audio :", err);
  }
}

/**
 * Stoppe toutes les pistes audio
 */
export function stopAllAudio() {
  audioCache.forEach((audio) => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  currentSrc = null;
}
