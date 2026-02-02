const express = require('express');
const router = express.Router();
const { login, register, refresh, logout } = require('./authController');
const { validateRegister } = require('../../middleware/validation');

router.post('/login', login);
router.post('/register', validateRegister, register);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
