function getStatusPrazoLembrete(lembrete) {
  const checklist = lembrete.checklist || [];
  const prazo = lembrete.prazo;

  if (
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    checklist.every((i) => i.feito)
  ) {
    return "concluido";
  }
  if (!prazo) return "emdia";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let [ano, mes, dia] = prazo.split("-");
  const dataPrazo = new Date(ano, mes - 1, dia);
  dataPrazo.setHours(0, 0, 0, 0);

  if (dataPrazo < hoje) return "atrasado";
  if (dataPrazo.getTime() === hoje.getTime()) return "hoje";
  return "emdia";
}

function renderizarGraficoProgressoChecklist() {
  // Calcula quantidade de lembretes em cada faixa de progresso
  const faixas = { "0%": 0, "1-49%": 0, "50-99%": 0, "100%": 0 };

  lembretes.forEach((l) => {
    if (!l.checklist || l.checklist.length === 0) {
      faixas["0%"]++;
      return;
    }
    const feitos = l.checklist.filter((i) => i.feito).length;
    const total = l.checklist.length;
    const perc = Math.round((feitos / total) * 100);

    if (perc === 0) faixas["0%"]++;
    else if (perc < 50) faixas["1-49%"]++;
    else if (perc < 100) faixas["50-99%"]++;
    else faixas["100%"]++;
  });

  const ctx = document
    .getElementById("graficoProgressoChecklist")
    .getContext("2d");
  if (window._graficoProgressoChecklist)
    window._graficoProgressoChecklist.destroy();

  window._graficoProgressoChecklist = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(faixas),
      datasets: [
        {
          label: "Lembretes",
          data: Object.values(faixas),
          backgroundColor: ["#ddd", "#facc15", "#f97316", "#16a34a"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderizarGraficoPizzaStatus() {
  // Calcula status para todos os lembretes usando a função central
  const statusContagem = { concluido: 0, pendente: 0, atrasado: 0 };

  lembretes.forEach((l) => {
    const status = getStatusPrazoLembrete(l);
    if (status === "concluido") statusContagem.concluido++;
    else if (status === "atrasado") statusContagem.atrasado++;
    else statusContagem.pendente++; // inclui tanto "hoje" quanto "emdia"
  });

  const ctx = document.getElementById("pizzaStatusLembretes").getContext("2d");
  if (window._graficoPizzaStatus) window._graficoPizzaStatus.destroy();

  window._graficoPizzaStatus = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Concluídos", "Pendentes", "Atrasados"],
      datasets: [
        {
          data: [
            statusContagem.concluido,
            statusContagem.pendente,
            statusContagem.atrasado,
          ],
          backgroundColor: ["#16a34a", "#facc15", "#dc2626"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        title: { display: false },
      },
    },
  });
}

function abrirModalAnalytics() {
  renderizarGraficoPizzaStatus();
  renderizarGraficoProgressoChecklist();
  new bootstrap.Modal(document.getElementById("modalAnalytics")).show();
}
