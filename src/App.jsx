import React, { useEffect, useState } from "react";
import OfficeDodge from "./games/OfficeDodge.jsx";
import SnakeGame from "./games/SnakeGame.jsx";
import ReactionTest from "./games/ReactionTest.jsx";
import NumberMemory from "./games/NumberMemory.jsx";
import PrecisionStopper from "./games/PrecisionStopper.jsx";
import ClickTheOddOne from "./games/ClickTheOddOne.jsx";
import MathRush from "./games/MathRush.jsx";
import Button from "./components/Button.jsx";
import Blackjack from "./games/Blackjack.jsx";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  return (
    <Button variant="ghost" onClick={() => setIsDark((v) => !v)} size="sm">
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </Button>
  );
}

export default function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const handleBack = () => setCurrentGame(null);

  if (currentGame === "office") return <OfficeDodge onBack={handleBack} />;
  if (currentGame === "snake") return <SnakeGame onBack={handleBack} />;
  if (currentGame === "reaction") return <ReactionTest onBack={handleBack} />;
  if (currentGame === "number") return <NumberMemory onBack={handleBack} />;
  if (currentGame === "stopper") return <PrecisionStopper onBack={handleBack} />;
  if (currentGame === "oddone") return <ClickTheOddOne onBack={handleBack} />;
  if (currentGame === "math") return <MathRush onBack={handleBack} />;
  if (currentGame === "blackjack") return <Blackjack onBack={handleBack} />;

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Mini Game Hub 🎮</h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Unauffällige Mini-Games für die kurze Arbeitspause. Wähle ein Spiel:
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
  <Card
    title="Office Dodge"
    desc="Weiche roten Blöcken aus und sammle ☕."
    onClick={() => setCurrentGame("office")}
  />
  <Card
    title="Snake Classic"
    desc="Iss Äpfel, wachse – nicht beißen lassen!"
    onClick={() => setCurrentGame("snake")}
  />
  <Card
    title="Reaction Test"
    desc="Klicke sobald es grün wird. Wie schnell bist du?"
    onClick={() => setCurrentGame("reaction")}
  />
  <Card
    title="Number Memory"
    desc="Zahl merken & korrekt eintippen – wie viele Stellen schaffst du?"
    onClick={() => setCurrentGame("number")}
  />
  <Card
    title="Precision Stopper"
    desc="Stoppe den Marker so nah wie möglich an der Mitte."
    onClick={() => setCurrentGame("stopper")}
  />
  <Card
    title="Click the Odd One"
    desc="Finde das Feld mit der anderen Farbe."
    onClick={() => setCurrentGame("oddone")}
  />
  <Card
    title="Math Rush"
    desc="30s Kopfrechnen: so viele Aufgaben wie möglich."
    onClick={() => setCurrentGame("math")}
  />
  <Card
    title="Blackjack (21)"
    desc="Setz Chips, zieh Karten, schlag den Dealer."
    onClick={() => setCurrentGame("blackjack")}
  />
</div>

  );
}

function Card({ title, desc, onClick }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 p-5 shadow-sm flex flex-col text-zinc-900 dark:text-zinc-100">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">{desc}</p>
      <div className="mt-auto">
        <Button variant="primary" onClick={onClick} size="md">Play</Button>
      </div>
    </div>
  );
}
