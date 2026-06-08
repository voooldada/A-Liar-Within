import {
  getDatabase,
  ref,
  update,
  onValue
} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';

const ROLES = {
  ASSASSIN: 'assassin',
  TRAITOR: 'traitor',
  DOCTOR: 'doctor',
  DETECTIVE: 'detective',
  INNOCENT: 'innocent'
};

const ROLE_NAMES = {
  pt: {
    [ROLES.ASSASSIN]: 'ASSASSINO',
    [ROLES.TRAITOR]: 'TRAIDOR',
    [ROLES.DOCTOR]: 'MÉDICO',
    [ROLES.DETECTIVE]: 'DETETIVE',
    [ROLES.INNOCENT]: 'INOCENTE'
  },
  en: {
    [ROLES.ASSASSIN]: 'ASSASSIN',
    [ROLES.TRAITOR]: 'TRAITOR',
    [ROLES.DOCTOR]: 'DOCTOR',
    [ROLES.DETECTIVE]: 'DETECTIVE',
    [ROLES.INNOCENT]: 'CIVILIAN'
  }
};

const ROLE_DESCRIPTIONS = {
  pt: {
    [ROLES.ASSASSIN]: 'Você é o assassino. Elimine jogadores sem ser descoberto.',
    [ROLES.TRAITOR]: 'Você é o traidor. Trabalhe nas sombras e herde o poder se o assassino morrer.',
    [ROLES.DOCTOR]: 'Você é o médico. Salve jogadores.',
    [ROLES.DETECTIVE]: 'Você é o detetive. Investigue e proteja a cidade.',
    [ROLES.INNOCENT]: 'Você é um civil.'
  },
  en: {
    [ROLES.ASSASSIN]: 'You are the assassin. Eliminate players without being discovered.',
    [ROLES.TRAITOR]: 'You are the traitor. Work in the shadows and inherit power if the assassin dies.',
    [ROLES.DOCTOR]: 'You are the doctor. Save players.',
    [ROLES.DETECTIVE]: 'You are the detective. Investigate and protect the city.',
    [ROLES.INNOCENT]: 'You are a civilian.'
  }
};

const DETECTIVE_BASE_WORDS = {
  pt: [
    'folha', 'casa', 'carro', 'livro', 'sol', 'lua', 'mar', 'rio', 'flor', 'árvore',
    'montanha', 'estrela', 'vento', 'chuva', 'fogo', 'terra', 'céu', 'pedra', 'luz', 'sombra'
  ],
  en: [
    'leaf', 'house', 'car', 'book', 'sun', 'moon', 'sea', 'river', 'flower', 'tree',
    'mountain', 'star', 'wind', 'rain', 'fire', 'earth', 'sky', 'stone', 'light', 'shadow'
  ]
};

const DETECTIVE_SIMILAR_WORDS = {
  pt: {
    'folha': 'flor',
    'casa': 'cama',
    'carro': 'carta',
    'livro': 'lobo',
    'sol': 'sal',
    'lua': 'luz',
    'mar': 'mão',
    'rio': 'rei',
    'flor': 'folha',
    'árvore': 'arvoredo',
    'montanha': 'vale',
    'estrela': 'sol',
    'vento': 'brisa',
    'chuva': 'garoa',
    'fogo': 'chama',
    'terra': 'solo',
    'céu': 'nuvem',
    'pedra': 'rocha',
    'luz': 'lua',
    'sombra': 'escuridão'
  },
  en: {
    'leaf': 'flower',
    'house': 'home',
    'car': 'cart',
    'book': 'look',
    'sun': 'son',
    'moon': 'soon',
    'sea': 'see',
    'river': 'rival',
    'flower': 'feather',
    'tree': 'three',
    'mountain': 'fountain',
    'star': 'start',
    'wind': 'wink',
    'rain': 'brain',
    'fire': 'fibre',
    'earth': 'birth',
    'sky': 'spy',
    'stone': 'stole',
    'light': 'might',
    'shadow': 'shallow'
  }
};

function getDetectiveAssassinWord(baseWord, language = 'pt') {
  const similarWords = DETECTIVE_SIMILAR_WORDS[language] || DETECTIVE_SIMILAR_WORDS.pt;
  if (similarWords[baseWord]) {
    return similarWords[baseWord];
  }
  return generateSimilarWord(baseWord);
}

function generateSimilarWord(word) {
  const replacements = {
    'a': ['e', 'o', 'á', 'ã', 'â'],
    'e': ['a', 'i', 'é', 'ê'],
    'i': ['e', 'o', 'í'],
    'o': ['a', 'u', 'ó', 'ô'],
    'u': ['o', 'a', 'ú'],
    'á': ['a', 'â', 'ã'],
    'é': ['e', 'ê'],
    'í': ['i'],
    'ó': ['o', 'ô'],
    'ú': ['u'],
    'â': ['a', 'á'],
    'ê': ['e', 'é'],
    'ô': ['o', 'ó'],
    'ç': ['s']
  };

  const letters = Array.from(word);
  const index = letters.findIndex(letter => replacements[letter.toLowerCase()]);
  if (index === -1) {
    return word.split('').reverse().join('');
  }

  const original = letters[index].toLowerCase();
  const candidates = replacements[original] || ['a'];
  const replacement = candidates[Math.floor(Math.random() * candidates.length)];
  letters[index] = replacement;
  return letters.join('');
}

export class GameRoles {
  constructor(roomCode, currentPlayerId, language = 'pt') {
    this.roomCode = roomCode;
    this.currentPlayerId = currentPlayerId;
    this.language = language;
    this.database = getDatabase();

    this.roles = {};
    this.gameState = {};
    this.recruitmentOffers = {};
  }

  // 🎭 Distribuição de roles
  async assignRoles(players) {
    const playerIds = Object.keys(players);

    if (playerIds.length < 4) {
      throw new Error('Precisa de pelo menos 4 jogadores');
    }

    if (playerIds.length > 30) {
      throw new Error('Máximo de 30 jogadores permitido');
    }

    // 🎲 Gera roles dinâmicos baseado no número de jogadores
    const roles = [
      ROLES.ASSASSIN,
      ROLES.DOCTOR,
      ROLES.DETECTIVE
    ];

    // Preencher resto com inocentes
    while (roles.length < playerIds.length) {
      roles.push(ROLES.INNOCENT);
    }

    // shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    const roleAssignments = {};

    playerIds.forEach((id, index) => {
      roleAssignments[id] = {
        role: roles[index],
        alive: true,
        voted: false
      };
    });

    console.log('🎭 Roles atribuídos:', roleAssignments);

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);

    await update(roomRef, {
      roles: roleAssignments,
      gameState: {
        phase: 'ROLE_REVEAL',
        round: 1,
        events: {},
        lastAction: null,
        assassinAction: null,
        traitorAction: null,
        doctorAction: null,
        doctorSave: null,
        detectiveWordTest: null,
        detectivePercentageTest: null,
        detectiveNotifications: null,
        assassinOrder: null
      },
      eliminatedPlayers: null,
      votes: null,
      continueActions: null,
      recruitmentOffers: null
    });

    this.roles = roleAssignments;

    return roleAssignments;
  }

  // 👁️ Sync total com Firebase + DEBUG
  listenGameState(callback) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);

    if (this.unsubscribe) {
      this.unsubscribe(); // evita duplicação
    }

    this.unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) return;

      this.roles = data.roles || {};
      this.gameState = data.gameState || {};
      this.recruitmentOffers = data.recruitmentOffers || {};

      // 🔍 DEBUG PODEROSO
      console.log('📦 Roles no Firebase:', this.roles);
      console.log('🆔 Meu ID:', this.currentPlayerId);
      console.log('📜 IDs disponíveis:', Object.keys(this.roles));

      const myRole = this.getCurrentPlayerRole();
      const myRoleData = this.roles?.[this.currentPlayerId];
      console.log('🎯 Meu role:', myRole);
      console.log('🎯 Meus dados completos:', myRoleData);
      callback?.(data);
    });
  }

  // 👤 Role do jogador atual (SEMPRE seguro)
  getCurrentPlayerRole() {
    return this.roles?.[this.currentPlayerId]?.role || null;
  }

  getRoleName(role) {
    return ROLE_NAMES[this.language]?.[role] || ROLE_NAMES.pt[role] || 'DESCONHECIDO';
  }

  getRoleDescription(role) {
    return ROLE_DESCRIPTIONS[this.language]?.[role] || ROLE_DESCRIPTIONS.pt[role] || 'Role desconhecido';
  }

  async savePlayer(targetId) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`gameState/doctorSave`]: targetId || null,
      [`gameState/doctorAction`]: {
        actor: this.currentPlayerId,
        action: 'doctorSave',
        target: targetId || null,
        timestamp: Date.now()
      }
    });
  }

  async activateTest() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`gameState/detectiveTest`]: {
        actor: this.currentPlayerId,
        timestamp: Date.now()
      }
    });
  }

  // 🕵️ Sistema de Detetive - Teste da Palavra
  async activateWordTest() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);

    const wordList = DETECTIVE_BASE_WORDS[this.language] || DETECTIVE_BASE_WORDS.pt;
    const wordIndex = Math.floor(Math.random() * wordList.length);
    const baseWord = wordList[wordIndex];
    const assassinWord = getDetectiveAssassinWord(baseWord, this.language);
    const timestamp = Date.now();
    const detectiveWordTest = {
      baseWord,
      assassinWord,
      wordIndex,
      language: this.language,
      activated: true,
      timestamp
    };

    await update(roomRef, {
      [`gameState/detectiveWordTest`]: detectiveWordTest,
      'gameState/detectivePercentageTest': null
    });

    this.gameState.detectiveWordTest = detectiveWordTest;
    this.gameState.detectivePercentageTest = null;
  }

  // 🕵️ Sistema de Detetive - Teste de Porcentagem
  async activatePercentageTest() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);

    // Calcular porcentagens baseadas no jogo
    const alivePlayers = Object.entries(this.roles).filter(([, roleData]) => roleData.alive !== false);
    const percentages = {};
    const assassinEntry = alivePlayers.find(([, roleData]) => roleData.role === ROLES.ASSASSIN);
    const traitorEntry = alivePlayers.find(([, roleData]) => roleData.role === ROLES.TRAITOR);
    const assassinId = assassinEntry?.[0] || null;
    const traitorId = traitorEntry?.[0] || null;

    alivePlayers.forEach(([playerId]) => {
      percentages[playerId] = Math.floor(Math.random() * 20) + 5; // 5-25%
    });

    if (assassinId) {
      const assassinPercent = Math.floor(Math.random() * 30) + 50; // 50-80%
      percentages[assassinId] = assassinPercent;

      if (traitorId) {
        percentages[traitorId] = assassinPercent;
      }

      const otherCandidates = alivePlayers
        .map(([playerId]) => playerId)
        .filter((playerId) => playerId !== assassinId && playerId !== traitorId);

      if (otherCandidates.length > 0) {
        const highSuspicionTarget = otherCandidates.sort(() => 0.5 - Math.random())[0];
        percentages[highSuspicionTarget] = Math.floor(Math.random() * 30) + 50;
      }
    } else {
      const playerIds = Object.keys(percentages);
      const highSuspicionPlayers = playerIds.sort(() => 0.5 - Math.random()).slice(0, 2);

      highSuspicionPlayers.forEach(playerId => {
        percentages[playerId] = Math.floor(Math.random() * 30) + 50; // 50-80%
      });
    }

    const timestamp = Date.now();
    const detectivePercentageTest = {
      percentages,
      activated: true,
      timestamp,
      assassinId,
      mirrorPlayerId: traitorId && assassinId ? traitorId : null
    };

    await update(roomRef, {
      [`gameState/detectivePercentageTest`]: detectivePercentageTest,
      'gameState/detectiveWordTest': null
    });

    this.gameState.detectivePercentageTest = detectivePercentageTest;
    this.gameState.detectiveWordTest = null;
  }

  // 🕵️ Sistema de Detetive - Notificar Investigação
  async notifyInvestigation(targetPlayerId) {
    if (!targetPlayerId || targetPlayerId === this.currentPlayerId) {
      throw new Error('Selecione outro jogador para notificar');
    }

    const targetRole = this.roles[targetPlayerId];
    if (!targetRole || targetRole.alive === false) {
      throw new Error('Jogador alvo não está vivo');
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);

    const notification = {
      message: 'Tem alguém te investigando...',
      from: 'detective',
      timestamp: Date.now()
    };

    // Adicionar notificação para o jogador alvo
    await update(roomRef, {
      [`gameState/detectiveNotifications/${targetPlayerId}`]: notification
    });

    if (!this.gameState) {
      this.gameState = {};
    }
    if (!this.gameState.detectiveNotifications) {
      this.gameState.detectiveNotifications = {};
    }
    this.gameState.detectiveNotifications[targetPlayerId] = notification;
  }

  async assassinKill(targetId) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      'gameState/assassinAction': {
        actor: this.currentPlayerId,
        action: 'assassinKill',
        target: targetId || null,
        timestamp: Date.now()
      },
      'gameState/lastAction': 'assassinKill'
    });
  }

  async traitorKill(targetId) {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      'gameState/traitorAction': {
        actor: this.currentPlayerId,
        action: 'traitorKill',
        target: targetId || null,
        timestamp: Date.now()
      },
      'gameState/lastAction': 'traitorKill'
    });
  }

  async sendRecruitmentOffer(targetPlayerId) {
    if (this.getCurrentPlayerRole() !== ROLES.ASSASSIN) {
      throw new Error('Apenas o assassino pode recrutar um traidor');
    }
    if (!targetPlayerId || targetPlayerId === this.currentPlayerId) {
      throw new Error('Selecione outro jogador para recrutar');
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`recruitmentOffers/${targetPlayerId}`]: {
        from: this.currentPlayerId,
        status: 'pending',
        timestamp: Date.now()
      }
    });
  }

  getPendingRecruitmentOffers() {
    return this.recruitmentOffers?.[this.currentPlayerId] || null;
  }

  async acceptRecruitment() {
    const offer = this.getPendingRecruitmentOffers();
    if (!offer || offer.status !== 'pending') {
      throw new Error('Nenhuma oferta de recrutamento pendente encontrada');
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`roles/${this.currentPlayerId}/role`]: ROLES.TRAITOR,
      [`roles/${this.currentPlayerId}/alive`]: true,
      [`recruitmentOffers/${this.currentPlayerId}/status`]: 'accepted',
      [`recruitmentOffers/${this.currentPlayerId}/acceptedAt`]: Date.now()
    });
    console.log(`✅ Traidor recrutado: ${this.currentPlayerId} com alive=true`);
  }

  async declineRecruitment() {
    const offer = this.getPendingRecruitmentOffers();
    if (!offer || offer.status !== 'pending') {
      throw new Error('Nenhuma oferta de recrutamento pendente encontrada');
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`recruitmentOffers/${this.currentPlayerId}/status`]: 'declined',
      [`recruitmentOffers/${this.currentPlayerId}/declinedAt`]: Date.now()
    });
  }

  async sendOrderToTraitor(order) {
    if (this.getCurrentPlayerRole() !== ROLES.ASSASSIN) {
      throw new Error('Apenas o assassino pode enviar ordens para o traidor');
    }
    if (!order) {
      throw new Error('Digite uma ordem válida');
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      'gameState/assassinOrder': {
        actor: this.currentPlayerId,
        order,
        timestamp: Date.now()
      }
    });
  }

  getTraitorOrders() {
    return this.gameState?.assassinOrder || null;
  }

  async promoteTraitorToAssassin() {
    const currentRole = this.getCurrentPlayerRole();
    const currentRoleData = this.roles[this.currentPlayerId] || {};

    if (currentRole !== ROLES.TRAITOR || currentRoleData.alive === false) {
      return false;
    }

    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      [`roles/${this.currentPlayerId}/role`]: ROLES.ASSASSIN,
      [`recruitmentOffers/${this.currentPlayerId}`]: null
    });

    if (this.roles[this.currentPlayerId]) {
      this.roles[this.currentPlayerId].role = ROLES.ASSASSIN;
    }

    return true;
  }

  listenDetectiveNotifications(callback) {
    const notificationRef = ref(this.database, `rooms/${this.roomCode}/gameState/detectiveNotifications/${this.currentPlayerId}`);
    return onValue(notificationRef, (snapshot) => {
      const notification = snapshot.val() || null;
      callback(notification);
    });
  }

  async clearDetectiveTests() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}`);
    await update(roomRef, {
      'gameState/detectiveWordTest': null,
      'gameState/detectivePercentageTest': null
    });

    if (this.gameState) {
      this.gameState.detectiveWordTest = null;
      this.gameState.detectivePercentageTest = null;
    }
  }

  // 🕵️ Obter palavra do teste para o jogador atual
  getWordTestResult() {
    if (!this.gameState?.detectiveWordTest?.activated) return null;
    return this.gameState.detectiveWordTest.baseWord;
  }

  // 🕵️ Obter porcentagens do teste
  getPercentageTestResults() {
    return this.gameState?.detectivePercentageTest || null;
  }

  // 🕵️ Obter notificações do detetive
  getDetectiveNotifications() {
    return this.gameState?.detectiveNotifications?.[this.currentPlayerId] || null;
  }

  static getTranslatedDetectiveWordTestResult(detectiveWordTest, language, currentPlayerRole) {
    if (!detectiveWordTest || !detectiveWordTest.activated) return null;
    const targetLang = language || 'pt';
    const originalLang = detectiveWordTest.language || 'pt';
    const baseWordIndex = typeof detectiveWordTest.wordIndex === 'number' ? detectiveWordTest.wordIndex : null;
    if (originalLang === targetLang || baseWordIndex === null) {
      return currentPlayerRole === ROLES.ASSASSIN ? detectiveWordTest.assassinWord : detectiveWordTest.baseWord;
    }

    const targetWords = DETECTIVE_BASE_WORDS[targetLang] || DETECTIVE_BASE_WORDS.pt;
    const baseWord = targetWords[baseWordIndex] || detectiveWordTest.baseWord;
    return currentPlayerRole === ROLES.ASSASSIN ? getDetectiveAssassinWord(baseWord, targetLang) : baseWord;
  }

  checkVictory() {
    const aliveRoles = Object.values(this.roles || {}).filter(roleData => roleData.alive !== false);
    const assassinAlive = aliveRoles.some(roleData => roleData.role === ROLES.ASSASSIN);
    const traitorAlive = aliveRoles.some(roleData => roleData.role === ROLES.TRAITOR);
    const players = Object.entries(this.roles || {});

    if ((assassinAlive || traitorAlive) && aliveRoles.length <= 2) {
      return {
        winner: 'assassin',
        players
      };
    }

    if (!assassinAlive && !traitorAlive) {
      return {
        winner: 'civilians',
        players
      };
    }

    return {
      winner: 'civilians',
      players
    };
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
export { ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS };