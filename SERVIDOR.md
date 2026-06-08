# 🎮 A Liar Within - Servidor Local

## Como iniciar o servidor?

### Opção 1: Node.js (Recomendado)
1. Certifique-se de ter Node.js instalado
2. Duplo clique em `iniciar-servidor.bat`
3. Abra no navegador: `http://localhost:3000/tv`

### Opção 2: Python (Sem instalação extra)
1. Certifique-se de ter Python instalado
2. Duplo clique em `iniciar-servidor-python.bat`
3. Abra no navegador: `http://localhost:3000/tv`

### Opção 3: Terminal (Manual)
#### Node.js:
```powershell
node server.js
```

#### Python:
```powershell
python server.py
```

---

## 🔗 URLs Disponíveis

### Local (Seu computador):
- **Jogo**: http://localhost:3000
- **TV**: http://localhost:3000/tv

### Pela Rede (Outro dispositivo/TV):
- **Jogo**: http://SEU_IP:3000
- **TV**: http://SEU_IP:3000/tv

Para descobrir seu IP, execute no PowerShell:
```powershell
ipconfig
```
Procure por "IPv4 Address" na seção WiFi ou Ethernet.

---

## 📱 Fluxo de Uso

1. **Na TV**: 
   - Abra `http://SEU_IP:3000/tv` no navegador
   - Exibe QR code para espectadores

2. **No Celular (Jogador)**:
   - Abra `http://SEU_IP:3000` no navegador
   - Crie uma sala e jogue normalmente

3. **No Celular (Espectador)**:
   - Clique "Conectar com TV"
   - Escaneie o QR code da TV
   - Digite o código da sala
   - Assista o jogo! 🎮

---

## ⚠️ Troubleshooting

**"Porta 3000 já está em uso"**
- Feche outros programas que usam a porta 3000
- Ou mude a porta no arquivo `server.js` ou `server.py`

**"Node.js não encontrado"**
- Instale Node.js em: https://nodejs.org
- Depois use `iniciar-servidor.bat`

**"Python não encontrado"**
- Instale Python em: https://python.org
- Durante instalação, marque "Add Python to PATH"

---

## 🌐 Publicar online com Firebase Hosting

O projeto já está pronto para ser publicado usando Firebase Hosting.

### Arquivos criados
- `firebase.json`
- `.firebaserc`

### Como publicar
1. Instale o Firebase CLI:
   ```powershell
   npm install -g firebase-tools
   ```
2. Faça login no Firebase:
   ```powershell
   firebase login
   ```
3. Inicie no projeto:
   ```powershell
   firebase use default
   ```
4. Publique:
   ```powershell
   firebase deploy --only hosting
   ```

### URLs após deploy
- `https://<seu-projeto>.web.app` ou `https://<seu-projeto>.firebaseapp.com`
- `https://<seu-projeto>.web.app/tv` para o QR code da TV
- `https://<seu-projeto>.web.app/spectator` para o espectador

---

## 🎯 Dicas

- A TV permanece na tela de QR code enquanto transmite
- Múltiplos espectadores podem assistir simultaneamente
- Espectadores veem fase, jogadores e eventos em tempo real
- Podem sair a qualquer momento

Divirta-se! 🎮
