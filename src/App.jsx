import React, { useState } from "react";
import OfficeDodge from "./games/OfficeDodge.jsx";
import SnakeGame from "./games/SnakeGame.jsx";
import ReactionTest from "./games/ReactionTest.jsx";
import NumberMemory from "./games/NumberMemory.jsx";

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

export default function App() {
  const [currentGame, setCurrentGame] = useState(null);

  const handleBack = () => setCurrentGame(null);

  if (currentGame === "office") return <OfficeDodge onBack={handleBack} />;
  if (currentGame === "snake") return <SnakeGame onBack={handleBack} />;
  if (currentGame === "reaction") return <ReactionTest onBack={handleBack} />;
  if (currentGame === "number") return <NumberMemory onBack={handleBack} />;

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Mini Game Hub 🎮</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Unauffällige Mini-Games für die kurze Arbeitspause. Wähle ein Spiel:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Office Dodge" desc="Weiche roten Blöcken aus und sammle ☕." onClick={() => setCurrentGame("office")} />
        <Card title="Snake Classic" desc="Iss Äpfel, wachse – nicht beißen lassen!" onClick={() => setCurrentGame("snake")} />
        <Card title="Reaction Test" desc="Klicke sobald es grün wird. Wie schnell bist du?" onClick={() => setCurrentGame("reaction")} />
        <Card title="Number Memory" desc="Zahl merken & korrekt eintippen – wie viele Stellen schaffst du?" onClick={() => setCurrentGame("number")} />
      </div>
      <div className="mt-8 text-xs text-zinc-500">Tipp: Fenster klein halten ➜ noch unauffälliger 😉</div>
    </div>
  );
}

function Card({ title, desc, onClick }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-zinc-200 p-5 shadow-sm flex flex-col">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <p className="text-xs text-zinc-600 mb-3">{desc}</p>
      <div className="mt-auto">
        <Button onClick={onClick}>Play</Button>
      </div>
    </div>
  );
}
