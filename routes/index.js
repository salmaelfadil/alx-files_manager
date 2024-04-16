const express = require('express');

const router = express.Router();
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
// const FilesController = require('../controllers/FilesController.js');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UserController.postNew);
router.get('/users/me', UserController.getMe);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
// router.post('/files', FilesController.postUpload);

module.exports = router;
