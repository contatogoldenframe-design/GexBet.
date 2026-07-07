require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function seed() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const demoPassword = await bcrypt.hash('gexbet123', 10);

    db.query(`INSERT IGNORE INTO users (username, email, password, coins, is_admin) VALUES (?, ?, ?, 0, 1)`,
      ['admin', 'admin@gexbet.com', adminPassword]);

    db.query(`INSERT IGNORE INTO users (username, email, password, coins, is_demo) VALUES (?, ?, ?, 10000, 1)`,
      ['gexbet_demo', 'demo@gexbet.com', demoPassword]);

    console.log('✅ Seed concluído!');
    console.log('👑 Admin: admin / admin123');
    console.log('🎬 Demo: gexbet_demo / gexbet123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}
seed();
