import type { Music, MusicFilters, PaginatedResponse } from "../types";
import type { Request, Response } from "express";
import mongoose from "mongoose";

export async function getMusics(req: Request, res: Response) {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      artista,
      musica,
      id,
      numero,
    } = req.query;

    // Parâmetros de paginação
    const page = parseInt((pageParam as string) || "1", 10);
    const limit = parseInt((limitParam as string) || "10", 10);
    const skip = (page - 1) * limit;

    // Filtros (usando any para permitir operadores do MongoDB)
    const filters: any = {};
    const artistaFilter = artista as string | undefined;
    const musicaFilter = musica as string | undefined;
    const idFilter = (id as string) || (numero as string);

    // Decode URL-encoded parameters to ensure proper UTF-8 handling
    if (artistaFilter) {
      const decodedArtista = decodeURIComponent(artistaFilter);
      filters.artista = { $regex: decodedArtista, $options: "i" };
    }
    if (musicaFilter) {
      const decodedMusica = decodeURIComponent(musicaFilter);
      filters.musica = { $regex: decodedMusica, $options: "i" };
    }
    if (idFilter) {
      filters.id = idFilter;
    }

    const MusicModel = mongoose.connection.collection("musics");

    const cursor = MusicModel.find(filters, {
      // Tentar preservar dados binários se possível
    });

    const data = await cursor.skip(skip).limit(limit).toArray();

    const total = await MusicModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    const formattedData = data.map((doc: any) => {
      // Tentar corrigir encoding antes de processar
      const docCopy: any = {};

      // Processar cada campo individualmente
      for (const key in doc) {
        if (key === "_id") {
          docCopy[key] = doc[key]?.toString() || doc[key];
        } else if (typeof doc[key] === "string") {
          // Aplicar correção de encoding
          docCopy[key] = decodeURIComponent(doc[key]);
        } else {
          docCopy[key] = doc[key];
        }
      }

      return docCopy;
    });

    const response: PaginatedResponse<Music> = {
      data: formattedData as Music[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    res.status(500).json({
      error: "Erro ao buscar músicas",
      message: (error as Error).message,
    });
  }
}
