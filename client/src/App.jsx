import React, { useState, useEffect, useCallback, useRef } from 'react';

// ==================== CONSTANTS & HELPERS ====================
const STORAGE_KEY = 'cricket_scoreboard_state';
const UPDATE_INTERVAL = 500; // Check for updates every 500ms

const TEAM_A_DEFAULTS = ['Rohit Sharma', 'Yashasvi Jaiswal', 'Virat Kohli', 'Suryakumar Yadav', 'Rishabh Pant', 'Hardik Pandya', 'Ravindra Jadeja', 'Jasprit Bumrah', 'Kuldeep Yadav', 'Mohammed Shami', 'Arshdeep Singh'];
const TEAM_B_DEFAULTS = ['Travis Head', 'David Warner', 'Mitchell Marsh', 'Glenn Maxwell', 'Marcus Stoinis', 'Tim David', 'Matthew Wade', 'Pat Cummins', 'Mitchell Starc', 'Adam Zampa', 'Josh Hazlewood'];

function createPlayer(id, name) {
  return { 
    id, name, runs: 0, balls: 0, fours: 0, sixes: 0, 
    isOut: false, dismissal: 'Not Out', hasBatted: id < 2, 
    isStriking: id === 0, ballsBowled: 0, runsConceded: 0, 
    wickets: 0, maidens: 0 
  };
}

function createInitialState() {
  const squadA = TEAM_A_DEFAULTS.map((n, i) => createPlayer(i, n));
  const squadB = TEAM_B_DEFAULTS.map((n, i) => createPlayer(i, n));
  
  return {
    matchId: 'live_001',
    status: 'live',
    leagueName: 'ICC CHAMPIONS TROPHY',
    venue: 'MELBOURNE CRICKET GROUND',
    matchOvers: 20,
    innings: 1,
    target: null,
    battingTeam: 'teamA',
    teams: {
      teamA: { id: 'teamA', short: 'IND', full: 'INDIA', color1: '#1e3a8a', color2: '#3b82f6', logo: '', squad: squadA },
      teamB: { id: 'teamB', short: 'AUS', full: 'AUSTRALIA', color1: '#064e3b', color2: '#10b981', logo: '', squad: squadB }
    },
    score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
    extras: { wd: 0, nb: 0, b: 0, lb: 0 },
    recentBalls: [],
    partnership: { runs: 0, balls: 0 },
    currentOver: { runs: 0, balls: 0 },
    activePlayers: { bat1Idx: 0, bat2Idx: 1, bowlerIdx: 7 },
    themeStyle: 'icc',
    overlays: { lowerThird: true, fullFrameVs: false, fullFrameSummary: false, fullFrameTarget: false },
    lastUpdated: Date.now()
  };
}

function getBattingSquad(state) { return state.battingTeam === 'teamA' ? state.teams.teamA.squad : state.teams.teamB.squad; }
function getBowlingSquad(state) { return state.battingTeam === 'teamA' ? state.teams.teamB.squad : state.teams.teamA.squad; }
function getActiveTeam(state) { return state.battingTeam === 'teamA' ? state.teams.teamA : state.teams.teamB; }
function getStriker(state) { const squad = getBattingSquad(state); return squad.find(p => p.isStriking) || squad[state.activePlayers.bat1Idx]; }
function getNonStriker(state) { const squad = getBattingSquad(state); return squad.find(p => !p.isStriking) || squad[state.activePlayers.bat2Idx]; }
function getCurrentBowler(state) { const squad = getBowlingSquad(state); return squad[state.activePlayers.bowlerIdx] || squad[0]; }
function formatOvers(overs, balls) { return `${overs}.${balls}`; }
function formatBowlerOvers(totalBalls) { return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`; }
function calculateStrikeRate(runs, balls) { return balls === 0 ? '0.0' : ((runs / balls) * 100).toFixed(1); }
function calculateEconomy(runs, balls) { const overs = balls / 6; return overs === 0 ? '0.00' : (runs / overs).toFixed(2); }
function calculateCRR(runs, overs, balls) { const totalOvers = overs + balls / 6; return totalOvers === 0 ? '0.00' : (runs / totalOvers).toFixed(2); }
function calculateRRR(target, runs, ballsLeft) { 
  if (!target || ballsLeft === 0) return '0.00';
  const runsNeeded = Math.max(0, target - runs);
  return ((runsNeeded / ballsLeft) * 6).toFixed(2);
}

function rotateStrike(state) {
  const squad = getBattingSquad(state);
  const bat1 = squad[state.activePlayers.bat1Idx];
  const bat2 = squad[state.activePlayers.bat2Idx];
  if (bat1 && bat2) {
    const temp = bat1.isStriking;
    bat1.isStriking = bat2.isStriking;
    bat2.isStriking = temp;
  }
}

// Custom hook for OBS overlay to listen for storage changes
function useStorageSync() {
  const [state, setState] = useState(null);
  const [version, setVersion] = useState(0);
  
  useEffect(() => {
    // Initial load
    const loadState = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.teams?.teamA?.squad?.length) {
            setState(parsed);
            return;
          }
        } catch (e) {}
      }
      setState(createInitialState());
    };
    loadState();
    
    // Poll for changes (for OBS overlay)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.teams?.teamA?.squad?.length) {
            setState(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                setVersion(v => v + 1);
                return parsed;
              }
              return prev;
            });
          }
        } catch (e) {}
      }
    }, UPDATE_INTERVAL);
    
    // Also listen for storage events (cross-tab)
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.teams?.teamA?.squad?.length) {
            setState(parsed);
            setVersion(v => v + 1);
          }
        } catch (err) {}
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  return { state, version };
}

// ==================== APP COMPONENT ====================
export default function App() {
  const isOverlayMode = window.location.hash === '#overlay';
  return isOverlayMode ? <BroadcastOverlay /> : <ControllerDashboard />;
}

// ==================== CONTROLLER DASHBOARD ====================
function ControllerDashboard() {
  const [state, setState] = useState(null);
  const [activeTab, setActiveTab] = useState('scoring');
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [boundaryAlert, setBoundaryAlert] = useState(null);
  const [wicketAlert, setWicketAlert] = useState(null);
  const historyStackRef = useRef([]);

  useEffect(() => {
    const loadState = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.teams?.teamA?.squad?.length) {
            setState(parsed);
            return;
          }
        } catch (e) {}
      }
      setState(createInitialState());
    };
    loadState();
    
    // Listen for storage events from other tabs
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.teams?.teamA?.squad?.length) {
            setState(parsed);
          }
        } catch (err) {}
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveState = useCallback((newState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    // Trigger storage event manually for same tab
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(state)
    }));
  }, [state]);

  const updateState = useCallback((updater) => {
    setState(prev => {
      if (!prev) return prev;
      const newState = JSON.parse(JSON.stringify(prev));
      updater(newState);
      newState.lastUpdated = Date.now();
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const pushHistory = useCallback(() => {
    if (state) {
      historyStackRef.current.push(JSON.parse(JSON.stringify(state)));
      if (historyStackRef.current.length > 30) historyStackRef.current.shift();
    }
  }, [state]);

  const showAlert = useCallback((title, subtitle) => {
    setWicketAlert({ title, subtitle });
    setTimeout(() => setWicketAlert(null), 3000);
  }, []);

  const showBoundary = useCallback((runs, batsman) => {
    setBoundaryAlert({ runs, batsman });
    setTimeout(() => setBoundaryAlert(null), 2500);
  }, []);

  const undoLastBall = useCallback(() => {
    if (historyStackRef.current.length > 0) {
      const previous = historyStackRef.current.pop();
      setState(previous);
      saveState(previous);
      showAlert('UNDO', 'Last ball undone');
    } else {
      showAlert('UNDO', 'No action to undo');
    }
  }, [saveState, showAlert]);

  const addRuns = useCallback((runs, isBoundary = false) => {
    pushHistory();
    updateState(s => {
      const batSquad = getBattingSquad(s);
      const bowlSquad = getBowlingSquad(s);
      const striker = getStriker(s);
      const nonStriker = getNonStriker(s);
      const bowler = getCurrentBowler(s);
      
      striker.runs += runs;
      striker.balls++;
      if (runs === 4 && isBoundary) striker.fours++;
      if (runs === 6 && isBoundary) striker.sixes++;
      bowler.runsConceded += runs;
      bowler.ballsBowled++;
      s.score.runs += runs;
      s.score.balls++;
      s.partnership.runs += runs;
      s.partnership.balls++;
      s.currentOver.runs += runs;
      s.currentOver.balls++;
      s.recentBalls.push(runs.toString());
      if (s.recentBalls.length > 6) s.recentBalls.shift();
      
      if (runs % 2 === 1) {
        striker.isStriking = false;
        nonStriker.isStriking = true;
      }
      
      if (s.score.balls >= 6) {
        s.score.overs++;
        s.score.balls = 0;
        rotateStrike(s);
        s.currentOver = { runs: 0, balls: 0 };
      }
      
      if (isBoundary) {
        showBoundary(runs, striker.name);
      }
    });
  }, [pushHistory, updateState, showBoundary]);

  const addExtra = useCallback((type) => {
    pushHistory();
    updateState(s => {
      const bowler = getCurrentBowler(s);
      if (type === 'wd' || type === 'nb') {
        s.score.runs += 1;
        s.extras[type] += 1;
        bowler.runsConceded += 1;
        s.currentOver.runs += 1;
        s.recentBalls.push(type.toUpperCase());
      } else if (type === 'by' || type === 'lb') {
        s.score.runs += 1;
        s.extras[type] += 1;
        s.score.balls++;
        s.currentOver.balls++;
        bowler.ballsBowled++;
        s.partnership.balls++;
        const striker = getStriker(s);
        if (striker) striker.balls++;
        s.recentBalls.push(type === 'by' ? 'B' : 'LB');
        if (s.score.balls >= 6) {
          s.score.overs++;
          s.score.balls = 0;
          rotateStrike(s);
          s.currentOver = { runs: 0, balls: 0 };
        }
      }
      if (s.recentBalls.length > 6) s.recentBalls.shift();
    });
  }, [pushHistory, updateState]);

  const registerWicket = useCallback((playerId, dismissalType, incomingId) => {
    pushHistory();
    updateState(s => {
      const batSquad = getBattingSquad(s);
      const bowlSquad = getBowlingSquad(s);
      const dismissed = batSquad.find(p => p.id === playerId);
      const bowler = getCurrentBowler(s);
      
      if (dismissed) {
        dismissed.isOut = true;
        dismissed.dismissal = dismissalType;
        if (dismissalType !== 'Run Out') bowler.wickets++;
        bowler.ballsBowled++;
        s.score.wickets++;
        s.score.balls++;
        s.currentOver.balls++;
        s.recentBalls.push('W');
        if (s.recentBalls.length > 6) s.recentBalls.shift();
        s.partnership = { runs: 0, balls: 0 };
        
        const newBatsman = batSquad.find(p => p.id === incomingId);
        if (newBatsman) {
          newBatsman.hasBatted = true;
          newBatsman.isStriking = dismissed.isStriking;
          if (playerId === s.activePlayers.bat1Idx) s.activePlayers.bat1Idx = incomingId;
          else s.activePlayers.bat2Idx = incomingId;
        }
        
        if (s.score.balls >= 6) {
          s.score.overs++;
          s.score.balls = 0;
          rotateStrike(s);
          s.currentOver = { runs: 0, balls: 0 };
        }
        
        showAlert('WICKET!', `${dismissed.name} ${dismissed.runs}(${dismissed.balls})`);
      }
    });
  }, [pushHistory, updateState, showAlert]);

  const resetMatch = useCallback(() => {
    pushHistory();
    const newState = createInitialState();
    setState(newState);
    saveState(newState);
    showAlert('MATCH RESET', 'All stats have been cleared');
  }, [pushHistory, saveState, showAlert]);

  const setInnings = useCallback((innings) => updateState(s => { s.innings = innings; }), [updateState]);
  const setBattingTeam = useCallback((team) => updateState(s => { s.battingTeam = team; }), [updateState]);
  const setTarget = useCallback((target) => updateState(s => { s.target = target ? parseInt(target) : null; }), [updateState]);
  const setMatchOvers = useCallback((overs) => updateState(s => { s.matchOvers = parseInt(overs); }), [updateState]);
  const toggleOverlay = useCallback((key, value) => updateState(s => { s.overlays[key] = value; }), [updateState]);
  const setTheme = useCallback((theme) => updateState(s => { s.themeStyle = theme; }), [updateState]);
  const updateTeamConfig = useCallback((teamId, config) => updateState(s => { Object.assign(s.teams[teamId], config); }), [updateState]);
  const updateActivePlayers = useCallback((updates) => updateState(s => { Object.assign(s.activePlayers, updates); }), [updateState]);
  const changeStriker = useCallback((side) => updateState(s => {
    const squad = getBattingSquad(s);
    squad.forEach(p => p.isStriking = false);
    if (side === 1) squad[s.activePlayers.bat1Idx].isStriking = true;
    else squad[s.activePlayers.bat2Idx].isStriking = true;
  }), [updateState]);

  const handleLaunchOBS = () => {
    const url = `${window.location.origin}${window.location.pathname}#overlay`;
    window.open(url, '_blank', 'width=1920,height=1080');
  };

  if (!state) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const activeTeam = getActiveTeam(state);
  const crr = calculateCRR(state.score.runs, state.score.overs, state.score.balls);
  const battingSquad = getBattingSquad(state);
  const bowlingSquad = getBowlingSquad(state);
  const striker = getStriker(state);
  const nonStriker = getNonStriker(state);
  const bowler = getCurrentBowler(state);

  return (
    <div className="min-h-screen bg-slate-950">
      {boundaryAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className={`rounded-2xl py-4 px-8 border-4 ${boundaryAlert.runs === 6 ? 'border-amber-500 bg-amber-950 text-amber-400' : 'border-emerald-500 bg-emerald-950 text-emerald-400'}`}>
            <div className="teko-font text-6xl">{boundaryAlert.runs === 6 ? 'SIX!' : 'FOUR!'}</div>
            <div className="sports-font text-sm">{boundaryAlert.batsman}</div>
          </div>
        </div>
      )}
      {wicketAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="rounded-2xl py-4 px-8 border-4 border-red-500 bg-red-950 text-red-400">
            <div className="teko-font text-5xl">{wicketAlert.title}</div>
            <div className="sports-font text-xs">{wicketAlert.subtitle}</div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 flex items-center justify-center">
              <i className="fa-solid fa-tv text-white text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold">CRICKET SCOREBOARD</h1>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-emerald-400">LIVE SYNC</span>
              </div>
            </div>
          </div>
          <button onClick={handleLaunchOBS} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <i className="fa-solid fa-tower-broadcast mr-2"></i> Launch OBS View
          </button>
        </div>
        
        <div className="flex space-x-2 mt-3">
          {['scoring', 'squad', 'graphics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              <div className="glass-panel p-6 text-center">
                <div className="text-7xl font-black teko-font">{state.score.runs}/{state.score.wickets}</div>
                <div className="text-lg sports-font text-cyan-400 mt-1">{formatOvers(state.score.overs, state.score.balls)} / {state.matchOvers}.0 Overs</div>
                <div className="text-sm text-slate-400 mt-1">CRR: {crr} {state.target && state.innings === 2 && `| Target: ${state.target}`}</div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex flex-wrap gap-2 justify-between mb-4">
                  <div className="flex gap-2">
                    <button onClick={() => setInnings(1)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${state.innings === 1 ? 'bg-cyan-600' : 'bg-slate-700'}`}>1st Inn</button>
                    <button onClick={() => setInnings(2)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${state.innings === 2 ? 'bg-rose-600' : 'bg-slate-700'}`}>2nd Inn</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBattingTeam('teamA')} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${state.battingTeam === 'teamA' ? 'bg-cyan-600' : 'bg-slate-700'}`}>{state.teams.teamA.short} Bat</button>
                    <button onClick={() => setBattingTeam('teamB')} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${state.battingTeam === 'teamB' ? 'bg-emerald-600' : 'bg-slate-700'}`}>{state.teams.teamB.short} Bat</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Target" value={state.target || ''} onChange={e => setTarget(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-24 text-sm" />
                    <input type="number" value={state.matchOvers} onChange={e => setMatchOvers(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-20 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                  {[0,1,2,3,4,6,5].map(r => (
                    <button key={r} onClick={() => addRuns(r, r === 4 || r === 6)} className={`py-3 rounded-lg font-bold transition-all ${r === 4 ? 'bg-emerald-600 hover:bg-emerald-500' : r === 6 ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}>{r}</button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {['wd', 'nb', 'by', 'lb'].map(type => (
                    <button key={type} onClick={() => addExtra(type)} className="bg-yellow-600/80 hover:bg-yellow-500 py-2 rounded-lg font-bold text-sm uppercase">{type}</button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowWicketModal(true)} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold"><i className="fa-solid fa-skull mr-2"></i> OUT!</button>
                  <button onClick={undoLastBall} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-bold"><i className="fa-solid fa-undo mr-2"></i> Undo</button>
                  <button onClick={resetMatch} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-bold"><i className="fa-solid fa-rotate-left mr-2"></i> Reset</button>
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`bg-slate-900/60 rounded-xl p-4 border-2 ${striker?.isStriking ? 'border-amber-500' : 'border-slate-700'}`}>
                    <div className="flex justify-between mb-2"><span className="font-bold">Striker</span><input type="radio" checked={striker?.isStriking} onChange={() => changeStriker(1)} className="accent-amber-500" /></div>
                    <select value={state.activePlayers.bat1Idx} onChange={e => updateActivePlayers({ bat1Idx: parseInt(e.target.value) })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2">
                      {battingSquad.filter(p => !p.isOut).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="text-xs text-slate-400">Runs: {striker?.runs || 0} ({striker?.balls || 0}) | 4s/6s: {striker?.fours || 0}/{striker?.sixes || 0}</div>
                  </div>
                  <div className={`bg-slate-900/60 rounded-xl p-4 border-2 ${nonStriker?.isStriking ? 'border-amber-500' : 'border-slate-700'}`}>
                    <div className="flex justify-between mb-2"><span className="font-bold">Non-Striker</span><input type="radio" checked={nonStriker?.isStriking} onChange={() => changeStriker(2)} className="accent-amber-500" /></div>
                    <select value={state.activePlayers.bat2Idx} onChange={e => updateActivePlayers({ bat2Idx: parseInt(e.target.value) })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2">
                      {battingSquad.filter(p => !p.isOut).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="text-xs text-slate-400">Runs: {nonStriker?.runs || 0} ({nonStriker?.balls || 0})</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
                    <div className="font-bold mb-2">Bowler</div>
                    <select value={state.activePlayers.bowlerIdx} onChange={e => updateActivePlayers({ bowlerIdx: parseInt(e.target.value) })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2">
                      {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name} ({p.wickets}/{p.runsConceded})</option>)}
                    </select>
                    <div className="text-xs text-slate-400">Overs: {formatBowlerOvers(bowler?.ballsBowled || 0)} | Econ: {calculateEconomy(bowler?.runsConceded || 0, bowler?.ballsBowled || 0)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-sm">
                  <span className="text-slate-400">This Over:</span>
                  <span className="text-amber-400 font-bold">{state.currentOver.runs}/{state.currentOver.balls}</span>
                  <div className="flex space-x-1">
                    {state.recentBalls.slice(-6).map((b, i) => (
                      <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${b === '4' ? 'bg-emerald-600' : b === '6' ? 'bg-amber-500 text-black' : b === 'W' ? 'bg-red-600' : 'bg-slate-700'}`}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="glass-panel p-5">
                <h3 className="font-bold mb-3">Broadcast Graphics</h3>
                {['lowerThird', 'fullFrameVs', 'fullFrameSummary', 'fullFrameTarget'].map(key => (
                  <label key={key} className="flex justify-between items-center py-2 cursor-pointer">
                    <span className="text-sm">{key === 'lowerThird' ? 'Scorebar' : key === 'fullFrameVs' ? 'VS Intro' : key === 'fullFrameSummary' ? 'Scorecard' : 'Target Card'}</span>
                    <input type="checkbox" checked={state.overlays[key]} onChange={e => toggleOverlay(key, e.target.checked)} className="w-5 h-5 accent-cyan-500" />
                  </label>
                ))}
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <select value={state.themeStyle} onChange={e => setTheme(e.target.value)} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm">
                    <option value="icc">ICC Style</option>
                    <option value="ticker">Minimal Ticker</option>
                  </select>
                </div>
              </div>

              <div className="glass-panel p-5">
                <h3 className="font-bold mb-3">Team Settings</h3>
                <input value={state.teams.teamA.short} onChange={e => updateTeamConfig('teamA', { short: e.target.value.toUpperCase() })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2" placeholder="Team A Short" maxLength="3" />
                <input value={state.teams.teamA.full} onChange={e => updateTeamConfig('teamA', { full: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2" placeholder="Team A Full" />
                <input value={state.teams.teamB.short} onChange={e => updateTeamConfig('teamB', { short: e.target.value.toUpperCase() })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2" placeholder="Team B Short" maxLength="3" />
                <input value={state.teams.teamB.full} onChange={e => updateTeamConfig('teamB', { full: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm" placeholder="Team B Full" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <input type="color" value={state.teams.teamA.color1} onChange={e => updateTeamConfig('teamA', { color1: e.target.value })} className="h-8 rounded cursor-pointer" />
                  <input type="color" value={state.teams.teamA.color2} onChange={e => updateTeamConfig('teamA', { color2: e.target.value })} className="h-8 rounded cursor-pointer" />
                  <input type="color" value={state.teams.teamB.color1} onChange={e => updateTeamConfig('teamB', { color1: e.target.value })} className="h-8 rounded cursor-pointer" />
                  <input type="color" value={state.teams.teamB.color2} onChange={e => updateTeamConfig('teamB', { color2: e.target.value })} className="h-8 rounded cursor-pointer" />
                </div>
              </div>
              
              <div className="glass-panel p-5">
                <h3 className="font-bold mb-3">OBS Setup</h3>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Browser Source URL:</p>
                  <code className="text-xs text-cyan-400 break-all">{window.location.origin}{window.location.pathname}#overlay</code>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#overlay`); alert('URL copied!'); }} className="mt-2 text-xs text-cyan-400 hover:underline block">Copy URL</button>
                </div>
                <div className="mt-3 bg-amber-950/50 border border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-300">⚠️ For OBS streaming:</p>
                  <p className="text-xs text-slate-400 mt-1">1. Add Browser Source<br/>2. Set dimensions to 1920x1080<br/>3. Paste the URL above<br/>4. Refresh OBS source after score updates</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['teamA', 'teamB'].map(teamId => {
              const team = state.teams[teamId];
              return (
                <div key={teamId} className="glass-panel p-5">
                  <h3 className="font-bold text-xl mb-4">{team.full} Squad</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {team.squad.map((player, idx) => (
                      <div key={player.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-xs text-slate-500 w-8">{idx + 1}</span>
                        <input value={player.name} onChange={e => {
                          const newSquad = [...team.squad];
                          newSquad[idx] = { ...player, name: e.target.value };
                          updateTeamConfig(teamId, { squad: newSquad });
                        }} className="flex-1 bg-slate-900 rounded-lg px-3 py-1.5 text-sm" />
                        <div className="text-xs text-slate-400">{player.runs} runs | {player.wickets} wkts</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'graphics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-5">
              <h3 className="font-bold mb-3">Match Info</h3>
              <input value={state.leagueName} onChange={e => updateState(s => { s.leagueName = e.target.value; })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm mb-2" placeholder="League Name" />
              <input value={state.venue} onChange={e => updateState(s => { s.venue = e.target.value; })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm" placeholder="Venue" />
            </div>
            <div className="glass-panel p-5">
              <h3 className="font-bold mb-3">Instructions</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>✅ Controller and OBS overlay sync automatically via localStorage</p>
                <p>✅ Open controller in one tab, OBS overlay in another</p>
                <p>✅ Changes made in controller appear instantly in OBS</p>
                <p>✅ For OBS, add as Browser Source with 1920x1080 resolution</p>
                <p>✅ If OBS doesn't update, right-click → Refresh Source</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-red-500 mb-4">Record Dismissal</h3>
            <select id="wicketPlayer" className="w-full bg-slate-800 rounded-lg px-3 py-2 mb-3">
              {battingSquad.filter(p => !p.isOut && p.hasBatted).map(p => <option key={p.id} value={p.id}>{p.name} ({p.runs} off {p.balls})</option>)}
            </select>
            <select id="wicketType" className="w-full bg-slate-800 rounded-lg px-3 py-2 mb-3">
              <option>Bowled</option><option>Caught</option><option>LBW</option><option>Run Out</option><option>Stumped</option>
            </select>
            <select id="wicketIncoming" className="w-full bg-slate-800 rounded-lg px-3 py-2 mb-4">
              {battingSquad.filter(p => !p.hasBatted).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => {
                const playerId = parseInt(document.getElementById('wicketPlayer').value);
                const type = document.getElementById('wicketType').value;
                const incomingId = parseInt(document.getElementById('wicketIncoming').value);
                registerWicket(playerId, type, incomingId);
                setShowWicketModal(false);
              }} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg font-bold">Confirm</button>
              <button onClick={() => setShowWicketModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== BROADCAST OVERLAY (OBS) ====================
function BroadcastOverlay() {
  const { state, version } = useStorageSync();
  const [boundary, setBoundary] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // Check for alerts in localStorage
    const checkAlerts = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed._boundary) {
            setBoundary(parsed._boundary);
            setTimeout(() => setBoundary(null), 2500);
            delete parsed._boundary;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          if (parsed._alert) {
            setAlert(parsed._alert);
            setTimeout(() => setAlert(null), 3000);
            delete parsed._alert;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch(e) {}
      }
    };
    
    const interval = setInterval(checkAlerts, 500);
    return () => clearInterval(interval);
  }, []);

  if (!state) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;

  const activeTeam = getActiveTeam(state);
  const striker = getStriker(state);
  const nonStriker = getNonStriker(state);
  const bowler = getCurrentBowler(state);
  const crr = calculateCRR(state.score.runs, state.score.overs, state.score.balls);
  const totalBalls = state.matchOvers * 6;
  const played = (state.score.overs * 6) + state.score.balls;
  const ballsLeft = Math.max(0, totalBalls - played);
  const needRuns = state.target ? Math.max(0, state.target - state.score.runs) : 0;
  const rrr = calculateRRR(state.target, state.score.runs, ballsLeft);

  return (
    <div className="fixed inset-0 w-[1920px] h-[1080px] bg-transparent overflow-hidden pointer-events-none select-none">
      {boundary && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[180px] w-[500px] text-center z-50 animate-bounce-in">
          <div className={`rounded-2xl py-6 px-10 border-4 ${boundary.runs === 6 ? 'border-amber-500 bg-amber-950 text-amber-400' : 'border-emerald-500 bg-emerald-950 text-emerald-400'}`}>
            <div className="teko-font text-8xl">{boundary.runs === 6 ? 'SIX!' : 'FOUR!'}</div>
            <div className="sports-font text-xl mt-2">{boundary.batsman}</div>
          </div>
        </div>
      )}
      {alert && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 glass-panel border-t-4 border-amber-500 px-12 py-6 rounded-xl z-50 animate-bounce-in">
          <div className="teko-font text-6xl text-amber-400">{alert.title}</div>
          <div className="sports-font text-xl text-slate-300 mt-1">{alert.subtitle}</div>
        </div>
      )}

      {state.overlays.lowerThird && (
        <div className="fixed bottom-8 left-[120px] right-[120px] z-50" key={version}>
          <div className="flex justify-between items-end mb-1">
            <div className="glass-panel px-4 py-1 rounded-t-xl text-xs sports-font">PART: {state.partnership.runs}({state.partnership.balls}) | EX: {state.extras.wd + state.extras.nb + state.extras.b + state.extras.lb}</div>
            <div className="glass-panel px-4 py-1 rounded-t-xl text-xs sports-font">CRR: {crr} {state.target && state.innings === 2 && `| RRR: ${rrr}`}</div>
          </div>
          <div className="glass-panel h-[72px] rounded-2xl overflow-hidden flex items-center justify-between border-l-8" style={{ borderColor: activeTeam.color2 }}>
            <div className="flex items-center h-full px-6" style={{ background: `linear-gradient(135deg, ${activeTeam.color1}, ${activeTeam.color2})` }}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{activeTeam.short}</div>
              <div className="ml-3"><div className="text-3xl font-black">{activeTeam.short} {state.score.runs}/{state.score.wickets}</div><div className="text-[10px]">{formatOvers(state.score.overs, state.score.balls)} OVERS</div></div>
            </div>
            <div className="flex items-center space-x-8 px-8">
              <div className="flex items-center space-x-3"><span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span><div><div className="font-bold">{striker?.name}</div><div className="text-[10px]">SR: {calculateStrikeRate(striker?.runs, striker?.balls)}</div></div><span className="text-2xl font-bold text-amber-400">{striker?.runs}<span className="text-sm text-white">({striker?.balls})</span></span></div>
              <div className="text-slate-600 text-2xl">|</div>
              <div className="flex items-center space-x-3 opacity-70"><div><div className="font-semibold">{nonStriker?.name}</div><div className="text-[10px]">SR: {calculateStrikeRate(nonStriker?.runs, nonStriker?.balls)}</div></div><span className="text-2xl font-bold">{nonStriker?.runs}<span className="text-sm">({nonStriker?.balls})</span></span></div>
            </div>
            <div className="flex items-center bg-black/40 h-full px-6 space-x-4">
              <div className="text-right"><div className="font-bold">{bowler?.name}</div><div className="text-xs">{formatBowlerOvers(bowler?.ballsBowled)} - {bowler?.maidens} - {bowler?.runsConceded} - {bowler?.wickets}</div><div className="text-[10px] text-amber-400">This over: {state.currentOver.runs}/{state.currentOver.balls}</div></div>
              <div className="flex space-x-1">{state.recentBalls.slice(-6).map((ball, i) => (<span key={i} className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full ${ball === '4' ? 'bg-emerald-600' : ball === '6' ? 'bg-amber-500 text-black' : ball === 'W' ? 'bg-red-600 animate-pulse' : ball === 'WD' || ball === 'NB' ? 'bg-yellow-600' : 'bg-slate-800'}`}>{ball}</span>))}</div>
            </div>
          </div>
        </div>
      )}

      {state.overlays.fullFrameVs && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-24">
          <div className="flex justify-between"><span className="teko-font text-5xl text-cyan-400">{state.leagueName}</span><span className="sports-font text-2xl bg-cyan-950/80 px-6 py-2 rounded-full">MATCH LIVE</span></div>
          <div className="flex items-center justify-center space-x-20 my-auto">
            <div className="text-center"><div className="teko-font text-9xl">{state.teams.teamA.short}</div><div className="sports-font text-2xl text-slate-400">{state.teams.teamA.full}</div></div>
            <div className="w-28 h-28 rounded-full bg-cyan-500 flex items-center justify-center teko-font text-6xl font-black">VS</div>
            <div className="text-center"><div className="teko-font text-9xl">{state.teams.teamB.short}</div><div className="sports-font text-2xl text-slate-400">{state.teams.teamB.full}</div></div>
          </div>
          <div className="text-center"><div className="text-slate-500 sports-font text-lg mb-2">Venue</div><div className="text-3xl font-bold">{state.venue}</div></div>
        </div>
      )}
      
      {state.overlays.fullFrameSummary && (
        <div className="absolute inset-0 bg-slate-950/98 flex flex-col p-16 overflow-y-auto">
          <div className="text-center mb-8"><div className="teko-font text-6xl text-cyan-400">{activeTeam.full} INNINGS</div><div className="text-2xl font-bold mt-2">{state.score.runs}/{state.score.wickets} ({formatOvers(state.score.overs, state.score.balls)})</div></div>
          <div className="glass-panel p-6"><h3 className="teko-font text-2xl text-amber-400 mb-3">Batting</h3>{activeTeam.squad.filter(p=>p.hasBatted).map(p=><div key={p.id} className="flex justify-between py-2 border-b border-slate-800"><span>{p.name} {!p.isOut && '*'}</span><span>{p.runs} ({p.balls})</span></div>)}</div>
        </div>
      )}
      
      {state.overlays.fullFrameTarget && state.target && state.innings === 2 && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center p-24">
          <div className="text-center"><div className="teko-font text-8xl text-rose-500">TARGET</div><div className="teko-font text-9xl font-bold text-white mt-4">{state.target}</div><div className="teko-font text-4xl text-rose-400 mt-2">RUNS</div></div>
          <div className="glass-panel mt-12 p-8 text-center"><div className="teko-font text-5xl">NEED {needRuns} IN {ballsLeft} BALLS</div><div className="grid grid-cols-3 gap-8 mt-6"><div>CRR: {crr}</div><div>RRR: {rrr}</div><div>WKTS LEFT: {10-state.score.wickets}</div></div></div>
        </div>
      )}
    </div>
  );
}