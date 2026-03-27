fetch('ranking.json')
  .then(res => res.json())
  .then(data => {
    const rankingDiv = document.getElementById("ranking");

    rankingDiv.innerHTML = "";

    data.sort((a, b) => b.pontos - a.pontos);

    data.forEach((player, index) => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h2>#${index + 1} ${player.nome}</h2>
        <p>${player.pontos} pontos</p>
      `;

      rankingDiv.appendChild(div);
    });
  });
