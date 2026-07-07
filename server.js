require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ ERRO FATAL - MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ MySQL conectado');
});
global.db = db;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');

app.use('/auth', authRoutes);
app.use('/games', gameRoutes);
app.use('/wallet', walletRoutes);
app.use('/admin', adminRoutes);
app.use('/support', supportRoutes);

app.get('/', (req, res) => {
  res.render('index', { 
    user: req.session.user || null,
    games_blocked: false
  });
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

io.on('connection', (socket) => {
  console.log('🎮 Conectado:', socket.id);
  socket.on('join_game', (data) => socket.join(`game_${data.gameId}`));
  socket.on('crash_bet', (data) => io.to('game_crash').emit('crash_update', data));
  socket.on('disconnect', () => console.log('🚫 Desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log('  🎰 GEXBET - RODANDO');
  console.log('═══════════════════════════════════════');
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log(`  👑 Admin: http://localhost:${PORT}/admin`);
  console.log('═══════════════════════════════════════');
});
