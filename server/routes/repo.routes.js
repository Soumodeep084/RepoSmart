const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const { analyzeRepository, aiScanRepository } = require("../controllers/repo.controller");

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeRepository);
router.post("/ai-scan", authMiddleware, aiScanRepository);

module.exports = router;
