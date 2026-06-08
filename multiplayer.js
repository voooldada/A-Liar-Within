import { app, authReady } from './firebase.js';
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue
} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';

const db = getDatabase(app);

// 🎲 Gera código da sala
function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

// 🧑 Gera ID único de jogador
function generatePlayerId() {
  return crypto.randomUUID();
}

// 🏗️ Criar sala
async function createRoom(playerName, language = 'pt') {
  await authReady;

  const roomCode = generateRoomCode();
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  // evita colisões de código
  if (snapshot.exists()) {
    return createRoom(playerName, language);
  }

  const now = Date.now();
  const playerId = generatePlayerId();

  const roomData = {
    host: playerId,
    createdAt: now,
    state: 'waiting',
    language: language || 'pt',
    players: {
      [playerId]: {
        id: playerId,
        name: playerName,
        joinedAt: now,
        role: 'founder'
      }
    }
  };

  await set(roomRef, roomData);

  return {
    roomCode,
    playerId,
    roomData
  };
}

// 🚪 Entrar numa sala existente
async function joinRoom(roomCode, playerName) {
  await authReady;

  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error('Sala não encontrada');
  }

  const data = snapshot.val();
  const eliminatedPlayers = data.eliminatedPlayers || [];

  if (eliminatedPlayers.includes(playerName)) {
    throw new Error('Você foi eliminado e não pode voltar à sala.');
  }

  const players = data.players || {};
  const playerCount = Object.keys(players).length;
  const maxPlayers = 30;

  if (playerCount >= maxPlayers) {
    throw new Error('Sala cheia. Máximo de 30 jogadores.');
  }

  const playerId = generatePlayerId();

  const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
  const newPlayerData = {
    id: playerId,
    name: playerName,
    joinedAt: Date.now(),
    role: null
  };

  await set(playerRef, newPlayerData);

  // ⚠️ IMPORTANTE:
  // snapshot aqui pode estar "antigo", então devolvemos a sala atualizada localmente
  return {
    roomCode,
    playerId,
    roomData: {
      ...snapshot.val(),
      players: {
        ...(snapshot.val()?.players || {}),
        [playerId]: newPlayerData
      }
    }
  };
}

// 👁️ Escutar mudanças da sala em tempo real
function listenRoom(roomCode, callback) {
  const roomRef = ref(db, `rooms/${roomCode}`);

  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ?? null);
  });
}

// 🔄 Atualizar sala
async function updateRoom(roomCode, updates) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, updates);
}

export {
  createRoom,
  joinRoom,
  listenRoom,
  updateRoom
};