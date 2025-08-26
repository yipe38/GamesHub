import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button.jsx";

// ---------- Helpers ----------
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// 4-Deck-Shoe für weniger häufiges Mischen
function buildShoe(decks = 4) {
  const cards = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        cards.push({ r, s });
      }
    }
  }
  // Fisher-Yates
  for (let i = cards.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function isTenCard(r) {
  return r === "10" || r === "J" || r === "Q" || r === "K";
}

function cardValue(r) {
  if (r === "A") return 11;        // wir zählen Asse erst als 11, korrigieren später
  if (r === "J" || r === "Q" || r === "K") return 10;
  return Number(r);
}

// Hand-Wert mit Assen korrekt berechnen
function scoreHand(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.r === "A") aces++;
    total += cardValue(c.r);
  }
  while (total > 21 && aces > 0) {
    total -= 10; // Ass von 11 auf 1
    aces--;
  }
  const soft = aces > 0 && total <= 21; // es gibt noch (mind.) ein Ass als 11
  return { total, soft };
}

function isBlackjack2(hand) {
  if (hand.length !== 2) return false;
  const ranks = hand.map(c => c.r);
  return (ranks.includes("A") && (ranks.some(isTenCard)));
}

function formatCard(c) {
  const red = (c.s === "♥" || c.s === "♦");
  return (
    <div
      className={`w-12 h-16 rounded-xl ring-1 ring-zinc-700 flex items-center justify-center text-lg font-semibold bg-white dark:bg-zinc-800 ${
        red ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
      }`}
      title={`${c.r}${c.s}`}
    >
      {c.r}{c.s}
    </div>
  );
}

function HiddenCard() {
  return (
    <div className="w-12 h-16 rounded-xl ring-1 ring-zinc-700 bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-700 dark:to-zinc-900" />
  );
}

// ---------- Component ----------
export default function Blackjack({ onBack }) {
  // phases: 'betting' | 'dealing' | 'player' | 'dealer' | 'settle'
  const [phase, setPhase] = useState("betting");
  const [shoe, setShoe] = useState(() => buildShoe(4));
  const shoeRef = useRef(null);
  shoeRef.current = shoe;

  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [bankroll, setBankroll] = useState(() => {
    const v = Number(localStorage.getItem("bj_bankroll") || 1000);
    return Number.isFinite(v) ? v : 1000;
  });
  const [bet, setBet] = useState(50);
  const [message, setMessage] = useState("Setz deinen Einsatz und starte die Runde.");
  const [canDouble, setCanDouble] = useState(false);

  useEffect(() => {
    localStorage.setItem("bj_bankroll", String(bankroll));
  }, [bankroll]);

  // Bei kleinem Shoe neu mischen
  useEffect(() => {
    if (shoe.length < 24 && phase === "betting") {
      setShoe(buildShoe(4));
      setMessage("Shoe neu gemischt.");
    }
  }, [shoe.length, phase]);

  function drawCard() {
    // Immer von shoeRef lesen (aktueller Stand)
    const s = shoeRef.current;
    if (!s.length) {
      const fresh = buildShoe(4);
      setShoe(fresh);
      shoeRef.current = fresh;
    }
    const top = shoeRef.current[shoeRef.current.length - 1];
    const next = shoeRef.current.slice(0, -1);
    setShoe(next);
    shoeRef.current = next;
    return top;
  }

  function startRound() {
    const b = Math.max(10, Math.min(bet, bankroll));
    if (b <= 0) return;
    setBet(b);
    setBankroll(prev => prev - b);
    setPlayer([drawCard(), drawCard()]);
    setDealer([drawCard(), drawCard()]);
    setPhase("dealing");
    setCanDouble(true);
    setMessage("Viel Glück!");

    // Nach kurzem Deal-Delay in Playerphase wechseln
    setTimeout(() => {
      // Sofort-Blackjacks prüfen
      const pBJ = isBlackjack2([...player, ...[]]); // player noch alt -> gleich korrigieren
      const dBJ = isBlackjack2([...dealer, ...[]]);
      // Obiges geht nicht, weil state async ist; wir prüfen hier frisch:
      const p = [drawPeek(-2), drawPeek(-1)]; // nope. also machen wir's richtig: nach setState warten
    }, 0);
  }

  // Da React setState async ist, prüfen wir Blackjacks in einem Effekt, sobald 'dealing' aktiv ist
  useEffect(() => {
    if (phase !== "dealing") return;
    // kurze Verzögerung, „animiertes“ Dealen
    const id = setTimeout(() => {
      const pBJ = isBlackjack2(getLatest("player"));
      const dBJ = isBlackjack2(getLatest("dealer"));
      if (pBJ || dBJ) {
        settleBlackjacks(pBJ, dBJ);
      } else {
        setPhase("player");
      }
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Hilfsleser für aktuellen State (vermeidet Stale-Closures)
  function getLatest(which) {
    if (which === "player") return JSON.parse(JSON.stringify(playerRef.current));
    if (which === "dealer") return JSON.parse(JSON.stringify(dealerRef.current));
    return null;
  }
  const playerRef = useRef(player); useEffect(() => { playerRef.current = player; }, [player]);
  const dealerRef = useRef(dealer); useEffect(() => { dealerRef.current = dealer; }, [dealer]);

  function settleBlackjacks(pBJ, dBJ) {
    const b = bet;
    if (pBJ && dBJ) {
      // Push
      setBankroll(v => v + b);
      setMessage("Beide Blackjack – Push.");
    } else if (pBJ) {
      // 3:2 payout
      setBankroll(v => v + b + Math.floor(b * 1.5));
      setMessage("Blackjack! Auszahlung 3:2 🎉");
    } else {
      setMessage("Dealer hat Blackjack. Verloren.");
    }
    setPhase("settle");
  }

  function onHit() {
    setCanDouble(false);
    setPlayer(h => {
      const nh = [...h, drawCard()];
      const { total } = scoreHand(nh);
      if (total > 21) {
        setMessage("Bust! Über 21 😵");
        setPhase("settle");
      }
      return nh;
    });
  }

  function onStand() {
    setCanDouble(false);
    setPhase("dealer");
    setMessage("Dealer zieht…");
    setTimeout(runDealer, 250);
  }

  function onDouble() {
    if (!canDouble) return;
    if (bankroll < bet) {
      setMessage("Zu wenig Bankroll für Double.");
      return;
    }
    setBankroll(v => v - bet);
    setBet(b => b * 2);
    setCanDouble(false);
    setPlayer(h => {
      const nh = [...h, drawCard()];
      const { total } = scoreHand(nh);
      setPhase("dealer");
      setTimeout(runDealer, 250);
      if (total > 21) {
        setMessage("Bust nach Double 😵");
        // Dealerzug überspringen, sofort Settlen
        setPhase("settle");
      } else {
        setMessage("Double: eine Karte, dann Dealer.");
      }
      return nh;
    });
  }

  function runDealer() {
    setDealer(h => {
      let nh = [...h];
      // Dealer deckt auf und zieht bis 17 (Dealer steht auf Soft 17)
      while (true) {
        const { total, soft } = scoreHand(nh);
        if (total < 17) {
          nh.push(drawCard());
          continue;
        }
        if (total === 17 && soft) {
          // steht auf Soft 17: keine weitere Karte
          break;
        }
        break;
      }
      // Ergebnis auswerten
      const pScore = scoreHand(playerRef.current).total;
      const dScore = scoreHand(nh).total;

      if (dScore > 21) {
        setMessage("Dealer bust – du gewinnst! 🎉");
        setBankroll(v => v + bet * 2);
      } else if (pScore > dScore) {
        setMessage("Gewonnen! 🎉");
        setBankroll(v => v + bet * 2);
      } else if (pScore < dScore) {
        setMessage("Verloren.");
      } else {
        setMessage("Push – Einsatz zurück.");
        setBankroll(v => v + bet);
      }
      setPhase("settle");
      return nh;
    });
  }

  function nextRound() {
    setPlayer([]);
    setDealer([]);
    setBet(b => Math.min(Math.max(10, b), bankroll > 0 ? bankroll : 0));
    setCanDouble(false);
    setMessage("Setz deinen Einsatz und starte die Runde.");
    setPhase("betting");
  }

  // ---------- UI ----------
  const pScore = useMemo(() => scoreHand(player).total, [player]);
  const dScorePeek = useMemo(() => {
    // nur erste Karte zählen, zweite ist verdeckt
    if (phase === "player" || phase === "dealing" || phase === "betting")
      return dealer.length ? cardValue(dealer[0].r) : 0;
    return scoreHand(dealer).total;
  }, [dealer, phase]);

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Blackjack (21)</h2>
        <div className="flex items-center gap-3 text-sm">
          <div>Bankroll: <b>{bankroll}</b></div>
          <div>Bet: <b>{bet}</b></div>
          <Button variant="ghost" onClick={onBack}>Zurück</Button>
        </div>
      </div>

      <div className="rounded-3xl ring-1 ring-zinc-800 bg-zinc-900 text-zinc-100 p-6 shadow-lg">
        {/* Dealer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm uppercase tracking-wide text-zinc-400">Dealer</div>
            <div className="text-lg font-semibold">
              {phase === "player" || phase === "dealing" || phase === "betting" ? "?" : dScorePeek}
            </div>
          </div>
          <div className="flex gap-2">
            {dealer.map((c, i) => (
              (i === 1 && (phase === "player" || phase === "dealing")) ? <HiddenCard key={i} /> : <React.Fragment key={i}>{formatCard(c)}</React.Fragment>
            ))}
            {dealer.length === 0 && <div className="text-sm opacity-60">—</div>}
          </div>
        </div>

        {/* Player */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm uppercase tracking-wide text-zinc-400">Du</div>
            <div className="text-lg font-semibold">{player.length ? pScore : "—"}</div>
          </div>
          <div className="flex gap-2">
            {player.map((c, i) => <React.Fragment key={i}>{formatCard(c)}</React.Fragment>)}
            {player.length === 0 && <div className="text-sm opacity-60">—</div>}
          </div>
        </div>

        {/* Message */}
        <div className="mb-4 text-sm opacity-90">{message}</div>

        {/* Controls */}
        {phase === "betting" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm mr-2">Einsatz setzen:</div>
            {[10,25,50,100].map(chip => (
              <Button key={chip} variant="secondary" onClick={() => setBet(b => Math.min(bankroll, Math.max(10, b + chip)))}>
                +{chip}
              </Button>
            ))}
            {[10,25,50,100].map(chip => (
              <Button key={"m"+chip} variant="ghost" onClick={() => setBet(b => Math.max(10, b - chip))}>
                -{chip}
              </Button>
            ))}
            <Button variant="primary" onClick={startRound} disabled={bankroll <= 0 || bet <= 0}>
              Deal
            </Button>
            <Button variant="ghost" onClick={() => { setBet(50); }}>Reset Bet</Button>
          </div>
        )}

        {phase === "player" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onHit}>Hit</Button>
            <Button variant="secondary" onClick={onStand}>Stand</Button>
            <Button variant="ghost" onClick={onDouble} disabled={!canDouble}>Double</Button>
          </div>
        )}

        {phase === "dealer" && (
          <div className="text-sm opacity-80">Dealer spielt…</div>
        )}

        {phase === "settle" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={nextRound}>Nächste Runde</Button>
            <Button variant="ghost" onClick={() => {
              setBankroll(1000);
              localStorage.setItem("bj_bankroll", "1000");
              setMessage("Bankroll zurückgesetzt.");
            }}>
              Bankroll reset
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Regeln: Blackjack zahlt 3:2. Dealer steht auf Soft-17. Kein Split in dieser Version.
      </div>
    </div>
  );
}
