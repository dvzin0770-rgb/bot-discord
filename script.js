fetch('ranking.json')
  .then(response => response.json())
  .then(data => {
    const ranking = document.getElementById('ranking');

    ranking.innerHTML = "";

    data.sort((a, b) => b.pontos - a.pontos);

    data.forEach((player, i) => {
      const item = document.createElement('div');

      item.innerHTML = `
        <h2>#${i + 1} ${player.nome}</h2>
        <p>⭐ ${player.pontos} pontos</p>
      `;

      ranking.appendChild(item);
    });
  })
  .catch(error => {
    console.error("Erro:", error);
  });
