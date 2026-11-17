const express = require('express');
const rota = require('../middlewares/rota');
const atendimentoController = require('../controllers/atendimentoController');
const triagemController = require('../controllers/triagemController');
const detalhesAtendimentoController = require('../controllers/detalhesAtendimentoController');
const medicacaoController = require('../controllers/medicacaoController');
const confirmacaoAtendimentoController = require('../controllers/confirmacaoAtendimentoController');
const painelAtendimentosController = require('../controllers/painelAtendimentosController');
const altaAtendimentoController = require('../controllers/altaAtendimentoController');

const router = express.Router();

router.post('/', rota(atendimentoController.create));
router.get('/', rota(atendimentoController.findByCpf));
router.get('/abertos', rota(atendimentoController.findAbertos));
router.get('/triados', rota(atendimentoController.findTriados));
router.get('/painel', rota(painelAtendimentosController.findPainel));
router.get('/confirmados', rota(altaAtendimentoController.listarConfirmados));
router.get('/:numero', rota(atendimentoController.findByNumero));
router.get('/:numero/detalhes', rota(detalhesAtendimentoController.findDetalhes));
router.patch('/:numero', rota(atendimentoController.alterar));
router.patch('/:numero/cancelar', rota(atendimentoController.cancelar));
router.post('/:numero/triagem', rota(triagemController.create));
router.post('/:numero/medicacoes', rota(medicacaoController.create));
router.post('/:numero/confirmacao', rota(confirmacaoAtendimentoController.confirmarAtendimento));
router.post('/:numero/alta', rota(altaAtendimentoController.darAlta));

module.exports = router;
