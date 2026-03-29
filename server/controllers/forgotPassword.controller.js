const User = require("../models/users.models");
const bcrypt = require("bcrypt");
const sendOTPEmail = require("../config/sendMail");
const crypto = require("crypto");

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit secure OTP
};

// 1️⃣ Send OTP
exports.sendOTP = async (req, res) => {
    try {
        // Get User Email
        const { email } = req.body;

        // If User Email Not Provided
        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        // Find User 
        const user = await User.findOne({ email });

        // If User Not Found
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP , hash it & Save to DB
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry
        await user.save();

        // Send OTP to User Email
        await sendOTPEmail(email, otp);
        res.json({ message: "OTP sent successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

// 2️⃣ Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        // Get User Email & OTP
        const { email, otp } = req.body;

        if (!otp) {
            return res.status(400).json({ message: "OTP not received in Server" });
        }

        // Find User by Email
        const user = await User.findOne({ email });
        if (!user || !user.resetOtp) {
            return res.status(400).json({ message: "Invalid request" });
        }

        // Check OTP Validity
        // 1. Check expiry FIRST
        if (user.resetOtpExpiry && user.resetOtpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // 2. Then verify OTP
        const isValid = await bcrypt.compare(String(otp), user.resetOtp);

        if (!isValid) {
            return res.status(400).json({ message: "Invalid OTP"});
        }

        res.json({ message: "OTP verified" });

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err.message);
        res.status(500).json({ message: "OTP verification failed" });
    }
};

// 3️⃣ Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        user.password = hashed;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;

        await user.save();

        res.json({ message: "Password reset successfull" });

    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err.message);
        res.status(500).json({ message: "Reset failed" });
    }
};