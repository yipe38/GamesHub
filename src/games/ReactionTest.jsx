
import React, { useEffect, useState } from "react";

function Button({ children, onClick, variant = "default" }) {
  const base =
    "rounded-2xl px-4 py-2 text-sm font-medium shadow active:translate-y-[1px] transition";
  const variants = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800",
    subtle: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  };
  return (
    <button onClick={onClick} className={base + " " + variants[variant]}>
      {children}
    </button>
  );
}

export default function ReactionTest({ onBack }) {
  const [state, setState] = useState("idle"); // idle -> waiting -> go -> result/early
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(() => Number(localStorage.getItem("reaction_best") || 0));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  useEffect(() => {
    let timer;
    if (state === "waiting") {
      timer = setTimeout(() => { setState("go"); setStartTime(performance.now()); }, 600 + Math.random() * 1600);
    }
    return () => clearTimeout(timer);
  }, [state]);

  const start = () => { setResult(null); setState("waiting"); };
  const clickArea = () => {
    if (state === "waiting") {
      setState("early");
      setResult("Zu früh! Warte auf GRÜN.");
    } else if (state === "go") {
      const ms = Math.round(performance.now() - startTime);
      setResult(ms + " ms");
      setState("result");
      setBest((b) => {
        const nb = b && b > 0 ? Math.min(b, ms) : ms;
        localStorage.setItem("reaction_best", String(nb));
        return nb;
      });
    } else if (state === "idle" || state === "result" || state === "early") {
      start();
    }
  };

  const bg =
    state === "idle" ? "bg-zinc-900" :
    state === "waiting" ? "bg-red-600" :
    state === "go" ? "bg-green-600" :
    state === "early" ? "bg-yellow-600" : "bg-zinc-900";

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Reaction Test</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm">Best: <b>{best || "-"}</b> ms</div>
          <Button variant="subtle" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div
        className={"relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg text-zinc-100 select-none cursor-pointer " + bg}
        onClick={clickArea}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {state === "idle" && <div className="text-center"><div className="text-2xl font-bold mb-2">Klicke zum Start</div><div className="text-sm opacity-80">Warte auf GRÜN und klicke so schnell du kannst.</div></div>}
          {state === "waiting" && <div className="text-2xl font-bold">Warte...</div>}
          {state === "go" && <div className="text-2xl font-bold">JETZT!</div>}
          {state === "result" && <div className="text-center"><div className="text-4xl font-extrabold mb-1">{result}</div><div className="text-sm opacity-80">Klicke, um erneut zu starten.</div></div>}
          {state === "early" && <div className="text-center"><div className="text-xl font-bold mb-1">Zu früh! 🙈</div><div className="text-sm opacity-80">Klicke, um es nochmal zu versuchen.</div></div>}
        </div>
      </div>
    </div>
  );
}
