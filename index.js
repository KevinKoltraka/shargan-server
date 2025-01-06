require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const winston = require("winston");

const app = express();
const port = process.env.PORT || 5000;

// Logger setup using winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    "https://sharganconsulting.com",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST endpoint to send email
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    logger.error("Missing required fields: name, email, or message");
    return res.status(400).json({ error: "All fields are required" });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.response}`);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

// Health check
app.get("/ping", (req, res) => {
  res.status(200).send("Server is up and running!");
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
