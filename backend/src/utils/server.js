const express = require('express');
const router = require('./router');
const { errorHandler } = require('../middleware/error');
const { PORT } = require('../config/env');

const app = express();
app.use(express.json());

// Mount API routes
app.use('/api', router);

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
