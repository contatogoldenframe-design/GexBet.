exports.sendMessage = (req, res) => {
  const userId = req.session.user.id;
  const { message } = req.body;
  if (!message) return res.json({ error: 'Mensagem vazia' });

  db.query('INSERT INTO support_messages (user_id, message) VALUES (?, ?)', [userId, message], (err) => {
    if (err) return res.json({ error: 'Erro ao enviar' });
    res.json({ success: true, message: 'Mensagem enviada!' });
  });
};

exports.myMessages = (req, res) => {
  const userId = req.session.user.id;
  db.query('SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, messages) => {
    res.render('support', { user: req.session.user, messages });
  });
};
