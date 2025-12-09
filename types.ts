export interface Music {
  _id?: any; // ObjectId do MongoDB
  id: string;
  arquivo: string;
  artista: string;
  musica: string;
  inicio: string;
}

export interface MusicFilters {
  artista?: string;
  musica?: string;
  id?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: "id" | "artista" | "musica" | "arquivo" | "inicio";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
