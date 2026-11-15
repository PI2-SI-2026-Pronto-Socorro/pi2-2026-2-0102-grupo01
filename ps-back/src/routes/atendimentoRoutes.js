const express = require('express');
const rota = require('../middlewares/rota');
const atendimentoController = require('../controllers/atendimentoController');
const triagemController = require('../controllers/triagemController');
const detalhesAtendimentoController = require('../controllers/detalhesAtendimentoController');
const medicacaoController = require('../controllers/medicacaoController');
const confirmacaoAtendimentoController = require('../controllers/confirmacaoAtendimentoController');

const router = express.Router();

router.post('/', rota(atendimentoController.create));
router.get('/', rota(atendimentoController.findByCpf));
router.get('/abertos', rota(atendimentoController.findAbertos));
router.get('/:numero', rota(atendimentoController.findByNumero));
router.get('/:numero/detalhes', rota(detalhesAtendimentoController.findDetalhes));
router.post('/:numero/triagem', rota(triagemController.create));
router.post('/:numero/medicacoes', rota(medicacaoController.create));
router.post('/:numero/confirmacao', rota(confirmacaoAtendimentoController.confirmar));

module.exports = router;
