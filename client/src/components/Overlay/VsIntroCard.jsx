;
import { useScoreboard } from '../../context/ScoreboardContext';

export default function VsIntroCard() {
  const { state } = useScoreboard();
  
  return (
    <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-24 transition-all duration-700">
      <div className="flex justify-between items-center">
        <span className="teko-font text-5xl text-cyan-400">{state.leagueName}</span>
        <span className="sports-font text-2xl bg-cyan-950/80 border border-cyan-800 px-6 py-2 rounded-full">MATCH LIVE</span>
      </div>
      
      <div className="flex items-center justify-center space-x-20 my-auto">
        <div className="flex flex-col items-center w-5/12 text-center p-10 rounded-3xl border border-slate-800 bg-slate-900/30 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-3" style={{ backgroundColor: state.teams.teamA.color1 }}></div>
          <div className="w-28 h-28 mb-6 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center overflow-hidden">
            {state.teams.teamA.logo ? (
              <img src={state.teams.teamA.logo} alt="A" className="w-full h-full object-cover" />
            ) : (
              <span className="teko-font text-5xl text-white">{state.teams.teamA.short}</span>
            )}
          </div>
          <div className="teko-font text-9xl text-slate-100">{state.teams.teamA.short}</div>
          <div className="sports-font text-2xl text-slate-400 mt-2">{state.teams.teamA.full}</div>
        </div>
        
        <div className="w-28 h-28 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 teko-font text-6xl font-black shadow-[0_0_35px_rgba(6,182,212,0.6)]">VS</div>
        
        <div className="flex flex-col items-center w-5/12 text-center p-10 rounded-3xl border border-slate-800 bg-slate-900/30 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-3" style={{ backgroundColor: state.teams.teamB.color1 }}></div>
          <div className="w-28 h-28 mb-6 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center overflow-hidden">
            {state.teams.teamB.logo ? (
              <img src={state.teams.teamB.logo} alt="B" className="w-full h-full object-cover" />
            ) : (
              <span className="teko-font text-5xl text-white">{state.teams.teamB.short}</span>
            )}
          </div>
          <div className="teko-font text-9xl text-slate-100">{state.teams.teamB.short}</div>
          <div className="sports-font text-2xl text-slate-400 mt-2">{state.teams.teamB.full}</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-slate-500 uppercase tracking-widest text-lg sports-font mb-2">Venue</div>
        <div className="text-3xl font-bold text-slate-200">{state.venue}</div>
      </div>
    </div>
  );
}