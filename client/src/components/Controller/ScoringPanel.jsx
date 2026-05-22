import React from 'react';
import { useScoreboard } from '../../context/ScoreboardContext';
import { formatOvers, calculateCRR } from '../../utils/helpers';
import Button from '../Common/Button';
import Card from '../Common/Card';

const RUN_BUTTONS = [
  { runs: 0, label: '0', color: 'secondary' },
  { runs: 1, label: '1', color: 'secondary' },
  { runs: 2, label: '2', color: 'secondary' },
  { runs: 3, label: '3', color: 'secondary' },
  { runs: 4, label: '4', color: 'success', isBoundary: true },
  { runs: 6, label: '6', color: 'warning', isBoundary: true },
  { runs: 5, label: '5', color: 'secondary' }
];

const EXTRA_BUTTONS = [
  { type: 'wd', label: 'WD', description: 'Wide +1' },
  { type: 'nb', label: 'NB', description: 'No Ball +1' },
  { type: 'by', label: 'BYE', description: 'Byes +1' },
  { type: 'lb', label: 'LB', description: 'Leg Bye +1' }
];

export default function ScoringPanel({ onWicket }) {
  const { state, addRuns, addExtra, undoLastBall, setTarget, setMatchOvers, setInnings, setBattingTeam } = useScoreboard();
  const activeTeam = state.battingTeam === 'teamA' ? state.teams.teamA : state.teams.teamB;
  const crr = calculateCRR(state.score.runs, state.score.overs, state.score.balls);

  return (
    <Card>
      <div className="space-y-5">
        {/* Score Display */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="text-6xl font-black teko-font text-white">
            {state.score.runs}/{state.score.wickets}
          </div>
          <div className="text-lg sports-font text-cyan-400 mt-1">
            {formatOvers(state.score.overs, state.score.balls)} / {state.matchOvers}.0 Overs
          </div>
          <div className="text-sm text-slate-400 mt-1">
            CRR: {crr} {state.target && state.innings === 2 && `| Target: ${state.target}`}
          </div>
        </div>

        {/* Match Controls Row */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <Button size="sm" variant={state.innings === 1 ? 'primary' : 'secondary'} onClick={() => setInnings(1)}>
              1st Innings
            </Button>
            <Button size="sm" variant={state.innings === 2 ? 'danger' : 'secondary'} onClick={() => setInnings(2)}>
              2nd Innings
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={state.battingTeam === 'teamA' ? 'primary' : 'secondary'} onClick={() => setBattingTeam('teamA')}>
              {state.teams.teamA.short} Batting
            </Button>
            <Button size="sm" variant={state.battingTeam === 'teamB' ? 'primary' : 'secondary'} onClick={() => setBattingTeam('teamB')}>
              {state.teams.teamB.short} Batting
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Target"
              value={state.target || ''}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-24 text-sm"
            />
            <input
              type="number"
              placeholder="Overs"
              value={state.matchOvers}
              onChange={(e) => setMatchOvers(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-20 text-sm"
            />
          </div>
        </div>

        {/* Run Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {RUN_BUTTONS.map(btn => (
            <Button
              key={btn.runs}
              onClick={() => addRuns(btn.runs, btn.isBoundary)}
              variant={btn.color}
              className="py-3"
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Extra Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXTRA_BUTTONS.map(btn => (
            <Button
              key={btn.type}
              onClick={() => addExtra(btn.type)}
              variant="warning"
              className="py-2 text-sm"
            >
              {btn.label}
              <span className="block text-[9px] text-yellow-300/70">{btn.description}</span>
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onWicket} variant="danger" fullWidth className="py-3">
            <i className="fa-solid fa-skull-crossbones mr-2"></i> OUT! (Wicket)
          </Button>
          <Button onClick={undoLastBall} variant="secondary" className="py-3 px-6">
            <i className="fa-solid fa-undo mr-2"></i> Undo
          </Button>
        </div>
      </div>
    </Card>
  );
}