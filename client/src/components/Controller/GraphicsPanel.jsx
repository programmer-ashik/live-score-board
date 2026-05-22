import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import Card from '../Common/Card';

export default function GraphicsPanel({ expanded = false }) {
  const { state, toggleOverlay, setTheme, updateTeamConfig } = useScoreboard();

  const overlays = [
    { key: 'lowerThird', label: 'Lower Third Scorebar', description: 'Live score ticker at bottom' },
    { key: 'fullFrameVs', label: 'VS Intro Card', description: 'Full screen match intro' },
    { key: 'fullFrameSummary', label: 'Scorecard Summary', description: 'Innings break scorecard' },
    { key: 'fullFrameTarget', label: 'Target Equation', description: 'Chase calculator card' }
  ];

  return (
    <Card>
      <h3 className="font-bold text-slate-300 mb-4 flex items-center">
        <i className="fa-solid fa-sliders-h mr-2 text-cyan-400"></i>
        Broadcast Graphics Control
      </h3>
      
      <div className="space-y-3">
        {overlays.map(overlay => (
          <label key={overlay.key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-all">
            <div>
              <span className="font-semibold text-sm">{overlay.label}</span>
              <p className="text-[10px] text-slate-500">{overlay.description}</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={state.overlays[overlay.key]}
                onChange={(e) => toggleOverlay(overlay.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <label className="text-xs text-slate-400 block mb-2">Scoreboard Theme</label>
        <select
          value={state.themeStyle}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="icc">ICC Style (Floating Pill)</option>
          <option value="ticker">Minimal Ticker</option>
          <option value="fullwidth">Full Width Panoramic</option>
        </select>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <h4 className="text-sm font-semibold mb-3">Team Colors</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Team A Primary</label>
              <input
                type="color"
                value={state.teams.teamA.color1}
                onChange={(e) => updateTeamConfig('teamA', { color1: e.target.value })}
                className="w-full h-10 bg-slate-800 rounded border border-slate-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Team A Accent</label>
              <input
                type="color"
                value={state.teams.teamA.color2}
                onChange={(e) => updateTeamConfig('teamA', { color2: e.target.value })}
                className="w-full h-10 bg-slate-800 rounded border border-slate-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Team B Primary</label>
              <input
                type="color"
                value={state.teams.teamB.color1}
                onChange={(e) => updateTeamConfig('teamB', { color1: e.target.value })}
                className="w-full h-10 bg-slate-800 rounded border border-slate-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Team B Accent</label>
              <input
                type="color"
                value={state.teams.teamB.color2}
                onChange={(e) => updateTeamConfig('teamB', { color2: e.target.value })}
                className="w-full h-10 bg-slate-800 rounded border border-slate-700"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}