exports.dashboard = (req, res) => {
  db.query('SELECT COUNT(*) as total_users, SUM(total_deposited) as total_deposits, SUM(total_withdrawn) as total_withdraws, SUM(total_bet) as total_bets, SUM(total_won) as total_wins FROM users', (err, stats) => {
    db.query('SELECT COUNT(*) as pending_deposits FROM transactions WHERE type = "deposit" AND status = "pending"', (err2, pd) => {
      db.query('SELECT COUNT(*) as pending_withdraws FROM transactions WHERE type = "withdraw" AND status = "pending"', (err3, pw) => {
        res.render('admin/dashboard', {
          user: req.session.user,
          stats: stats[0],
          pending_deposits: pd[0].pending_deposits,
          pending_withdraws: pw[0].pending_withdraws
        });
      });
    });
  });
};

exports.users = (req, res) => {
  db.query('SELECT id, username, email, coins, total_deposited, total_withdrawn, total_bet, total_won, is_admin, is_banned, is_demo, created_at FROM users ORDER BY id DESC', (err, users) => {
    res.render('admin/users', { user: req.session.user, users });
  });
};

exports.banUser = (req, res) => {
  const { userId } = req.body;
  db.query('UPDATE users SET is_banned = NOT is_banned WHERE id = ?', [userId]);
  db.query('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.session.user.id, 'toggle_ban', `Alternou ban do usuário #${userId}`]);
  res.json({ success: true });
};

exports.transactions = (req, res) => {
  db.query('SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC', (err, transactions) => {
    res.render('admin/transactions', { user: req.session.user, transactions });
  });
};

exports.finances = (req, res) => {
  db.query('SELECT SUM(total_deposited) as total_in, SUM(total_withdrawn) as total_out FROM users', (err, totals) => {
    db.query('SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.status = "pending" ORDER BY t.created_at DESC', (err2, pending) => {
      res.render('admin/finances', {
        user: req.session.user,
        total_in: totals[0].total_in || 0,
        total_out: totals[0].total_out || 0,
        balance: (totals[0].total_in || 0) - (totals[0].total_out || 0),
        pending
      });
    });
  });
};

exports.gamesConfig = (req, res) => {
  db.query('SELECT * FROM settings WHERE setting_key LIKE "%rtp%" OR setting_key = "games_blocked"', (err, settings) => {
    res.render('admin/games-config', { user: req.session.user, settings });
  });
};

exports.updateSettings = (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    db.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
  }
  res.json({ success: true, message: 'Configurações salvas!' });
};

exports.supportMessages = (req, res) => {
  db.query('SELECT sm.*, u.username FROM support_messages sm JOIN users u ON sm.user_id = u.id ORDER BY sm.created_at DESC', (err, messages) => {
    res.render('admin/support', { user: req.session.user, messages });
  });
};

exports.respondSupport = (req, res) => {
  const { messageId, response } = req.body;
  db.query('UPDATE support_messages SET response = ?, is_responded = TRUE, is_read = TRUE WHERE id = ?', [response, messageId]);
  res.json({ success: true });
};

exports.settings = (req, res) => {
  db.query('SELECT * FROM settings', (err, settings) => {
    res.render('admin/settings', { user: req.session.user, settings });
  });
};

exports.adminLogs = (req, res) => {
  db.query('SELECT al.*, u.username FROM admin_logs al JOIN users u ON al.admin_id = u.id ORDER BY al.created_at DESC LIMIT 100', (err, logs) => {
    res.render('admin/logs', { user: req.session.user, logs });
  });
};
