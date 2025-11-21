const express = require("express");
const cors = require("cors");
const { keyboard, Key } = require("@nut-tree-fork/nut-js");

const app = express();
const PORT = 4000;

app.use(cors()); // Permite que seu app web (em outro domínio) acesse esse backend
app.use(express.json()); // Habilita o parsing de JSON no body das requisições

const numberQueue = [];
let isProcessing = false; // Flag para evitar que o job rode em duplicidade

// --- Função de Sleep ---
// Função auxiliar para criar delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/add-number", (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res
      .status(400)
      .json({ error: 'Nenhum "number" foi fornecido no body.' });
  }

  const numberStr = number.toString();
  console.log(`[API] Número recebido: ${numberStr}`);

  numberQueue.push(numberStr);

  res.status(200).json({
    message: "Número adicionado à fila com sucesso.",
    queueSize: numberQueue.length,
  });

  if (!isProcessing) {
    processQueue();
  }
});

app.get("/", (req, res) => {
  res.send(
    "Servidor de automação (nut-js) está rodando. Faça POST em /add-number."
  );
});

// --- O Job (Processador da Fila) ---
async function processQueue() {
  if (isProcessing) return;
  if (numberQueue.length === 0) {
    console.log("[Job] Fila vazia. Aguardando...");
    isProcessing = false;
    return;
  }

  isProcessing = true;
  console.log(
    `[Job] Iniciando processamento da fila. Itens: ${numberQueue.length}`
  );

  console.warn("\n!!!! ATENÇÃO !!!!");
  console.warn(
    "Você tem 5 SEGUNDOS para focar (clicar) no aplicativo de destino."
  );
  console.warn("!!!! ATENÇÃO !!!!\n");
  await sleep(5000);
  keyboard.config.autoDelayMs = 50;

  while (numberQueue.length > 0) {
    const numberToType = numberQueue.shift();

    console.log(`[Job] Digitando: ${numberToType}`);

    try {
      // --- Comandos do nut-js ---
      await keyboard.type(numberToType);
      await keyboard.type(Key.Enter);

      console.log(`[Job] Concluído: ${numberToType}`);

      await sleep(1000);
    } catch (err) {
      console.error(`[Job] Erro ao tentar digitar (${numberToType}):`, err);
      numberQueue.unshift(numberToType);
      break; // Sai do loop 'while'
    }
  }

  console.log("[Job] Processamento da fila concluído.");
  isProcessing = false;

  processQueue();
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[Servidor] Backend de automação (nut-js) rodando em http://localhost:${PORT}`
  );
  console.log("[Servidor] Aguardando números no endpoint /add-number");

  processQueue();
});
