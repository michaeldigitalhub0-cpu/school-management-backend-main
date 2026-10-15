
const router = require('express').Router();

const { validateSchema } = require('../middleware/validate');
const { refreshAccessToken, validateToken } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');
const { loginSchema } = require('../request_schemas/Auth');

router.post('/login', validateSchema(loginSchema), authController.login);
router.get('/me', validateToken, authController.getLoggedIn)
router.post('/refresh', refreshAccessToken);
router.post('/logout', authController.logout);

module.exports = router;