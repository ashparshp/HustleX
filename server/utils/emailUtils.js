const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
};

// Send email verification
const sendVerificationEmail = async (user, verificationUrl) => {
  const html = `
    <h1>Verify Your Email Address</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
    <p>If you did not request this verification, please ignore this email.</p>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({
    email: user.email,
    subject: "Email Verification",
    html,
  });
};

// Send password reset email
const sendResetPasswordEmail = async (user, resetToken) => {
  const resetUrl = `${resetToken}`;

  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you didn't request this, ignore this email.</p>
  `;

  await sendEmail({
    email: user.email,
    subject: "Password Reset",
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
};
