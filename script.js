fetch('ranking.json')
  .then(res => res.json())
  .then(data => {

    const div = document.getElementById('ranking');

    data.forEach((user, i) => {
      const el = document.createElement('div');
      el.className = 'card';

      el.innerHTML = `
        <b>#${i + 1}</b> ${user.nick} <br>
        ⭐ ${user.pontos} pontos
      `;

      div.appendChild(el);
    });

  });
