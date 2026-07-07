class SeededRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  chance(prob) { return this.next() < prob; }
}

exports.playFortuneTiger = (req, res) => {
  const userId = req.session.user.id;
  const { betAmount } = req.body;
  const isDemo = req.session.user.is_demo || false;
  if (!betAmount || betAmount <= 0) return res.json({ error: 'Aposta inválida' });

  db.query('SELECT setting_value FROM settings WHERE setting_key = "tiger_rtp"', (err, settings) => {
    const rtp = parseFloat(settings[0]?.setting_value || 95) / 100;
    db.query('SELECT coins FROM users WHERE id = ?', [userId], (err, results) => {
      if (results[0].coins < betAmount) return res.json({ error: 'Saldo insuficiente' });

      const rng = new SeededRNG(userId * Date.now() * Math.floor(Math.random() * 10000));
      const symbols = ['🐯','🐱','🐉','👑','⭐','💎','🍀','🔔','💰','7️⃣'];
      const weights = [2,5,8,3,10,4,12,15,20,1];
      const grid = [];
      let winMultiplier = 0;

      for (let row = 0; row < 3; row++) {
        const rowSymbols = [];
        for (let col = 0; col < 3; col++) {
          const totalW = weights.reduce((a,b) => a+b, 0);
          let rw = rng.range(1, totalW);
          let si = 0;
          for (let i = 0; i < weights.length; i++) { rw -= weights[i]; if (rw <= 0) { si = i; break; } }
          rowSymbols.push(si);
        }
        grid.push(rowSymbols);
      }

      const paylines = [[[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],[[0,0],[1,1],[2,2]],[[0,2],[1,1],[2,0]]];
      const payouts = [50,10,8,30,5,15,3,2,1.5,100];

      for (const pl of paylines) {
        const s1 = grid[pl[0][0]][pl[0][1]];
        const s2 = grid[pl[1][0]][pl[1][1]];
        const s3 = grid[pl[2][0]][pl[2][1]];
        if (s1 === s2 && s2 === s3) winMultiplier += payouts[s1];
      }

      if (!isDemo && rng.next() > rtp) winMultiplier = 0;

      let winAmount = betAmount * winMultiplier;
      if (isDemo) {
        winAmount = rng.range(parseFloat(process.env.DEMO_MIN_WIN || 10), parseFloat(process.env.DEMO_MAX_WIN || 200));
      }

      const net = winAmount - betAmount;
      db.query('UPDATE users SET coins = coins + ?, total_bet = total_bet + ?, total_won = total_won + ? WHERE id = ?', [net, betAmount, winAmount, userId]);
      const gd = grid.map(r => r.map(i => symbols[i]));
      db.query('INSERT INTO game_sessions (user_id, game_type, bet_amount, win_amount, multiplier, result, is_demo) VALUES (?,?,?,?,?,?,?)',
        [userId, 'fortune_tiger', betAmount, winAmount, winMultiplier, JSON.stringify(gd), isDemo]);

      res.json({ success: true, grid: gd, winAmount, multiplier: winMultiplier, newBalance: results[0].coins + net, isDemo });
    });
  });
};

exports.playSlots = (req, res) => {
  const userId = req.session.user.id;
  const { betAmount } = req.body;
  const isDemo = req.session.user.is_demo || false;
  if (!betAmount || betAmount <= 0) return res.json({ error: 'Aposta inválida' });

  db.query('SELECT setting_value FROM settings WHERE setting_key = "slots_rtp"', (err, settings) => {
    const rtp = parseFloat(settings[0]?.setting_value || 92) / 100;
    db.query('SELECT coins FROM users WHERE id = ?', [userId], (err, results) => {
      if (results[0].coins < betAmount) return res.json({ error: 'Saldo insuficiente' });

      const rng = new SeededRNG(userId * Date.now() * Math.floor(Math.random() * 10000));
      const syms = ['🍒','🍋','🍊','🍇','🔔','7️⃣','⭐','💎','💰','🎰'];
      const reels = [];
      for (let i = 0; i < 5; i++) reels.push(rng.range(0, syms.length - 1));

      let winMultiplier = 0;
      const count = {};
      for (const s of reels) count[s] = (count[s] || 0) + 1;
      const payouts = [2,3,5,8,10,20,30,50,100,200];
      for (const [s, c] of Object.entries(count)) if (c >= 3) winMultiplier += payouts[parseInt(s)] * (c - 2);

      if (!isDemo && rng.next() > rtp && winMultiplier > 0) winMultiplier = Math.max(0, winMultiplier - 1);

      let winAmount = betAmount * winMultiplier;
      if (isDemo) winAmount = rng.range(parseFloat(process.env.DEMO_MIN_WIN || 10), parseFloat(process.env.DEMO_MAX_WIN || 200));

      const net = winAmount - betAmount;
      db.query('UPDATE users SET coins = coins + ?, total_bet = total_bet + ?, total_won = total_won + ? WHERE id = ?', [net, betAmount, winAmount, userId]);
      const dr = reels.map(i => syms[i]);
      db.query('INSERT INTO game_sessions (user_id, game_type, bet_amount, win_amount, multiplier, result, is_demo) VALUES (?,?,?,?,?,?,?)',
        [userId, 'slots', betAmount, winAmount, winMultiplier, JSON.stringify(dr), isDemo]);

      res.json({ success: true, reels: dr, winAmount, multiplier: winMultiplier, newBalance: results[0].coins + net, isDemo });
    });
  });
};

exports.playCrash = (req, res) => {
  const userId = req.session.user.id;
  const { betAmount, cashoutAt } = req.body;
  const isDemo = req.session.user.is_demo || false;
  if (!betAmount || betAmount <= 0) return res.json({ error: 'Aposta inválida' });

  db.query('SELECT setting_value FROM settings WHERE setting_key = "crash_rtp"', (err, settings) => {
    const rtp = parseFloat(settings[0]?.setting_value || 90) / 100;
    db.query('SELECT coins FROM users WHERE id = ?', [userId], (err, results) => {
      if (results[0].coins < betAmount) return res.json({ error: 'Saldo insuficiente' });

      const rng = new SeededRNG(userId * Date.now() * Math.floor(Math.random() * 10000));
      let crashPoint;

      if (isDemo) {
        crashPoint = (cashoutAt || 1) + rng.range(1, 50) / 10;
      } else {
        const cc = rng.next();
        if (cc < 0.3) crashPoint = 1.0 + rng.next() * 0.5;
        else if (cc < 0.6) crashPoint = 1.5 + rng.next() * 1.5;
        else if (cc < 0.85) crashPoint = 3.0 + rng.next() * 5.0;
        else crashPoint = 8.0 + rng.next() * 20.0;
        if (rng.next() > rtp) crashPoint = 1.0 + rng.next() * 0.2;
      }

      let winMultiplier = 0;
      let won = false;
      if (cashoutAt && cashoutAt < crashPoint) { winMultiplier = cashoutAt; won = true; }

      if (isDemo) {
        const dw = rng.range(parseFloat(process.env.DEMO_MIN_WIN || 10), parseFloat(process.env.DEMO_MAX_WIN || 200));
        winMultiplier = dw / betAmount;
        crashPoint = winMultiplier + 0.5;
        won = true;
      }

      const winAmount = betAmount * winMultiplier;
      const net = winAmount - betAmount;
      db.query('UPDATE users SET coins = coins + ?, total_bet = total_bet + ?, total_won = total_won + ? WHERE id = ?', [net, betAmount, winAmount, userId]);
      db.query('INSERT INTO game_sessions (user_id, game_type, bet_amount, win_amount, multiplier, result, is_demo) VALUES (?,?,?,?,?,?,?)',
        [userId, 'crash', betAmount, winAmount, winMultiplier, JSON.stringify({ crashPoint, won, cashoutAt }), isDemo]);

      res.json({ success: true, crashPoint, winAmount, multiplier: winMultiplier, won, newBalance: results[0].coins + net, isDemo });
    });
  });
};

exports.listGames = (req, res) => {
  const games = [
    { id: 'fortune-tiger', name: 'Fortune Tiger', image: '/assets/images/tiger.png', minBet: 1 },
    { id: 'slots', name: 'Caça Níqueis', image: '/assets/images/slots.png', minBet: 1 },
    { id: 'crash', name: 'Crash (Aviator)', image: '/assets/images/crash.png', minBet: 1 }
  ];
  res.render('games', { games, user: req.session.user, games_blocked: false });
};
