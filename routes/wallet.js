const express = require('express');
const router = express.Router();
const wallet = require('../controllers/walletController');
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

router.get('/deposit', isAuthenticated, (req, res) => res.render('deposit', { error: null, qrcode: null, payload: null, reference: null, amount: null, user: req.session.user }));
router.post('/deposit/generate', isAuthenticated, wallet.generateDeposit);
router.get('/withdraw', isAuthenticated, (req, res) => res.render('withdraw', { error: null, success: null, user: req.session.user }));
router.post('/withdraw/request', isAuthenticated, wallet.requestWithdraw);
router.post('/admin/confirm-deposit', isAuthenticated, isAdmin, wallet.confirmDeposit);
router.post('/admin/approve-withdraw', isAuthenticated, isAdmin, wallet.approveWithdraw);

module.exports = router;
