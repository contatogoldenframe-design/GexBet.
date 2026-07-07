const { QrCodePix } = require('qrcode-pix');

exports.generateDeposit = (req, res) => {
  const { amount } = req.body;
  const userId = req.session.user.id;
  if (!amount || amount < process.env.MIN_DEPOSIT) {
    return res.render('deposit', { error: `Mínimo R$ ${process.env.MIN_DEPOSIT}`, qrcode: null, payload: null, reference: null, amount: null, user: req.session.user });
  }
  const ref = `DEP${userId}${Date.now()}`;
  const pix = QrCodePix({
    version: '01', key: process.env.ADMIN_PIX_KEY, name: process.env.ADMIN_PIX_NAME,
    city: process.env.ADMIN_PIX_CITY, transactionId: ref.substring(0, 25),
    message: `Deposito GexBet #${ref}`, value: parseFloat(amount), cep: '00000000'
  });
  const payload = pix.payload();
  const qrcode = pix.base64();

  db.query('INSERT INTO transactions (user_id, type, amount, status, pix_key, pix_qrcode, pix_payload, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, 'deposit', amount, 'pending', process.env.ADMIN_PIX_KEY, qrcode, payload, ref, `Depósito R$ ${amount}`], (err) => {
      if (err) return res.render('deposit', { error: 'Erro ao gerar', qrcode: null, payload: null, reference: null, amount: null, user: req.session.user });
      res.render('deposit', { error: null, qrcode, payload, reference: ref, amount, user: req.session.user });
    });
};

exports.confirmDeposit = (req, res) => {
  const { transactionId } = req.body;
  const adminId = req.session.user.id;
  db.query('SELECT * FROM transactions WHERE id = ? AND type = "deposit" AND status = "pending"', [transactionId], (err, results) => {
    if (err || results.length === 0) return res.json({ error: 'Não encontrada' });
    const t = results[0];
    const coins = t.amount * parseFloat(process.env.COIN_RATE);
    db.query('UPDATE users SET coins = coins + ?, total_deposited = total_deposited + ? WHERE id = ?', [coins, t.amount, t.user_id]);
    db.query('UPDATE transactions SET status = "completed" WHERE id = ?', [transactionId]);
    db.query('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [adminId, 'confirm_deposit', `Confirmou depósito #${transactionId} R$ ${t.amount}`]);
    res.json({ success: true, message: 'Depósito confirmado!' });
  });
};

exports.requestWithdraw = (req, res) => {
  const userId = req.session.user.id;
  const { amount, pixKey } = req.body;
  const minW = parseFloat(process.env.MIN_WITHDRAW);
  const maxW = parseFloat(process.env.MAX_WITHDRAW);
  if (!amount || !pixKey) return res.render('withdraw', { error: 'Preencha tudo', user: req.session.user });
  if (amount < minW) return res.render('withdraw', { error: `Mínimo R$ ${minW}`, user: req.session.user });
  if (amount > maxW) return res.render('withdraw', { error: `Máximo R$ ${maxW}`, user: req.session.user });

  db.query('SELECT coins FROM users WHERE id = ?', [userId], (err, results) => {
    if (results[0].coins < amount) return res.render('withdraw', { error: 'Saldo insuficiente', user: req.session.user });
    db.query('INSERT INTO transactions (user_id, type, amount, status, pix_key, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, 'withdraw', amount, 'pending', pixKey, `SAQ${userId}${Date.now()}`, `Saque R$ ${amount}`], (err) => {
        if (err) return res.render('withdraw', { error: 'Erro', user: req.session.user });
        db.query('UPDATE users SET coins = coins - ? WHERE id = ?', [amount, userId]);
        res.render('withdraw', { error: null, success: `Saque R$ ${amount} solicitado!`, user: req.session.user });
      });
  });
};

exports.approveWithdraw = (req, res) => {
  const { transactionId } = req.body;
  const adminId = req.session.user.id;
  db.query('SELECT * FROM transactions WHERE id = ? AND type = "withdraw" AND status = "pending"', [transactionId], (err, results) => {
    if (err || results.length === 0) return res.json({ error: 'Não encontrada' });
    const t = results[0];
    db.query('UPDATE transactions SET status = "completed" WHERE id = ?', [transactionId]);
    db.query('UPDATE users SET total_withdrawn = total_withdrawn + ? WHERE id = ?', [t.amount, t.user_id]);
    db.query('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [adminId, 'approve_withdraw', `Aprovou saque #${transactionId} R$ ${t.amount} PIX: ${t.pix_key}`]);
    res.json({ success: true, message: 'Saque aprovado!', pixKey: t.pix_key, amount: t.amount });
  });
};
