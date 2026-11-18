const express = require('express');
const rota = require('../middlewares/rota');
const profissionalController = require('../controllers/profissionalController');

const router = express.Router();

router.get('/', rota(profissionalController.findAll));

module.exports = router;
