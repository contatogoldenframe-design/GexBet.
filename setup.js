require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('═══════════════════════════════════════');
console.log('  🎰 GEXBET - INSTALAÇÃO');
console.log('═══════════════════════════════════════');

async function setup() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const demoPassword = await bcrypt.hash('gexbet123', 10);

    const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Criar banco
    db.query('CREATE DATABASE IF NOT EXISTS gexbet');
    db.query('USE gexbet');

    // Ler schema
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    const statements = schema.split(';').filter(s => s.trim());

    for (const stmt of statements) {
      db.query(stmt);
    }

    console.log('✅ Banco de dados criado!');
    console.log('✅ Tabelas criadas!');
    console.log('✅ Admin criado: admin / admin123');
    console.log('✅ Demo criada: gexbet_demo / gexbet123');
    console.log('');
    console.log('📌 NÃO ESQUEÇA DE EDITAR O .env:');
    console.log('   - Coloque sua chave PIX em ADMIN_PIX_KEY');
    console.log('   - Coloque seu nome em ADMIN_PIX_NAME');
    console.log('   - Coloque sua cidade em ADMIN_PIX_CITY');
    console.log('');
    console.log('▶️  Para iniciar: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

setup();
