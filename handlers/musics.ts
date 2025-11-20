import type { Music, MusicFilters, PaginatedResponse } from "../types";
import type { Request, Response } from "express";
import mongoose from "mongoose";

// Helper function to fix encoding issues (converts ISO-8859-1/Windows-1252 to UTF-8)
// The issue: MongoDB may have stored data in Latin1, but Node.js interprets it as UTF-8
// When we see "", it means UTF-8 decoding failed - we need to get raw bytes from MongoDB
function fixEncoding(str: string): string {
  if (!str || typeof str !== "string") return str;

  try {
    // Check if string contains replacement character (indicates encoding issue)
    const hasReplacementChar = str.includes("");
    // Check for common mojibake patterns (double-encoded UTF-8)
    const hasMojibake = /Ã[¡-¿À-ÿ]|â€|Ã§|Ã£|Ã©|Ã³|Ãº|Ãª|Ã´/.test(str);
    // Check for specific encoding issues like "coraêêo" (should be "coração")
    const hasEncodingIssue = /êêo|êo\b|coraêêo|coraêo/.test(str);

    if (hasReplacementChar || hasMojibake || hasEncodingIssue) {
      // When we have "", the original bytes were lost during UTF-8 decoding
      // We need to work with what we have and try to reconstruct

      // Method 1: Try to get the raw bytes that created this string
      // If the string was created from Latin1 bytes interpreted as UTF-8
      try {
        // Get bytes as they are currently encoded in the string
        const currentBytes = Buffer.from(str, "utf8");
        // Try to reinterpret as Latin1 (most common case for Portuguese)
        const fixed = currentBytes.toString("latin1");

        // Check if this looks better
        if (!fixed.includes("") && fixed !== str) {
          return fixed;
        }
      } catch (e) {
        // Continue
      }

      // Method 2: Try binary encoding (preserves bytes exactly)
      try {
        const binaryBytes = Buffer.from(str, "binary");
        // Try interpreting as Latin1
        const fixed1 = binaryBytes.toString("latin1");
        if (!fixed1.includes("") && fixed1 !== str) {
          return fixed1;
        }
        // Try interpreting as UTF-8 (in case it was double-encoded)
        const fixed2 = binaryBytes.toString("utf8");
        if (!fixed2.includes("") && fixed2 !== str) {
          return fixed2;
        }
      } catch (e) {
        // Continue
      }

      // Method 3: Pattern-based replacement for common Portuguese words
      // When "" appears, it often replaces characters like ê, ã, é, etc.
      // We can try to fix common patterns
      let fixed = str;

      // Common Portuguese word patterns that might have encoding issues
      const patterns = [
        // "cad" + "" likely means "cadê"
        { pattern: /cad/g, replacement: "cadê" },
        { pattern: /nao/g, replacement: "não" },
        { pattern: /voce/g, replacement: "você" },
        { pattern: /pao/g, replacement: "pão" },
        { pattern: /mae/g, replacement: "mãe" },
        { pattern: /coracao/g, replacement: "coração" },
        { pattern: /cancao/g, replacement: "canção" },
        { pattern: /acao/g, replacement: "ação" },
        { pattern: /cao/g, replacement: "ção" },
        // Corrigir "coraêêo" -> "coração"
        { pattern: /coraêêo/g, replacement: "coração" },
        { pattern: /coraêo/g, replacement: "coração" },
        // Corrigir outros padrões comuns
        { pattern: /êêo/g, replacement: "ção" },
        { pattern: /êo\b/g, replacement: "ção" },
      ];

      // Apply pattern replacements
      for (const { pattern, replacement } of patterns) {
        if (pattern.test(fixed)) {
          fixed = fixed.replace(pattern, replacement);
        }
      }

      // Also try to replace "" with common characters based on context
      // "cad" + "" at end of word = "cadê"
      fixed = fixed.replace(/cad$/g, "cadê");
      fixed = fixed.replace(/cad\s/g, "cadê ");
      fixed = fixed.replace(/cad/g, "cadê");

      // Corrigir padrões específicos de encoding
      // "coraêêo" -> "coração" (prioridade alta - fazer antes de padrões gerais)
      fixed = fixed.replace(/coraêêo/gi, "coração");
      fixed = fixed.replace(/coraêo/gi, "coração");

      // Corrigir padrão geral: "êêo" -> "ção" (quando no final de palavra)
      // Isso corrige palavras como "coraêêo", "canêêo", etc.
      fixed = fixed.replace(/([a-z])êêo/gi, "$1ção");
      fixed = fixed.replace(/([a-z])êo\b/gi, "$1ção");

      // Sempre aplicar correções de padrões conhecidos, mesmo sem ""
      // Isso corrige casos como "coraêêo" que não têm "" mas são erros de encoding
      if (fixed !== str) {
        return fixed;
      }

      // Method 4: Direct character replacement for "" in common positions
      // This is a last resort - try to guess what character should be there
      // Based on common Portuguese patterns
      if (fixed.includes("")) {
        // Try common replacements for "" in Portuguese text
        // "cad" + "" = "cadê" (ê = 0xEA in Latin1, becomes "" in UTF-8 if misread)
        fixed = fixed.replace(/cad/g, "cadê");

        // Corrigir "coraêêo" -> "coração"
        fixed = fixed.replace(/coraêêo/gi, "coração");

        // If still has "", try to remove it or replace with space
        if (fixed.includes("")) {
          // Last resort: remove "" or replace with likely character
          // Use Unicode replacement character U+FFFD
          const replacementChar = "\uFFFD";
          fixed = fixed.replace(new RegExp(replacementChar, "g"), "ê"); // Most common in "cadê"
        }
      }

      if (fixed !== str) {
        return fixed;
      }
    }

    // Sempre aplicar correções de padrões conhecidos, mesmo sem problemas de encoding detectados
    // Isso corrige casos como "coraêêo" que não têm "" mas são erros de encoding
    let alwaysFixed = str;

    // Corrigir padrões específicos que sempre devem ser corrigidos
    alwaysFixed = alwaysFixed.replace(/coraêêo/gi, "coração");
    alwaysFixed = alwaysFixed.replace(/coraêo/gi, "coração");
    alwaysFixed = alwaysFixed.replace(/([a-z])êêo/gi, "$1ção");
    alwaysFixed = alwaysFixed.replace(/([a-z])êo\b/gi, "$1ção");

    if (alwaysFixed !== str) {
      return alwaysFixed;
    }

    return str;
  } catch (error) {
    console.error("Error fixing encoding:", error);
    return str;
  }
}

// Helper to recursively fix encoding in objects
function fixEncodingInObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return fixEncoding(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(fixEncodingInObject);
  }

  if (typeof obj === "object") {
    const fixed: any = {};
    for (const key in obj) {
      fixed[key] = fixEncodingInObject(obj[key]);
    }
    return fixed;
  }

  return obj;
}

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

    // Usando Mongoose para buscar na coleção "musics"
    const MusicModel = mongoose.connection.collection("musics");

    // Buscar músicas com filtros e paginação
    // Usar find com opções que podem ajudar com encoding
    const cursor = MusicModel.find(filters, {
      // Tentar preservar dados binários se possível
    });

    const data = await cursor.skip(skip).limit(limit).toArray();

    // Contar total de documentos que correspondem aos filtros
    const total = await MusicModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    // Transformar dados para formato JSON (convertendo ObjectId para string)
    // e corrigir encoding de strings
    // IMPORTANTE: Tentar acessar os dados como BSON primeiro para preservar bytes
    const formattedData = data.map((doc: any) => {
      // Tentar corrigir encoding antes de processar
      const docCopy: any = {};

      // Processar cada campo individualmente
      for (const key in doc) {
        if (key === "_id") {
          docCopy[key] = doc[key]?.toString() || doc[key];
        } else if (typeof doc[key] === "string") {
          // Aplicar correção de encoding
          docCopy[key] = fixEncoding(doc[key]);
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
