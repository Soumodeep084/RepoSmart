const nodemailer = require("nodemailer");

// MailTrap Configuration
const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
});

// Google Configuration
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // app password
//   },
// });

const sendOtpEmail = async (email, otp) => {
    const html = `
  <div style="font-family: Arial, sans-serif; background:#0d1117; padding:20px; color:#c9d1d9;">
    <div style="max-width:500px; margin:auto; background:#161b22; padding:20px; border-radius:10px; border:1px solid #30363d;">
      
      <h2 style="color:#58a6ff; text-align:center;">🔐 RepoSmart Password Reset</h2>
      
      <p style="font-size:14px;">
        We received a request to reset your password.
      </p>

      <p style="font-size:14px;">
        Use the OTP below to continue:
      </p>

      <div style="text-align:center; margin:20px 0;">
        <span style="
          display:inline-block;
          font-size:24px;
          letter-spacing:5px;
          background:#0d1117;
          padding:12px 20px;
          border-radius:8px;
          border:1px solid #30363d;
          color:#58a6ff;
          font-weight:bold;
        ">
          ${otp}
        </span>
      </div>

      <p style="font-size:12px; color:#8b949e;">
        This OTP is valid for 5 minutes.
      </p>

      <p style="font-size:12px; color:#8b949e;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <hr style="border-color:#30363d; margin:20px 0;" />

      <p style="text-align:center; font-size:12px; color:#6e7681;">
        © RepoSmart
      </p>

    </div>
  </div>
  `;

    await transporter.sendMail({
        from: `"RepoSmart" <${process.env.MAILTRAP_USER}>`,
        to: email,
        subject: "Your OTP for Password Reset",
        html,
    });
};

module.exports = sendOtpEmail;