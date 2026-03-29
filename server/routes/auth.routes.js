const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { googleAuth } = require("../controllers/googleAuth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);

module.exports = router;