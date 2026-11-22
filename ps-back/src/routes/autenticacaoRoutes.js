const express = require('express');
const rota = require('../middlewares/rota');
const { exigirLogin } = require('../middlewares/autenticacao');
const autenticacaoController = require('../controllers/autenticacaoController');

const router = express.Router();

router.post('/login', rota(autenticacaoController.login));
router.get('/eu', exigirLogin, rota(autenticacaoController.eu));

module.exports = router;
