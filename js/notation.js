let lembretes = (JSON.parse(localStorage.getItem('lembretes')) || []).map(item => {
  if (!item.id) item.id = gerarId();
  if (item.favorito === undefined) item.favorito = false;
  if (!item.hasOwnProperty('anotacaoLivre')) item.anotacaoLivre = '';
  return item;
});

let anotacoes = (JSON.parse(localStorage.getItem('anotacoes')) || []).map(item => {
  if (!item.id) item.id = gerarId();
  if (item.favorito === undefined) item.favorito = false;
  return item;
});

let snippets = (JSON.parse(localStorage.getItem('snippets') || '[]')).map(s => {
  if (!s.id) s.id = gerarId();
  if (s.favorito === undefined) s.favorito = false;
  return s;
});

let quillInfoLembrete = null;
let quillToolbar = null;

let lembreteChecklistAtualId = null;

function adicionarLembrete(titulo, descricao, cor, prazo = null) {
  const tagsTitulo = extrairTags(titulo);
  const tagsDescricao = extrairTags(descricao);
  const tagsUnicas = [...new Set([...tagsTitulo, ...tagsDescricao])];

  lembretes.unshift({
    id: gerarId(),
    titulo,
    descricao,
    checklist: [],
    cor,
    prazo,
    tags: tagsUnicas,
    arquivado: false,
  });

  salvarLembretes();
  renderizarLembretes();
}

function adicionarChecklist(id) {
  lembreteChecklistAtualId = id;
  document.getElementById('inputNovoChecklistTexto').value = '';
  const modal = new bootstrap.Modal(document.getElementById('modalNovoChecklistItem'));
  modal.show();
}

function removerLembrete(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  Swal.fire({
    title: 'Tem certeza?',
    text: 'Deseja realmente excluir este lembrete?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      lembretes.splice(index, 1);
      salvarLembretes();
      renderizarLembretes();
    }
  });
}

renderizarLembretes();

document.getElementById('formNovoLembrete').addEventListener('submit', function (e) {
  e.preventDefault();
  const titulo = document.getElementById('tituloLembrete').value.trim();
  const descricao = document.getElementById('descricaoLembrete').value.trim();
  const cor = document.getElementById('corLembrete').value;
  const prazo = document.getElementById('prazoLembrete').value || null;

  if (titulo && descricao) {
    adicionarLembrete(titulo, descricao, cor, prazo);
    document.getElementById('formNovoLembrete').reset();
    document.getElementById('corLembrete').value = 'nenhuma';
    bootstrap.Modal.getInstance(document.getElementById('modalNovoLembrete')).hide();
  }
});

document.getElementById('btnSalvarChecklistModal').addEventListener('click', () => {
  const texto = document.getElementById('inputNovoChecklistTexto').value.trim();
  if (!texto) return;

  const index = lembretes.findIndex(l => l.id === lembreteChecklistAtualId);
  if (index === -1) return;

  lembretes[index].checklist = lembretes[index].checklist || [];
  lembretes[index].checklist.push({ texto, feito: false });

  salvarLembretes();
  renderizarLembretes();

  const modalAberto = document.getElementById('modalInfoLembrete')?.classList.contains('show');
  if (modalAberto) preencherAbaDetalhes(lembretes[index]);

  bootstrap.Modal.getInstance(document.getElementById('modalNovoChecklistItem'))?.hide();
});

function editarLembrete(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  const item = lembretes[index];
  document.getElementById('editarIndex').value = index;
  document.getElementById('editarTitulo').value = item.titulo;
  document.getElementById('editarDescricao').value = item.descricao;
  document.getElementById('editarPrazoLembrete').value = item.prazo || '';
  
  document.querySelectorAll('input[name="editarCorCard"]').forEach(input => {
      input.checked = input.value === item.cor;
      input.addEventListener('change', () => {
          document.getElementById('editarCor').value = input.value;
        });
    });
    
    // Garante que o hidden está com o valor atual
    document.getElementById('editarCor').value = item.cor || 'azul';

  const modal = new bootstrap.Modal(document.getElementById('modalEditarLembrete'));
  modal.show();

  iniciarAutoCompleteHashtags(document.getElementById('editarTitulo'));
  iniciarAutoCompleteHashtags(document.getElementById('editarDescricao'));
}

document.getElementById('formEditarLembrete').addEventListener('submit', function (e) {
  e.preventDefault();
  const index = parseInt(document.getElementById('editarIndex').value, 10);
  const titulo = document.getElementById('editarTitulo').value.trim();
  const descricao = document.getElementById('editarDescricao').value.trim();
  const cor = document.getElementById('editarCor').value;
  const prazo = document.getElementById('editarPrazoLembrete').value || null;

  const tagsTitulo = extrairTags(titulo);
  const tagsDescricao = extrairTags(descricao);
  const tagsUnicas = [...new Set([...tagsTitulo, ...tagsDescricao])];

  if (titulo && descricao && cor) {
    lembretes[index].titulo = titulo;
    lembretes[index].descricao = descricao;
    lembretes[index].cor = cor;
    lembretes[index].tags = tagsUnicas;
    lembretes[index].prazo = prazo;

    salvarLembretes();
    renderizarLembretes();
    bootstrap.Modal.getInstance(document.getElementById('modalEditarLembrete')).hide();
  }
});

function salvarSnippets() {
  localStorage.setItem('snippets', JSON.stringify(snippets));
}

function editarSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (!snippet) return;

  document.getElementById('editarSnippetId').value = id;
  document.getElementById('tituloSnippet').value = snippet.titulo;
  document.getElementById('descricaoSnippet').value = snippet.descricao;
  document.getElementById('linguagemSnippet').value = snippet.linguagem;
  document.getElementById('codigoSnippet').value = snippet.codigo;

  const modal = new bootstrap.Modal(document.getElementById('modalNovoSnippet'));
  modal.show();
}

function removerSnippet(id) {
  Swal.fire({
    title: 'Remover snippet?',
    text: 'Essa ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      snippets = snippets.filter(s => s.id !== id);
      salvarSnippets();
      renderizarSnippets();
      Swal.fire('Removido!', 'O snippet foi excluído.', 'success');
    }
  });
}

document.getElementById('formNovoSnippet').addEventListener('submit', function (e) {
  e.preventDefault();

  const titulo = document.getElementById('tituloSnippet').value.trim();
  const descricao = document.getElementById('descricaoSnippet').value.trim();
  const linguagem = document.getElementById('linguagemSnippet').value;
  const codigo = document.getElementById('codigoSnippet').value;

  if (titulo && codigo) {
    const editId = document.getElementById('editarSnippetId').value;

    if (editId) {
    // Edição
    const index = snippets.findIndex(s => s.id === editId);
    if (index !== -1) {
        snippets[index] = { ...snippets[index], titulo, descricao, linguagem, codigo };
    }
    } else {
    // Novo
    snippets.unshift({
      id: gerarId(),
      titulo,
      descricao,
      linguagem,
      codigo,
    });  
    }

    salvarSnippets();
    renderizarSnippets();
    bootstrap.Modal.getInstance(document.getElementById('modalNovoSnippet')).hide();
    document.getElementById('formNovoSnippet').reset();
    document.getElementById('editarSnippetId').value = '';
  }
});

function salvarAnotacoes() {
  localStorage.setItem('anotacoes', JSON.stringify(anotacoes));
}

document.getElementById('formNovaAnotacao').addEventListener('submit', function (e) {
  e.preventDefault();
  const titulo = document.getElementById('tituloNota').value.trim();
  const conteudoHtml = quillAnotacao.root.innerHTML;

  if (conteudoHtml.replace(/<(.|\n)*?>/g, '').trim() !== '') {
    anotacoes.unshift({
      id: gerarId(),
      titulo,
      conteudoHtml,
      arquivado: false,
      criadoEm: new Date().toISOString()
    });

    salvarAnotacoes();
    renderizarAnotacoes();
    bootstrap.Modal.getInstance(document.getElementById('modalNovaAnotacao')).hide();
    document.getElementById('formNovaAnotacao').reset();
    quillAnotacao.setContents([]); // limpa editor
  }
});

function removerAnotacao(id) {
  Swal.fire({
    title: 'Remover anotação?',
    text: 'Essa ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      anotacoes = anotacoes.filter(a => a.id !== id);
      salvarAnotacoes();
      renderizarAnotacoes();
      Swal.fire('Removido!', 'A anotação foi excluída.', 'success');
    }
  });
}

function editarAnotacao(id) {
  const card = document.querySelector(`div.card[data-id="${id}"]`);
  const anot = anotacoes.find(a => a.id === id);
  if (!card || !anot) return;

  // Substitui título por input
  const tituloEl = card.querySelector('.card-title');
  const originalTitulo = anot.titulo || 'Sem título';

  const inputTitulo = document.createElement('input');
  inputTitulo.className = 'form-control form-control-sm mb-2';
  inputTitulo.value = originalTitulo;
  inputTitulo.id = `titulo-edit-${id}`;
  tituloEl.replaceWith(inputTitulo);

  detectarAtalhoEmoji(inputTitulo);

  // Substitui conteúdo por Quill
  const conteudoDiv = card.querySelector('.card-text');
  const botoes = card.querySelector('.d-flex.justify-content-end');

  const editorDiv = document.createElement('div');
  editorDiv.id = `quill-inline-${id}`;
  editorDiv.style.height = '150px';
  conteudoDiv.replaceWith(editorDiv);

  const quill = new Quill(editorDiv, {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link'],
        ['clean']
      ]
    }
  });
  quill.root.innerHTML = anot.conteudoHtml;

  // Botões de ação
  botoes.innerHTML = `
    <button class="btn btn-sm no-border btn-outline-secondary" onclick="salvarEdicaoAnotacao('${id}')">
      <i class="fas fa-check"></i>
    </button>
    <button class="btn btn-sm no-border btn-outline-secondary" onclick="renderizarAnotacoes()">
      <i class="fas fa-times"></i>
    </button>
  `;

  if (!window._quillInlineEditores) window._quillInlineEditores = {};
  window._quillInlineEditores[id] = quill;
}

function salvarEdicaoAnotacao(id) {
  const quill = window._quillInlineEditores?.[id];
  const inputTitulo = document.getElementById(`titulo-edit-${id}`);
  if (!quill || !inputTitulo) return;

  const novoConteudo = quill.root.innerHTML;
  const novoTitulo = inputTitulo.value.trim() || 'Sem título';

  const index = anotacoes.findIndex(a => a.id === id);
  if (index === -1) return;

  anotacoes[index].conteudoHtml = novoConteudo;
  anotacoes[index].titulo = novoTitulo;

  salvarAnotacoes();
  renderizarAnotacoes();
}

document.addEventListener('DOMContentLoaded', () => {
  const tituloSalvo = localStorage.getItem('muralProjetoTitulo') || '';
  const input = document.getElementById('tituloProjeto');
  if (input) input.value = tituloSalvo;
  if (tituloSalvo) document.title = `Mural | ${tituloSalvo}`;
});

function salvarTituloProjeto() {
  const input = document.getElementById('tituloProjeto');
  const titulo = input?.value.trim() || 'meu-mural';
  localStorage.setItem('muralProjetoTitulo', titulo);
  return titulo;
}

function editarChecklistItem(lembreteId, itemIndex, isModal = false) {
  const lembrete = lembretes.find(l => l.id === lembreteId);
  if (!lembrete || !lembrete.checklist[itemIndex]) return;

  const item = lembrete.checklist[itemIndex];

  const wrapperId = isModal
    ? `check-wrapper-aba-${lembreteId}-${itemIndex}`
    : `check-wrapper-${lembreteId}-${itemIndex}`;

  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  // Limpa conteúdo e define estilo de edição
  wrapper.innerHTML = '';
  wrapper.className = 'd-flex align-items-center gap-2 p-1 rounded bg-light';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control form-control-sm flex-grow-1';
  input.value = item.texto;
  input.style.minWidth = '0';

  const btnSalvar = document.createElement('button');
  btnSalvar.className = 'btn btn-sm btn-outline-success';
  btnSalvar.innerHTML = '<i class="fas fa-check"></i>';
  btnSalvar.title = 'Salvar';

  const btnCancelar = document.createElement('button');
  btnCancelar.className = 'btn btn-sm btn-outline-secondary';
  btnCancelar.innerHTML = '<i class="fas fa-times"></i>';
  btnCancelar.title = 'Cancelar';

  const salvar = () => {
    item.texto = input.value.trim();
    salvarLembretes();
    renderizarLembretes();
    if (isModal) preencherAbaDetalhes(lembrete);
  };

  const cancelar = () => {
    renderizarLembretes();
    if (isModal) preencherAbaDetalhes(lembrete);
  };

  btnSalvar.addEventListener('click', salvar);
  btnCancelar.addEventListener('click', cancelar);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') salvar();
    if (e.key === 'Escape') cancelar();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(btnSalvar);
  wrapper.appendChild(btnCancelar);

  input.focus();
}


function removerChecklistItem(lembreteId, itemIndex) {
  const lembreteIndex = lembretes.findIndex(l => l.id === lembreteId);
  if (lembreteIndex === -1) return;

  lembretes[lembreteIndex].checklist.splice(itemIndex, 1);
  salvarLembretes();
  renderizarLembretes();

  const modalAberto = document.getElementById('modalInfoLembrete')?.classList.contains('show');
  if (modalAberto) {
    preencherAbaDetalhes(lembretes[lembreteIndex]);
  }
}

document.querySelectorAll('input[name="corCard"]').forEach(input => {
  input.addEventListener('change', () => {
    document.getElementById('corLembrete').value = input.value;
  });
});

function mostrarComentarios(id) {
  const lembrete = lembretes.find(l => l.id === id);
  if (!lembrete) return;

  if (!lembrete.comentarios) lembrete.comentarios = [];

  const html = `
    <div style="max-height: 250px; overflow-y: auto; text-align: left;">
      ${lembrete.comentarios.length
        ? lembrete.comentarios.map(c => `
          <div style="margin-bottom: 8px;">
            <small class="text-muted">${new Date(c.criadoEm).toLocaleString('pt-BR')}</small>
            <div>${c.texto}</div>
          </div>
        `).join('')
        : '<em class="text-muted">Sem comentários ainda.</em>'
      }
    </div>
    <hr>
    <input type="text" id="novoComentarioInput" class="swal2-input" placeholder="Digite um novo comentário">
  `;

  Swal.fire({
    title: 'Comentários',
    html: html,
    confirmButtonText: 'Adicionar',
    showCancelButton: true,
    preConfirm: () => {
      const input = document.getElementById('novoComentarioInput');
      return input?.value?.trim();
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      lembrete.comentarios.push({
        id: gerarId(),
        texto: result.value,
        criadoEm: new Date().toISOString()
      });

      salvarLembretes();
      renderizarLembretes();

      Swal.fire('Comentado!', 'Seu comentário foi adicionado.', 'success');
    }
  });
}


function adicionarComentario(id) {
  const input = document.getElementById(`input-comentario-${id}`);
  if (!input || !input.value.trim()) return;

  const lembrete = lembretes.find(l => l.id === id);
  if (!lembrete) return;

  lembrete.comentarios = lembrete.comentarios || [];
  lembrete.comentarios.push({
    id: gerarId(),
    texto: input.value.trim(),
    criadoEm: new Date().toISOString()
  });

  salvarLembretes();
  renderizarLembretes();

  // Reabre o popover com comentários atualizados
  setTimeout(() => {
    const btn = document.querySelector(`.comentario-btn[data-id='${id}']`);
    if (btn) mostrarComentarios(id, btn);
  }, 100);
}

document.addEventListener('click', (event) => {
  const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');

  popovers.forEach(btn => {
    const popover = bootstrap.Popover.getInstance(btn);
    const popoverEl = document.querySelector('.popover');

    if (
      popover &&
      popoverEl &&
      !popoverEl.contains(event.target) &&
      !btn.contains(event.target)
    ) {
      popover.dispose();
    }
  });
});

let lembreteAtual = null;

function abrirModalInformacoes(id) {
  lembreteAtual = lembretes.find((l) => l.id === id);
  if (!lembreteAtual) return;

  document
    .querySelectorAll("#tabAnotacoes .ql-toolbar, #tabAnotacoes .ql-container")
    .forEach((el) => el.remove());
  quillInfoLembrete = null;

  const container = document.createElement("div");
  container.id = "quillAnotacaoModal";
  container.style.height = "200px";
  document.getElementById("tabAnotacoes").appendChild(container);

  quillInfoLembrete = new Quill("#quillAnotacaoModal", {
    theme: "snow",
    placeholder: "Escreva suas anotações...",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ],
    },
  });

  quillInfoLembrete.root.innerHTML = lembreteAtual.anotacaoLivre || "";

  quillInfoLembrete.on("text-change", () => {
    const index = lembretes.findIndex((l) => l.id === lembreteAtual.id);
    if (index !== -1) {
      lembretes[index].anotacaoLivre = quillInfoLembrete.root.innerHTML;
      salvarLembretes();
    }
  });

  preencherAbaDetalhes(lembreteAtual);
  atualizarComentariosModal();

  const modal = new bootstrap.Modal(
    document.getElementById("modalInfoLembrete")
  );
  modal.show();
}

function atualizarComentariosModal() {
  const container = document.getElementById('comentariosConteudo');
  container.innerHTML = '';

  if (!lembreteAtual.comentarios || lembreteAtual.comentarios.length === 0) {
    container.innerHTML = '<em class="text-muted">Sem comentários ainda.</em>';
    return;
  }

  container.innerHTML = lembreteAtual.comentarios.map((c, i) => `
  <div class="timeline-comentario mb-1 rounded comentario-card" data-coment-index="${i}">
    <div class="d-flex align-items-start gap-2">
      <div class="comment-s rounded-circle flex-shrink-0 bg-primary-subtle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
        <i class="fas fa-comment-alt"></i>
      </div>
      <div class="flex-grow-1">
        <div class="small text-muted">${formatarDataProfissional(c.criadoEm)}</div>
        <div id="comentario-texto-${i}">${c.texto}</div>
      </div>
    </div>
  </div>
`).join('');

document.getElementById('novoComentarioTexto').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('btnEnviarComentario')?.click();
  }
});
}

document.getElementById('btnEnviarComentario').addEventListener('click', () => {
  const input = document.getElementById('novoComentarioTexto');
  const texto = input.value.trim();
  if (!texto) return;

  if (!lembreteAtual) return;
  lembreteAtual.comentarios = lembreteAtual.comentarios || [];

  lembreteAtual.comentarios.push({
    id: gerarId(),
    texto,
    criadoEm: new Date().toISOString()
  });

  salvarLembretes();
  renderizarLembretes();
  input.value = '';
  atualizarComentariosModal();
});

function abrirAnotacaoCompleta(id) {
  const anot = anotacoes.find(a => a.id === id);
  if (!anot) return;

  document.getElementById('tituloAnotacaoInfo').textContent = anot.titulo || 'Sem título';
  document.getElementById('conteudoAnotacaoInfo').innerHTML = anot.conteudoHtml || '<em>Sem conteúdo</em>';
  document.getElementById('dataAnotacaoInfo').textContent = formatarData(anot.criadoEm);

  const modal = new bootstrap.Modal(document.getElementById('modalAnotacaoInfo'));
  modal.show();
}

function salvarTituloProjeto() {
  const input = document.getElementById('tituloProjeto');
  const titulo = input?.value.trim() || 'Mural';
  localStorage.setItem('muralProjetoTitulo', titulo);
  document.title = `Mural | ${titulo}`;
  return titulo;
}

function prepararNovoSnippet() {
  document.getElementById('formNovoSnippet').reset();
  document.getElementById('editarSnippetId').value = '';
}

document.addEventListener("DOMContentLoaded", () => {
  const versaoEl = document.getElementById("versaoSistema");
  if (typeof obterVersaoSistema === "function") {
    versaoEl.textContent = obterVersaoSistema();
  }
});

function preencherAbaDetalhes(lembrete) {
  const { feitos, total, percentual } = calcularProgressoChecklist(lembrete.checklist || []);
  const corProgresso = corBarraPorcentagem(percentual);

  const temChecklist = Array.isArray(lembreteAtual.checklist) && lembreteAtual.checklist.length > 0;

  const sufixo = temChecklist && !estaConcluido(lembreteAtual.checklist)
  ? ` <span class="text-muted">[${percentual}% concluído]</span>`
  : '';

  let statusHtml = '';
  if (estaConcluido(lembreteAtual.checklist)) {
    statusHtml = `
      <small class="bandeira-concluido bandeira-detalhe" title="Concluído">
        <i class="fa-solid fa-flag-checkered text-secondary"></i>
      </small>
    `;
  } else if (lembreteAtual?.prazo) {
    statusHtml = `
      <span 
        class="bolinha-prazo me-1" 
        style="background: ${statusPrazoCor(lembreteAtual.prazo, lembreteAtual.checklist)}"
        title="${statusPrazoTitulo(lembreteAtual.prazo, lembreteAtual.checklist)}"
      ></span>
    `;
  }

  // No título:
  document.getElementById('modalTituloLembrete').innerHTML =
    lembreteAtual?.titulo
      ? `${statusHtml} ${lembreteAtual.titulo}${sufixo}`
      : 'Informações do Lembrete';

  const barraHTML = (total > 0 && percentual > 0)
    ? `<div class="progress-check mb-2">
         <div class="progress-check-bar" style="width: ${percentual}%; background-color: ${corProgresso};">${percentual}%</div>
       </div>`
    : '';

  const checklistHTML = lembrete.checklist?.map((chk, i) => `
    <div 
      class="d-flex align-items-start gap-2 mb-1 check rounded drag-check"
      data-check-index="${i}"
      style="cursor: grab;"
      id="check-wrapper-aba-${lembrete.id}-${i}"
    >
      <input class="form-check-input mt-1" type="checkbox" id="aba-check-${lembrete.id}-${i}" ${chk.feito ? 'checked' : ''}>
      <label class="form-check-label flex-grow-1 p-1" for="aba-check-${lembrete.id}-${i}">${chk.texto}</label>
      <button class="btn-link-acao text-secondary" onclick="editarChecklistItem('${lembrete.id}', ${i}, true)">Editar</button>
      <button class="btn-link-acao text-secondary" onclick="removerChecklistItem('${lembrete.id}', ${i})">Remover</button>
      <i class="fas fa-up-down-left-right text-muted mt-1 me-1 drag-handle-check"></i>
    </div>
  `).join('') || '<span class="text-muted">Sem itens no checklist.</span>';
  
  document.getElementById('detalhesConteudo').innerHTML = `
    <div class="tags mb-3">
      ${extrairHashtags(lembrete.descricao).map(tag => `
        <span class="badge bg-primary-subtle text-primary fw-medium me-1">#${tag}</span>
      `).join('')}
    </div>
    <div class="d-flex justify-content-between align-items-center mb-1">
      <strong>Checklist</strong>
      <small class="text-muted">${feitos} de ${total} concluídos</small>
    </div>
    <div class="checklist-container checklist-container-scroll checklist-container-resizable">${checklistHTML}</div>
    <div class="d-flex justify-content-end mt-3">
      <button class="btn btn-sm no-border btn-outline-secondary" title="Adicionar check-list" onclick="adicionarChecklist('${lembrete.id}')">
        <i class="fas fa-list-check"></i>
      </button>
    </div>
  `;

  lembrete.checklist?.forEach((chk, i) => {
    const checkbox = document.getElementById(`aba-check-${lembrete.id}-${i}`);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        chk.feito = checkbox.checked;
        salvarLembretes();
        renderizarLembretes();
        preencherAbaDetalhes(lembrete);
      });
    }
  });

  ativarSortableChecklistModal(lembrete.id);
}

// Salva ao sair da modal
const modalEl = document.getElementById('modalInfoLembrete');
modalEl.addEventListener('hidden.bs.modal', () => {
  const novaAnotacao = quillInfoLembrete.root.innerHTML;
  const index = lembretes.findIndex(l => l.id === lembreteAtual.id);

  if (index !== -1) {
    lembretes[index].anotacaoLivre = novaAnotacao;
    salvarLembretes();
  }

  quillInfoLembrete = null;
}, { once: true });

document.getElementById('modalNovoChecklistItem').addEventListener('shown.bs.modal', function () {
  document.getElementById('inputNovoChecklistTexto').focus();
});

document.getElementById('inputNovoChecklistTexto').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault(); 
    document.getElementById('btnSalvarChecklistModal').click();
  }
});
