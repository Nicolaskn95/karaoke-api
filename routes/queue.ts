
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// Adiciona músicas na fila

router.post("/queue/add", async (req, res) => {
	try {
		const { musicId, name, date, time } = req.body;
		if (!musicId || !name || !date || !time) {
			return res.status(400).json({
				error: "Parâmetros obrigatórios ausentes",
				message: "Envie musicId, name, date e time."
			});
		}

		const queueCollection = mongoose.connection.collection("queue");
		const entry = {
			musicId,
			name,
			date,
			time,
			createdAt: new Date()
		};
		await queueCollection.insertOne(entry);
		res.status(201).json({ success: true, entry });
	} catch (error) {
		res.status(500).json({
			error: "Erro ao adicionar à fila",
			message: (error as Error).message
		});
	}
});


// Lista músicas da fila da data atual
router.get("/queue/today", async (req, res) => {
	try {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		const dateStr = `${yyyy}-${mm}-${dd}`;

		const queueCollection = mongoose.connection.collection("queue");
		const queue = await queueCollection.find({ date: dateStr }).toArray();
		res.status(200).json(queue);
	} catch (error) {
		res.status(500).json({
			error: "Erro ao buscar fila",
			message: (error as Error).message
		});
	}
});

export default router;



