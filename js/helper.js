const topicosHashtags = {
  urgente: {
    label: "urgente",
    icon: "fas fa-exclamation-triangle",
    cor: "#FF4545",
  },
  tarefa: { label: "tarefa", icon: "fas fa-check-circle", cor: "#367DB5" },
  lembrete: { label: "lembrete", icon: "fas fa-bell", cor: "#DF7943" },
  code_review: { label: "code_review", icon: "fas fa-code", cor: "#2D4263" },
  acompanhar: { label: "acompanhar", icon: "fas fa-eye", cor: "#3D5A59" },
  analise: { label: "analise", icon: "fas fa-chart-line", cor: "#4B6982" },
};

function gerarId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

function calcularProgressoChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0)
    return { feitos: 0, total: 0, percentual: 0 };
  const feitos = checklist.filter((item) => item.feito).length;
  const total = checklist.length;
  const percentual = Math.round((feitos / total) * 100);
  return { feitos, total, percentual };
}

function corBarraPorcentagem(p) {
  if (p <= 30) return "#dc2626"; // vermelho
  if (p <= 59) return "#f97316"; // laranja
  if (p <= 84) return "#facc15"; // amarelo
  return "#16a34a"; // verde
}

function salvarLembretes() {
  localStorage.setItem("lembretes", JSON.stringify(lembretes));
}

function destacarHashtags(texto) {
  return texto.replace(/#(\w+)/g, `<span class="hashtag">#$1</span>`);
}

function converterQuebrasDeLinha(texto) {
  return texto.replace(/\n/g, "<br>");
}

function extrairTags(texto) {
  return (texto.match(/#(\w+)/g) || []).map((tag) => tag.slice(1));
}

function ativarSortableLembretes() {
  const container = document.getElementById("coluna-lembretes");
  if (!container) return;

  Sortable.create(container, {
    handle: ".drag-lembrete",
    animation: 150,
    ghostClass: "sortable-ghost",
    onEnd: function (evt) {
      const novosIds = Array.from(container.children)
        .map((col) => {
          return col.firstChild?.dataset.id;
        })
        .filter(Boolean);

      lembretes.sort((a, b) => {
        return novosIds.indexOf(a.id) - novosIds.indexOf(b.id);
      });

      salvarLembretes();
      renderizarLembretes();
    },
  });
}  

function mostrarSugestoesHashtag(sugestoes, input, cursorPos) {
  let container = input.parentNode;
  let box = container.querySelector(".hashtag-sugestoes");

  if (!box) {
    box = document.createElement("div");
    box.className = "hashtag-sugestoes list-group position-absolute";
    box.style.position = "absolute";
    box.style.background = "#fff";
    box.style.border = "1px solid #ccc";
    box.style.borderRadius = "6px";
    box.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    box.style.zIndex = 9999;
    box.style.maxHeight = "180px";
    box.style.overflowY = "auto";
    box.style.width = "100%";
    box.style.cursor = "pointer";
    box.style.top = `${input.offsetTop + input.offsetHeight}px`;
    box.style.left = `${input.offsetLeft}px`;
    container.appendChild(box);
  }

  box.innerHTML = "";
  sugestoes.forEach((tag) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item list-group-item-action d-flex align-items-center";
    item.innerHTML = `<i class="${topicosHashtags[tag]?.icon}" style="color:${topicosHashtags[tag]?.cor}; margin-right: 8px;"></i>#${tag}`;

    item.onclick = () => {
      const cursorPos = input.selectionStart;
      const textoAntes = input.value.slice(0, cursorPos);
      const textoDepois = input.value.slice(cursorPos);

      // Remove o texto parcial digitado após o #
      const match = textoAntes.match(/#(\w*)$/);
      const inicioTag = match ? textoAntes.lastIndexOf("#") : cursorPos;

      const textoFinal =
        textoAntes.slice(0, inicioTag) + `#${tag} ` + textoDepois;

      input.value = textoFinal;
      input.focus();

      // Reposiciona cursor ao fim da tag inserida
      const novaPos = inicioTag + tag.length + 2;
      input.setSelectionRange(novaPos, novaPos);

      esconderSugestoesHashtag(input);
    };
    box.appendChild(item);
  });
}

function esconderSugestoesHashtag(input) {
  const box = input.parentNode.querySelector(".hashtag-sugestoes");
  if (box) box.remove();
}

function iniciarAutoCompleteHashtags(inputElement) {
  inputElement.addEventListener("input", (e) => {
    const cursorPos = e.target.selectionStart;
    const textoAntes = e.target.value.slice(0, cursorPos);
    const match = textoAntes.match(/#(\w*)$/);

    if (match) {
      const termo = match[1].toLowerCase();
      const sugestoes = Object.keys(topicosHashtags).filter((t) =>
        t.startsWith(termo)
      );
      if (sugestoes.length) {
        mostrarSugestoesHashtag(sugestoes, e.target, cursorPos);
      } else {
        esconderSugestoesHashtag(e.target);
      }
    } else {
      esconderSugestoesHashtag(e.target);
    }
  });

  inputElement.addEventListener("blur", () => {
    setTimeout(() => esconderSugestoesHashtag(inputElement), 200);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarAutoCompleteHashtags(document.getElementById("tituloLembrete"));
  iniciarAutoCompleteHashtags(document.getElementById("descricaoLembrete"));
  renderizarSnippets();
  atualizarContagens();
});

function copiarCodigo(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (snippet) {
    navigator.clipboard.writeText(snippet.codigo);
    Swal.fire(
      "Copiado!",
      "Código adicionado à área de transferência.",
      "success"
    );
  }
}

function ativarSortableSnippets() {
  new Sortable(document.getElementById("coluna-snippets"), {
    animation: 150,
    group: "snippets",
    handle: ".drag-handle",
    onEnd: () => {
      const container = document.getElementById("coluna-snippets");
      const novaOrdem = Array.from(container.children).map((card) => {
        const id = card.dataset.id;
        return snippets.find((s) => s.id === id);
      });

      snippets.length = 0;
      snippets.push(...novaOrdem);
      salvarSnippets();
    },
  });
}

let quillAnotacao;

document.addEventListener("DOMContentLoaded", () => {
  quillAnotacao = new Quill("#editorAnotacao", {
    theme: "snow",
    placeholder: "Digite sua anotação...",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        ["bold", "italic", "underline", "strike"],
        [
          {
            color: [
              "#000000",
              "#e60000",
              "#ff9900",
              "#ffff00",
              "#008a00",
              "#0066cc",
              "#9933ff",
            ],
          },
        ],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link"],
        ["clean"],
      ],
    },
  });

  renderizarAnotacoes();
});

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportarJSON() {
  const tituloProjeto = localStorage.getItem("muralProjetoTitulo") || "";
  const dados = {
    lembretes,
    snippets,
    anotacoes,
    tituloProjeto,
  };

  const nome = localStorage.getItem("muralProjetoTitulo") || "meu-mural";
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${nome.toLowerCase().replace(/\s+/g, "-")}-mural.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(input) {
  const file = input.files[0];
  if (!file) return;

  const novoReader = new FileReader();

  novoReader.addEventListener("load", function (e) {
    try {
      const dados = JSON.parse(e.target.result);

      if (dados.lembretes && dados.snippets && dados.anotacoes) {
        lembretes = dados.lembretes;
        snippets = dados.snippets;
        anotacoes = dados.anotacoes;

        if (dados.tituloProjeto) {
          localStorage.setItem("muralProjetoTitulo", dados.tituloProjeto);
          const inputTitulo = document.getElementById("tituloProjeto");
          if (inputTitulo) inputTitulo.value = dados.tituloProjeto;
          document.title = `Mural | ${dados.tituloProjeto}`;
        }

        salvarLembretes();
        salvarSnippets();
        salvarAnotacoes();

        renderizarLembretes();
        renderizarSnippets();
        renderizarAnotacoes();

        Swal.fire(
          "Importado!",
          "Os dados foram restaurados com sucesso.",
          "success"
        );
        atualizarContagens();
      } else {
        throw new Error("Formato inválido");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Erro!", "Arquivo inválido ou corrompido.", "error");
    }

    input.value = "";
  });

  novoReader.readAsText(file);
}

function ativarSortableAnotacoes() {
  new Sortable(document.getElementById("coluna-outros"), {
    animation: 150,
    group: "outros",
    handle: ".drag-handle",
    onEnd: () => {
      const container = document.getElementById("coluna-outros");
      const novaOrdem = Array.from(container.children)
        .map((card) => anotacoes.find((a) => a.id === card.dataset.id))
        .filter(Boolean);

      anotacoes.length = 0;
      anotacoes.push(...novaOrdem);
      salvarAnotacoes();
    },
  });
}

function arquivarLembrete(id) {
  const lembrete = lembretes.find((l) => l.id === id);
  if (lembrete) {
    lembrete.arquivado = true;
    salvarLembretes();
    renderizarLembretes();
    atualizarContagens();
  }
}

function abrirModalArquivados(tipo) {
  let lista = [];
  const container = document.getElementById("listaArquivados");

  const titulos = {
    lembretes: "Lembretes Arquivados",
    snippets: "Snippets Arquivados",
    anotacoes: "Anotações Arquivadas",
  };

  document.getElementById("tituloModalArquivados").textContent =
    titulos[tipo] || "Arquivados";

  if (tipo === "lembretes") lista = lembretes.filter((l) => l.arquivado);
  else if (tipo === "snippets") lista = snippets.filter((s) => s.arquivado);
  else if (tipo === "anotacoes") lista = anotacoes.filter((a) => a.arquivado);

  if (lista.length === 0) {
    container.innerHTML = '<p class="text-muted">Nada arquivado por aqui.</p>';
  } else {
    let html = "";

    if (tipo === "lembretes") {
      // Adiciona os controles de seleção múltipla
      html += `
          <div id="controleArquivados" class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <input type="checkbox" id="selecionarTodosArquivados" onchange="toggleSelecionarTodosArquivados(this)">
              <label for="selecionarTodosArquivados">Selecionar todos</label>
            </div>
            <div class="d-flex gap-2">
              <button id="btnRestaurarSelecionados" class="btn btn-sm no-border btn-outline-secondary" onclick="restaurarSelecionadosArquivados()" title="Restaurar selecionados" disabled>
              <i class="fas fa-undo"></i>
              </button>
              <button id="btnExcluirSelecionados" class="btn btn-sm no-border btn-outline-secondary" onclick="excluirSelecionadosArquivados()" title="Excluir selecionados" disabled>
              <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
    }

    if (tipo === "anotacoes") {
      html += `
          <div id="controleArquivados" class="d-flex justify-content-between align-items-center mb-3">
          <div>
              <input type="checkbox" id="selecionarTodosArquivados" onchange="toggleSelecionarTodosArquivados(this)">
              <label for="selecionarTodosArquivados">Selecionar todos</label>
          </div>
          <div class="d-flex gap-2">
              <button id="btnRestaurarSelecionados" class="btn btn-sm no-border btn-outline-secondary" onclick="restaurarSelecionadosArquivados('anotacoes')" title="Restaurar selecionados" disabled>
              <i class="fas fa-undo"></i>
              </button>
              <button id="btnExcluirSelecionados" class="btn btn-sm no-border btn-outline-secondary" onclick="excluirSelecionadosArquivados('anotacoes')" title="Excluir selecionados" disabled>
              <i class="fas fa-trash"></i>
              </button>
          </div>
          </div>
      `;
    }

    html += lista
      .map((item) => {
        return `
          <div class="check-item d-flex align-items-start py-2 px-2 rounded hover-glow border mb-2">
            <input type="checkbox" class="form-check-input mt-1 me-3 checkbox-arquivado" data-id="${
              item.id
            }" onchange="toggleSelecaoArquivado('${item.id}')">
            <div class="flex-grow-1">
              <strong class="fw-semibold">${
                item.titulo || "Sem título"
              }</strong>
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = html;
  }

  new bootstrap.Modal(document.getElementById("modalArquivados")).show();
}

function desarquivarLembrete(id) {
  const lembrete = lembretes.find((l) => l.id === id);
  if (lembrete) {
    lembrete.arquivado = false;
    salvarLembretes();
    renderizarLembretes();
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalArquivados")
    );
    if (modal) modal.hide();

    setTimeout(() => abrirModalArquivados(tipo), 300);
  }
}

function desarquivar(tipo, id) {
  let lista;

  if (tipo === "lembretes") lista = lembretes;
  else if (tipo === "snippets") lista = snippets;
  else if (tipo === "anotacoes") lista = anotacoes;

  const item = lista.find((x) => x.id === id);
  if (item) {
    item.arquivado = false;

    salvarLembretes?.();
    salvarSnippets?.();
    salvarAnotacoes?.();

    renderizarLembretes?.();
    renderizarSnippets?.();
    renderizarAnotacoes?.();

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalArquivados")
    );
    if (modal) modal.hide();

    abrirModalArquivados(tipo);
    atualizarContagens();
  }
}

function arquivarAnotacao(id) {
  const anot = anotacoes.find((a) => a.id === id);
  if (anot) {
    anot.arquivado = true;
    salvarAnotacoes();
    renderizarAnotacoes();
    atualizarContagens();
  }
}

const arquivadosSelecionados = new Set();

function toggleSelecaoArquivado(id) {
  if (arquivadosSelecionados.has(id)) {
    arquivadosSelecionados.delete(id);
  } else {
    arquivadosSelecionados.add(id);
  }

  const total = document.querySelectorAll(
    "#modalArquivados .checkbox-arquivado"
  ).length;
  const marcados = document.querySelectorAll(
    "#modalArquivados .checkbox-arquivado:checked"
  ).length;

  const masterCheck = document.getElementById("selecionarTodosArquivados");
  if (masterCheck) {
    if (marcados === total && total > 0) {
      masterCheck.checked = true;
      masterCheck.indeterminate = false;
    } else if (marcados > 0) {
      masterCheck.checked = false;
      masterCheck.indeterminate = true;
    } else {
      masterCheck.checked = false;
      masterCheck.indeterminate = false;
    }
  }

  atualizarEstadoBotoesArquivados();
  atualizarCheckboxMestre();
}

function atualizarEstadoBotoesArquivados() {
  const temSelecao = arquivadosSelecionados.size > 0;

  const btnRestaurar = document.getElementById("btnRestaurarSelecionados");
  const btnExcluir = document.getElementById("btnExcluirSelecionados");

  if (btnRestaurar) btnRestaurar.disabled = !temSelecao;
  if (btnExcluir) btnExcluir.disabled = !temSelecao;
}

function toggleSelecionarTodosArquivados(checkbox) {
  const todos = document.querySelectorAll(
    '#modalArquivados input[type="checkbox"]'
  );
  todos.forEach((cb) => {
    cb.checked = checkbox.checked;
    if (checkbox.checked) {
      arquivadosSelecionados.add(cb.dataset.id);
    } else {
      arquivadosSelecionados.delete(cb.dataset.id);
    }
  });

  checkbox.indeterminate = false;

  atualizarEstadoBotoesArquivados();
  atualizarCheckboxMestre();
}

function atualizarCheckboxMestre() {
  const checkboxes = document.querySelectorAll(
    '#modalArquivados input[type="checkbox"][data-id]'
  );
  const total = checkboxes.length;
  const marcados = Array.from(checkboxes).filter((cb) => cb.checked).length;

  const masterCheck = document.getElementById("selecionarTodosArquivados");
  if (!masterCheck) return;

  if (marcados === total && total > 0) {
    masterCheck.checked = true;
    masterCheck.indeterminate = false;
  } else if (marcados > 0) {
    masterCheck.indeterminate = true;
  } else {
    masterCheck.checked = false;
    masterCheck.indeterminate = false;
  }
}

function restaurarSelecionadosArquivados(tipo = "lembretes") {
  const checkboxes = document.querySelectorAll(
    '#modalArquivados input[type="checkbox"]:checked'
  );

  const idsSelecionados = Array.from(checkboxes)
    .map((cb) => cb.dataset.id) // aqui era o problema
    .filter(Boolean);

  if (tipo === "lembretes") {
    lembretes.forEach((l) => {
      if (idsSelecionados.includes(l.id)) l.arquivado = false;
    });
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === "anotacoes") {
    anotacoes.forEach((a) => {
      if (idsSelecionados.includes(a.id)) a.arquivado = false;
    });
    salvarAnotacoes();
    renderizarAnotacoes();
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalArquivados")
  );
  if (modal) modal.hide();

  setTimeout(() => abrirModalArquivados(tipo), 300);
  atualizarContagens();
}

function excluirSelecionadosArquivados(tipo = "lembretes") {
  if (tipo === "lembretes") {
    lembretes = lembretes.filter((l) => !arquivadosSelecionados.has(l.id));
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === "anotacoes") {
    anotacoes = anotacoes.filter((a) => !arquivadosSelecionados.has(a.id));
    salvarAnotacoes();
    renderizarAnotacoes();
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalArquivados")
  );
  if (modal) modal.hide();

  setTimeout(() => abrirModalArquivados(tipo), 300);
  atualizarContagens();
}

function confirmarLimpezaStorage() {
  Swal.fire({
    icon: "warning",
    title: "Tem certeza?",
    text: "Essa ação irá apagar todos os lembretes, anotações e snippets do mural.",
    showCancelButton: true,
    confirmButtonText: "Sim, apagar tudo!",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      Swal.fire({
        icon: "success",
        title: "Mural limpo!",
        text: "Tudo foi apagado com sucesso.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => location.reload());
    }
  });
}

function transformarLinks(texto) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return texto.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function removerHashtags(texto) {
  return texto.replace(/#[\w\u00C0-\u017F-]+/g, "").trim();
}

function extrairHashtags(texto) {
  const matches = texto.match(/#[\w\u00C0-\u017F-]+/g);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}

function destacarTextoPreservandoHTML(elemento, termo) {
  if (!termo) return;

  const regex = new RegExp(`(${termo})`, "gi");
  const walker = document.createTreeWalker(
    elemento,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textos = [];
  while (walker.nextNode()) {
    textos.push(walker.currentNode);
  }

  textos.forEach((node) => {
    const textoOriginal = node.textContent;
    if (regex.test(textoOriginal)) {
      const span = document.createElement("span");
      span.innerHTML = textoOriginal.replace(regex, "<mark>$1</mark>");
      node.parentNode.replaceChild(span, node);
    }
  });
}

function destacarLinks(texto) {
  const regex = /((https?:\/\/|www\.)[^\s]+)/gi;
  return texto.replace(regex, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function atualizarContagens() {
  const elLembretes = document.getElementById("count-lembretes");
  const elArquivadosLembretes = document.getElementById(
    "count-arquivados-lembretes"
  );
  const elAnotacoes = document.getElementById("count-anotacoes");
  const elArquivadosAnotacoes = document.getElementById(
    "count-arquivados-anotacoes"
  );
  const elSnippets = document.getElementById("count-snippets");

  if (elLembretes)
    elLembretes.textContent = `(${
      lembretes.filter((l) => !l.arquivado).length
    })`;
  if (elArquivadosLembretes)
    elArquivadosLembretes.textContent = `(${
      lembretes.filter((l) => l.arquivado).length
    })`;

  if (elAnotacoes)
    elAnotacoes.textContent = `(${
      anotacoes.filter((a) => !a.arquivado).length
    })`;
  if (elArquivadosAnotacoes)
    elArquivadosAnotacoes.textContent = `(${
      anotacoes.filter((a) => a.arquivado).length
    })`;

  if (elSnippets)
    elSnippets.textContent = `(${snippets.filter((s) => !s.arquivado).length})`;
}

function formatarDataProfissional(isoString) {
  const d = new Date(isoString);
  const data = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${hora} - ${data}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

let campoEmojiAtivo = null;

function detectarAtalhoEmoji(input) {
  input.addEventListener("input", () => {
    const pos = input.selectionStart;
    const textoAntes = input.value.substring(0, pos);
    if (textoAntes.endsWith("//")) {
      campoEmojiAtivo = input;
      const modal = new bootstrap.Modal(
        document.getElementById("modalEmojiAtalho")
      );
      modal.show();
    }
  });
}

document
  .querySelectorAll(
    "#tituloLembrete, #descricaoLembrete, #editarTitulo, #editarDescricao, #tituloSnippet, #descricaoSnippet, #tituloNota"
  )
  .forEach((el) => detectarAtalhoEmoji(el));

document.querySelectorAll(".emoji-atalho").forEach((emojiEl) => {
  emojiEl.addEventListener("click", () => {
    if (!campoEmojiAtivo) return;

    const emoji = emojiEl.textContent;
    const pos = campoEmojiAtivo.selectionStart;
    const texto = campoEmojiAtivo.value;
    const antes = texto.slice(0, pos - 2); // remove //
    const depois = texto.slice(pos);
    campoEmojiAtivo.value = antes + emoji + depois;

    campoEmojiAtivo.focus();
    const novaPos = antes.length + emoji.length;
    campoEmojiAtivo.setSelectionRange(novaPos, novaPos);

    bootstrap.Modal.getInstance(
      document.getElementById("modalEmojiAtalho")
    ).hide();
  });
});

function abrirAjudaMural() {
  const modal = new bootstrap.Modal(document.getElementById("modalAjudaMural"));
  modal.show();
}

function aplicarModoEscuro(ativar) {
  const body = document.body;
  const icone = document.getElementById("iconeModoEscuro");

  if (ativar) {
    body.classList.add("modo-escuro");
    localStorage.setItem("modoEscuroAtivo", "true");
    if (icone) icone.className = "fas fa-sun";
  } else {
    body.classList.remove("modo-escuro");
    localStorage.setItem("modoEscuroAtivo", "false");
    if (icone) icone.className = "fas fa-moon";
  }
}

function ativarSortableChecklist(lembreteId) {
  const container = document.querySelector(
    `[data-id='${lembreteId}'] .checklist-container`
  );
  if (!container) return;

  new Sortable(container, {
    animation: 150,
    handle: ".drag-handle-check",
    onEnd: () => {
      const card = lembretes.find((l) => l.id === lembreteId);
      if (!card || !Array.isArray(card.checklist)) return;

      const novaOrdem = Array.from(container.children).map((el) => {
        const index = el.dataset.checkIndex;
        return card.checklist[parseInt(index, 10)];
      });

      card.checklist = novaOrdem;
      salvarLembretes();
      renderizarLembretes();
    },
  });
}

function ativarSortableChecklistModal(lembreteId) {
  const container = document.querySelector(`#tabDetalhes .checklist-container`);
  if (!container) return;

  new Sortable(container, {
    animation: 150,
    handle: ".drag-handle-check",
    onEnd: () => {
      const lembrete = lembretes.find((l) => l.id === lembreteId);
      if (!lembrete || !lembrete.checklist) return;

      const novaOrdem = Array.from(container.children).map((el) => {
        const index = el.dataset.checkIndex;
        return lembrete.checklist[parseInt(index, 10)];
      });

      lembrete.checklist = novaOrdem;
      salvarLembretes();
      preencherAbaDetalhes(lembrete); // só atualiza a aba
      renderizarLembretes(); // atualiza o card principal também
    },
  });
}

function formatarPrazo(isoDate) {
  if (!isoDate) return "";
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function statusPrazoCor(prazo, checklist = []) {
  if (
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    checklist.every((i) => i.feito)
  ) {
    return "#16a34a";
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let [ano, mes, dia] = prazo.split("-");
  const dataPrazo = new Date(ano, mes - 1, dia);
  dataPrazo.setHours(0, 0, 0, 0);

  if (dataPrazo < hoje) return "#dc2626";
  if (dataPrazo.getTime() === hoje.getTime()) return "#facc15";
  return "#16a34a";
}

function statusPrazoTitulo(prazo, checklist = []) {
  if (
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    checklist.every((i) => i.feito)
  ) {
    return "Concluído";
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let [ano, mes, dia] = prazo.split("-");
  const dataPrazo = new Date(ano, mes - 1, dia);
  dataPrazo.setHours(0, 0, 0, 0);

  if (dataPrazo < hoje) return "Atrasado";
  if (dataPrazo.getTime() === hoje.getTime()) return "Vence hoje";
  return "Em dia";
}

function estaConcluido(checklist = []) {
  return (
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    checklist.every((i) => i.feito)
  );
}

function getStatusPrazoLembrete(lembrete) {
  const checklist = lembrete.checklist || [];
  const prazo = lembrete.prazo;
  if (
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    checklist.every((i) => i.feito)
  )
    return "concluido";
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

function atualizarColunasVisiveis() {
  const colLembretes = document.querySelector(".col-lembretes");
  const colAnotacoes = document.querySelector(".col-anotacoes");
  const colSnippets = document.querySelector(".col-snippets");

  // Descobre quais estão visíveis
  const visibles = [
    { el: colLembretes, key: "lembretes" },
    { el: colAnotacoes, key: "anotacoes" },
    { el: colSnippets, key: "snippets" },
  ].filter((c) => !c.el.classList.contains("d-none"));

  // Limpa classes anteriores
  [colLembretes, colAnotacoes, colSnippets].forEach((c) => {
    c.classList.remove(
      "col-12",
      "col-md-8",
      "col-md-4",
      "col-md-6",
      "col-md-3"
    );
  });

  // Só lembretes visível
  if (visibles.length === 1 && visibles[0].key === "lembretes") {
    colLembretes.classList.add("col-12");
  }
  // Duas colunas visíveis
  else if (visibles.length === 2) {
    // Se Lembretes + Anotações
    if (!colSnippets.classList.contains("d-none")) {
      // Lembretes + Snippets
      colLembretes.classList.add("col-md-8");
      colSnippets.classList.add("col-md-4");
    } else if (!colAnotacoes.classList.contains("d-none")) {
      // Lembretes + Anotações
      colLembretes.classList.add("col-md-8");
      colAnotacoes.classList.add("col-md-4");
    }
  }
  // Três colunas visíveis (padrão)
  else {
    colLembretes.classList.add("col-md-4");
    colAnotacoes.classList.add("col-md-4");
    colSnippets.classList.add("col-md-4");
  }
}  

document
  .getElementById("toggleColunaAnotacoes")
  .addEventListener("click", function (e) {
    e.preventDefault();
    const col = document.querySelector(".col-anotacoes");
    col.classList.toggle("d-none");
    const icon = document.getElementById("iconColunaAnotacoes");
    icon.className = col.classList.contains("d-none")
      ? "fas fa-eye-slash me-2"
      : "fas fa-eye me-2";
    atualizarColunasVisiveis();
    salvarPreferenciasColunas();
  });

document
  .getElementById("toggleColunaSnippets")
  .addEventListener("click", function (e) {
    e.preventDefault();
    const col = document.querySelector(".col-snippets");
    col.classList.toggle("d-none");
    const icon = document.getElementById("iconColunaSnippets");
    icon.className = col.classList.contains("d-none")
      ? "fas fa-eye-slash me-2"
      : "fas fa-eye me-2";
    atualizarColunasVisiveis();
    salvarPreferenciasColunas();
  });

// Persistir preferências
function salvarPreferenciasColunas() {
  const prefs = {
    anotacoes: !document
      .querySelector(".col-anotacoes")
      .classList.contains("d-none"),
    snippets: !document
      .querySelector(".col-snippets")
      .classList.contains("d-none"),
  };
  localStorage.setItem("preferenciasColunas", JSON.stringify(prefs));
}

function restaurarPreferenciasColunas() {
  const prefs = JSON.parse(localStorage.getItem("preferenciasColunas") || "{}");
  if (prefs.anotacoes === false) {
    document.querySelector(".col-anotacoes").classList.add("d-none");
    document
      .getElementById("toggleColunaAnotacoes")
      .querySelector("i").className = "fas fa-eye-slash";
  }
  if (prefs.snippets === false) {
    document.querySelector(".col-snippets").classList.add("d-none");
    document
      .getElementById("toggleColunaSnippets")
      .querySelector("i").className = "fas fa-eye-slash";
  }
  atualizarColunasVisiveis();
}

function alternarColuna(nomeColuna) {
  atualizarColunasVisiveis();
  renderizarLembretes();
}

document
  .getElementById("toggleColunaAnotacoes")
  .addEventListener("click", (e) => {
    e.preventDefault();
    alternarColuna("anotacoes");
  });

document
  .getElementById("toggleColunaSnippets")
  .addEventListener("click", (e) => {
    e.preventDefault();
    alternarColuna("snippets");
  });

// Chame isso quando a página carregar
document.addEventListener("DOMContentLoaded", restaurarPreferenciasColunas);
