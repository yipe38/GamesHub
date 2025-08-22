import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button.jsx";

export default function ReactionTest({ onBack }) {
  const [phase, setPhase] = useState("idle"); // idle -> wait -> go -> result
  const [startAt, setStartAt] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const start = () => {
    setResult(null);
    setPhase("wait");
    // Zufällige Wartezeit 800–2000ms
    const ms = 800 + Math.floor(Math.random() * 1200);
    timerRef.current = setTimeout(() => {
      setPhase("go");
      setStartAt(performance.now());
    }, ms);
  };

  const handleClick = () => {
    if (phase === "wait") {
      // zu früh
      clearTimeout(timerRef.current);
      setPhase("result");
      setResult({ ok: false, ms: 0 });
    } else if (phase === "go") {
      const ms = Math.round(performance.now() - startAt);
      setPhase("result");
      setResult({ ok: true, ms });
      // Bestwert speichern
      const key = "reaction_best";
      const prev = Number(localStorage.getItem(key) || 1e9);
      if (ms < prev) localStorage.setItem(key, String(ms));
    }
  };

  const best = Number(localStorage.getItem("reaction_best") || 0);

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reaction Test</h2>
        <div className="flex gap-3 items-center">
          <div className="text-sm">Best: <b>{best ? `${best} ms` : "—"}</b></div>
          <Button variant="ghost" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div
        className={`relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg
        ${phase === "go" ? "bg-emerald-500" : phase === "wait" ? "bg-zinc-800" : "bg-zinc-900"} 
        text-zinc-100 select-none flex items-center justify-center`}
        onClick={phase === "idle" ? undefined : handleClick}
      >
        {phase === "idle" && (
          <div className="text-center">
            <div className="mb-2 text-sm opacity-80">Klicke so schnell wie möglich, sobald der Bildschirm <b>grün</b> wird.</div>
            <Button onClick={start}>Start</Button>
          </div>
        )}
        {phase === "wait" && (
          <div className="text-lg opacity-80">Warte…</div>
        )}
        {phase === "go" && (
          <div className="text-xl font-semibold">JETZT!</div>
        )}
        {phase === "result" && (
          <div className="text-center">
            <div className="text-xl font-bold mb-1">
              {result?.ok ? `${result.ms} ms` : "Zu früh!"}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setPhase("idle")}>Neu</Button>
              <Button variant="secondary" onClick={onBack}>Menü</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Tipp: Nicht hetzen – bei „Warte…“ ist jeder Klick zu früh 😉
      </div>
    </div>
  );
}
