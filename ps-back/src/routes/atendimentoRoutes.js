const express = require('express');
const rota = require('../middlewares/rota');
const {
  exigirPerfil, RECEPCAO, ENFERMAGEM, MEDICO, TODOS_OS_PERFIS,
} = require('../middlewares/autenticacao');
const atendimentoController = require('../controllers/atendimentoController');
const triagemController = require('../controllers/triagemController');
const detalhesAtendimentoController = require('../controllers/detalhesAtendimentoController');
const medicacaoController = require('../controllers/medicacaoController');
const confirmacaoAtendimentoController = require('../controllers/confirmacaoAtendimentoController');
const painelAtendimentosController = require('../controllers/painelAtendimentosController');
const altaAtendimentoController = require('../controllers/altaAtendimentoController');

const router = express.Router();

router.post('/', exigirPerfil(RECEPCAO), rota(atendimentoController.create));
router.post('/nao-identificado', exigirPerfil(RECEPCAO), rota(atendimentoController.abrirNaoIdentificado));
router.get('/', exigirPerfil(RECEPCAO), rota(atendimentoController.findByCpf));
router.get('/abertos', exigirPerfil(RECEPCAO, ENFERMAGEM), rota(atendimentoController.findAbertos));
router.get('/triados', exigirPerfil(MEDICO), rota(atendimentoController.findTriados));
router.get('/painel', exigirPerfil(...TODOS_OS_PERFIS), rota(painelAtendimentosController.findPainel));
router.get('/confirmados', exigirPerfil(MEDICO), rota(altaAtendimentoController.listarConfirmados));
router.get('/:numero', exigirPerfil(...TODOS_OS_PERFIS), rota(atendimentoController.findByNumero));
router.get('/:numero/detalhes', exigirPerfil(...TODOS_OS_PERFIS), rota(detalhesAtendimentoController.findDetalhes));
router.patch('/:numero', exigirPerfil(RECEPCAO), rota(atendimentoController.alterar));
router.patch('/:numero/cancelar', exigirPerfil(RECEPCAO), rota(atendimentoController.cancelar));
router.post('/:numero/triagem', exigirPerfil(ENFERMAGEM), rota(triagemController.create));
router.post('/:numero/reserva', exigirPerfil(MEDICO), rota(atendimentoController.reservar));
router.post('/:numero/medicacoes', exigirPerfil(MEDICO), rota(medicacaoController.create));
router.post('/:numero/confirmacao', exigirPerfil(MEDICO), rota(confirmacaoAtendimentoController.confirmarAtendimento));
router.post('/:numero/alta', exigirPerfil(MEDICO), rota(altaAtendimentoController.darAlta));

module.exports = router;
