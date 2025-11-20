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

    if (artistaFilter) {
      filters.artista = { $regex: artistaFilter, $options: "i" };
    }
    if (musicaFilter) {
      filters.musica = { $regex: musicaFilter, $options: "i" };
    }
    if (idFilter) {
      filters.id = idFilter;
    }

    // Usando Mongoose para buscar na coleção "musics"
    const MusicModel = mongoose.connection.collection("musics");

    // Buscar músicas com filtros e paginação
    const data = await MusicModel.find(filters)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Contar total de documentos que correspondem aos filtros
    const total = await MusicModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    // Transformar dados para formato JSON (convertendo ObjectId para string)
    const formattedData = data.map((doc: any) => ({
      ...doc,
      _id: doc._id?.toString() || doc._id,
    }));

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
