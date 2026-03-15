const User = require("../models/users.models");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const generateUsername = async (email) => {
    const base = email.split("@")[0];
    let username = base;

    while (await User.findOne({ username })) {
        const rand = Math.floor(100 + Math.random() * 900);
        username = `${base}${rand}`;
    }

    return username;
};

exports.googleAuth = async (req, res) => {
    try {
        const { access_token } = req.body; // received from frontend

        // Fetch user profile
        const response = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const { email } = response.data;

        let user = await User.findOne({ email });

        if (!user) {
            const username = await generateUsername(email);

            user = await User.create({
                username,
                email,
                password: "GOOGLE_AUTH", // placeholder password
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Google authentication failed" });
    }
};