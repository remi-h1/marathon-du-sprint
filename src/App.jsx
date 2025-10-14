import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { playAudio, stopAllAudio, AUDIO_TRACKS } from "./audioManager";

const TOTAL_DISTANCE = 42.195;
const COEF_DEFAULT = 1;

const actions = [
  { id: 1, title: "🏃‍♂️ Très bonne allure !", description: "Parle-nous d’une réussite personnelle ou collective du sprint.", gain: 3 },
  { id: 2, title: "🧱 Le mur du marathon", description: "Quelle difficulté as-tu rencontrée ? Comment la surmonter la prochaine fois ?", gain: 1 },
  { id: 3, title: "💥 Blessure réveillée", description: "Partage une frustration ou un processus à améliorer.", gain: 0 },
  { id: 4, title: "🙌 Encouragements des supporters", description: "Remercie ou félicite quelqu’un dans l’équipe.", gain: 2 },
  { id: 5, title: "🧠 Changement de stratégie", description: "Propose une amélioration concrète pour le prochain sprint.", gain: 2 },
  { id: 6, title: "🚰 Ravitaillement", description: "Tes deux voisins partagent un mot ou une image qui décrit l’ambiance du sprint.", gain: 1 },
];

const IMAGES = {
  RUNNING: { man: "assets/coureur.png", woman: "assets/coureur-woman.png", position: "center 25%" },
  WALL: { man: "assets/wall.png", woman: "assets/wall-woman.png", position: "center 25%" },
  INJURY: { man: "assets/injury.png", woman: "assets/injury-woman.png", position: "center 25%" },
  ENCOURAGEMENTS: { man: "assets/encouragements.png", woman: "assets/encouragements-woman.png", position: "72% 25%" },
  STRATEGY: { man: "assets/strategy.png", woman: "assets/strategy-woman.png", position: "28% 25%" },
  SUPPLIES: { man: "assets/supplies.png", woman: "assets/supplies-woman.png", position: "center 20%" },
  VICTORY: { man: "assets/victory.png", woman: "assets/victory-woman.png", position: "center 25%" },
};

export default function App() {
  const [distance, setDistance] = useState(0);
  const [showTrophy, setShowTrophy] = useState(false);
  const [isFemale, setIsFemale] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [runnerImage, setRunnerImage] = useState(IMAGES.RUNNING.man);
  const [runnerPosition, setRunnerPosition] = useState(IMAGES.RUNNING.position);
  const [undoStack, setUndoStack] = useState([]);
  const [coef, setCoef] = useState(COEF_DEFAULT);
  const roundSmart = (num) => Math.round(num * 100) / 100;

  const handleAction = (gain, id) => {
    changeThemeAction(id);

    const prev = distance;
    const newDistance = Math.min(prev + gain, TOTAL_DISTANCE);
    const gainReel = newDistance - prev;

    setDistance(newDistance);

    if (gainReel > 0) setUndoStack(stack => [...stack, -gainReel]);
    if (newDistance >= TOTAL_DISTANCE) triggerVictory();
  };

  const changeThemeAction = (id) => {
    if (showTrophy) return;

    switch (id) {
      case 1:
        stopAllAudio();
        // playAudio(AUDIO_TRACKS.RUNNING, true, 0.7);
        setRunnerImage(IMAGES.RUNNING.man);
        setRunnerPosition(IMAGES.RUNNING.position);
        break;
      case 2:
        stopAllAudio();
        setRunnerImage(IMAGES.WALL.man);
        setRunnerPosition(IMAGES.WALL.position);
        break;
      case 3:
        stopAllAudio();
        setRunnerImage(IMAGES.INJURY.man);
        setRunnerPosition(IMAGES.INJURY.position);
        break;
      case 4:
        stopAllAudio();
        // playAudio(AUDIO_TRACKS.ENCOURAGEMENTS, true, 0.9);
        setRunnerImage(IMAGES.ENCOURAGEMENTS.man);
        setRunnerPosition(IMAGES.ENCOURAGEMENTS.position);
        break;
      case 5:
        stopAllAudio();
        setRunnerImage(IMAGES.STRATEGY.man);
        setRunnerPosition(IMAGES.STRATEGY.position);
        break;
      case 6:
        stopAllAudio();
        setRunnerImage(IMAGES.SUPPLIES.man);
        setRunnerPosition(IMAGES.SUPPLIES.position);
        break;
      default:
        stopAllAudio();
        break;
    }
  };

  const triggerVictory = () => {
    confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
    playAudio(AUDIO_TRACKS.VICTORY, false, 0.7);
    setShowTrophy(true);
  };

  // Musique de départ
  useEffect(() => {
    if (distance === 0) playAudio(AUDIO_TRACKS.START, true, 0.5);
    if (distance === TOTAL_DISTANCE) {
      stopAllAudio();
      setRunnerImage(IMAGES.VICTORY.man);
    }
  }, [distance]);

  // Gestion des raccourcis clavier pour modifier le coefficient
  useEffect(() => {
    let cPressed = false;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      }

      if (e.key.toLowerCase() === "c") cPressed = true;

      if (cPressed) {
        let delta = 0;
        if (e.key === "ArrowUp") delta = 0.5;
        if (e.key === "ArrowDown") delta = -0.5;
        if (e.key === "ArrowRight") delta = 0.25;
        if (e.key === "ArrowLeft") delta = -0.25;

        if (delta !== 0) {
          setCoef((prev) => roundSmart(Math.max(prev + delta, 0)));
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key.toLowerCase() === "q") cPressed = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Préchargement images
  useEffect(() => {
    Object.values(IMAGES).forEach((img) => {
      [img.man, img.woman].forEach((src) => {
        const preload = new Image();
        preload.src = src;
      });
    });
  }, []);

  const resetRace = () => {
    stopAllAudio();
    setShowTrophy(false);
    setRunnerImage(IMAGES.RUNNING.man);
    setRunnerPosition(IMAGES.RUNNING.position);
    playAudio(AUDIO_TRACKS.START, true, 0.5);
    setTimeout(() => setDistance(0), 200);
    setUndoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || showTrophy) return;
    const lastUndo = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setDistance((prev) => Math.max(prev + lastUndo, 0));
  };

  const progress = (distance / TOTAL_DISTANCE) * 100;

  // Flip homme/femme
  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setIsFemale((prev) => !prev); // on change l’état directement
    setTimeout(() => setIsFlipping(false), 500); // durée synchro avec la rotation
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen w-full bg-gradient-to-r from-blue-100 to-indigo-200 overflow-hidden">
      {/* 🔙 Bouton retour discret */}
      { undoStack.length > 0 && (
      <button
        onClick={handleUndo}
        className="absolute top-4 right-4 text-indigo-700 bg-white/70 hover:bg-white border border-indigo-200 px-3 py-1 rounded-lg shadow-sm text-sm font-semibold z-30"
        title="Annuler la dernière action"
      >
        ↩️ Retour
      </button>
      )}

      {/* Overlay victoire */}
      <AnimatePresence>
        {showTrophy && (
          <motion.div
            key="victory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-9xl drop-shadow-lg"
            >
              🏆
            </motion.div>
            <p className="mt-6 text-4xl font-bold text-yellow-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] text-center">
              Victoire ! Marathon terminé 🎉
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coefficient affiché discrètement */}
      <div className="absolute bottom-4 right-4 text-sm font-semibold text-indigo-800 bg-white/60 px-3 py-1 rounded-lg shadow">
        ⚙️ Coef : {coef}
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col items-center justify-start min-h-screen w-full p-6 relative z-10">
        <h1 className="text-4xl font-bold mb-6 text-indigo-700 text-center">Marathon du Sprint 72 🏁</h1>

        {/* Image du coureur avec flip */}
        <div
          className="relative mb-8 cursor-pointer flex items-center justify-center w-full"
          style={{
            perspective: "1000px",
            height: "22rem",
          }}
          onClick={handleFlip}
        >
          <div
            className="relative w-[40rem] h-[22rem]"
            style={{
              transformStyle: "preserve-3d",
              transform: isFemale ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 0.5s ease-in-out",
            }}
          >
            {/* Face avant (homme) */}
            <img
              src={runnerImage}
              alt="runner man"
              className="absolute inset-0 w-full h-full object-contain select-none
              pointer-events-none"
              style={{
                // objectPosition: runnerPosition,
                backfaceVisibility: "hidden",
                imageRendering: "crisp-edges",
              }}
            />

            {/* Face arrière (femme) */}
            <img
              src={runnerImage.replace(".png", "-woman.png")}
              alt="runner woman"
              className="absolute inset-0 w-full h-full object-contain select-none
              pointer-events-none"
              style={{
                // objectPosition: runnerPosition,
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                imageRendering: "crisp-edges",
              }}
            />
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full max-w-3xl">
          <div className="flex justify-between mb-2 text-indigo-700 font-semibold">
            <span>{distance} km</span>
            <span>{TOTAL_DISTANCE} km</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-6">
            <motion.div
              className="bg-indigo-600 h-6 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <div className="mt-2 text-sm text-indigo-800 text-center font-semibold">
            {progress.toFixed(1)}% du marathon
          </div>
        </div>

        {/* Actions bien positionnées sous la barre */}
        <div className="mt-8 w-full max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((a) => (
              <motion.div
                key={a.id}
                whileHover={{ scale: 1.03 }}
                onClick={() => changeThemeAction(a.id)}
                className={`border border-indigo-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition ${
                  showTrophy ? "opacity-45 blur-sm" : "opacity-100"
                }`}
              >
                <h3 className="text-lg font-semibold text-indigo-700">{a.title}</h3>
                <p className="text-sm text-gray-700 mt-2">{a.description}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(roundSmart(a.gain * coef), a.id);
                  }}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
                >
                  +{roundSmart(a.gain * coef)} km
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={resetRace}
          className="mt-8 px-6 py-3 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-xl text-indigo-700 font-semibold shadow-md z-30"
        >
          🔁 Réinitialiser la course
        </button>
      </div>
    </div>
  );
}
