const express = require('express');
const rota = require('../middlewares/rota');
const pacienteController = require('../controllers/pacienteController');

const router = express.Router();

router.get('/', rota(pacienteController.findAll));
router.get('/:cpf', rota(pacienteController.findOne));
router.post('/', rota(pacienteController.create));

module.exports = router;
