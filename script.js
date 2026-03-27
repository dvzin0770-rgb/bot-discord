const ranking = [
  { nome: "Dvzin", pontos: 120 },
  { nome: "Player2", pontos: 90 },
  { nome: "Player3", pontos: 50 }
];

const rankingDiv = document.getElementById("ranking");

ranking.forEach((player, index) => {
  const div = document.createElement("div");
  div.classList.add("player");

  div.innerHTML = `
    <h2>#${index + 1} ${player.nome}</h2>
    <p>⭐ ${player.pontos} pontos</p>
  `;

  rankingDiv.appendChild(div);
});
