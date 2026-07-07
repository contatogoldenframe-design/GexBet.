// Funções globais do site
console.log('🎰 GexBet carregado!');

// Atualizar saldo periodicamente
if (document.querySelector('.coins')) {
  setInterval(async () => {
    try {
      const res = await fetch('/wallet/balance');
      const data = await res.json();
      if (data.coins !== undefined) {
        document.querySelectorAll('.coins').forEach(el => {
          el.textContent = `💰 ${data.coins.toFixed(2)} coins`;
        });
      }
    } catch (e) {
      // Ignorar erros
    }
  }, 30000);
}
