import React, { useEffect, useState } from "react";

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

export default function ClickTheOddOne({ onBack }) {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [oddIndex, setOddIndex] = useState(null);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(() => Number(localStorage.getItem("oddone_best") || 0));
  const [message, setMessage] = useState("Finde das andere Feld!");

  const sizeForLevel = (lvl) => Math.min(2 + Math.floor(lvl / 2), 8); // Grid wächst max 8x8

  const startLevel = (lvl) => {
    const size = sizeForLevel(lvl);
    const total = size * size;
    const odd = Math.floor(Math.random() * total);

    // Basisfarbe HSL, odd etwas heller/dunkler
    const baseHue = Math.floor(Math.random() * 360);
    const baseColor = `hsl(${baseHue}, 70%, 50%)`;
    const oddColor = `hsl(${baseHue}, 70%, ${lvl > 5 ? 52 : 60}%)`;

    const cells = Array.from({ length: total }, (_, i) => ({
      color: i === odd ? oddColor : baseColor,
    }));

    setGrid(cells);
    setOddIndex(odd);
    setLevel(lvl);
    setRunning(true);
    setMessage("Welches Feld ist anders?");
  };

  const handleClick = (i) => {
    if (!running) return;
    if (i === oddIndex) {
      // richtig → nächstes Level
      const next = level + 1;
      setMessage("Richtig ✅");
      setBest((b) => {
        const nb = Math.max(b, level);
        localStorage.setItem("oddone_best", String(nb));
        return nb;
      });
      setTimeout(() => startLevel(next), 700);
    } else {
      // falsch → Game Over
      setRunning(false);
      setMessage("Falsch ❌ — Game Over!");
    }
  };

  const handleRestart = () => {
    startLevel(1);
    setBest((b) => {
      localStorage.setItem("oddone_best", String(b));
      return b;
    });
  };

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Click the Odd One</h2>
        <div className="flex gap-3 items-center">
          <div className="text-sm">Level: <b>{level}</b> | Best: <b>{best}</b></div>
          <Button variant="subtle" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="rounded-3xl bg-zinc-900 text-zinc-100 p-6 shadow-lg flex flex-col items-center justify-center">
        {!running ? (
          <div className="text-center">
            <p className="mb-3">{message}</p>
            <Button onClick={handleRestart}>Start</Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm">{message}</p>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${sizeForLevel(level)}, 1fr)`,
                width: "100%",
                maxWidth: "320px",
              }}
            >
              {grid.map((cell, i) => (
                <div
                  key={i}
                  onClick={() => handleClick(i)}
                  className="aspect-square rounded-lg cursor-pointer shadow active:scale-95 transition"
                  style={{ background: cell.color }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Tipp: Mit jedem Level wächst das Feld und die Farben ähneln sich mehr 👀
      </div>
    </div>
  );
}
