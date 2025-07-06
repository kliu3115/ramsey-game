import './index.css'
import React, { useState, useMemo, useEffect } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline";
  className?: string;
  children: ReactNode;
}
const Button = ({
  variant,
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={
      `px-4 py-2 rounded-lg shadow font-medium transition ` +
      (variant === "outline"
        ? "border border-slate-400 bg-white hover:bg-slate-50 "
        : "bg-slate-800 text-white hover:bg-slate-700 ") +
      className
    }
  >
    {children}
  </button>
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
const Input = ({ className = "", ...props }: InputProps) => (
  <input
    {...props}
    className={`border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-slate-400 ${className}`}
  />
);

interface CardProps {
  className?: string;
  children: ReactNode;
}
const Card = ({ className = "", children }: CardProps) => (
  <div className={`rounded-2xl shadow bg-white ${className}`}>{children}</div>
);
const CardContent = ({ className = "", children }: CardProps) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export default function RamseyGame() {
  const [nInput, setNInput] = useState(6);
  const [kInput, setKInput] = useState(3);
  const [playersInput, setPlayersInput] = useState(2);

  const [n, setN] = useState(6);
  const [k, setK] = useState(3);
  const [numPlayers, setNumPlayers] = useState(2);

  const COLORS = ["red", "blue", "green", "gold", "purple", "orange"] as const;
  type Color = (typeof COLORS)[number];
  type EdgeKey = string;

  const [edges, setEdges] = useState<Record<EdgeKey, Color | null>>({});
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [winningClique, setWinningClique] = useState<number[] | null>(null);
  const [history, setHistory] = useState<EdgeKey[]>([]);

  const initEdges = (nodes: number) => {
    const obj: Record<EdgeKey, Color | null> = {};
    for (let i = 0; i < nodes; i++)
      for (let j = i + 1; j < nodes; j++) obj[`${i}-${j}`] = null;
    return obj;
  };

  useEffect(() => {
    setEdges(initEdges(n));
  }, [n]);

  const resetGame = () => {
    setN(nInput);
    setK(kInput);
    setNumPlayers(playersInput);
    setEdges(initEdges(nInput));
    setWinner(null);
    setWinningClique(null);
    setCurrentPlayerIdx(0);
    setHistory([]);
  };

  const positions = useMemo(() => {
    const R = 200,
      cx = 250,
      cy = 250;
    return Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
  }, [n]);

  const handleEdgeClick = (key: EdgeKey) => {
    if (winner || edges[key]) return;
    const color = COLORS[currentPlayerIdx];
    const newEdges = { ...edges, [key]: color };
    setEdges(newEdges);
    setHistory((h) => [...h, key]);

    const clique = checkWin(color, newEdges);
    if (clique) {
      setWinner(color);
      setWinningClique(clique);
    } else {
      setCurrentPlayerIdx((i) => (i + 1) % numPlayers);
    }
  };

  const undoMove = () => {
    if (!history.length || winner) return; // disallow undo after win
    const newHist = [...history];
    const last = newHist.pop()!;
    setEdges((e) => ({ ...e, [last]: null }));
    setHistory(newHist);
    setCurrentPlayerIdx((idx) => (idx - 1 + numPlayers) % numPlayers);
  };

  const checkWin = (
    color: Color,
    edgeState: Record<EdgeKey, Color | null>
  ): number[] | null => {
    const nodes = [...Array(n).keys()];
    const combine = (arr: number[], size: number): number[][] =>
      size === 0
        ? [[]]
        : arr.length < size
        ? []
        : [
            ...combine(arr.slice(1), size),
            ...combine(arr.slice(1), size - 1).map((c) => [arr[0], ...c]),
          ];

    for (const subset of combine(nodes, k)) {
      const ok = subset.every((u, i) =>
        subset
          .slice(i + 1)
          .every(
            (v) => edgeState[`${Math.min(u, v)}-${Math.max(u, v)}`] === color
          )
      );
      if (ok) return subset;
    }
    return null;
  };

  const turnText = winner
    ? `${winner.toUpperCase()} WINS!`
    : `Current turn: ${COLORS[currentPlayerIdx].toUpperCase()}`;

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-6 bg-gray-100">
      <h1 className="text-3xl font-bold">Ramsey Game</h1>

      <Card>
      <CardContent>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", width: "150px" }}>
            <span style={{ fontWeight: "bold", marginBottom: "4px" }}>Players (2–6)</span>
            <Input
              type="number"
              min={2}
              max={6}
              value={playersInput}
              style={{ padding: "6px 8px" }}
              onChange={(e) => setPlayersInput(+e.target.value)}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", width: "150px" }}>
            <span style={{ fontWeight: "bold", marginBottom: "4px" }}>Nodes (n)</span>
            <Input
              type="number"
              min={3}
              value={nInput}
              style={{ padding: "6px 8px" }}
              onChange={(e) => setNInput(+e.target.value)}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", width: "150px" }}>
            <span style={{ fontWeight: "bold", marginBottom: "4px" }}>k‑Clique to win</span>
            <Input
              type="number"
              min={3}
              value={kInput}
              style={{ padding: "6px 8px" }}
              onChange={(e) => setKInput(+e.target.value)}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <Button style={{ flex: 1 }} onClick={resetGame}>
            Reset Game
          </Button>
          <Button
            variant="outline"
            style={{ flex: 1 }}
            onClick={undoMove}
            disabled={!history.length}
          >
            Undo
          </Button>
        </div>
      </CardContent>
    </Card>
    <br />
    <hr style={{ display: "block", height: "1px", width: "50%", border: "none", borderTop: "1px solid #ccc", margin: "1rem 0" }} />
      <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "20px" }}>{turnText}</div>
      <svg width={500} height={500} className="bg-white rounded-2xl shadow-md">
        {Object.keys(edges).map((key) => {
          const [iS, jS] = key.split("-");
          const i = +iS,
            j = +jS;
          const { x: x1, y: y1 } = positions[i];
          const { x: x2, y: y2 } = positions[j];
          const color = edges[key];

          const isWinEdge =
            winningClique && winningClique.includes(i) && winningClique.includes(j);
          const strokeCol = isWinEdge && winner ? winner : color ?? "#cbd5e1";
          const glow = isWinEdge && winner
            ? { filter: `drop-shadow(0 0 4px ${winner})` }
            : undefined;

          return (
            <line
              key={key}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeCol}
              strokeWidth={isWinEdge ? 6 : 4}
              strokeLinecap="round"
              onClick={() => handleEdgeClick(key)}
              className={
                color ? "cursor-not-allowed" : "cursor-pointer hover:stroke-yellow-400"
              }
              style={glow}
            />
          );
        })}

        {positions.map(({ x, y }, idx) => {
          const inWin = winningClique && winningClique.includes(idx);
          const strokeCol = inWin && winner ? winner : "#1e293b";
          const glow = inWin && winner
            ? { filter: `drop-shadow(0 0 4px ${winner})` }
            : undefined;

          return (
            <React.Fragment key={idx}>
              <circle
                cx={x}
                cy={y}
                r={18}
                fill="#fff"
                stroke={strokeCol}
                strokeWidth={3}
                style={glow}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className="font-semibold select-none"
              >
                {idx}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}
