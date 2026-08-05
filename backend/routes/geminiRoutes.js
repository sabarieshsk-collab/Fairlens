const express = require('express');
const { testGemini } = require('../controllers/geminiController');
const router = express.Router();

router.get('/', testGemini);
router.post('/', testGemini);
router.get('/test', testGemini);
router.post('/test', testGemini);

module.exports = router;
