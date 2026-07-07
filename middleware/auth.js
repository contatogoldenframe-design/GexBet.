function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

function isNotBanned(req, res, next) {
  if (req.session.user && req.session.user.is_banned) {
    return res.render('error', { message: 'Conta banida. Contate o suporte.', user: null });
  }
  next();
}

module.exports = { isAuthenticated, isNotBanned };
