import type { Music } from "../types";

/**
 * Converte um arquivo BD.ini para um array de objetos Music
 * @param fileContent - Conteúdo do arquivo BD.ini como string
 * @returns Array de objetos Music
 */
export function parseIniFile(fileContent: string): Music[] {
  const musics: Music[] = [];
  const lines = fileContent.split(/\r?\n/);
  
  let currentId: string | null = null;
  let currentMusic: Partial<Music> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignorar linhas vazias
    if (!line) {
      continue;
    }

    // Detectar seção [ID]
    const sectionMatch = line.match(/^\[(\d+)\]$/);
    if (sectionMatch) {
      // Se já temos uma música anterior, salvá-la
      if (currentId && currentMusic.id) {
        musics.push(currentMusic as Music);
      }

      // Iniciar nova música
      currentId = sectionMatch[1];
      currentMusic = {
        id: currentId,
        arquivo: "",
        artista: "",
        musica: "",
        inicio: "",
      };
      continue;
    }

    // Processar campos chave=valor
    const fieldMatch = line.match(/^([^=]+)=(.*)$/);
    if (fieldMatch && currentId) {
      const key = fieldMatch[1].trim().toLowerCase();
      const value = fieldMatch[2].trim();

      switch (key) {
        case "arquivo":
          currentMusic.arquivo = value;
          break;
        case "artista":
          currentMusic.artista = value;
          break;
        case "musica":
          currentMusic.musica = value;
          break;
        case "inicio":
          currentMusic.inicio = value;
          break;
      }
    }
  }

  // Adicionar a última música
  if (currentId && currentMusic.id) {
    musics.push(currentMusic as Music);
  }

  return musics;
}

/**
 * Valida se um arquivo BD.ini tem o formato correto
 * @param fileContent - Conteúdo do arquivo BD.ini como string
 * @returns Objeto com isValid e errors
 */
export function validateIniFile(fileContent: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!fileContent || fileContent.trim().length === 0) {
    errors.push("Arquivo vazio");
    return { isValid: false, errors };
  }

  const musics = parseIniFile(fileContent);

  if (musics.length === 0) {
    errors.push("Nenhuma música encontrada no arquivo");
    return { isValid: false, errors };
  }

  // Validar cada música
  musics.forEach((music, index) => {
    if (!music.id) {
      errors.push(`Música ${index + 1}: ID não encontrado`);
    }
    if (!music.arquivo) {
      errors.push(`Música ${index + 1} (ID: ${music.id}): Campo 'arquivo' não encontrado`);
    }
    if (!music.artista) {
      errors.push(`Música ${index + 1} (ID: ${music.id}): Campo 'artista' não encontrado`);
    }
    if (!music.musica) {
      errors.push(`Música ${index + 1} (ID: ${music.id}): Campo 'musica' não encontrado`);
    }
    if (!music.inicio) {
      errors.push(`Música ${index + 1} (ID: ${music.id}): Campo 'inicio' não encontrado`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

