import React, { useEffect, useRef, useState } from "react";

function Button({ children, onClick, variant = "default", type = "button" }) {
  const base =
    "rounded-2xl px-4 py-2 text-sm font-medium shadow active:translate-y-[1px] transition";
  const variants = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800",
    subtle: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  };
  return (
    <button type={type} onClick={onClick} className={base + " " + variants[variant]}>
      {children}
    </button>
  );
}

/**
 * Precision Stopper
 * - Ein Marker läuft horizontal hin und her.
 * - Klicke oder drücke SPACE/ENTER, um zu stoppen.
 * - Je näher an der Mitte (50%), desto mehr Punkte.
 * - 5 Runden, steigende Geschwindigkeit. Highscore wird gespeichert.
 */
export default function PrecisionStopper({ onBack }) {
  const [round, setRound] = useState(1);          // 1..5
  const [running, setRunning] = useState(false);  // bewegt sich der Marker?
  const [stoppedAt, setStoppedAt] = useState(null); // 0..1, wo gestoppt
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("stopper_best") || 0));

  const posRef = useRef(0);   // 0..1
  const velRef = useRef(0.6); // Einheit: fraction per second
  const lastT = useRef(0);
  const animId = useRef(null);

  // Geschwindigkeit je Runde
  const speedForRound = (r) => 0.6 + (r - 1) * 0.18; // z.B. 0.6, 0.78, 0.96, 1.14, 1.32

  // Tastatur: Space/Enter = Stop/Next, Esc = Back
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBack?.();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (running) handleStop();
        else handleNext();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [running, round, score, onBack]);

  // Startet/stoppt die Animation
  useEffect(() => {
    if (!running) return;
    velRef.current = speedForRound(round);
    lastT.current = performance.now();

    const tick = (t) => {
      animId.current = requestAnimationFrame(tick);
      const dt = Math.min(32, t - lastT.current) / 1000;
      lastT.current = t;

      // Ping-Pong Bewegung 0..1
      let p = posRef.current + velRef.current * dt;
      if (p > 1) { p = 1 - (p - 1); velRef.current *= -1; }
      if (p < 0) { p = -p;          velRef.current *= -1; }
      posRef.current = p;
    };

    animId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId.current);
  }, [running, round]);

  const handleStart = () => {
    setScore(0);
    setRound(1);
    setStoppedAt(null);
    posRef.current = Math.random(); // etwas Variation
    setRunning(true);
  };

  const handleStop = () => {
    // Stoppt die Runde, berechnet Punkte
    setRunning(false);
    const p = posRef.current; // 0..1
    setStoppedAt(p);

    const dist = Math.abs(p - 0.5); // 0 (perfekt) .. 0.5 (ganz daneben)
    // Punkte: max 100 bei exakt Mitte, linear fallend bis 0 bei Rand
    const roundPoints = Math.max(0, Math.round(100 * (1 - dist * 2)));
    setScore((s) => s + roundPoints);
  };

  const handleNext = () => {
    if (round >= 5) {
      // Spiel zu Ende -> Highscore speichern, neu starten ermöglichen
      setBest((b) => {
        const nb = Math.max(b, score);
        localStorage.setItem("stopper_best", String(nb));
        return nb;
      });
      // Neue Session
      setRound(1);
      setStoppedAt(null);
      posRef.current = Math.random();
      setScore(0);
      setRunning(true);
      return;
    }
    // nächste Runde
    setRound((r) => r + 1);
    setStoppedAt(null);
    posRef.current = Math.random();
    setRunning(true);
  };

  // Für Anzeige: Prozent & Feedback-Text
  const percent = stoppedAt == null ? null : Math.round(stoppedAt * 100);
  const accuracy = stoppedAt == null ? null : Math.round((1 - Math.abs(stoppedAt - 0.5) * 2) * 100);

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Precision Stopper</h2>
        <div className="flex gap-3 items-center">
          <div className="text-sm">Runde: <b>{round}/5</b></div>
          <div className="text-sm">Score: <b>{score}</b> | Best: <b>{best}</b></div>
          <Button variant="subtle" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      {/* Spielfeld */}
      <div
        className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg bg-zinc-900 text-zinc-100 select-none"
        onClick={() => (running ? handleStop() : handleNext())}
      >
        {/* Mittellinie */}
        <div className="absolute left-1/2 top-8 bottom-8 w-[2px] bg-zinc-700" />

        {/* Laufender Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-emerald-400 shadow"
          style={{ left: `calc(${posRef.current * 100}% - 20px)` }}
        />

        {/* HUD */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-center text-sm opacity-80">
          {running ? (
            <div>Stoppe so nah wie möglich an der Mitte (SPACE/ENTER oder Klick)</div>
          ) : stoppedAt == null ? (
            <div>Klicke oder drücke SPACE/ENTER, um zu starten</div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div>Gestoppt bei <b>{percent}%</b> • Genauigkeit: <b>{Math.max(0, accuracy)}%</b></div>
              <div className="text-xs">Klicke oder drücke SPACE/ENTER für {round >= 5 ? "Neustart" : "nächste Runde"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        {!running && stoppedAt == null && <Button onClick={handleStart}>Start</Button>}
        {running && <Button variant="subtle" onClick={handleStop}>Stop</Button>}
        {!running && stoppedAt != null && <Button onClick={handleNext}>{round >= 5 ? "Neustart" : "Nächste Runde"}</Button>}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Hinweis: Die Geschwindigkeit erhöht sich pro Runde. Perfekt (100 Punkte) gibt’s genau bei 50%.
      </div>
    </div>
  );
}
