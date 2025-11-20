import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import musicsRouter from "./routes/musics";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/karaoke";

app.use(express.json());
app.use(musicsRouter);

mongoose.connect(MONGODB_URI)
	.then(() => {
		console.log("Conectado ao MongoDB");
		app.listen(PORT, () => {
			console.log(`Servidor rodando na porta ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("Erro ao conectar ao MongoDB:", err);
		process.exit(1);
	});
