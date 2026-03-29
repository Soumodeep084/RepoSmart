const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { googleAuth } = require("../controllers/googleAuth.controller");
const { sendOTP, verifyOTP, resetPassword } = require("../controllers/forgotPassword.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;