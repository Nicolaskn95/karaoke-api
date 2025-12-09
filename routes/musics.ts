import { Router } from "express";
import { getMusics } from "../handlers/musics";
import { uploadMusics, upload } from "../handlers/upload";
import multer from "multer";

const router = Router();

router.get("/musics", getMusics);
router.post(
  "/musics/upload",
  upload.single("file"),
  (req, res, next) => {
    // Tratamento de erros do multer
    if (req.file === undefined) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado",
        message: "Por favor, envie um arquivo BD.ini",
      });
    }
    next();
  },
  uploadMusics
);
// Middleware para capturar erros do multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Arquivo muito grande",
        message: "O arquivo excede o tamanho máximo de 10MB",
      });
    }
    return res.status(400).json({
      error: "Erro no upload",
      message: error.message,
    });
  }
  if (error) {
    return res.status(400).json({
      error: "Erro no upload",
      message: error.message || "Erro desconhecido",
    });
  }
  next();
});
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API está funcionando!" });
});

export default router;
