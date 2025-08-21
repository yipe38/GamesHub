
import React, { useEffect, useRef, useState } from "react";

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

const GRID = 20; // cell size

export default function SnakeGame({ onBack }) {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("snake_best") || 0));
  const [speed, setSpeed] = useState(8); // cells per second
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const snakeRef = useRef([{ x: 8, y: 8 }]);
  const foodRef = useRef({ x: 12, y: 8 });
  const lastStep = useRef(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBack();
      if (e.key.startsWith("Arrow")) {
        const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
        const nd = map[e.key];
        // prevent reversing into self
        if (nd && !(nd.x === -dirRef.current.x && nd.y === -dirRef.current.y)) nextDirRef.current = nd;
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "w") nextDirRef.current = { x: 0, y: -1 };
      if (e.key.toLowerCase() === "s") nextDirRef.current = { x: 0, y: 1 };
      if (e.key.toLowerCase() === "a") nextDirRef.current = { x: -1, y: 0 };
      if (e.key.toLowerCase() === "d") nextDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let anim;

    const loop = (t) => {
      if (!running) return;
      anim = requestAnimationFrame(loop);
      const rect = canvas.getBoundingClientRect();
      const W = Math.floor(rect.width);
      const H = Math.floor(rect.height);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const cols = Math.floor(W / GRID), rows = Math.floor(H / GRID);

      if (t - lastStep.current > 1000 / speed) {
        lastStep.current = t;
        dirRef.current = nextDirRef.current;

        // move
        const snake = snakeRef.current.slice();
        const head = { x: snake[0].x + dirRef.current.x, y: snake[0].y + dirRef.current.y };

        // wrap around edges for stealth gameplay
        head.x = (head.x + cols) % cols;
        head.y = (head.y + rows) % rows;

        // collision with self
        if (snake.some((s) => s.x === head.x && s.y === head.y)) {
          // game over
          setRunning(false);
          setBest((b) => {
            const nb = Math.max(b, score);
            localStorage.setItem("snake_best", String(nb));
            return nb;
          });
          return;
        }

        snake.unshift(head);

        // food
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          setScore((s) => s + 10);
          // new food not on snake
          let nx, ny;
          do {
            nx = Math.floor(Math.random() * cols);
            ny = Math.floor(Math.random() * rows);
          } while (snake.some((s) => s.x === nx && s.y === ny));
          foodRef.current = { x: nx, y: ny };
          // speed up slightly
          setSpeed((v) => Math.min(20, v + 0.2));
        } else {
          snake.pop();
        }

        snakeRef.current = snake;
      }

      // render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grid
      ctx.strokeStyle = "#1f1f1f";
      for (let x = 0; x < canvas.width; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      // food
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(foodRef.current.x * GRID, foodRef.current.y * GRID, GRID, GRID);

      // snake
      ctx.fillStyle = "#22c55e";
      snakeRef.current.forEach((seg, i) => {
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      });
    };

    if (running) requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, [running, speed, score]);

  const start = () => {
    setScore(0);
    setSpeed(8);
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    snakeRef.current = [{ x: 8, y: 8 }];
    foodRef.current = { x: 12, y: 8 };
    setRunning(true);
  };

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Snake Classic</h2>
        <div className="flex gap-2 items-center">
          <div className="text-sm">Score: <b>{score}</b> | Best: <b>{best}</b></div>
          {!running ? <Button onClick={start}>Start</Button> : null}
          <Button variant="subtle" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-100 bg-black/40">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">Snake</div>
              <div className="opacity-80 mb-3 text-sm">Steuerung: Pfeiltasten oder WASD. Rand wird ge-wrappt.</div>
              <Button onClick={start}>Start</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
