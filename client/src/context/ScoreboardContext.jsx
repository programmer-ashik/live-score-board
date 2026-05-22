import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ScoreboardContext = createContext();

const initialState = {
  matchId: 'live_001',
  status: 'live',
  leagueName: 'ICC CHAMPIONS TROPHY',
  venue: 'MELBOURNE CRICKET GROUND',
  matchOvers: 20,
  innings: 1,
  target: null,
  battingTeam: 'teamA',
  teams: {
    teamA: { id: 'teamA', short: 'IND', full: 'INDIA', color1: '#1e3a8a', color2: '#3b82f6', logo: '', squad: [] },
    teamB: { id: 'teamB', short: 'AUS', full: 'AUSTRALIA', color1: '#064e3b', color2: '#10b981', logo: '', squad: [] }
  },
  score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
  extras: { wd: 0, nb: 0, b: 0, lb: 0 },
  recentBalls: [],
  partnership: { runs: 0, balls: 0 },
  currentOver: { runs: 0, balls: 0 },
  activePlayers: { bat1Idx: 0, bat2Idx: 1, bowlerIdx: 7 },
  themeStyle: 'icc',
  overlays: { lowerThird: true, fullFrameVs: false, fullFrameSummary: false, fullFrameTarget: false },
  loading: true,
  error: null
};

function scoreboardReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload, loading: false };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_SCORE':
      return { ...state, score: { ...state.score, ...action.payload } };
    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.teamId]: { ...state.teams[action.teamId], ...action.config }
        }
      };
    case 'UPDATE_ACTIVE_PLAYERS':
      return { ...state, activePlayers: { ...state.activePlayers, ...action.payload } };
    case 'UPDATE_OVERLAYS':
      return { ...state, overlays: { ...state.overlays, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function ScoreboardProvider({ children }) {
  const [state, dispatch] = useReducer(scoreboardReducer, initialState);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('state_update', (data) => {
      dispatch({ type: 'SET_STATE', payload: data });
    });

    newSocket.on('boundary', (data) => {
      window.dispatchEvent(new CustomEvent('boundary', { detail: data }));
    });

    newSocket.on('alert', (data) => {
      window.dispatchEvent(new CustomEvent('alert', { detail: data }));
    });

    // Fetch initial state
    axios.get('/api/state')
      .then(res => dispatch({ type: 'SET_STATE', payload: res.data }))
      .catch(err => dispatch({ type: 'SET_ERROR', payload: err.message }));

    return () => {
      newSocket.close();
    };
  }, []);

  const sendAction = useCallback(async (type, payload) => {
    try {
      await axios.post('/api/action', { type, payload });
    } catch (err) {
      console.error('Action failed:', err);
    }
  }, []);

  const addRuns = useCallback((runs, isBoundary = false) => {
    sendAction('ADD_RUNS', { runs, isBoundary });
  }, [sendAction]);

  const addExtra = useCallback((type) => {
    sendAction('ADD_EXTRA', { extraType: type });
  }, [sendAction]);

  const registerWicket = useCallback((playerId, dismissalType, incomingId) => {
    sendAction('WICKET', { playerId, dismissalType, incomingId });
  }, [sendAction]);

  const resetMatch = useCallback(() => {
    axios.post('/api/reset');
  }, []);

  const updateSettings = useCallback((updates) => {
    sendAction('UPDATE_SETTINGS', updates);
  }, [sendAction]);

  const updateTeamConfig = useCallback((teamId, config) => {
    sendAction('UPDATE_TEAM_CONFIG', { teamId, config });
  }, [sendAction]);

  const toggleOverlay = useCallback((key, value) => {
    sendAction('TOGGLE_OVERLAY', { overlayKey: key, value });
  }, [sendAction]);

  const setTheme = useCallback((theme) => {
    sendAction('SET_THEME', { theme });
  }, [sendAction]);

  const changeStriker = useCallback((side) => {
    sendAction('CHANGE_STRIKER', { side });
  }, [sendAction]);

  const setBattingTeam = useCallback((team) => {
    sendAction('SET_BATTING_TEAM', { team });
  }, [sendAction]);

  const setInnings = useCallback((innings) => {
    sendAction('SET_INNINGS', { innings });
  }, [sendAction]);

  const setTarget = useCallback((target) => {
    sendAction('SET_TARGET', { target });
  }, [sendAction]);

  const setMatchOvers = useCallback((overs) => {
    sendAction('SET_MATCH_OVERS', { overs });
  }, [sendAction]);

  const updateActivePlayers = useCallback((updates) => {
    sendAction('UPDATE_ACTIVE_PLAYERS', updates);
  }, [sendAction]);

  const value = {
    state,
    dispatch,
    addRuns,
    addExtra,
    registerWicket,
    resetMatch,
    updateSettings,
    updateTeamConfig,
    toggleOverlay,
    setTheme,
    changeStriker,
    setBattingTeam,
    setInnings,
    setTarget,
    setMatchOvers,
    updateActivePlayers
  };

  return (
    <ScoreboardContext.Provider value={value}>
      {children}
    </ScoreboardContext.Provider>
  );
}

export function useScoreboard() {
  const context = useContext(ScoreboardContext);
  if (!context) {
    throw new Error('useScoreboard must be used within a ScoreboardProvider');
  }
  return context;
}