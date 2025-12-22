import mongoose, { Schema, Document } from "mongoose";

export interface IMusic extends Document {
  title: string;
  artist: string;
  duration: number; // duração em segundos
  url: string;
  key?: string; // tom da música, opcional
  lyrics?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MusicSchema = new Schema<IMusic>(
  {
    title: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: false,
      trim: true,
    },
    lyrics: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "musics",
  }
);

// Índices para pesquisa eficiente
MusicSchema.index({ title: 1, artist: 1 });

export const Music = mongoose.model<IMusic>("Music", MusicSchema);
