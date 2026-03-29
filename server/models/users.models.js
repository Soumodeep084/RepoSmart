const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: false
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
            required: false,
        },
        githubId: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
            required: false,
        },
        resetOtp:{
            type: String,
            required: false,
        },
        resetOtpExpiry : {
            type: Date,
            required: false,    
        }

    },
    { timestamps: true }

);

module.exports = mongoose.model("User", userSchema);