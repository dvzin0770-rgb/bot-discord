fetch('ranking.json')
  .then(res => res.json())
  .then(data => {
    const rankingDiv = document.getElementById("ranking");

    // limpa antes (evita duplicar)
    rankingDiv.innerHTML = "";

    // ordenar por pontos
    data.sort((a, b) => b.pontos - a.pontos);

    data.forEach((player, index) => {
      const div = document.createElement("div");
      div.classList.add("player");

      div.innerHTML = `
        <h2>#${index + 1} ${player.nome}</h2>
        <p>⭐ ${player.pontos} pontos</p>
      `;

      rankingDiv.appendChild(div);
    });
  });
