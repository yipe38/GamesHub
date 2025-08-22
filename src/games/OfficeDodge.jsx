import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button.jsx";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-100 shadow">
      {children}
    </span>
  );
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const rand = (min, max) => Math.random() * (max - min) + min;

export default function OfficeDodge({ onBack }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => {
      keys.current[e.key.toLowerCase()] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("office_dodge_best") || 0));
  const [difficulty, setDifficulty] = useState("normal");
  const [message, setMessage] = useState("Dodge the red blocks. Grab ☕ for bonus.");

  const player = useRef({ x: 160, y: 200, r: 10, vx: 0, vy: 0, dash: 0, dashCd: 0 });
  const hazards = useRef([]);
  const coffees = useRef([]);
  const lastTime = useRef(0);
  const accTime = useRef(0);

  // performanter Score (State-Throttle)
  const scoreRef = useRef(0);
  const scoreSyncT = useRef(0);

  const cfgMap = {
    easy: { speed: 115, spawnRate: 1.0, hazardSpeed: 55 },
    normal: { speed: 150, spawnRate: 1.25, hazardSpeed: 80 },
    hard: { speed: 175, spawnRate: 1.55, hazardSpeed: 105 },
  };
  const config = cfgMap[difficulty];

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const onKey = (e) => {
      if (e.key === "Escape") onBack();
      if (e.key.toLowerCase() === "p") setPaused((p) => !p);
      if (e.key.toLowerCase() === "r" && !running) handleRestart();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("keydown", onKey); };
  }, [running, onBack]);

  const initGame = () => {
    hazards.current = [];
    coffees.current = [];
    const p = player.current;
    p.x = 160; p.y = 200; p.vx = 0; p.vy = 0; p.dash = 0; p.dashCd = 0;
    lastTime.current = 0;
    accTime.current = 0;
    scoreRef.current = 0;
    scoreSyncT.current = 0;
  };

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const loop = (t) => {
      if (!running) return;
      const id = requestAnimationFrame(loop);

      if (paused) { canvas._raf = id; return; }

      const dt = Math.min(32, t - (lastTime.current || t)) / 1000;
      lastTime.current = t;
      accTime.current += dt;

      const rect = containerRef.current.getBoundingClientRect();
      const W = Math.floor(rect.width), H = Math.floor(rect.height);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

      // Input
      const p = player.current; const k = keys.current;
      const up = k["w"] || k["arrowup"], down = k["s"] || k["arrowdown"], left = k["a"] || k["arrowleft"], right = k["d"] || k["arrowright"], space = k[" "] || k["space"];
      const accel = config.speed;
      let ax = 0, ay = 0; if (up) ay -= accel; if (down) ay += accel; if (left) ax -= accel; if (right) ax += accel;
      p.vx = ax; p.vy = ay;

      // Dash
      if (p.dashCd > 0) p.dashCd -= dt;
      if (space && p.dash <= 0 && p.dashCd <= 0) {
        const mag = Math.hypot(p.vx, p.vy) || accel;
        const dx = (p.vx || accel) / mag, dy = (p.vy || 0) / mag;
        p.vx += dx * 480; p.vy += dy * 480; p.dash = 0.15; p.dashCd = 1.2;
      }
      if (p.dash > 0) p.dash -= dt;

      // Move
      p.x = clamp(p.x + p.vx * dt, p.r, W - p.r);
      p.y = clamp(p.y + p.vy * dt, p.r, H - p.r);

      // Spawns
      const spawnEvery = 0.9 / config.spawnRate;
      if (accTime.current > spawnEvery) {
        accTime.current = 0;
        const edge = Math.floor(rand(0, 4));
        let x = 0, y = 0, w = rand(16, 42), h = rand(16, 42), vx = 0, vy = 0;
        const speed = config.hazardSpeed + rand(-10, 20);
        if (edge === 0) { x = rand(0, W - w); y = -h; vy = speed; }
        else if (edge === 1) { x = rand(0, W - w); y = H + h; vy = -speed; }
        else if (edge === 2) { x = -w; y = rand(0, H - h); vx = speed; }
        else { x = W + w; y = rand(0, H - h); vx = -speed; }
        hazards.current.push({ x, y, w, h, vx, vy });

        if (Math.random() < 0.25) coffees.current.push({ x: rand(20, W - 20), y: rand(20, H - 20), r: 7, ttl: 6 });
      }

      // Update
      hazards.current.forEach((hz) => { hz.x += hz.vx * dt; hz.y += hz.vy * dt; });
      hazards.current = hazards.current.filter((hz) => hz.x > -200 && hz.x < W + 200 && hz.y > -200 && hz.y < H + 200);
      coffees.current.forEach((c) => (c.ttl -= dt));
      coffees.current = coffees.current.filter((c) => c.ttl > 0);

      // Collisions
      const collideRectCircle = (cx, cy, cr, rx, ry, rw, rh) => {
        const testX = clamp(cx, rx, rx + rw), testY = clamp(cy, ry, ry + rh);
        return (cx - testX) ** 2 + (cy - testY) ** 2 <= cr * cr;
      };

      let hit = false;
      for (const hz of hazards.current) {
        if (collideRectCircle(p.x, p.y, p.r, hz.x, hz.y, hz.w, hz.h)) { hit = true; break; }
      }

      // Coffee pickup
      let coffeePicked = false;
      coffees.current = coffees.current.filter((c) => {
        const d2 = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d2 <= (p.r + c.r) ** 2) { coffeePicked = true; return false; }
        return true;
      });
      if (coffeePicked) { scoreRef.current += 50; setMessage("Caffeine boost +50 ☕"); }

      // Score
      scoreRef.current += Math.floor(dt * 10);
      if (!scoreSyncT.current || t - scoreSyncT.current > 100) {
        scoreSyncT.current = t;
        setScore(scoreRef.current);
      }

      if (hit) {
        setRunning(false);
        setPaused(false);
        setMessage("Oops! Hit a block. Press Restart.");
        setBest((b) => {
          const current = scoreRef.current;
          const nb = Math.max(b, current);
          localStorage.setItem("office_dodge_best", String(nb));
          return nb;
        });
        cancelAnimationFrame(id);
        return;
      }

      // Render
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1f1f1f";
      for (let xg = 0; xg < W; xg += 24) { ctx.beginPath(); ctx.moveTo(xg, 0); ctx.lineTo(xg, H); ctx.stroke(); }
      for (let yg = 0; yg < H; yg += 24) { ctx.beginPath(); ctx.moveTo(0, yg); ctx.lineTo(W, yg); ctx.stroke(); }

      ctx.fillStyle = "#ef4444"; hazards.current.forEach((hz) => { ctx.fillRect(hz.x, hz.y, hz.w, hz.h); });
      ctx.fillStyle = "#f59e0b"; coffees.current.forEach((c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(player.current.x, player.current.y, player.current.r, 0, Math.PI * 2); ctx.fill();

      if (player.current.dash > 0) {
        ctx.globalAlpha = 0.25; ctx.fillStyle = "#86efac";
        ctx.beginPath(); ctx.arc(player.current.x - player.current.vx * 0.02, player.current.y - player.current.vy * 0.02, player.current.r * 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (paused) {
        ctx.fillStyle = "rgba(10,10,10,0.6)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e5e7eb"; ctx.font = "bold 24px Inter, ui-sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Paused (P)", W / 2, H / 2);
      }

      canvas._raf = id;
    };

    const id = requestAnimationFrame(loop);
    canvasRef.current._raf = id;
    return () => cancelAnimationFrame(canvasRef.current?._raf);
  }, [running, paused, difficulty]);

  const handleStart = () => {
    initGame();
    setScore(0);
    setMessage("Good luck!");
    setRunning(true);
    setPaused(false);
  };
  const handleRestart = () => {
    initGame();
    setScore(0);
    setMessage("Back at it!");
    setRunning(true);
    setPaused(false);
  };

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Office Dodge</h2>
          <Badge>WASD/Arrows</Badge>
          <Badge>Space = Dash</Badge>
          <Badge>P = Pause</Badge>
          <Badge>Esc = Menü</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={running}>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
          {!running ? (
            <Button onClick={handleStart} variant="primary">Start</Button>
          ) : (
            <Button onClick={() => setPaused((p) => !p)} variant="secondary">{paused ? "Resume" : "Pause"}</Button>
          )}
          {!running ? (<Button onClick={handleRestart} variant="secondary">Restart</Button>) : null}
          <Button variant="ghost" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-2xl bg-zinc-900 text-zinc-100 p-3 shadow"><div className="text-xs uppercase tracking-wide text-zinc-400">Score</div><div className="text-2xl font-bold">{score}</div></div>
        <div className="rounded-2xl bg-zinc-900 text-zinc-100 p-3 shadow"><div className="text-xs uppercase tracking-wide text-zinc-400">Best</div><div className="text-2xl font-bold">{Math.max(best, score)}</div></div>
        <div className="rounded-2xl bg-zinc-900 text-zinc-100 p-3 shadow"><div className="text-xs uppercase tracking-wide text-zinc-400">Status</div><div className="text-sm">{message}</div></div>
      </div>

      <div ref={containerRef} className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-zinc-800 shadow-lg bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/60">
            <div className="text-center text-zinc-100">
              <div className="text-3xl font-bold mb-1">Ready?</div>
              <div className="opacity-80 mb-3">Dodge red blocks, collect ☕, survive to rack up points.</div>
              <Button onClick={handleStart} variant="primary">Start Game</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">Pro-Tipp: Fenster klein halten ➜ unauffälliges Zocken 😉</div>
    </div>
  );
}
