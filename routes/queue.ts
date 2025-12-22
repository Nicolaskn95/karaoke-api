import { Router } from "express";
import { Queue } from "../models/Queue";
import mongoose from "mongoose";

const router = Router();

// Adiciona músicas na fila
router.post("/queue/add", async (req, res) => {
  try {
    const { musicId, name, date, time } = req.body;

    console.log("Adicionando à fila:", { musicId, name, date, time });

    if (!musicId || !name || !date || !time) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios ausentes",
        message: "Envie musicId, name, date e time.",
      });
    }

    const entry = new Queue({
      musicId,
      name,
      date,
      time,
    });

    const savedEntry = await entry.save();
    console.log("Entrada salva:", {
      _id: savedEntry._id,
      date: savedEntry.date,
    });

    res.status(201).json({ success: true, entry: savedEntry });
  } catch (error) {
    console.error("Erro ao adicionar à fila:", error);
    res.status(500).json({
      error: "Erro ao adicionar à fila",
      message: (error as Error).message,
    });
  }
});

// Lista músicas da fila da data atual
router.get("/queue/today", async (req, res) => {
  try {
    // Usar UTC para consistência com o frontend (que usa toISOString)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    // Também tentar data local caso tenha sido salva assim
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStrLocal = `${yyyy}-${mm}-${dd}`;

    console.log("Buscando fila para datas:", { dateStr, dateStrLocal });

    // Buscar todas as entradas para debug (remover depois)
    const allEntries = await Queue.find({}).limit(5).lean();
    console.log(
      "Últimas 5 entradas no banco:",
      allEntries.map((e) => ({ date: e.date, name: e.name }))
    );

    // Buscar por ambas as datas (UTC e local) para cobrir casos de timezone
    const queueEntries = await Queue.find({
      $or: [{ date: dateStr }, { date: dateStrLocal }],
    })
      .sort({ time: 1, createdAt: 1 })
      .lean();

    console.log(`Encontradas ${queueEntries.length} músicas na fila para hoje`);

    // Buscar informações das músicas
    const musicCollection = mongoose.connection.collection("musics");
    const queueWithMusicInfo = await Promise.all(
      queueEntries.map(async (entry) => {
        try {
          const music = await musicCollection.findOne({ id: entry.musicId });
          return {
            ...entry,
            musica: music?.musica || null,
            artista: music?.artista || null,
          };
        } catch (err) {
          console.error(`Erro ao buscar música ${entry.musicId}:`, err);
          return {
            ...entry,
            musica: null,
            artista: null,
          };
        }
      })
    );

    res.status(200).json(queueWithMusicInfo);
  } catch (error) {
    console.error("Erro ao buscar fila:", error);
    res.status(500).json({
      error: "Erro ao buscar fila",
      message: (error as Error).message,
    });
  }
});

export default router;
