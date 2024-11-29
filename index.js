// index.js

const path = require("path");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@adiwajshing/baileys"); // Corrigido o nome da biblioteca
const readline = require("readline");
const pino = require("pino");
const { respostas } = require('./respostas'); // Importe o objeto respostas

const question = (string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(string, resolve));
};

const connect = async () => { // Removido exports. para funcionar diretamente
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, ".", "assets", "auth", "creds")
  );

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    printQRInTerminal: true, // Exibe o QR code no terminal para autenticação inicial
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Conexão fechada devido ao error:", lastDisconnect.error, ", Fazendo reconexão...", shouldReconnect);
      if (shouldReconnect) {
        connect(); // Chama a função connect() diretamente
      }
    } else if (connection === "open") {
      console.log(`Conexão estabelecida com sucesso!`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  let estadoUsuario = {};

  sock.ev.on('messages.upsert', async ({ messages, connection }) => {
    // ... (lógica de tratamento de mensagens e fluxo de conversa - igual ao exemplo anterior)
  });

  return sock;
};

connect(); // Inicia a conexão ao executar o arquivo
