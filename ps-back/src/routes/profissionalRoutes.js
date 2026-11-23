const express = require('express');
const rota = require('../middlewares/rota');
const { exigirPerfil, TODOS_OS_PERFIS } = require('../middlewares/autenticacao');
const profissionalController = require('../controllers/profissionalController');

const router = express.Router();

router.get('/', exigirPerfil(...TODOS_OS_PERFIS), rota(profissionalController.findAll));
router.post('/', rota(profissionalController.create));

module.exports = router;
