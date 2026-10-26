const express = require('express');
const rota = require('../middlewares/rota');
const atendimentoController = require('../controllers/atendimentoController');

const router = express.Router();

router.post('/', rota(atendimentoController.create));
router.get('/', rota(atendimentoController.findByCpf));
router.get('/:numero', rota(atendimentoController.findByNumero));

module.exports = router;
