import React from "react";
import { useScoreboard } from "../../context/ScoreboardContext";
import {
  getActiveTeam,
  getStriker,
  getNonStriker,
  getCurrentBowler,
  formatOvers,
  formatBowlerOvers,
  calculateStrikeRate,
  calculateEconomy,
  calculateCRR,
} from "../../utils/helpers";

export default function ScoreboardWidget() {
  const { state } = useScoreboard();
  const activeTeam = getActiveTeam(state);
  const striker = getStriker(state);
  const nonStriker = getNonStriker(state);
  const bowler = getCurrentBowler(state);
  const crr = calculateCRR(
    state.score.runs,
    state.score.overs,
    state.score.balls,
  );
  const strikerSR = calculateStrikeRate(
    striker?.runs || 0,
    striker?.balls || 0,
  );
  const nonStrikerSR = calculateStrikeRate(
    nonStriker?.runs || 0,
    nonStriker?.balls || 0,
  );
  const bowlerEcon = calculateEconomy(
    bowler?.runsConceded || 0,
    bowler?.ballsBowled || 0,
  );

  const logoHtml = activeTeam.logo
    ? `<img src="${activeTeam.logo}" class="w-10 h-10 object-cover rounded-full" alt="logo">`
    : `<div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold">${activeTeam.short}</div>`;

  const theme = state.themeStyle;

  if (theme === "icc") {
    return (
      <div className='fixed bottom-8 left-[120px] right-[120px] z-50'>
        <div className='flex justify-between items-end mb-1'>
          <div className='glass-panel px-4 py-1 rounded-t-xl text-xs sports-font'>
            PART: {state.partnership.runs}({state.partnership.balls}) | EX:{" "}
            {state.extras.wd +
              state.extras.nb +
              state.extras.b +
              state.extras.lb}
          </div>
          <div className='glass-panel px-4 py-1 rounded-t-xl text-xs sports-font'>
            CRR: {crr}
            {state.target && state.innings === 2 && ` | RRR: ${calculateRRR()}`}
          </div>
        </div>
        <div
          className='glass-panel h-[72px] rounded-2xl overflow-hidden flex items-center justify-between border-l-8'
          style={{ borderColor: activeTeam.color2 }}
        >
          <div
            className='flex items-center h-full px-6'
            style={{
              background: `linear-gradient(135deg, ${activeTeam.color1}, ${activeTeam.color2})`,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: logoHtml }} />
            <div className='ml-3'>
              <div className='text-3xl font-black'>
                {activeTeam.short} {state.score.runs}/{state.score.wickets}
              </div>
              <div className='text-[10px]'>
                {formatOvers(state.score.overs, state.score.balls)} OVERS
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-8 px-8'>
            <div className='flex items-center space-x-3'>
              <span className='w-2 h-2 bg-amber-400 rounded-full animate-pulse'></span>
              <div>
                <div className='font-bold'>{striker?.name || ""}</div>
                <div className='text-[10px]'>SR: {strikerSR}</div>
              </div>
              <span className='text-2xl font-bold text-amber-400'>
                {striker?.runs || 0}
                <span className='text-sm text-white'>
                  ({striker?.balls || 0})
                </span>
              </span>
            </div>
            <div className='text-slate-600 text-2xl'>|</div>
            <div className='flex items-center space-x-3 opacity-70'>
              <div>
                <div className='font-semibold'>{nonStriker?.name || ""}</div>
                <div className='text-[10px]'>SR: {nonStrikerSR}</div>
              </div>
              <span className='text-2xl font-bold'>
                {nonStriker?.runs || 0}
                <span className='text-sm'>({nonStriker?.balls || 0})</span>
              </span>
            </div>
          </div>
          <div className='flex items-center bg-black/40 h-full px-6 space-x-4'>
            <div className='text-right'>
              <div className='font-bold'>{bowler?.name || ""}</div>
              <div className='text-xs'>
                {formatBowlerOvers(bowler?.ballsBowled || 0)} -{" "}
                {bowler?.maidens || 0} - {bowler?.runsConceded || 0} -{" "}
                {bowler?.wickets || 0}
              </div>
            </div>
            <div className='flex space-x-1'>
              {state.recentBalls.slice(-6).map((ball, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full ${
                    ball === "4"
                      ? "bg-emerald-600"
                      : ball === "6"
                        ? "bg-amber-500 text-black"
                        : ball === "W"
                          ? "bg-red-600 animate-pulse"
                          : ball === "WD" || ball === "NB"
                            ? "bg-yellow-600"
                            : "bg-slate-800"
                  }`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimal ticker theme
  return (
    <div className='fixed bottom-0 left-0 right-0 h-16 bg-black/90 border-t border-cyan-800 flex items-center justify-between px-8 text-white z-50'>
      <div className='flex items-center space-x-4'>
        <span className='font-black text-xl'>
          {activeTeam.short} {state.score.runs}/{state.score.wickets}
        </span>
        <span className='text-sm'>
          {formatOvers(state.score.overs, state.score.balls)} ov
        </span>
      </div>
      <div className='flex items-center space-x-6'>
        <div>
          <span className='text-amber-400'>{striker?.runs || 0}*</span> (
          {striker?.balls || 0})
        </div>
        <div>
          {bowler?.name} {bowler?.wickets || 0}/{bowler?.runsConceded || 0}
        </div>
        <div className='text-xs text-cyan-400'>CRR: {crr}</div>
      </div>
    </div>
  );
}
