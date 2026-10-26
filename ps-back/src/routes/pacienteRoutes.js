const express = require('express');
const rota = require('../middlewares/rota');
const pacienteController = require('../controllers/pacienteController');

const router = express.Router();

router.get('/', rota(pacienteController.findAll));
router.post('/', rota(pacienteController.create));
router.get('/:cpf', rota(pacienteController.findByCpf));

module.exports = router;
