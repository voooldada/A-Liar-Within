// gameVoting.js - Sistema de votação
import { getDatabase, ref, update, onValue } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';

export class GameVoting {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.database = getDatabase();
    this.votes = {};
    this.continueActions = {};
    this.votingContinueActions = {};
    this.votingRequests = {};
    this.listeners = [];
  }

  // Registra pedido de ir a votação de um jogador
  async requestVoting(playerId) {
    this.votingRequests[playerId] = true;

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`votingRequests/${playerId}`]: true
    });
  }

  // Limpa pedidos de votação
  async clearVotingRequests() {
    this.votingRequests = {};

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      votingRequests: null
    });
  }

  getVotingRequestCount() {
    return Object.keys(this.votingRequests || {}).length;
  }

  hasMajorityRequested(alivePlayerIds) {
    const currentCount = this.getVotingRequestCount();
    const required = Math.floor(alivePlayerIds.length / 2) + 1;
    return currentCount >= required;
  }

  hasAllRequested(alivePlayerIds) {
    return alivePlayerIds.every(playerId => this.votingRequests[playerId]);
  }

  // Registra voto de um jogador
  async castVote(playerId, targetPlayerId) {
    this.votes[playerId] = targetPlayerId;

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`votes/${playerId}`]: targetPlayerId
    });
  }

  // Remove voto de um jogador
  async removeVote(playerId) {
    delete this.votes[playerId];

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`votes/${playerId}`]: null
    });
  }

  // Registra ação de "continuar" de um jogador
  async continueGame(playerId) {
    this.continueActions[playerId] = true;

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`continueActions/${playerId}`]: true
    });
  }

  // Limpa todos os votos
  async clearVotes() {
    this.votes = {};

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      votes: null
    });
  }

  // Limpa ações de continuar
  async clearContinueActions() {
    this.continueActions = {};

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      continueActions: null
    });
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners = [];
  }

  // Obtém contagem atual de votos
  getVoteCounts() {
    const counts = {};
    Object.values(this.votes).forEach(targetId => {
      counts[targetId] = (counts[targetId] || 0) + 1;
    });
    return counts;
  }

  // Verifica se todos os jogadores vivos votaram
  hasAllVoted(alivePlayers) {
    return alivePlayers.every(playerId => this.votes[playerId] !== undefined && this.votes[playerId] !== null);
  }

  // Verifica se todos os jogadores vivos clicaram continuar
  hasAllContinued(alivePlayers) {
    return alivePlayers.every(playerId => this.continueActions[playerId] === true);
  }

  // Verifica se a maioria dos jogadores vivos clicou continuar
  hasMajorityContinued(alivePlayers) {
    const currentCount = Object.keys(this.continueActions || {}).length;
    const required = Math.floor(alivePlayers.length / 2) + 1;
    return currentCount >= required;
  }

  // Registra ação de continuar discussão a partir da fase de votação
  async continueVoting(playerId) {
    this.votingContinueActions[playerId] = true;

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`votingContinueActions/${playerId}`]: true
    });
  }

  // Limpa ações de continuar discussão da votação
  async clearVotingContinueActions() {
    this.votingContinueActions = {};

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      votingContinueActions: null
    });
  }

  // Escuta ações de continuar discussão da votação
  listenVotingContinueActions(callback) {
    const continueRef = ref(this.database, `rooms/${this.roomCode}/votingContinueActions`);
    const unsubscribe = onValue(continueRef, (snapshot) => {
      const actions = snapshot.val() || {};
      this.votingContinueActions = actions;
      callback(actions);
    });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Verifica se todos os jogadores vivos clicaram continuar na votação
  hasAllVotingContinued(alivePlayers) {
    return alivePlayers.every(playerId => this.votingContinueActions[playerId] === true);
  }

  // Verifica se a maioria dos jogadores vivos clicou continuar na votação
  hasMajorityVotingContinued(alivePlayers) {
    const currentCount = Object.keys(this.votingContinueActions || {}).length;
    const required = Math.floor(alivePlayers.length / 2) + 1;
    return currentCount >= required;
  }

  // Obtém o jogador mais votado
  getMostVoted() {
    const counts = this.getVoteCounts();

    let maxVotes = 0;
    let mostVoted = null;

    Object.entries(counts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVoted = playerId;
      }
    });

    return { playerId: mostVoted, votes: maxVotes };
  }

  // Escuta mudanças nos votos
  listenVotes(callback) {
    const votesRef = ref(this.database, `rooms/${this.roomCode}/votes`);
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const votes = snapshot.val() || {};
      this.votes = votes;
      callback(votes);
    });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Escuta ações de continuar
  listenContinueActions(callback) {
    const continueRef = ref(this.database, `rooms/${this.roomCode}/continueActions`);
    const unsubscribe = onValue(continueRef, (snapshot) => {
      const actions = snapshot.val() || {};
      this.continueActions = actions;
      callback(actions);
    });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Escuta pedidos de votação
  listenVotingRequests(callback) {
    const requestsRef = ref(this.database, `rooms/${this.roomCode}/votingRequests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests = snapshot.val() || {};
      this.votingRequests = requests;
      callback(requests);
    });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Marca um jogador como pronto
  async markReady(playerId) {
    const playerRef = ref(this.database, `rooms/${this.roomCode}/players/${playerId}`);
    await update(playerRef, {
      ready: true
    });
  }

  // Escuta mudanças no status "pronto" dos jogadores
  listenReady(callback) {
    const playersRef = ref(this.database, `rooms/${this.roomCode}/players`);
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      callback(players);
    });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Verifica se todos os jogadores estão prontos
  areAllPlayersReady(players) {
    if (!players || Object.keys(players).length === 0) return false;
    return Object.values(players).every(player => player.ready === true);
  }

  // Resolve votação e retorna o mais votado
  async resolveVote() {
    const { playerId: mostVoted } = this.getMostVoted();
    return mostVoted;
  }
}