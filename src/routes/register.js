const express = require('express');
const router = express.Router();
const registerController = require('../controllers/auth/registerController');

router.post('/', registerController.createNewUser);

module.exports = router;