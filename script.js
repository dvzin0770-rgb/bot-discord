fetch('https://raw.githubusercontent.com/dvzin0770-rgb/bot-discord/main/ranking.json')
  .then(res => res.json())
  .then(data => {
    const rankingDiv = document.getElementById('ranking');

    data.forEach((user, index) => {
      const item = document.createElement('div');
      item.innerHTML = `
        <h2>#${index + 1} ${user.nome}</h2>
        <p>⭐ ${user.pontos} pontos</p>
      `;
      rankingDiv.appendChild(item);
    });
  })
  .catch(err => {
    console.error('Erro ao carregar ranking:', err);
  });
