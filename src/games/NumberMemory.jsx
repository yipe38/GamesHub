import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button.jsx";

// Random Zahl als String mit n Stellen (erste Stelle nicht 0)
const makeNumber = (digits) => {
  const first = String(Math.floor(Math.random() * 9) + 1);
  let rest = "";
  for (let i = 1; i < digits; i++) rest += String(Math.floor(Math.random() * 10));
  return first + rest;
};

export default function NumberMemory({ onBack }) {
  // Phasen: idle -> show -> recall -> result
  const [phase, setPhase] = useState("idle");
  const [level, setLevel] = useState(1);           // Anzahl Stellen
  const [target, setTarget] = useState("");        // gemerkte Zahl (String)
  const [guess, setGuess] = useState("");          // Eingabe
  const [best, setBest] = useState(() => Number(localStorage.getItem("number_memory_best") || 0));
  const inputRef = useRef(null);

  // Zahl anzeigen, dann automatisch zur Eingabe wechseln
  useEffect(() => {
    if (phase !== "show") return;
    const ms = 900 + level * 450;
    const id = setTimeout(() => {
      setPhase("recall");
      setTimeout(() => inputRef.current?.focus(), 0);
    }, ms);
    return () => clearTimeout(id);
  }, [phase, level]);

  const start = () => {
    const n = makeNumber(level);
    setTarget(n);
    setGuess("");
    setPhase("show");
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const ok = guess.trim() === target;
    if (ok) {
      const next = level + 1;
      setBest((b) => {
        const nb = Math.max(b, level);
        localStorage.setItem("number_memory_best", String(nb));
        return nb;
      });
      setLevel(next);
      const n = makeNumber(next);
      setTarget(n);
      setGuess("");
      setPhase("show");
    } else {
      setPhase("result");
    }
  };

  const retrySame = () => {
    setGuess("");
    setPhase("show");
    setTarget(makeNumber(level));
  };

  const restartFrom1 = () => {
    setLevel(1);
    setGuess("");
    setTarget(makeNumber(1));
    setPhase("show");
  };

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Number Memory</h2>
        <div className="flex gap-2 items-center">
          <div className="text-sm">Level: <b>{level}</b> | Best: <b>{best}</b></div>
          <Button variant="ghost" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg bg-zinc-900 text-zinc-100">
        <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-4">
          {phase === "idle" && (
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">Merke dir die Zahl</div>
              <div className="text-sm opacity-80 mb-4">Sie wird kurz eingeblendet – gib sie danach ein.</div>
              <Button onClick={start}>Start (Level {level})</Button>
            </div>
          )}

          {phase === "show" && (
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Merke dir:</div>
              <div className="text-5xl font-extrabold tracking-widest">{target}</div>
              <div className="mt-4 text-xs opacity-70">Die Zahl verschwindet gleich…</div>
            </div>
          )}

          {phase === "recall" && (
            <form onSubmit={submit} className="flex flex-col items-center gap-3">
              <div className="text-sm opacity-80">Gib die Zahl ein:</div>
              <input
                ref={inputRef}
                value={guess}
                onChange={(e) => setGuess(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="text-zinc-900 rounded-xl px-4 py-2 text-lg w-48 text-center"
                placeholder="Zahl hier"
                maxLength={Math.max(24, level)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit">Prüfen</Button>
                <Button variant="secondary" onClick={() => { setGuess(""); inputRef.current?.focus(); }}>Clear</Button>
              </div>
            </form>
          )}

          {phase === "result" && (
            <div className="text-center">
              <div className="text-xl font-bold mb-2">Falsch 🙈</div>
              <div className="text-sm mb-1">Gesucht war: <span className="font-mono font-semibold">{target}</span></div>
              <div className="text-sm opacity-80 mb-4">Deine Eingabe: <span className="font-mono">{guess || "—"}</span></div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={retrySame}>Nochmal Level {level}</Button>
                <Button variant="secondary" onClick={restartFrom1}>Von vorn (Level 1)</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Tipp: Mit steigender Levelzahl wird die Anzeigezeit länger – aber nur ein bisschen 😉
      </div>
    </div>
  );
}
