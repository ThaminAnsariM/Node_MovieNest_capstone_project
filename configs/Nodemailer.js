import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, body }) => {
  const response = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });
  return response;
};

export default sendEmail;

