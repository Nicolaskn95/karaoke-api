import type { Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { parseIniFile, validateIniFile } from "../services/iniParser";
import type { Music } from "../types";

// Configuração do multer para armazenar em memória
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Validar extensão do arquivo
    if (file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".ini")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos .ini são permitidos"));
    }
  },
});

export async function uploadMusics(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado",
        message: "Por favor, envie um arquivo BD.ini",
      });
    }

    // Validar extensão do arquivo
    const fileName = req.file.originalname.toLowerCase();
    if (!fileName.endsWith(".ini")) {
      return res.status(400).json({
        error: "Extensão inválida",
        message: "Apenas arquivos .ini são permitidos",
      });
    }

    // Converter buffer para string (assumindo encoding UTF-8 ou Latin1)
    let fileContent: string;
    try {
      // Tentar UTF-8 primeiro
      fileContent = req.file.buffer.toString("utf-8");
    } catch (error) {
      // Se falhar, tentar Latin1 (comum em arquivos .ini brasileiros)
      fileContent = req.file.buffer.toString("latin1");
    }

    // Validar conteúdo do arquivo
    const validation = validateIniFile(fileContent);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Arquivo inválido",
        message: "O arquivo não está no formato correto",
        details: validation.errors,
      });
    }

    // Converter arquivo para array de Music
    const uploadedMusics = parseIniFile(fileContent);

    // Buscar todas as músicas existentes no banco
    const MusicModel = mongoose.connection.collection("musics");
    const existingMusics = await MusicModel.find({}).toArray();

    // Criar um Map para busca rápida por ID
    const existingMusicsMap = new Map<string, any>();
    existingMusics.forEach((music: any) => {
      existingMusicsMap.set(music.id, music);
    });

    // Encontrar músicas novas ou diferentes
    const musicsToInsert: Music[] = [];
    const musicsToUpdate: Music[] = [];
    const stats = {
      new: 0,
      updated: 0,
      unchanged: 0,
      total: uploadedMusics.length,
    };

    for (const uploadedMusic of uploadedMusics) {
      const existingMusic = existingMusicsMap.get(uploadedMusic.id);

      if (!existingMusic) {
        // Música nova - adicionar
        musicsToInsert.push(uploadedMusic);
        stats.new++;
      } else {
        // Normalizar strings para comparação (trim e case-insensitive)
        const normalize = (str: string) => (str || "").trim().toLowerCase();
        
        // Verificar se há diferenças
        const hasChanges =
          normalize(existingMusic.arquivo) !== normalize(uploadedMusic.arquivo) ||
          normalize(existingMusic.artista) !== normalize(uploadedMusic.artista) ||
          normalize(existingMusic.musica) !== normalize(uploadedMusic.musica) ||
          normalize(existingMusic.inicio) !== normalize(uploadedMusic.inicio);

        if (hasChanges) {
          musicsToUpdate.push(uploadedMusic);
          stats.updated++;
        } else {
          stats.unchanged++;
        }
      }
    }

    // Inserir novas músicas
    if (musicsToInsert.length > 0) {
      await MusicModel.insertMany(musicsToInsert);
    }

    // Atualizar músicas modificadas
    if (musicsToUpdate.length > 0) {
      const bulkOps = musicsToUpdate.map((music) => ({
        updateOne: {
          filter: { id: music.id },
          update: {
            $set: {
              arquivo: music.arquivo,
              artista: music.artista,
              musica: music.musica,
              inicio: music.inicio,
            },
          },
        },
      }));

      await MusicModel.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: "Upload realizado com sucesso",
      stats: {
        total: stats.total,
        new: stats.new,
        updated: stats.updated,
        unchanged: stats.unchanged,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    res.status(500).json({
      error: "Erro ao processar upload",
      message: (error as Error).message,
    });
  }
}

