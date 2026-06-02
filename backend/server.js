require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
// Operate against a simple JSON file by default. MongoDB is only used when a
// MONGODB_URI is explicitly provided AND file-DB mode isn't forced. This makes
// a fresh clone (`npm install && npm start`) work out of the box with no
// database setup — the API routes read/write the JSON files under /data.
const useFileDb = process.env.USE_FILE_DB === 'true' || !process.env.MONGODB_URI;
if (useFileDb) {
  console.log('✅ Running in file-DB mode (JSON storage under /data); MongoDB connection skipped');
} else {
  // Database connection
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));
}

// Serve the static frontend from the repo root (one origin for site + API).
// The frontend HTML/CSS/JS live one level up from /backend.
const path = require('path');

// Never expose the backend folder over HTTP — that includes server source and
// the runtime JSON store (backend/data/*.json holds users + password hashes).
// (express.static already ignores dotfiles like .env / .git by default.)
app.use('/backend', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Static frontend (index.html, *.html, config.js, main.js, resources/, ...)
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/verification', require('./routes/verification')); // account verification endpoints
app.use('/api/dashboard', require('./routes/dashboard')); // protected dashboard route

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${useFileDb ? 'file-DB (JSON under /data)' : 'MongoDB ' + process.env.MONGODB_URI}`);
});
