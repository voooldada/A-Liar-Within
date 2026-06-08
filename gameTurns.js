import { getDatabase, ref, update, onValue, get } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';
console.log("GAME TURNS OK");
const PHASES = {
  ROLE_REVEAL: 'ROLE_REVEAL',
  NIGHT: 'NIGHT',
  ASSASSIN_TURN: 'ASSASSIN_TURN',
  TRAITOR_TURN: 'TRAITOR_TURN',
  DOCTOR_TURN: 'DOCTOR_TURN',
  DETECTIVE_TURN: 'DETECTIVE_TURN',
  DAY: 'DAY',
  VOTING: 'VOTING',
  DEATH: 'DEATH',
  GAME_OVER: 'GAME_OVER'
};

export class GameTurns {
  constructor(roomCode, gameState) {
    this.roomCode = roomCode;
    this.db = getDatabase();
    this.currentPhase = PHASES.ROLE_REVEAL;
    this.gameState = gameState;
  }

  // Inicia o jogo
  async startGame() {
    await this.setPhase(PHASES.ROLE_REVEAL);
  }

  // Define fase manualmente
  async setPhase(phase) {
    const roomRef = ref(this.db, `rooms/${this.roomCode}`);
    await update(roomRef, {
      'gameState/phase': phase
    });

    this.currentPhase = phase;
  }

  // Avança para próxima fase
  async nextPhase() {
    const next = await this.getNextPhase(this.currentPhase);
    await this.setPhase(next);
  }

  // Lógica de progressão
  async getNextPhase(current) {
    switch (current) {
      case PHASES.ROLE_REVEAL:
        return PHASES.NIGHT;
      case PHASES.NIGHT:
        return PHASES.ASSASSIN_TURN;
      case PHASES.ASSASSIN_TURN:
        return PHASES.TRAITOR_TURN;
      case PHASES.TRAITOR_TURN:
        return PHASES.DOCTOR_TURN;
      case PHASES.DOCTOR_TURN:
        return PHASES.DETECTIVE_TURN;
      case PHASES.DETECTIVE_TURN:
        return PHASES.DAY;
      case PHASES.DAY:
        return PHASES.VOTING;
      case PHASES.VOTING:
        return PHASES.DEATH;
      case PHASES.DEATH:
        return PHASES.DAY;
      default:
        return PHASES.NIGHT;
    }
  }

  // Vai direto para votação
  async goToVoting() {
    await this.setPhase(PHASES.VOTING);
  }

  // Escuta mudanças de fase
  listenPhaseChanges(callback) {
    const roomRef = ref(this.db, `rooms/${this.roomCode}`);

    return onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.gameState) return;

      const phase = data.gameState.phase;
      this.currentPhase = phase;

      callback(phase, data.gameState);
    });
  }
}

export { PHASES };
