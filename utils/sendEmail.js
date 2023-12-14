const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1- create nodeMailer transporter(define service [gmail])
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2- setup message options
  const mailOptions = {
    from: "kenana <kenenaegp@gmail.com>",
    to: options.email,
    subject: options.subject,
    html: options.html,
  };
  // 3- use transporter.sendmail() to send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
