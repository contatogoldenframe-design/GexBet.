let currentBalance = parseFloat(document.getElementById('balanceDisplay')?.textContent || 0);

function changeBet(delta) {
  const input = document.getElementById('betAmount');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  input.value = val;
}

function updateBalance(amount) {
  currentBalance = amount;
  const display = document.getElementById('balanceDisplay');
  if (display) display.textContent = amount.toFixed(2);
}

async function playTiger() {
  const betAmount = parseInt(document.getElementById('betAmount').value);
  const btn = document.getElementById('spinBtn');
  const resultDiv = document.getElementById('gameResult');
  const grid = document.querySelectorAll('.tiger-cell');

  if (!betAmount || betAmount < 1) {
    resultDiv.textContent = '⚠️ Valor mínimo: 1 coin';
    resultDiv.className = 'game-result lose';
    return;
  }

  if (betAmount > currentBalance) {
    resultDiv.textContent = '❌ Saldo insuficiente!';
    resultDiv.className = 'game-result lose';
    return;
  }

  btn.disabled = true;
  btn.textContent = '🎰 GIRANDO...';

  // Animação de giro
  grid.forEach(cell => cell.classList.add('spinning'));

  try {
    const res = await fetch('/games/fortune-tiger/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betAmount })
    });

    const data = await res.json();

    // Parar animação
    setTimeout(() => {
      grid.forEach(cell => cell.classList.remove('spinning'));

      if (data.success) {
        // Atualizar grid
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const cell = document.getElementById(`cell${row}${col}`);
            cell.textContent = data.grid[row][col];
            cell.classList.remove('win');
          }
        }

        // Destacar linhas vencedoras
        if (data.winAmount > 0) {
          // Destacar todas as células (simplificado)
          grid.forEach(cell => cell.classList.add('win'));
          resultDiv.textContent = `🏆 GANHOU R$ ${data.winAmount.toFixed(2)}! (${data.multiplier.toFixed(2)}x)`;
          resultDiv.className = 'game-result win';
        } else {
          resultDiv.textContent = `😞 Perdeu R$ ${betAmount.toFixed(2)}`;
          resultDiv.className = 'game-result lose';
        }

        updateBalance(data.newBalance);
      } else {
        resultDiv.textContent = '❌ ' + (data.error || 'Erro ao jogar');
        resultDiv.className = 'game-result lose';
      }

      btn.disabled = false;
      btn.textContent = '🎰 GIRAR';
    }, 800);

  } catch (error) {
    resultDiv.textContent = '❌ Erro de conexão';
    resultDiv.className = 'game-result lose';
    btn.disabled = false;
    btn.textContent = '🎰 GIRAR';
  }
}
