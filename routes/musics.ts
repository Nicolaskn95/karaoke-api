import { Router } from "express";
import { getMusics } from "../handlers/musics";

const router = Router();

router.get("/musics", getMusics);
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API está funcionando!" });
});

export default router;
