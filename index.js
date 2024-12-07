require('dotenv').config(); // To read environment variables from a .env file
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 5000;

// Logger setup using winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' })
  ],
});

// CORS configuration for production and development
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL, // Use the FRONTEND_URL from the .env file
    'http://localhost:5173/' // Replace with your actual production front-end domain
  ],
  methods: ['GET', 'POST'], // Allowed HTTP methods
  credentials: true, // Allow cookies or authorization headers if needed
};

// Middleware
app.use(cors(corsOptions)); // Apply the CORS middleware with specific options
app.use(bodyParser.json()); // Parse JSON requests

// Create a Nodemailer transporter for email functionality
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service provider
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or App password
  },
});

// POST endpoint to send email from the contact form
app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    logger.error('Missing required fields: name, email, or message');
    return res.status(400).json({ error: 'All fields are required' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL, // where the email will be sent
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.response}`);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Endpoint to check if the server is running
app.get('/ping', (req, res) => {
  res.status(200).send('Server is up and running!');
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
