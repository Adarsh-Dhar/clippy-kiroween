const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const lintRouter = require('./routes/lintRouter');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS middleware
app.use(cors({
  origin: '*'
}));

// Configure body-parser middleware
app.use(bodyParser.json({
  limit: '10mb'
}));

// Register routes
app.use('/', lintRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: err.details || undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Linting server running on port ${PORT}`);
  console.log(`POST /lint endpoint available`);
});

module.exports = app;
