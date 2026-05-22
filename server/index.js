import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import db from './db.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Default data
const DEFAULT_SQUAD_A = ['Rohit Sharma', 'Yashasvi Jaiswal', 'Virat Kohli', 'Suryakumar Yadav', 'Rishabh Pant', 'Hardik Pandya', 'Ravindra Jadeja', 'Jasprit Bumrah', 'Kuldeep Yadav', 'Mohammed Shami', 'Arshdeep Singh'];
const DEFAULT_SQUAD_B = ['Travis Head', 'David Warner', 'Mitchell Marsh', 'Glenn Maxwell', 'Marcus Stoinis', 'Tim David', 'Matthew Wade', 'Pat Cummins', 'Mitchell Starc', 'Adam Zampa', 'Josh Hazlewood'];

// Current state in memory
let currentState = null;

function getInitialState() {
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
      teamA: {
        id: 'teamA',
        short: 'IND',
        full: 'INDIA',
        color1: '#1e3a8a',
        color2: '#3b82f6',
        logo: '',
        squad: DEFAULT_SQUAD_A.map((name, i) => ({
          id: i,
          name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissal: 'Not Out',
          hasBatted: i < 2,
          isStriking: i === 0,
          ballsBowled: 0,
          runsConceded: 0,
          wickets: 0,
          maidens: 0
        }))
      },
      teamB: {
        id: 'teamB',
        short: 'AUS',
        full: 'AUSTRALIA',
        color1: '#064e3b',
        color2: '#10b981',
        logo: '',
        squad: DEFAULT_SQUAD_B.map((name, i) => ({
          id: i,
          name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissal: 'Not Out',
          hasBatted: i < 2,
          isStriking: i === 0,
          ballsBowled: 0,
          runsConceded: 0,
          wickets: 0,
          maidens: 0
        }))
      }
    },
    score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
    extras: { wd: 0, nb: 0, b: 0, lb: 0 },
    recentBalls: [],
    partnership: { runs: 0, balls: 0 },
    currentOver: { runs: 0, balls: 0 },
    activePlayers: { bat1Idx: 0, bat2Idx: 1, bowlerIdx: 7 },
    themeStyle: 'icc',
    overlays: {
      lowerThird: true,
      fullFrameVs: false,
      fullFrameSummary: false,
      fullFrameTarget: false
    }
  };
}

currentState = getInitialState();

// Helper functions
function getBattingSquad() {
  return currentState.battingTeam === 'teamA' ? currentState.teams.teamA.squad : currentState.teams.teamB.squad;
}

function getBowlingSquad() {
  return currentState.battingTeam === 'teamA' ? currentState.teams.teamB.squad : currentState.teams.teamA.squad;
}

function getActiveTeam() {
  return currentState.battingTeam === 'teamA' ? currentState.teams.teamA : currentState.teams.teamB;
}

function rotateStrike() {
  const squad = getBattingSquad();
  const bat1 = squad[currentState.activePlayers.bat1Idx];
  const bat2 = squad[currentState.activePlayers.bat2Idx];
  if (bat1 && bat2) {
    const temp = bat1.isStriking;
    bat1.isStriking = bat2.isStriking;
    bat2.isStriking = temp;
  }
}

// API Routes
app.get('/api/state', (req, res) => {
  res.json(currentState);
});

app.post('/api/state', (req, res) => {
  currentState = req.body;
  io.emit('state_update', currentState);
  res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
  currentState = getInitialState();
  io.emit('state_update', currentState);
  res.json({ success: true });
});

app.post('/api/action', (req, res) => {
  const { type, payload } = req.body;
  
  switch(type) {
    case 'ADD_RUNS':
      const { runs, isBoundary } = payload;
      const batSquad = getBattingSquad();
      const bowlSquad = getBowlingSquad();
      const striker = batSquad.find(p => p.isStriking);
      const nonStriker = batSquad.find(p => !p.isStriking);
      const bowler = bowlSquad[currentState.activePlayers.bowlerIdx];
      
      striker.runs += runs;
      striker.balls++;
      if (runs === 4 && isBoundary) striker.fours++;
      if (runs === 6 && isBoundary) striker.sixes++;
      bowler.runsConceded += runs;
      bowler.ballsBowled++;
      currentState.score.runs += runs;
      currentState.score.balls++;
      currentState.partnership.runs += runs;
      currentState.partnership.balls++;
      currentState.currentOver.runs += runs;
      currentState.currentOver.balls++;
      currentState.recentBalls.push(runs.toString());
      if (currentState.recentBalls.length > 6) currentState.recentBalls.shift();
      
      if (runs % 2 === 1) {
        striker.isStriking = false;
        nonStriker.isStriking = true;
      }
      
      if (currentState.score.balls >= 6) {
        currentState.score.overs++;
        currentState.score.balls = 0;
        rotateStrike();
        currentState.currentOver = { runs: 0, balls: 0 };
      }
      
      if (isBoundary) {
        io.emit('boundary', { runs, batsman: striker.name });
      }
      break;
      
    case 'ADD_EXTRA':
      const { extraType } = payload;
      const bowlerExtra = getBowlingSquad()[currentState.activePlayers.bowlerIdx];
      if (extraType === 'wd' || extraType === 'nb') {
        currentState.score.runs += 1;
        currentState.extras[extraType] += 1;
        bowlerExtra.runsConceded += 1;
        currentState.currentOver.runs += 1;
        currentState.recentBalls.push(extraType.toUpperCase());
      } else if (extraType === 'by' || extraType === 'lb') {
        currentState.score.runs += 1;
        currentState.extras[extraType] += 1;
        currentState.score.balls++;
        currentState.currentOver.balls++;
        bowlerExtra.ballsBowled++;
        currentState.partnership.balls++;
        const strikerExtra = getBattingSquad().find(p => p.isStriking);
        if (strikerExtra) strikerExtra.balls++;
        currentState.recentBalls.push(extraType === 'by' ? 'B' : 'LB');
        if (currentState.score.balls >= 6) {
          currentState.score.overs++;
          currentState.score.balls = 0;
          rotateStrike();
          currentState.currentOver = { runs: 0, balls: 0 };
        }
      }
      if (currentState.recentBalls.length > 6) currentState.recentBalls.shift();
      break;
      
    case 'WICKET':
      const { playerId, dismissalType, incomingId } = payload;
      const batWicket = getBattingSquad();
      const bowlWicket = getBowlingSquad();
      const dismissed = batWicket.find(p => p.id === playerId);
      const bowlerWicket = bowlWicket[currentState.activePlayers.bowlerIdx];
      
      if (dismissed) {
        dismissed.isOut = true;
        dismissed.dismissal = dismissalType;
        if (dismissalType !== 'Run Out') bowlerWicket.wickets++;
        bowlerWicket.ballsBowled++;
        currentState.score.wickets++;
        currentState.score.balls++;
        currentState.currentOver.balls++;
        currentState.recentBalls.push('W');
        if (currentState.recentBalls.length > 6) currentState.recentBalls.shift();
        currentState.partnership = { runs: 0, balls: 0 };
        
        const newBatsman = batWicket.find(p => p.id === incomingId);
        if (newBatsman) {
          newBatsman.hasBatted = true;
          newBatsman.isStriking = dismissed.isStriking;
          if (playerId === currentState.activePlayers.bat1Idx) {
            currentState.activePlayers.bat1Idx = incomingId;
          } else {
            currentState.activePlayers.bat2Idx = incomingId;
          }
        }
        
        if (currentState.score.balls >= 6) {
          currentState.score.overs++;
          currentState.score.balls = 0;
          rotateStrike();
          currentState.currentOver = { runs: 0, balls: 0 };
        }
        io.emit('alert', { title: 'WICKET!', subtitle: `${dismissed.name} ${dismissed.runs}(${dismissed.balls})` });
      }
      break;
      
    case 'UPDATE_SETTINGS':
      Object.assign(currentState, payload);
      break;
      
    case 'UPDATE_TEAM_CONFIG':
      const { teamId, config } = payload;
      Object.assign(currentState.teams[teamId], config);
      break;
      
    case 'TOGGLE_OVERLAY':
      const { overlayKey, value } = payload;
      currentState.overlays[overlayKey] = value;
      break;
      
    case 'SET_THEME':
      currentState.themeStyle = payload.theme;
      break;
      
    case 'CHANGE_STRIKER':
      const { side } = payload;
      const squad = getBattingSquad();
      squad.forEach(p => p.isStriking = false);
      if (side === 1) squad[currentState.activePlayers.bat1Idx].isStriking = true;
      else squad[currentState.activePlayers.bat2Idx].isStriking = true;
      break;
      
    case 'SET_BATTING_TEAM':
      currentState.battingTeam = payload.team;
      break;
      
    case 'SET_INNINGS':
      currentState.innings = payload.innings;
      break;
      
    case 'SET_TARGET':
      currentState.target = payload.target ? parseInt(payload.target) : null;
      break;
      
    case 'SET_MATCH_OVERS':
      currentState.matchOvers = parseInt(payload.overs);
      break;
      
    case 'UPDATE_ACTIVE_PLAYERS':
      Object.assign(currentState.activePlayers, payload);
      break;
  }
  
  io.emit('state_update', currentState);
  res.json({ success: true });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('state_update', currentState);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});