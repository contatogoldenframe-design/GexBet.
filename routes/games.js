const express = require('express');
const router = express.Router();
const games = require('../controllers/gamesController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', games.listGames);
router.get('/fortune-tiger', isAuthenticated, (req, res) => res.render('game-tiger', { user: req.session.user }));
router.get('/slots', isAuthenticated, (req, res) => res.render('game-slots', { user: req.session.user }));
router.get('/crash', isAuthenticated, (req, res) => res.render('game-crash', { user: req.session.user }));
router.post('/fortune-tiger/play', isAuthenticated, games.playFortuneTiger);
router.post('/slots/play', isAuthenticated, games.playSlots);
router.post('/crash/play', isAuthenticated, games.playCrash);

module.exports = router;
