// gameChat.js - Sistema de chat e recrutamento
import { getDatabase, ref, update, onValue, push } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js';

export class GameChat {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.database = getDatabase();
    this.messages = {};
  }

  // Enviar mensagem pública
  async sendPublicMessage(playerId, playerName, message, isAssassinProfile = false, isTraitorProfile = false, isDoctorProfile = false, isDetectiveProfile = false, displayNameOverride = null, displayColorOverride = null, isTraitorMask = false) {
    const messagesRef = ref(this.database, `rooms/${this.roomCode}/chat/public`);
    const newMessageRef = push(messagesRef);
    
    const displayName = isAssassinProfile ? 'Assassino'
      : isTraitorProfile ? 'Traidor'
      : isDoctorProfile ? 'Médico'
      : isDetectiveProfile ? 'Detetive'
      : playerName;
    
    await update(newMessageRef, {
      playerId,
      playerName: displayName,
      displayName: displayNameOverride || null,
      displayColor: displayColorOverride || null,
      message,
      timestamp: Date.now(),
      isAssassinProfile: isAssassinProfile || false,
      isTraitorProfile: isTraitorProfile || false,
      isDoctorProfile: isDoctorProfile || false,
      isDetectiveProfile: isDetectiveProfile || false,
      isTraitorMask: isTraitorMask || false
    });
  }

  // Enviar mensagem privada entre dois jogadores
  async sendPrivateMessage(fromPlayerId, fromPlayerName, toPlayerId, message, isAssassinProfile = false, isTraitorProfile = false, isDoctorProfile = false, isDetectiveProfile = false, displayNameOverride = null, displayColorOverride = null, isTraitorMask = false) {
    const chatId = [fromPlayerId, toPlayerId].sort().join('_');
    const messagesRef = ref(this.database, `rooms/${this.roomCode}/chat/private/${chatId}`);
    const newMessageRef = push(messagesRef);
    
    const displayName = isAssassinProfile ? 'Assassino'
      : isTraitorProfile ? 'Traidor'
      : isDoctorProfile ? 'Médico'
      : isDetectiveProfile ? 'Detetive'
      : fromPlayerName;
    
    await update(newMessageRef, {
      fromPlayerId,
      fromPlayerName: displayName,
      displayName: displayNameOverride || null,
      displayColor: displayColorOverride || null,
      toPlayerId,
      message,
      timestamp: Date.now(),
      isAssassinProfile: isAssassinProfile || false,
      isTraitorProfile: isTraitorProfile || false,
      isDoctorProfile: isDoctorProfile || false,
      isDetectiveProfile: isDetectiveProfile || false,
      isTraitorMask: isTraitorMask || false
    });
  }

  // Escuta mensagens públicas
  listenPublicMessages(callback) {
    const messagesRef = ref(this.database, `rooms/${this.roomCode}/chat/public`);
    return onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val() || {};
      this.messages = messages;
      callback(messages);
    });
  }

  // Escuta mensagens privadas entre dois jogadores
  listenPrivateMessages(playerId, otherPlayerId, callback) {
    const chatId = [playerId, otherPlayerId].sort().join('_');
    const messagesRef = ref(this.database, `rooms/${this.roomCode}/chat/private/${chatId}`);
    return onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val() || {};
      callback(messages);
    });
  }

  // Obtém ID do assassino
  async getAssassinId() {
    const roomRef = ref(this.database, `rooms/${this.roomCode}/roles`);
    return new Promise((resolve) => {
      onValue(roomRef, (snapshot) => {
        const roles = snapshot.val() || {};
        const assassinId = Object.entries(roles).find(([, role]) => role.role === 'assassin')?.[0];
        resolve(assassinId || null);
      }, { onlyOnce: true });
    });
  }

  // Obtém role de um jogador específico
  async getPlayerRole(playerId) {
    const playerRoleRef = ref(this.database, `rooms/${this.roomCode}/roles/${playerId}`);
    return new Promise((resolve) => {
      onValue(playerRoleRef, (snapshot) => {
        resolve(snapshot.val() || null);
      }, { onlyOnce: true });
    });
  }

  // Envia uma solicitação para que um jogador responda usando seu perfil de role
  async sendRoleProfileRequest(fromPlayerId, toPlayerId, role) {
    const reqRef = ref(this.database, `rooms/${this.roomCode}/roleProfileRequests/${toPlayerId}/${fromPlayerId}`);
    await update(reqRef, {
      role: role,
      timestamp: Date.now()
    });
  }

  // Escuta solicitações de role-profile direcionadas ao jogador
  listenRoleProfileRequests(playerId, callback) {
    const requestsRef = ref(this.database, `rooms/${this.roomCode}/roleProfileRequests/${playerId}`);
    return onValue(requestsRef, (snapshot) => {
      const requests = snapshot.val() || {};
      callback(requests);
    });
  }

  // Remove uma solicitação de role-profile (após processada)
  async clearRoleProfileRequest(toPlayerId, fromPlayerId) {
    const singleRef = ref(this.database, `rooms/${this.roomCode}/roleProfileRequests/${toPlayerId}/${fromPlayerId}`);
    await update(singleRef, null);
  }
}
