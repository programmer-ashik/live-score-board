import { useEffect, useState } from "react";
import { useScoreboard } from "../../context/ScoreboardContext";
import ScoreboardWidget from "./ScoreboardWidget";
import VsIntroCard from "./VsIntroCard";
import ScorecardSummary from "./ScorecardSummary";
import TargetEquation from "./TargetEquation";

export default function BroadcastOverlay() {
  const { state } = useScoreboard();
  const [boundary, setBoundary] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const handleBoundary = (e) => {
      setBoundary(e.detail);
      setTimeout(() => setBoundary(null), 3000);
    };
    const handleAlert = (e) => {
      setAlert(e.detail);
      setTimeout(() => setAlert(null), 3500);
    };

    window.addEventListener("boundary", handleBoundary);
    window.addEventListener("alert", handleAlert);

    return () => {
      window.removeEventListener("boundary", handleBoundary);
      window.removeEventListener("alert", handleAlert);
    };
  }, []);

  return (
    <div className='fixed inset-0 w-[1920px] h-[1080px] bg-transparent overflow-hidden pointer-events-none select-none'>
      {/* Boundary Alert */}
      {boundary && (
        <div className='absolute left-1/2 -translate-x-1/2 bottom-[180px] w-[500px] text-center z-50 animate-boundary'>
          <div
            className={`rounded-2xl py-6 px-10 border-4 ${
              boundary.runs === 6
                ? "border-amber-500 bg-linear-to-r from-amber-950 to-orange-950 text-amber-400 glow-orange"
                : "border-emerald-500 bg-linear-to-r from-emerald-950 to-teal-950 text-emerald-400 glow-green"
            }`}
          >
            <div className='teko-font text-8xl tracking-widest'>
              {boundary.runs === 6 ? "SIX!" : "FOUR!"}
            </div>
            <div className='sports-font text-xl tracking-wider mt-2'>
              {boundary.batsman?.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* General Alert */}
      {alert && (
        <div className='absolute top-12 left-1/2 -translate-x-1/2 glass-panel border-t-4 border-amber-500 px-12 py-6 rounded-xl z-50 animate-boundary'>
          <div className='teko-font text-6xl text-amber-400'>{alert.title}</div>
          <div className='sports-font text-xl text-slate-300 mt-1'>
            {alert.subtitle}
          </div>
        </div>
      )}

      {/* Scoreboard Widget */}
      {state.overlays.lowerThird && <ScoreboardWidget />}

      {/* Full Frame Overlays */}
      {state.overlays.fullFrameVs && <VsIntroCard />}
      {state.overlays.fullFrameSummary && <ScorecardSummary />}
      {state.overlays.fullFrameTarget && <TargetEquation />}
    </div>
  );
}
