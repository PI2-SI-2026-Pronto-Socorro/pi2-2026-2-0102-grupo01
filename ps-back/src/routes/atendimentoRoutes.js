const express = require('express');
const rota = require('../middlewares/rota');
const atendimentoController = require('../controllers/atendimentoController');

const router = express.Router();

router.post('/', rota(atendimentoController.criar));

module.exports = router;
