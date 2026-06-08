// gameState.js - Estado global do jogo
import { getDatabase, ref, update, onValue, set, get } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';

const GAME_PHASES = {
  WAITING: 'WAITING',
  ROLE_REVEAL: 'ROLE_REVEAL',
  NIGHT: 'NIGHT',
  DOCTOR_TURN: 'DOCTOR_TURN',
  DETECTIVE_TURN: 'DETECTIVE_TURN',
  DAY: 'DAY',
  VOTING: 'VOTING',
  GAME_OVER: 'GAME_OVER'
};

export class GameState {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.database = getDatabase();
    this.players = {};
    this.gameState = {
      phase: GAME_PHASES.WAITING,
      round: 1,
      currentRole: null,
      events: {},
      winner: null,
      dayAnnouncement: null
    };
    this.votes = {};
    this.continueActions = {};
    this.eliminatedPlayers = [];
    this.listeners = [];
  }

  // Inicializa o estado do jogo
  async initialize() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    const snapshot = await get(roomRef);

    const data = snapshot.val();
    if (data) {
      this.players = data.players || {};
      this.roles = data.roles || {};
      this.gameState = data.gameState || this.gameState;
      this.votes = data.votes || {};
      this.continueActions = data.continueActions || {};
      this.eliminatedPlayers = data.eliminatedPlayers || [];
      this.normalizeEliminatedPlayers();
    }
  }

  // Atualiza estado do jogo
  async updateGameState(updates) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      gameState: { ...this.gameState, ...updates }
    });
    this.gameState = { ...this.gameState, ...updates };
  }

  // Adiciona jogador
  async addPlayer(playerId, playerData) {
    this.players[playerId] = playerData;
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`players/${playerId}`]: playerData
    });
  }

  // Remove jogador
  async removePlayer(playerId) {
    delete this.players[playerId];
    const playerRef = ref(this.database, `rooms/${this.roomCode}/players/${playerId}`);
    await set(playerRef, null);
  }

  // Atualiza role de jogador
  async updatePlayerRole(playerId, roleData) {
    this.roles[playerId] = { ...this.roles[playerId], ...roleData };
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    const updates = {
      [`roles/${playerId}`]: this.roles[playerId]
    };

    if (roleData.alive === false) {
      if (!this.eliminatedPlayers.includes(playerId)) {
        this.eliminatedPlayers.push(playerId);
        updates.eliminatedPlayers = this.eliminatedPlayers;
      }
    }

    await update(roomRef, updates);
  }

  // Registra voto
  async castVote(voterId, targetId) {
    this.votes[voterId] = targetId;
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`votes/${voterId}`]: targetId,
      [`roles/${voterId}/voted`]: true
    });
  }

  // Registra ação de continuar
  async continueGame(playerId) {
    this.continueActions[playerId] = true;
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`continueActions/${playerId}`]: true
    });
  }

  // Limpa votos
  async clearVotes() {
    this.votes = {};
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, { votes: null });
  }

  // Limpa ações de continuar
  async clearContinueActions() {
    this.continueActions = {};
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, { continueActions: null });
  }

  normalizeEliminatedPlayers() {
    if (!Array.isArray(this.eliminatedPlayers)) {
      this.eliminatedPlayers = [];
      return;
    }

    const normalized = [];
    const seen = new Set();
    const nameToId = Object.entries(this.players || {}).reduce((map, [playerId, player]) => {
      if (player?.name) {
        map[player.name] = playerId;
      }
      return map;
    }, {});

    this.eliminatedPlayers.forEach(item => {
      if (typeof item !== 'string') return;

      if (this.players?.[item] && !seen.has(item)) {
        normalized.push(item);
        seen.add(item);
        return;
      }

      const mappedId = nameToId[item];
      if (mappedId && !seen.has(mappedId)) {
        normalized.push(mappedId);
        seen.add(mappedId);
      }
    });

    this.eliminatedPlayers = normalized;
  }

  // Obtém jogadores vivos
  getAlivePlayers() {
    const eliminatedSet = new Set(this.eliminatedPlayers || []);

    return Object.entries(this.players).filter(([playerId, player]) => {
      if (this.roles[playerId]?.alive === false) return false;
      if (eliminatedSet.has(playerId)) return false;
      if (typeof player?.name === 'string' && eliminatedSet.has(player.name)) return false;
      return true;
    });
  }

  // Verifica condição de vitória
  checkVictory() {
    return null;
  }

  // Escuta todas as mudanças no estado
  listenStateChanges(callback) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.players = data.players || {};
        this.roles = data.roles || {};
        this.gameState = data.gameState || this.gameState;
        this.votes = data.votes || {};
        this.continueActions = data.continueActions || {};
        this.eliminatedPlayers = data.eliminatedPlayers || [];
        this.normalizeEliminatedPlayers();

        callback({
          players: this.players,
          roles: this.roles,
          gameState: this.gameState,
          votes: this.votes,
          continueActions: this.continueActions,
          eliminatedPlayers: this.eliminatedPlayers
        });
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Limpa todos os listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

export { GAME_PHASES };