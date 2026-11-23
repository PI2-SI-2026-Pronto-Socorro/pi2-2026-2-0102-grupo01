const express = require('express');
const rota = require('../middlewares/rota');
const { exigirPerfil, RECEPCAO } = require('../middlewares/autenticacao');
const pacienteController = require('../controllers/pacienteController');

const router = express.Router();

router.get('/', exigirPerfil(RECEPCAO), rota(pacienteController.findAll));
router.post('/', exigirPerfil(RECEPCAO), rota(pacienteController.create));
router.get('/:cpf', exigirPerfil(RECEPCAO), rota(pacienteController.findByCpf));

module.exports = router;
