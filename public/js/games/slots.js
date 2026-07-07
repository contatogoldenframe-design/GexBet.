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

async function playSlots() {
  const betAmount = parseInt(document.getElementById('betAmount').value);
  const btn = document.getElementById('spinBtn');
  const resultDiv = document.getElementById('gameResult');
  const reels = document.querySelectorAll('.slot-reel');

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

  reels.forEach(reel => reel.classList.add('spinning'));

  // Animação rápida de símbolos trocando
  const symbols = ['🍒','🍋','🍊','🍇','🔔','7️⃣','⭐','💎','💰','🎰'];
  const spinInterval = setInterval(() => {
    reels.forEach(reel => {
      reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    });
  }, 80);

  try {
    const res = await fetch('/games/slots/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betAmount })
    });

    const data = await res.json();

    setTimeout(() => {
      clearInterval(spinInterval);
      reels.forEach(reel => reel.classList.remove('spinning'));

      if (data.success) {
        for (let i = 0; i < 5; i++) {
          reels[i].textContent = data.reels[i];
          reels[i].classList.remove('win');
        }

        if (data.winAmount > 0) {
          reels.forEach(reel => reel.classList.add('win'));
          resultDiv.textContent = `🏆 GANHOU R$ ${data.winAmount.toFixed(2)}! (${data.multiplier.toFixed(2)}x)`;
          resultDiv.className = 'game-result win';
        } else {
          resultDiv.textContent = `😞 Perdeu R$ ${betAmount.toFixed(2)}`;
          resultDiv.className = 'game-result lose';
        }

        updateBalance(data.newBalance);
      } else {
        resultDiv.textContent = '❌ ' + (data.error || 'Erro');
        resultDiv.className = 'game-result lose';
      }

      btn.disabled = false;
      btn.textContent = '🎰 GIRAR';
    }, 1000);

  } catch (error) {
    clearInterval(spinInterval);
    reels.forEach(reel => reel.classList.remove('spinning'));
    resultDiv.textContent = '❌ Erro de conexão';
    resultDiv.className = 'game-result lose';
    btn.disabled = false;
    btn.textContent = '🎰 GIRAR';
  }
}
let currentBalance = parseFloat(document.getElementById('balanceDisplay')?.textContent || 0);
let gameActive = false;

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

async function playCrash() {
  if (gameActive) return;
  
  const betAmount = parseInt(document.getElementById('betAmount').value);
  const cashoutAt = parseFloat(document.getElementById('cashoutAt').value);
  const btn = document.getElementById('spinBtn');
  const resultDiv = document.getElementById('gameResult');
  const multiplierDisplay = document.getElementById('multiplierDisplay');
  const canvas = document.getElementById('crashCanvas');
  const ctx = canvas.getContext('2d');

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
  btn.textContent = '✈️ AGUARDANDO...';
  gameActive = true;

  try {
    const res = await fetch('/games/crash/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betAmount, cashoutAt })
    });

    const data = await res.json();

    if (data.success) {
      // Animação do gráfico subindo
      let currentMult = 1.0;
      const crashPoint = data.crashPoint;
      let crashed = false;

      const animInterval = setInterval(() => {
        if (crashed) return;

        currentMult += 0.05;
        multiplierDisplay.textContent = currentMult.toFixed(2) + 'x';

        // Desenhar gráfico
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = currentMult < crashPoint ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 3;
        
        const progress = Math.min(currentMult / crashPoint, 1);
        const x = progress * canvas.width * 0.8 + 50;
        const y = canvas.height - (progress * canvas.height * 0.8) - 20;
        ctx.lineTo(x, y);
        ctx.stroke();

        if (currentMult >= crashPoint) {
          crashed = true;
          clearInterval(animInterval);
          
          if (data.won) {
            resultDiv.textContent = `🏆 GANHOU R$ ${data.winAmount.toFixed(2)}! Cashout em ${data.multiplier.toFixed(2)}x`;
            resultDiv.className = 'game-result win';
          } else {
            resultDiv.textContent = `💥 CRASHOU! O avião caiu em ${crashPoint.toFixed(2)}x`;
            resultDiv.className = 'game-result lose';
          }

          updateBalance(data.newBalance);
          btn.disabled = false;
          btn.textContent = '✈️ APOSTAR';
          gameActive = false;
        }
      }, 50);
    } else {
      resultDiv.textContent = '❌ ' + (data.error || 'Erro');
      resultDiv.className = 'game-result lose';
      btn.disabled = false;
      btn.textContent = '✈️ APOSTAR';
      gameActive = false;
    }
  } catch (error) {
    resultDiv.textContent = '❌ Erro de conexão';
    resultDiv.className = 'game-result lose';
    btn.disabled = false;
    btn.textContent = '✈️ APOSTAR';
    gameActive = false;
  }
}
