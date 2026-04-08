const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { googleAuth } = require("../controllers/googleAuth.controller");
const { sendOTP, verifyOTP, resetPassword } = require("../controllers/forgotPassword.controller");
const verifyCaptcha = require("../middleware/captcha.middleware");

router.post("/register", verifyCaptcha, register);
router.post("/login", verifyCaptcha, login);
// Exposes Google OAuth client id to the frontend.
// Note: client id is not a secret (unlike the client secret).
router.get("/google-client-id", (req, res) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
	}

	res.json({ clientId });
});
router.post("/google", googleAuth);
router.post("/forgot-password", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;