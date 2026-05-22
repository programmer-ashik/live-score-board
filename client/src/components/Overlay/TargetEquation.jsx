import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import { calculateCRR, calculateRRR } from '../../utils/helpers';

export default function TargetEquation() {
  const { state } = useScoreboard();
  const crr = calculateCRR(state.score.runs, state.score.overs, state.score.balls);
  const totalBalls = state.matchOvers * 6;
  const played = (state.score.overs * 6) + state.score.balls;
  const ballsLeft = Math.max(0, totalBalls - played);
  const needRuns = state.target ? Math.max(0, state.target - state.score.runs) : 0;
  const rrr = calculateRRR(state.target, state.score.runs, ballsLeft);
  
  if (!state.target) return null;
  
  return (
    <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-24 transition-all duration-700">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <span className="teko-font text-5xl text-rose-500">CHASE EQUATION</span>
        <span className="sports-font text-2xl text-slate-400">{state.leagueName} • 2ND INNING</span>
      </div>
      
      <div className="flex flex-col items-center justify-center my-auto space-y-12">
        <div className="flex items-baseline space-x-6 text-center">
          <span className="text-slate-400 teko-font text-4xl">TARGET</span>
          <span className="text-slate-100 teko-font text-9xl font-extrabold animate-pulse">{state.target}</span>
          <span className="text-slate-400 teko-font text-4xl">RUNS</span>
        </div>
        
        <div className="glass-panel max-w-4xl w-full p-8 rounded-3xl border-2 border-rose-500/30">
          <div className="teko-font text-6xl text-white text-center mb-4">
            NEED {needRuns} RUNS IN {ballsLeft} BALLS
          </div>
          <div className="grid grid-cols-3 gap-8 w-full mt-6 pt-6 border-t border-slate-800 text-center">
            <div>
              <div className="text-slate-400 text-xs uppercase sports-font">Current Run Rate</div>
              <div className="text-4xl font-extrabold text-slate-100 mt-1">{crr}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase sports-font">Required Run Rate</div>
              <div className="text-4xl font-extrabold text-rose-400 mt-1">{rrr}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase sports-font">Wickets Left</div>
              <div className="text-4xl font-extrabold text-emerald-400 mt-1">{10 - state.score.wickets} Wkts</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-slate-400 sports-font text-lg">
        PARTNERSHIP: {state.partnership.runs} RUNS ({state.partnership.balls} BALLS)
      </div>
    </div>
  );
}