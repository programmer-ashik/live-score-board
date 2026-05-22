export function formatOvers(overs, balls) {
  return `${overs}.${balls}`;
}

export function formatBowlerOvers(totalBalls) {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateStrikeRate(runs, balls) {
  if (balls === 0) return '0.0';
  return ((runs / balls) * 100).toFixed(1);
}

export function calculateEconomy(runs, balls) {
  const overs = balls / 6;
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
}

export function calculateCRR(runs, overs, balls) {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return '0.00';
  return (runs / totalOvers).toFixed(2);
}

export function calculateRRR(target, runs, ballsRemaining) {
  if (ballsRemaining === 0) return '0.00';
  const runsNeeded = Math.max(0, target - runs);
  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
}

export function getBattingSquad(state) {
  return state.battingTeam === 'teamA' ? state.teams.teamA.squad : state.teams.teamB.squad;
}

export function getBowlingSquad(state) {
  return state.battingTeam === 'teamA' ? state.teams.teamB.squad : state.teams.teamA.squad;
}

export function getActiveTeam(state) {
  return state.battingTeam === 'teamA' ? state.teams.teamA : state.teams.teamB;
}

export function getOpponentTeam(state) {
  return state.battingTeam === 'teamA' ? state.teams.teamB : state.teams.teamA;
}

export function getStriker(state) {
  const squad = getBattingSquad(state);
  return squad.find(p => p.isStriking) || squad[state.activePlayers.bat1Idx];
}

export function getNonStriker(state) {
  const squad = getBattingSquad(state);
  return squad.find(p => !p.isStriking) || squad[state.activePlayers.bat2Idx];
}

export function getCurrentBowler(state) {
  const squad = getBowlingSquad(state);
  return squad[state.activePlayers.bowlerIdx] || squad[0];
}