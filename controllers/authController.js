const bcrypt = require('bcryptjs');

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.render('login', { error: 'Preencha todos os campos' });

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.render('login', { error: 'Usuário não encontrado' });
    const user = results[0];
    if (user.is_banned) return res.render('login', { error: 'Conta banida' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render('login', { error: 'Senha incorreta' });

    req.session.user = {
      id: user.id, username: user.username, email: user.email,
      coins: user.coins, is_admin: user.is_admin,
      is_demo: user.is_demo, is_banned: user.is_banned
    };
    if (user.is_admin) return res.redirect('/admin');
    res.redirect('/');
  });
};

exports.register = (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) return res.render('register', { error: 'Preencha todos os campos' });
  if (password !== confirmPassword) return res.render('register', { error: 'Senhas não conferem' });
  if (password.length < 6) return res.render('register', { error: 'Mínimo 6 caracteres' });

  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
    if (results.length > 0) return res.render('register', { error: 'Usuário ou email já existe' });
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (err) => {
      if (err) return res.render('register', { error: 'Erro ao cadastrar' });
      res.redirect('/login?success=Conta criada!');
    });
  });
};

exports.logout = (req, res) => { req.session.destroy(); res.redirect('/'); };
