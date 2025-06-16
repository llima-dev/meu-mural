let termoFiltroAtual = "";
let statusFiltroAtual = "";
let termoFiltroAnotacoes = "";
let termoFiltroSnippets = "";
let lembreteFavAtivo = false;
let notFavAtivo = false;
let snippetFavAtivo = false;

const filtroFavoritos = {
  lembretes: false,
  anotacoes: false,
  snippets: false,
};

function filtrarAnotacoes(termo) {
  const cards = document.querySelectorAll("#coluna-outros .card");
  const termoLower = termo.trim().toLowerCase();
  const termoEscapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${termoEscapado})`, "gi");

  termoFiltroAnotacoes = termo;

  anotacoes.forEach((item, index) => {
    const card = cards[index];
    if (!card) return;

    const tituloEl = card.querySelector(".card-title");
    const tituloOriginal = item.titulo || "";
    const match = tituloOriginal.toLowerCase().includes(termoLower);

    card.style.display = match || termo === "" ? "block" : "none";

    if (match && termo.trim()) {
      const destacado = tituloOriginal.replace(
        regex,
        '<span class="charlonico-highlight">$1</span>'
      );
      tituloEl.innerHTML = destacarHashtags(destacado);
    } else {
      tituloEl.innerHTML = destacarHashtags(tituloOriginal);
    }

    const filtroAtivo =
      filtroFavoritos.anotacoes || termoFiltroAnotacoes.trim();
    const drags = card.getElementsByClassName("drag-anotacoes");

    for (const drag of drags) {
      drag.style.display = filtroAtivo ? "none" : "";
    }
  });
}

function filtrarSnippets(termo) {
  const cards = document.querySelectorAll("#coluna-snippets .card");
  const termoLower = termo.trim().toLowerCase();
  const termoEscapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${termoEscapado})`, "gi");

  termoFiltroSnippets = termo;

  snippets.forEach((item, index) => {
    const card = cards[index];
    if (!card) return;

    const tituloEl = card.querySelector(".card-title");

    const titulo = item.titulo?.toLowerCase() || "";
    const descricao = item.descricao?.toLowerCase() || "";
    const codigo = item.codigo?.toLowerCase() || "";

    const match =
      titulo.includes(termoLower) ||
      descricao.includes(termoLower) ||
      codigo.includes(termoLower);

    card.style.display = match || termo === "" ? "block" : "none";

    if (tituloEl) {
      if (termo && titulo.includes(termoLower)) {
        const destacado = item.titulo.replace(
          regex,
          '<span class="charlonico-highlight">$1</span>'
        );
        tituloEl.innerHTML = destacado;
      } else {
        tituloEl.textContent = item.titulo;
      }
    }

    const filtroAtivo =
        filtroFavoritos.snippets || termoFiltroSnippets.trim();
    const drags = card.getElementsByClassName("drag-snippets");

    for (const drag of drags) {
        drag.style.display = filtroAtivo ? "none" : "";
    }
  });
}

function alternarFavorito(tipo, id) {
  let lista;
  if (tipo === "lembrete") lista = lembretes;
  else if (tipo === "snippet") lista = snippets;
  else if (tipo === "anotacao") lista = anotacoes;
  else return;

  const index = lista.findIndex((l) => l.id === id);
  if (index === -1) return;

  lista[index].favorito = !lista[index].favorito;

  if (tipo === "lembrete") {
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === "snippet") {
    salvarSnippets();
    renderizarSnippets();
  } else if (tipo === "anotacao") {
    salvarAnotacoes();
    renderizarAnotacoes();
  }
}

function alternarFiltroFavoritos(tipo) {
  filtroFavoritos[tipo] = !filtroFavoritos[tipo];

  localStorage.setItem(`filtroFavoritos_${tipo}`, filtroFavoritos[tipo]);
  const btn = document.getElementById(`btnFavoritos${capitalize(tipo)}`);
  const icone = btn.querySelector("i");

  if (filtroFavoritos[tipo]) {
    lembreteFavAtivo = true;
    btn.classList.add("ativo");
    icone.classList.remove("fa-regular");
    icone.classList.add("fa-solid");
  } else {
    lembreteFavAtivo = false;
    btn.classList.remove("ativo");
    icone.classList.remove("fa-solid");
    icone.classList.add("fa-regular");
  }

  if (tipo === "lembretes") renderizarLembretes();
  else if (tipo === "anotacoes") renderizarAnotacoes();
  else if (tipo === "snippets") renderizarSnippets();
}

function atualizarContadorFavoritos() {
  const totalLembretes = lembretes.filter((l) => l.favorito).length;
  const totalSnippets = snippets.filter((s) => s.favorito).length;
  const totalAnotacoes = anotacoes.filter((a) => a.favorito).length;

  document.getElementById("badgeFavoritosLembretes").textContent =
    totalLembretes;
  document.getElementById("badgeFavoritosSnippets").textContent = totalSnippets;
  document.getElementById("badgeFavoritosAnotacoes").textContent =
    totalAnotacoes;
}

function filtrarArquivados(valor) {
  const termo = valor.trim().toLowerCase();
  const itens = document.querySelectorAll("#listaArquivados .check-item");

  itens.forEach((item) => {
    const titulo =
      item.querySelector("strong")?.textContent.toLowerCase() || "";
    item.style.setProperty(
      "display",
      titulo.includes(termo) ? "flex" : "none",
      "important"
    );
  });
}

document.getElementById("toggleModoEscuro").addEventListener("click", () => {
  const modoAtivo = document.body.classList.contains("modo-escuro");
  aplicarModoEscuro(!modoAtivo);
});

document.addEventListener("DOMContentLoaded", () => {
  const preferencia = localStorage.getItem("modoEscuroAtivo") === "true";
  aplicarModoEscuro(preferencia);

  termoFiltroAtual = localStorage.getItem("termoFiltroLembrete") || "";
  statusFiltroAtual = localStorage.getItem("statusFiltroLembrete") || "";
  filtroFavoritos.lembretes =
    localStorage.getItem("filtroFavoritos_lembretes") === "true";

  document.getElementById("inputFiltroLembrete").value = termoFiltroAtual;
  document.getElementById("filtroStatusLembrete").value = statusFiltroAtual;

  const btn = document.getElementById("btnFavoritosLembretes");
  if (btn) {
    if (filtroFavoritos.lembretes) {
      btn.classList.add("ativo");
      btn.querySelector("i").classList.remove("fa-regular");
      btn.querySelector("i").classList.add("fa-solid");
    } else {
      btn.classList.remove("ativo");
      btn.querySelector("i").classList.remove("fa-solid");
      btn.querySelector("i").classList.add("fa-regular");
    }
  }

  renderizarLembretes();
});

// Ao mudar o filtro de status
document
  .getElementById("filtroStatusLembrete")
  .addEventListener("change", function () {
    statusFiltroAtual = this.value;
    localStorage.setItem("statusFiltroLembrete", statusFiltroAtual);
    renderizarLembretes();
  });

// Ao digitar no campo de busca
document
  .getElementById("inputFiltroLembrete")
  .addEventListener("input", function () {
    termoFiltroAtual = this.value.trim().toLowerCase();
    localStorage.setItem("termoFiltroLembrete", termoFiltroAtual);
    renderizarLembretes();
  });