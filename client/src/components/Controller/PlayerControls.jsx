import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import { getBattingSquad, getBowlingSquad, getStriker, getNonStriker, getCurrentBowler, calculateStrikeRate, formatBowlerOvers, calculateEconomy } from '../../utils/helpers';
import Card from '../Common/Card';

export default function PlayerControls() {
  const { state, changeStriker, updateActivePlayers } = useScoreboard();
  
  const battingSquad = getBattingSquad(state);
  const bowlingSquad = getBowlingSquad(state);
  const striker = getStriker(state);
  const nonStriker = getNonStriker(state);
  const bowler = getCurrentBowler(state);
  
  const strikerSR = calculateStrikeRate(striker?.runs || 0, striker?.balls || 0);
  const nonStrikerSR = calculateStrikeRate(nonStriker?.runs || 0, nonStriker?.balls || 0);
  const bowlerEcon = calculateEconomy(bowler?.runsConceded || 0, bowler?.ballsBowled || 0);

  return (
    <Card>
      <h3 className="font-bold text-slate-300 mb-4 flex items-center">
        <i className="fa-solid fa-users mr-2 text-cyan-400"></i>
        Active Players Control
      </h3>
      
      <div className="grid md:grid-cols-3 gap-5">
        {/* Striker */}
        <div className={`bg-slate-900/60 rounded-xl p-4 border-2 transition-all ${striker?.isStriking ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-slate-700'}`}>
          <div className="flex justify-between items-start mb-3">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Striker</label>
            <input
              type="radio"
              name="striker"
              checked={striker?.isStriking}
              onChange={() => changeStriker(1)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
          <select
            value={state.activePlayers.bat1Idx}
            onChange={(e) => updateActivePlayers({ bat1Idx: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3"
          >
            {battingSquad.filter(p => !p.isOut).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Runs:</span><span className="text-white font-bold">{striker?.runs || 0}</span></div>
            <div className="flex justify-between"><span>Balls:</span><span>{striker?.balls || 0}</span></div>
            <div className="flex justify-between"><span>4s/6s:</span><span>{striker?.fours || 0}/{striker?.sixes || 0}</span></div>
            <div className="flex justify-between"><span>SR:</span><span className="text-amber-400">{strikerSR}</span></div>
          </div>
        </div>

        {/* Non-Striker */}
        <div className={`bg-slate-900/60 rounded-xl p-4 border-2 transition-all ${nonStriker?.isStriking ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-slate-700'}`}>
          <div className="flex justify-between items-start mb-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Non-Striker</label>
            <input
              type="radio"
              name="striker"
              checked={nonStriker?.isStriking}
              onChange={() => changeStriker(2)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
          <select
            value={state.activePlayers.bat2Idx}
            onChange={(e) => updateActivePlayers({ bat2Idx: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3"
          >
            {battingSquad.filter(p => !p.isOut).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Runs:</span><span className="text-white font-bold">{nonStriker?.runs || 0}</span></div>
            <div className="flex justify-between"><span>Balls:</span><span>{nonStriker?.balls || 0}</span></div>
            <div className="flex justify-between"><span>4s/6s:</span><span>{nonStriker?.fours || 0}/{nonStriker?.sixes || 0}</span></div>
            <div className="flex justify-between"><span>SR:</span><span className="text-slate-300">{nonStrikerSR}</span></div>
          </div>
        </div>

        {/* Bowler */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
          <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3">Bowler</label>
          <select
            value={state.activePlayers.bowlerIdx}
            onChange={(e) => updateActivePlayers({ bowlerIdx: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3"
          >
            {bowlingSquad.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.wickets}/{p.runsConceded})</option>
            ))}
          </select>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Overs:</span><span className="text-white">{formatBowlerOvers(bowler?.ballsBowled || 0)}</span></div>
            <div className="flex justify-between"><span>Runs:</span><span>{bowler?.runsConceded || 0}</span></div>
            <div className="flex justify-between"><span>Wickets:</span><span className="text-emerald-400 font-bold">{bowler?.wickets || 0}</span></div>
            <div className="flex justify-between"><span>Economy:</span><span className="text-cyan-400">{bowlerEcon}</span></div>
          </div>
        </div>
      </div>

      {/* Current Over Info */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Current Over:</span>
          <div className="flex items-center space-x-3">
            <span className="text-amber-400 font-bold">{state.currentOver.runs} runs</span>
            <span className="text-slate-500">•</span>
            <span>{state.currentOver.balls}/6 balls</span>
          </div>
          <div className="flex space-x-1">
            {state.recentBalls.slice(-6).map((ball, i) => (
              <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                ball === '4' ? 'bg-emerald-600' : ball === '6' ? 'bg-amber-500 text-black' : ball === 'W' ? 'bg-red-600' : 'bg-slate-700'
              }`}>{ball}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}