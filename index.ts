import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import musicsRouter from "./routes/musics";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/karaoke";

// CORS configuration
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	// Não definir Content-Type aqui para permitir multipart/form-data
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(musicsRouter);

// Configure MongoDB connection with UTF-8 support
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
