const express = require('express');
const healthController = require('../controllers/healthController');
const pacienteRoutes = require('./pacienteRoutes');
const atendimentoRoutes = require('./atendimentoRoutes');

const router = express.Router();

router.get('/health', healthController.check);
router.use('/pacientes', pacienteRoutes);
router.use('/atendimentos', atendimentoRoutes);

module.exports = router;
