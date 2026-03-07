const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const { analyzeRepository } = require("../controllers/repo.controller");

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeRepository);

module.exports = router;
