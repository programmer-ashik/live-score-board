import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import { getActiveTeam, getOpponentTeam, formatOvers, formatBowlerOvers, calculateStrikeRate, calculateEconomy } from '../../utils/helpers';

export default function ScorecardSummary() {
  const { state } = useScoreboard();
  const activeTeam = getActiveTeam(state);
  const oppTeam = getOpponentTeam(state);
  
  const extras = state.extras.wd + state.extras.nb + state.extras.b + state.extras.lb;
  const needRuns = state.target ? Math.max(0, state.target - state.score.runs) : 0;
  
  return (
    <div className="absolute inset-0 bg-slate-950/98 flex flex-col justify-between p-16 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            {activeTeam.logo ? (
              <img src={activeTeam.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="teko-font text-3xl text-white">{activeTeam.short}</span>
            )}
          </div>
          <div>
            <span className="teko-font text-5xl text-cyan-400">{activeTeam.full} INNINGS</span>
            <p className="text-xs text-slate-400 tracking-wider sports-font">{state.leagueName}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="teko-font text-7xl text-white">{state.score.runs}/{state.score.wickets}</span>
          <p className="text-xs text-slate-400">{formatOvers(state.score.overs, state.score.balls)} OVERS</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border-l-4 border-amber-500">
          <h3 className="teko-font text-3xl text-amber-400 mb-4 border-b border-slate-800 pb-2">BATTING SCORECARD</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {activeTeam.squad.filter(p => p.hasBatted).map(player => (
              <div key={player.id} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="font-bold text-slate-100">{player.name}</span>
                  {!player.isOut && <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded ml-2">NOT OUT</span>}
                  <div className="text-xs text-slate-500 italic">{player.dismissal}</div>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-xs text-slate-400">4s: {player.fours} | 6s: {player.sixes}</span>
                  <span className="text-xs text-slate-400">SR: {calculateStrikeRate(player.runs, player.balls)}</span>
                  <span className="text-2xl font-black text-amber-400">{player.runs}<span className="text-xs text-slate-500">({player.balls})</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border-l-4 border-teal-500">
          <h3 className="teko-font text-3xl text-teal-400 mb-4 border-b border-slate-800 pb-2">BOWLING SUMMARY</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {oppTeam.squad.filter(p => p.ballsBowled > 0).map(player => (
              <div key={player.id} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="font-bold text-slate-100">{player.name}</span>
                  <div className="text-xs text-slate-500">Overs: {formatBowlerOvers(player.ballsBowled)}</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Econ: {calculateEconomy(player.runsConceded, player.ballsBowled)}</div>
                  </div>
                  <span className="text-2xl font-black text-teal-400">{player.wickets}-{player.runsConceded}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-slate-800 pt-5 text-sm">
        <div className="flex space-x-8">
          <div>EXTRAS: <span className="text-white font-bold">{extras}</span></div>
          <div>PARTNERSHIP: <span className="text-white font-bold">{state.partnership.runs} ({state.partnership.balls})</span></div>
        </div>
        <div className="text-cyan-400 font-bold sports-font">
          {state.target && state.innings === 2 
            ? (needRuns > 0 ? `NEED ${needRuns} RUNS TO WIN` : `${activeTeam.short} WON!`)
            : 'INNINGS BREAK'}
        </div>
      </div>
    </div>
  );
}