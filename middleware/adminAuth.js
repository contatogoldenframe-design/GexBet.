function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) return next();
  res.redirect('/login');
}
module.exports = { isAdmin };
