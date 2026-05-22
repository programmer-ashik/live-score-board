import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import Card from '../Common/Card';

export default function SquadManager() {
  const { state, updateTeamConfig } = useScoreboard();

  const updatePlayerName = (teamId, playerId, name) => {
    const squad = [...state.teams[teamId].squad];
    const index = squad.findIndex(p => p.id === playerId);
    if (index !== -1) {
      squad[index] = { ...squad[index], name };
      updateTeamConfig(teamId, { squad });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Team A Squad */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-xl">{state.teams.teamA.full}</h3>
            <p className="text-xs text-slate-400">Squad Management</p>
          </div>
          <div className="flex gap-2">
            <input
              value={state.teams.teamA.short}
              onChange={(e) => updateTeamConfig('teamA', { short: e.target.value.toUpperCase() })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-20 text-center text-sm font-bold"
              maxLength="3"
            />
            <input
              value={state.teams.teamA.full}
              onChange={(e) => updateTeamConfig('teamA', { full: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {state.teams.teamA.squad.map((player, idx) => (
            <div key={player.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 w-8">{idx + 1}</span>
              <input
                value={player.name}
                onChange={(e) => updatePlayerName('teamA', player.id, e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2 text-xs text-slate-400">
                <span>{player.runs} runs</span>
                <span>|</span>
                <span className="text-emerald-400">{player.wickets} wkts</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Team B Squad */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-xl">{state.teams.teamB.full}</h3>
            <p className="text-xs text-slate-400">Squad Management</p>
          </div>
          <div className="flex gap-2">
            <input
              value={state.teams.teamB.short}
              onChange={(e) => updateTeamConfig('teamB', { short: e.target.value.toUpperCase() })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-20 text-center text-sm font-bold"
              maxLength="3"
            />
            <input
              value={state.teams.teamB.full}
              onChange={(e) => updateTeamConfig('teamB', { full: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {state.teams.teamB.squad.map((player, idx) => (
            <div key={player.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 w-8">{idx + 1}</span>
              <input
                value={player.name}
                onChange={(e) => updatePlayerName('teamB', player.id, e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2 text-xs text-slate-400">
                <span>{player.runs} runs</span>
                <span>|</span>
                <span className="text-emerald-400">{player.wickets} wkts</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}