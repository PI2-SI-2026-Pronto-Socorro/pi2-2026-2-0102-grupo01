const express = require('express');
const rota = require('../middlewares/rota');
const atendimentoController = require('../controllers/atendimentoController');

const router = express.Router();

router.post('/', rota(atendimentoController.create));
router.get('/', rota(atendimentoController.findByCpf));
router.get('/abertos', rota(atendimentoController.findAbertos));
router.get('/triados', rota(atendimentoController.findTriados));
router.get('/painel', rota(atendimentoController.painel));
router.get('/:numero', rota(atendimentoController.findByNumero));
router.patch('/:numero', rota(atendimentoController.alterar));
router.patch('/:numero/cancelar', rota(atendimentoController.cancelar));

module.exports = router;
