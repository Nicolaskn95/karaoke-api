import mongoose, { Schema, Document } from "mongoose";

export interface IQueue extends Document {
  musicId: string;
  name: string;
  date: string; // formato YYYY-MM-DD
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const QueueSchema = new Schema<IQueue>(
  {
    musicId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "queue",
  }
);

// Índices compostos para melhor performance
QueueSchema.index({ date: 1, time: 1 });
QueueSchema.index({ date: 1, createdAt: 1 });

export const Queue = mongoose.model<IQueue>("Queue", QueueSchema);
