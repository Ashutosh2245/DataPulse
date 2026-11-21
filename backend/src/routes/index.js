const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const datasetRoutes = require('./datasetRoutes');
const healthController = require('../controllers/healthController');

// Health endpoint
router.get('/health', healthController.getHealth);

// Auth endpoints (/api/register, /api/login, /api/me)
router.use('/', authRoutes);

// Dataset endpoints (/api/datasets)
router.use('/datasets', datasetRoutes);

module.exports = router;
