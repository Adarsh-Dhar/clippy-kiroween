require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const lintRouter = require('./routes/lintRouter');
const memoryRouter = require('./routes/memoryRouter');
const gameStateRouter = require('./routes/gameStateRouter');
const { checkHealth, checkDatabaseUrl } = require('./utils/prismaClient');

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
app.use('/api/memory', memoryRouter);
app.use('/api/game-state', gameStateRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: err.details || undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Linting server running on port ${PORT}`);
  console.log(`POST /lint endpoint available`);
  
  // Check database connection status on startup
  console.log('\n📊 Database Connection Diagnostics:');
  const dbUrlCheck = checkDatabaseUrl();
  if (dbUrlCheck.isSet) {
    console.log(`✅ DATABASE_URL is set: ${dbUrlCheck.masked}`);
  } else {
    console.log('❌ DATABASE_URL is not set');
    console.log('   Hint: Set DATABASE_URL in your .env file or environment variables');
  }
  
  // Check database health
  try {
    const health = await checkHealth();
    if (health.healthy) {
      console.log('✅ Database connection: Healthy');
    } else {
      console.log(`❌ Database connection: ${health.category || 'Unhealthy'}`);
      console.log(`   Error: ${health.error || health.message || 'Unknown error'}`);
      if (health.hint) {
        console.log(`   Hint: ${health.hint}`);
      }
      console.log('   Note: App will continue in memory-only mode');
    }
  } catch (error) {
    console.error('❌ Failed to check database health:', error.message);
  }
  
  console.log(''); // Empty line for readability
});

module.exports = app;
