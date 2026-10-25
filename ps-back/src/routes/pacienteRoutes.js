const express = require('express');
const rota = require('../middlewares/rota');
const pacienteController = require('../controllers/pacienteController');

const router = express.Router();

router.get('/', rota(pacienteController.listar));
router.get('/:cpf', rota(pacienteController.buscarPorCpf));
router.post('/', rota(pacienteController.criar));

module.exports = router;
