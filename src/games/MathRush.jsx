import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button.jsx";

// Helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeQuestion(score) {
  // Difficulty scales with score
  const tier = score < 5 ? 0 : score < 10 ? 1 : 2;

  const ranges = [
    { min: 0, max: 9 },
    { min: 0, max: 20 },
    { min: 5, max: 50 },
  ];
  const { min, max } = ranges[tier];

  const ops = score < 5 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[randInt(0, ops.length - 1)];

  let a = randInt(min, max);
  let b = randInt(min, max);

  if (op === "-") {
    if (b > a) [a, b] = [b, a]; // avoid negatives
  } else if (op === "×") {
    b = randInt(2, score < 10 ? 9 : 12); // keep mental math friendly
  }

  let answer;
  if (op === "+") answer = a + b;
  if (op === "-") answer = a - b;
  if (op === "×") answer = a * b;

  return { a, b, op, answer };
}

export default function MathRush({ onBack }) {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("mathrush_best") || 0));
  const [q, setQ] = useState(() => makeQuestion(0));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(""); // „✔️“ / „❌ -2s“
  const inputRef = useRef(null);
  const timerId = useRef(null);
  const fbTimer = useRef(null);

  // Global nur ESC behandeln (Enter NICHT global, sonst Doppelsubmit!)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBack?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  // Timer
  useEffect(() => {
    if (!running) return;
    timerId.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerId.current);
          setRunning(false);
          setBest((b) => {
            const nb = Math.max(b, score);
            localStorage.setItem("mathrush_best", String(nb));
            return nb;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerId.current);
  }, [running, score]);

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setQ(makeQuestion(0));
    setInput("");
    clearTimeout(fbTimer.current);
    setFeedback("");
    setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const nextQuestion = (newScore) => {
    setQ(makeQuestion(newScore));
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const showFeedback = (text) => {
    setFeedback(text);
    clearTimeout(fbTimer.current);
    fbTimer.current = setTimeout(() => setFeedback(""), 300);
  };

  const handleSubmit = () => {
    if (!running) return;
    // deutsche Eingabe: Komma -> Punkt (falls jemand 3,5 eintippt)
    const normalized = input.replace(",", ".");
    const val = Number(normalized.trim());
    if (!Number.isFinite(val)) return;

    if (val === q.answer) {
      showFeedback("✔️");
      const ns = score + 1;
      setScore(ns);
      nextQuestion(ns);
    } else {
      showFeedback("❌ -2s");
      setTimeLeft((t) => Math.max(0, t - 2));
      nextQuestion(score);
    }
  };

  const skip = () => {
    setTimeLeft((t) => Math.max(0, t - 1));
    nextQuestion(score);
  };

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Math Rush</h2>
        <div className="flex gap-3 items-center">
          <div className="text-sm">Zeit: <b>{timeLeft}s</b> • Score: <b>{score}</b> • Best: <b>{best}</b></div>
          <Button variant="subtle" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="rounded-3xl bg-zinc-900 text-zinc-100 p-6 shadow-lg">
        {!running ? (
          <div className="text-center">
            <p className="mb-3 text-sm opacity-80">
              Löse so viele Aufgaben wie möglich in <b>30 Sekunden</b>. Falsch = <b>-2s</b>, Skip = <b>-1s</b>.
            </p>
            <Button onClick={start}>Start</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-5xl font-extrabold tracking-wide font-mono select-none">
              {q.a} {q.op} {q.b} =
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="text-zinc-900 rounded-xl px-4 py-2 text-lg w-36 text-center"
                placeholder="Antwort"
                autoFocus
              />
              <Button onClick={handleSubmit}>OK</Button>
              <Button variant="subtle" onClick={skip}>Skip (-1s)</Button>
            </div>

            {feedback && (
              <div className={`text-lg ${feedback.startsWith("✔") ? "text-emerald-400" : "text-rose-400"}`}>
                {feedback}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Tipp: Ab Score 5 kommen leichte Multiplikationen dazu. Viel Erfolg! ✏️
      </div>
    </div>
  );
}
