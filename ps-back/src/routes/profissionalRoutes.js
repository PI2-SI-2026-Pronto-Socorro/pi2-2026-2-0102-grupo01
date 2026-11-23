const express = require('express');
const rota = require('../middlewares/rota');
const profissionalController = require('../controllers/profissionalController');

const router = express.Router();

router.get('/', rota(profissionalController.findAll));
router.post('/', rota(profissionalController.create));

module.exports = router;
