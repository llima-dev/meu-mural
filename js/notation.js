const topicosHashtags = {
  urgente:      { label: 'urgente', icon: 'fas fa-exclamation-triangle', cor: '#FF4545' },
  tarefa:       { label: 'tarefa', icon: 'fas fa-check-circle', cor: '#367DB5' },
  lembrete:     { label: 'lembrete', icon: 'fas fa-bell', cor: '#DF7943' },
  code_review:  { label: 'code_review', icon: 'fas fa-code', cor: '#2D4263' },
  acompanhar:   { label: 'acompanhar', icon: 'fas fa-eye', cor: '#3D5A59' },
  analise:      { label: 'analise', icon: 'fas fa-chart-line', cor: '#4B6982' }
};

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

const filtroFavoritos = {
  lembretes: false,
  anotacoes: false,
  snippets: false
};

function gerarId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function calcularProgressoChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) return { feitos: 0, total: 0, percentual: 0 };
  const feitos = checklist.filter(item => item.feito).length;
  const total = checklist.length;
  const percentual = Math.round((feitos / total) * 100);
  return { feitos, total, percentual };
}

function corBarraPorcentagem(p) {
  if (p <= 30) return '#dc2626'; // vermelho
  if (p <= 59) return '#f97316'; // laranja
  if (p <= 84) return '#facc15'; // amarelo
  return '#16a34a';              // verde
}

function salvarLembretes() {
  localStorage.setItem('lembretes', JSON.stringify(lembretes));
}

function destacarHashtags(texto) {
  return texto.replace(/#(\w+)/g, `<span class="hashtag">#$1</span>`);
}

function converterQuebrasDeLinha(texto) {
  return texto.replace(/\n/g, '<br>');
}

function renderizarLembretes() {
    const container = document.getElementById('coluna-lembretes');
    container.innerHTML = '';

    const ativos = lembretes.filter(l =>
      !l.arquivado && (!filtroFavoritos.lembretes || l.favorito)
    );

    ativos.forEach((item, index) => {
      const card = document.createElement('div');

      const { feitos, total, percentual } = calcularProgressoChecklist(item.checklist || []);
      const exibirProgresso = total > 0;
      const corProgresso = corBarraPorcentagem(percentual);
      const barraProgressoHTML = (total > 0 && percentual > 0)
      ? `<div class="progress-check mb-2">
          <div class="progress-check-bar" style="width: ${percentual}%; background-color: ${corProgresso};">
            ${percentual}%
          </div>
        </div>`
      : '';

      card.dataset.id = item.id;
      const corClasse = item.cor && item.cor !== 'nenhuma' ? `card-borda-${item.cor}` : 'card-sem-cor';
      card.className = `card mb-3 ${corClasse}`;
      card.style = `position: relative;`;
      const favClass = item.favorito ? 'fa-solid fa-star' : 'fa-regular fa-star';
      card.innerHTML = `
      <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
                <i class="fas fa-up-down-left-right"></i>
            </div>
            <div class="d-flex">
            <button class="estrela-btn" onclick="alternarFavorito('lembrete', '${item.id}')">
              <i class="${favClass}"></i>
            </button>
            <h5 class="card-title mr-3">
              ${destacarHashtags(item.titulo)}
            </h5>
            </div>
            </div>

            <p class="card-text descricao-limite">
              ${converterQuebrasDeLinha(transformarLinks(removerHashtags(item.descricao)))}
            </p>

            <div class="tags mt-2">
            ${extrairHashtags(item.descricao).map(tag => `
                <span class="badge bg-primary-subtle text-primary fw-medium me-1">#${tag}</span>
            `).join('')}
            </div>

            <p class="text-muted small mt-2">
              ${item.prazo ? `<i class="fas fa-calendar-day me-1"></i> Prazo: <strong>${formatarPrazo(item.prazo)}</strong>` : ''}
            </p>

          <div class="checklist-container">
            ${item.checklist?.map((chk, i) => `
            <div 
              class="d-flex align-items-start gap-2 mb-1 check rounded drag-check"
              id="check-wrapper-${item.id}-${i}"
              data-check-index="${i}"
              style="cursor: grab;"
            >
              <input class="form-check-input mt-1" type="checkbox" id="check-${index}-${i}" ${chk.feito ? 'checked' : ''}>
              <label class="form-check-label flex-grow-1 p-1" for="check-${index}-${i}">${chk.texto}</label>
              <button class="btn-link-acao text-secondary" onclick="editarChecklistItem('${item.id}', ${i})" title="Editar">Editar</button>
              <button class="btn-link-acao text-secondary" onclick="removerChecklistItem('${item.id}', ${i})" title="Remover">Remover</button>
              <i class="fas fa-up-down-left-right text-muted mt-1 drag-handle-check" title="Arrastar para reordenar"></i>
            </div>
          `).join('') || ''}        
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2 bg-white rounded p-1">
              <div class="status-container d-flex" style="flex: 1; max-width: 200px;">
              ${
                estaConcluido(item.checklist)
                  ? `<small class="bandeira-concluido" title="Concluído"><i class="fa-solid fa-flag-checkered text-secondary"></i></small>`
                  : (item.prazo
                      ? `<span 
                            class="bolinha-prazo" 
                            style="background: ${statusPrazoCor(item.prazo, item.checklist)}"
                            title="${statusPrazoTitulo(item.prazo, item.checklist)}"
                          ></span>`
                      : ''
                    )
              }
              ${barraProgressoHTML}
            </div>        
            <div class="d-flex gap-2">
              <button class="btn btn-sm no-border btn-outline-secondary" title="Remover" onclick="removerLembrete('${item.id}')">
                <i class="fas fa-trash"></i>
              </button>
              <button class="btn btn-sm no-border btn-outline-secondary" title="Arquivar" onclick="arquivarLembrete('${item.id}')"><i class="fas fa-box-archive"></i></button>
              <button class="btn btn-sm no-border btn-outline-secondary" title="Editar" onclick="editarLembrete('${item.id}')"><i class="fas fa-pen"></i></button>
              <button class="btn btn-sm no-border btn-outline-secondary" title="Adicionar check-list" onclick="adicionarChecklist('${item.id}')"><i class="fas fa-list-check"></i></button>
              <button class="btn btn-sm no-border btn-outline-secondary info-btn" title="Informações" onclick="abrirModalInformacoes('${item.id}')">
                <i class="fas fa-circle-info"></i>
              </button>
            </div>
          </div>        
        </div>
      `;

        container.appendChild(card);
        ativarSortableChecklist(item.id);

        item.checklist?.forEach((chk, i) => {
        const checkbox = document.getElementById(`check-${index}-${i}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                const realIndex = lembretes.findIndex(l => l.id === item.id);
                if (realIndex !== -1) {
                  lembretes[realIndex].checklist[i].feito = checkbox.checked;
                  salvarLembretes();
                  renderizarLembretes();
                }
                salvarLembretes();
            });
        }
        });
    });

    ativarSortableLembretes();
    atualizarContadorFavoritos();
  }

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

function extrairTags(texto) {
  return (texto.match(/#(\w+)/g) || []).map(tag => tag.slice(1));
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

function ativarSortableLembretes() {
  new Sortable(document.getElementById('coluna-lembretes'), {
    group: 'lembretes',
    animation: 150,
    handle: '.drag-handle',
    onEnd: () => {
      const container = document.getElementById('coluna-lembretes');
      const novaOrdem = [];

      Array.from(container.children).forEach(card => {
        const id = card.dataset.id;
        const lembrete = lembretes.find(l => l.id === id);
        if (lembrete) {
          novaOrdem.push(lembrete);
        }
      });

      // Reescreve o array
      lembretes.length = 0;
      novaOrdem.forEach(l => lembretes.push(l));
      salvarLembretes();
    }
  });
}

function mostrarSugestoesHashtag(sugestoes, input, cursorPos) {
  let container = input.parentNode;
  let box = container.querySelector('.hashtag-sugestoes');

  if (!box) {
    box = document.createElement('div');
    box.className = 'hashtag-sugestoes list-group position-absolute';
    box.style.position = 'absolute';
    box.style.background = '#fff';
    box.style.border = '1px solid #ccc';
    box.style.borderRadius = '6px';
    box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    box.style.zIndex = 9999;
    box.style.maxHeight = '180px';
    box.style.overflowY = 'auto';
    box.style.width = '100%';
    box.style.cursor = 'pointer'
    box.style.top = `${input.offsetTop + input.offsetHeight}px`;
    box.style.left = `${input.offsetLeft}px`;
    container.appendChild(box);
  }

  box.innerHTML = '';
  sugestoes.forEach(tag => {
    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-action d-flex align-items-center';
    item.innerHTML = `<i class="${topicosHashtags[tag]?.icon}" style="color:${topicosHashtags[tag]?.cor}; margin-right: 8px;"></i>#${tag}`;
    
    item.onclick = () => {
        const cursorPos = input.selectionStart;
        const textoAntes = input.value.slice(0, cursorPos);
        const textoDepois = input.value.slice(cursorPos);

        // Remove o texto parcial digitado após o #
        const match = textoAntes.match(/#(\w*)$/);
        const inicioTag = match ? textoAntes.lastIndexOf('#') : cursorPos;

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
  const box = input.parentNode.querySelector('.hashtag-sugestoes');
  if (box) box.remove();
}

function iniciarAutoCompleteHashtags(inputElement) {
  inputElement.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    const textoAntes = e.target.value.slice(0, cursorPos);
    const match = textoAntes.match(/#(\w*)$/);

    if (match) {
      const termo = match[1].toLowerCase();
      const sugestoes = Object.keys(topicosHashtags).filter(t => t.startsWith(termo));
      if (sugestoes.length) {
        mostrarSugestoesHashtag(sugestoes, e.target, cursorPos);
      } else {
        esconderSugestoesHashtag(e.target);
      }
    } else {
      esconderSugestoesHashtag(e.target);
    }
  });

  inputElement.addEventListener('blur', () => {
    setTimeout(() => esconderSugestoesHashtag(inputElement), 200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarAutoCompleteHashtags(document.getElementById('tituloLembrete'));
  iniciarAutoCompleteHashtags(document.getElementById('descricaoLembrete'));
  renderizarSnippets();
  atualizarContagens();
});

function salvarSnippets() {
  localStorage.setItem('snippets', JSON.stringify(snippets));
}

function renderizarSnippets() {
  const container = document.getElementById('coluna-snippets');
  container.innerHTML = '';

  const ativos = snippets.filter(s =>
    !s.arquivado && (!filtroFavoritos.snippets || s.favorito)
  );

  ativos.forEach(snippet => {
    const card = document.createElement('div');
    card.className = 'card mb-3 snippet-card';
    const favClass = snippet.favorito ? 'fa-solid fa-star' : 'fa-regular fa-star';

    card.innerHTML = `
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
            <i class="fas fa-up-down-left-right"></i>
        </div>
        <div class="d-flex">
        <button class="estrela-btn" onclick="alternarFavorito('snippet', '${snippet.id}')">
          <i class="${favClass}"></i>
        </button>
        <h5 class="card-title">${snippet.titulo}</h5>
        </div>
        </div>
        <p class="card-text">${snippet.descricao || ''}</p>
        <pre><code class="language-${snippet.linguagem}">${snippet.codigo}</code></pre>
        <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-sm no-border btn-outline-secondary" title="Editar" onclick="editarSnippet('${snippet.id}')">
            <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-sm no-border btn-outline-secondary" title="Remover" onclick="removerSnippet('${snippet.id}')">
            <i class="fas fa-trash"></i>
        </button>
        <button class="btn btn-sm no-border btn-outline-secondary" title="Copiar código" onclick="copiarCodigo('${snippet.id}')">
            <i class="fas fa-copy"></i>
        </button>
        </div>
    </div>
    `;
    card.dataset.id = snippet.id;
    container.appendChild(card);
});

    hljs.highlightAll();
    ativarSortableSnippets();
    atualizarContadorFavoritos();
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

function copiarCodigo(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    navigator.clipboard.writeText(snippet.codigo);
    Swal.fire('Copiado!', 'Código adicionado à área de transferência.', 'success');
  }
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

const favicons = {
  lembretes: "https://em-content.zobj.net/thumbs/240/apple/354/pushpin_1f4cc.png", // 📌
  snippets: "https://img.icons8.com/ios-filled/50/000000/source-code.png", // </>
  outros: "https://img.icons8.com/ios-filled/50/000000/combo-chart.png", // 📈
};

function atualizarFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

document.getElementById('coluna-lembretes').addEventListener('mouseenter', () => {
  atualizarFavicon(favicons.lembretes);
});

document.getElementById('coluna-snippets').addEventListener('mouseenter', () => {
  atualizarFavicon(favicons.snippets);
});

document.getElementById('coluna-outros').addEventListener('mouseenter', () => {
  atualizarFavicon(favicons.outros);
});

function ativarSortableSnippets() {
new Sortable(document.getElementById('coluna-snippets'), {
  animation: 150,
  group: 'snippets',
  handle: '.drag-handle',
  onEnd: () => {
    const container = document.getElementById('coluna-snippets');
    const novaOrdem = Array.from(container.children).map(card => {
      const id = card.dataset.id;
      return snippets.find(s => s.id === id);
    });

    snippets.length = 0;
    snippets.push(...novaOrdem); 
    salvarSnippets();
  }
});
}

let quillAnotacao;

document.addEventListener('DOMContentLoaded', () => {
  quillAnotacao = new Quill('#editorAnotacao', {
    theme: 'snow',
    placeholder: 'Digite sua anotação...',
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

  renderizarAnotacoes();
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

function renderizarAnotacoes() {
  const container = document.getElementById('coluna-outros');
  container.innerHTML = '';

  const ativos = anotacoes.filter(a =>
    !a.arquivado && (!filtroFavoritos.anotacoes || a.favorito)
  );

  ativos.forEach(anot => {
    const card = document.createElement('div');

    card.className = 'card mb-3 anotacao-card';
    card.dataset.id = anot.id;
    const favClass = anot.favorito ? 'fa-solid fa-star' : 'fa-regular fa-star';

    card.innerHTML = `
    <div class="card-body position-relative d-flex flex-column">
      <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
        <i class="fas fa-up-down-left-right"></i>
      </div>
  
      <div class="d-flex">
      <button class="estrela-btn" onclick="alternarFavorito('anotacao', '${anot.id}')">
        <i class="${favClass}"></i>
      </button>
      <h5 class="card-title">${anot.titulo || 'Sem título'}</h5>
      </div>
  
      <div class="card-text flex-grow-1">
        <div class="anotacao-conteudo-scroll">${anot.conteudoHtml}</div>
      </div>
  
      <p class="text-muted small mt-2 mb-1">${formatarData(anot.criadoEm)}</p>
  
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-sm no-border btn-outline-secondary" title="Arquivar" onclick="arquivarAnotacao('${anot.id}')">
          <i class="fas fa-box-archive"></i>
        </button>
        <button class="btn btn-sm no-border btn-outline-secondary" title="Editar" onclick="editarAnotacao('${anot.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-sm no-border btn-outline-secondary" title="Remover" onclick="removerAnotacao('${anot.id}')">
          <i class="fas fa-trash"></i>
        </button>
        <button class="btn btn-sm no-border btn-outline-secondary info-btn" title="Ver anotação completa" onclick="abrirAnotacaoCompleta('${anot.id}')">
          <i class="fas fa-circle-info"></i>
        </button>
      </div>
    </div>
  `;  

    container.appendChild(card);
  });

  ativarSortableAnotacoes();
  atualizarContadorFavoritos();
}

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

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

function exportarJSON() {
  const tituloProjeto = localStorage.getItem('muralProjetoTitulo') || '';
  const dados = {
    lembretes,
    snippets,
    anotacoes,
    tituloProjeto
  };

  const nome = localStorage.getItem('muralProjetoTitulo') || 'meu-mural';
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `${nome.toLowerCase().replace(/\s+/g, '-')}-mural.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(input) {
  const file = input.files[0];
  if (!file) return;

  const novoReader = new FileReader();

  novoReader.addEventListener('load', function (e) {
    try {
      const dados = JSON.parse(e.target.result);

      if (dados.lembretes && dados.snippets && dados.anotacoes) {
        lembretes = dados.lembretes;
        snippets = dados.snippets;
        anotacoes = dados.anotacoes;

        if (dados.tituloProjeto) {
          localStorage.setItem('muralProjetoTitulo', dados.tituloProjeto);
          const inputTitulo = document.getElementById('tituloProjeto');
          if (inputTitulo) inputTitulo.value = dados.tituloProjeto;
          document.title = `Mural | ${dados.tituloProjeto}`;
        }

        salvarLembretes();
        salvarSnippets();
        salvarAnotacoes();

        renderizarLembretes();
        renderizarSnippets();
        renderizarAnotacoes();

        Swal.fire('Importado!', 'Os dados foram restaurados com sucesso.', 'success');
        atualizarContagens();
      } else {
        throw new Error('Formato inválido');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro!', 'Arquivo inválido ou corrompido.', 'error');
    }

    input.value = '';
  });

  novoReader.readAsText(file);
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

function ativarSortableAnotacoes() {
  new Sortable(document.getElementById('coluna-outros'), {
    animation: 150,
    group: 'outros',
    handle: '.drag-handle',
    onEnd: () => {
      const container = document.getElementById('coluna-outros');
      const novaOrdem = Array.from(container.children).map(card =>
        anotacoes.find(a => a.id === card.dataset.id)
      ).filter(Boolean);

      anotacoes.length = 0;
      anotacoes.push(...novaOrdem);
      salvarAnotacoes();
    }
  });
}

function arquivarLembrete(id) {
  const lembrete = lembretes.find(l => l.id === id);
  if (lembrete) {
    lembrete.arquivado = true;
    salvarLembretes();
    renderizarLembretes();
    atualizarContagens();
  }
}

function abrirModalArquivados(tipo) {
  let lista = [];
  const container = document.getElementById('listaArquivados');

  const titulos = {
    lembretes: 'Lembretes Arquivados',
    snippets: 'Snippets Arquivados',
    anotacoes: 'Anotações Arquivadas'
  };

  document.getElementById('tituloModalArquivados').textContent = titulos[tipo] || 'Arquivados';

  if (tipo === 'lembretes') lista = lembretes.filter(l => l.arquivado);
  else if (tipo === 'snippets') lista = snippets.filter(s => s.arquivado);
  else if (tipo === 'anotacoes') lista = anotacoes.filter(a => a.arquivado);

  if (lista.length === 0) {
    container.innerHTML = '<p class="text-muted">Nada arquivado por aqui.</p>';
  } else {
    let html = '';

    if (tipo === 'lembretes') {
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

    if (tipo === 'anotacoes') {
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

    html += lista.map(item => {
      return `
        <div class="check-item d-flex align-items-start py-2 px-2 rounded hover-glow border mb-2">
          <input type="checkbox" class="form-check-input mt-1 me-3 checkbox-arquivado" data-id="${item.id}" onchange="toggleSelecaoArquivado('${item.id}')">
          <div class="flex-grow-1">
            <strong class="fw-semibold">${item.titulo || 'Sem título'}</strong>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
  }

  new bootstrap.Modal(document.getElementById('modalArquivados')).show();
}

function desarquivarLembrete(id) {
  const lembrete = lembretes.find(l => l.id === id);
  if (lembrete) {
    lembrete.arquivado = false;
    salvarLembretes();
    renderizarLembretes();
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalArquivados'));
    if (modal) modal.hide();

    setTimeout(() => abrirModalArquivados(tipo), 300); 
  }
}

function desarquivar(tipo, id) {
  let lista;

  if (tipo === 'lembretes') lista = lembretes;
  else if (tipo === 'snippets') lista = snippets;
  else if (tipo === 'anotacoes') lista = anotacoes;

  const item = lista.find(x => x.id === id);
  if (item) {
    item.arquivado = false;

    salvarLembretes?.();
    salvarSnippets?.();
    salvarAnotacoes?.();

    renderizarLembretes?.();
    renderizarSnippets?.();
    renderizarAnotacoes?.();

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalArquivados'));
    if (modal) modal.hide();

    abrirModalArquivados(tipo);
    atualizarContagens();
  }
}

function arquivarAnotacao(id) {
  const anot = anotacoes.find(a => a.id === id);
  if (anot) {
    anot.arquivado = true;
    salvarAnotacoes();
    renderizarAnotacoes();
    atualizarContagens();
  }
}

document.querySelectorAll('input[name="corCard"]').forEach(input => {
  input.addEventListener('change', () => {
    document.getElementById('corLembrete').value = input.value;
  });
});

const arquivadosSelecionados = new Set();

function toggleSelecaoArquivado(id) {
  if (arquivadosSelecionados.has(id)) {
    arquivadosSelecionados.delete(id);
  } else {
    arquivadosSelecionados.add(id);
  }

  const total = document.querySelectorAll('#modalArquivados .checkbox-arquivado').length;
  const marcados = document.querySelectorAll('#modalArquivados .checkbox-arquivado:checked').length;


  const masterCheck = document.getElementById('selecionarTodosArquivados');
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

  const btnRestaurar = document.getElementById('btnRestaurarSelecionados');
  const btnExcluir = document.getElementById('btnExcluirSelecionados');

  if (btnRestaurar) btnRestaurar.disabled = !temSelecao;
  if (btnExcluir) btnExcluir.disabled = !temSelecao;
}

function toggleSelecionarTodosArquivados(checkbox) {
  const todos = document.querySelectorAll('#modalArquivados input[type="checkbox"]');
  todos.forEach(cb => {
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
  const checkboxes = document.querySelectorAll('#modalArquivados input[type="checkbox"][data-id]');
  const total = checkboxes.length;
  const marcados = Array.from(checkboxes).filter(cb => cb.checked).length;

  const masterCheck = document.getElementById('selecionarTodosArquivados');
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

function restaurarSelecionadosArquivados(tipo = 'lembretes') {
  const checkboxes = document.querySelectorAll('#modalArquivados input[type="checkbox"]:checked');

  const idsSelecionados = Array.from(checkboxes)
    .map(cb => cb.dataset.id) // aqui era o problema
    .filter(Boolean);

  if (tipo === 'lembretes') {
    lembretes.forEach(l => {
      if (idsSelecionados.includes(l.id)) l.arquivado = false;
    });
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === 'anotacoes') {
    anotacoes.forEach(a => {
      if (idsSelecionados.includes(a.id)) a.arquivado = false;
    });
    salvarAnotacoes();
    renderizarAnotacoes();
  }

  const modal = bootstrap.Modal.getInstance(document.getElementById('modalArquivados'));
  if (modal) modal.hide();

  setTimeout(() => abrirModalArquivados(tipo), 300);
  atualizarContagens();
}

function excluirSelecionadosArquivados(tipo = 'lembretes') {
  if (tipo === 'lembretes') {
    lembretes = lembretes.filter(l => !arquivadosSelecionados.has(l.id));
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === 'anotacoes') {
    anotacoes = anotacoes.filter(a => !arquivadosSelecionados.has(a.id));
    salvarAnotacoes();
    renderizarAnotacoes();
  }

  const modal = bootstrap.Modal.getInstance(document.getElementById('modalArquivados'));
  if (modal) modal.hide();

  setTimeout(() => abrirModalArquivados(tipo), 300);
  atualizarContagens();
}

function confirmarLimpezaStorage() {
  Swal.fire({
    icon: 'warning',
    title: 'Tem certeza?',
    text: 'Essa ação irá apagar todos os lembretes, anotações e snippets do mural.',
    showCancelButton: true,
    confirmButtonText: 'Sim, apagar tudo!',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      Swal.fire({
        icon: 'success',
        title: 'Mural limpo!',
        text: 'Tudo foi apagado com sucesso.',
        timer: 1500,
        showConfirmButton: false
      }).then(() => location.reload());
    }
  });
}

function transformarLinks(texto) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return texto.replace(urlRegex, url => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function removerHashtags(texto) {
  return texto.replace(/#[\w\u00C0-\u017F-]+/g, '').trim();
}

function extrairHashtags(texto) {
  const matches = texto.match(/#[\w\u00C0-\u017F-]+/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

function filtrarLembretes(termo) {
    const container = document.getElementById('coluna-lembretes');
    const cards = container.querySelectorAll('.card');

    const termoEscapado = termo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${termoEscapado})`, 'gi');

    lembretes.forEach((item, index) => {
        const card = cards[index];

        if (!card) return;

        const titulo = item.titulo || '';
        const descricao = item.descricao || '';
        const textoCompleto = `${titulo} ${descricao}`.toLowerCase();

        const match = textoCompleto.includes(termo.toLowerCase());

        card.style.display = match ? 'block' : 'none';

        if (match && termo.trim()) {
            const tituloDestacado = destacarHashtags(destacarLinks(titulo.replace(regex, '<span class="charlonico-highlight">$1</span>')));

            const tituloEl = card.querySelector('.card-title');

            if (tituloEl) tituloEl.innerHTML = tituloDestacado;
        } else {
            const tituloEl = card.querySelector('.card-title');

            if (tituloEl) tituloEl.innerHTML = destacarHashtags(destacarLinks(titulo));
        }
    });
}

function destacarTextoPreservandoHTML(elemento, termo) {
  if (!termo) return;

  const regex = new RegExp(`(${termo})`, 'gi');
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

  textos.forEach(node => {
    const textoOriginal = node.textContent;
    if (regex.test(textoOriginal)) {
      const span = document.createElement('span');
      span.innerHTML = textoOriginal.replace(regex, '<mark>$1</mark>');
      node.parentNode.replaceChild(span, node);
    }
  });
}


function filtrarSnippets(termo) {
  const cards = document.querySelectorAll('#coluna-snippets .card');
  const termoLower = termo.trim().toLowerCase();
  const termoEscapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${termoEscapado})`, 'gi');

  snippets.forEach((item, index) => {
    const card = cards[index];
    if (!card) return;

    const tituloEl = card.querySelector('.card-title');

    const titulo = item.titulo?.toLowerCase() || '';
    const descricao = item.descricao?.toLowerCase() || '';
    const codigo = item.codigo?.toLowerCase() || '';

    const match = (
      titulo.includes(termoLower) ||
      descricao.includes(termoLower) ||
      codigo.includes(termoLower)
    );

    card.style.display = match || termo === '' ? 'block' : 'none';

    if (tituloEl) {
      if (termo && titulo.includes(termoLower)) {
        const destacado = item.titulo.replace(regex, '<span class="charlonico-highlight">$1</span>');
        tituloEl.innerHTML = destacado;
      } else {
        tituloEl.textContent = item.titulo;
      }
    }
  });
}

function filtrarAnotacoes(termo) {
  const cards = document.querySelectorAll('#coluna-outros .card');
  const termoLower = termo.trim().toLowerCase();
  const termoEscapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${termoEscapado})`, 'gi');

  anotacoes.forEach((item, index) => {
    const card = cards[index];
    if (!card) return;

    const tituloEl = card.querySelector('.card-title');
    const tituloOriginal = item.titulo || '';
    const match = tituloOriginal.toLowerCase().includes(termoLower);

    card.style.display = match || termo === '' ? 'block' : 'none';

    if (match && termo.trim()) {
      const destacado = tituloOriginal.replace(regex, '<span class="charlonico-highlight">$1</span>');
      tituloEl.innerHTML = destacarHashtags(destacado);
    } else {
      tituloEl.innerHTML = destacarHashtags(tituloOriginal);
    }
  });
}

function destacarLinks(texto) {
  const regex = /((https?:\/\/|www\.)[^\s]+)/gi;
  return texto.replace(regex, url => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function atualizarContagens() {
  const elLembretes = document.getElementById('count-lembretes');
  const elArquivadosLembretes = document.getElementById('count-arquivados-lembretes');
  const elAnotacoes = document.getElementById('count-anotacoes');
  const elArquivadosAnotacoes = document.getElementById('count-arquivados-anotacoes');
  const elSnippets = document.getElementById('count-snippets');

  if (elLembretes) elLembretes.textContent = `(${lembretes.filter(l => !l.arquivado).length})`;
  if (elArquivadosLembretes) elArquivadosLembretes.textContent = `(${lembretes.filter(l => l.arquivado).length})`;

  if (elAnotacoes) elAnotacoes.textContent = `(${anotacoes.filter(a => !a.arquivado).length})`;
  if (elArquivadosAnotacoes) elArquivadosAnotacoes.textContent = `(${anotacoes.filter(a => a.arquivado).length})`;

  if (elSnippets) elSnippets.textContent = `(${snippets.filter(s => !s.arquivado).length})`;
}

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

function formatarDataProfissional(isoString) {
  const d = new Date(isoString);
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${hora} - ${data}`;
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

function alternarFavorito(tipo, id) {
  let lista;
  if (tipo === 'lembrete') lista = lembretes;
  else if (tipo === 'snippet') lista = snippets;
  else if (tipo === 'anotacao') lista = anotacoes;
  else return;

  const index = lista.findIndex(l => l.id === id);
  if (index === -1) return;

  lista[index].favorito = !lista[index].favorito;

  if (tipo === 'lembrete') {
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === 'snippet') {
    salvarSnippets();
    renderizarSnippets();
  } else if (tipo === 'anotacao') {
    salvarAnotacoes();
    renderizarAnotacoes();
  }
}

function alternarFiltroFavoritos(tipo) {
  filtroFavoritos[tipo] = !filtroFavoritos[tipo];

  const btn = document.getElementById(`btnFavoritos${capitalize(tipo)}`);
  const icone = btn.querySelector('i');

  if (filtroFavoritos[tipo]) {
    btn.classList.add('ativo'); // se quiser usar um estilo extra via CSS
    icone.classList.remove('fa-regular');
    icone.classList.add('fa-solid');
  } else {
    btn.classList.remove('ativo');
    icone.classList.remove('fa-solid');
    icone.classList.add('fa-regular');
  }

  if (tipo === 'lembretes') renderizarLembretes();
  else if (tipo === 'anotacoes') renderizarAnotacoes();
  else if (tipo === 'snippets') renderizarSnippets();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function atualizarContadorFavoritos() {
  const totalLembretes = lembretes.filter(l => l.favorito).length;
  const totalSnippets = snippets.filter(s => s.favorito).length;
  const totalAnotacoes = anotacoes.filter(a => a.favorito).length;

  document.getElementById('badgeFavoritosLembretes').textContent = totalLembretes;
  document.getElementById('badgeFavoritosSnippets').textContent = totalSnippets;
  document.getElementById('badgeFavoritosAnotacoes').textContent = totalAnotacoes;
}

function filtrarArquivados(valor) {
  const termo = valor.trim().toLowerCase();
  const itens = document.querySelectorAll('#listaArquivados .check-item');

  itens.forEach(item => {
    const titulo = item.querySelector('strong')?.textContent.toLowerCase() || '';
    item.style.setProperty('display', titulo.includes(termo) ? 'flex' : 'none', 'important');
  });
}

let campoEmojiAtivo = null;

function detectarAtalhoEmoji(input) {
  input.addEventListener('input', () => {
    const pos = input.selectionStart;
    const textoAntes = input.value.substring(0, pos);
    if (textoAntes.endsWith('//')) {
      campoEmojiAtivo = input;
      const modal = new bootstrap.Modal(document.getElementById('modalEmojiAtalho'));
      modal.show();
    }
  });
}

document.querySelectorAll('#tituloLembrete, #descricaoLembrete, #editarTitulo, #editarDescricao, #tituloSnippet, #descricaoSnippet, #tituloNota')
  .forEach(el => detectarAtalhoEmoji(el));

document.querySelectorAll('.emoji-atalho').forEach(emojiEl => {
  emojiEl.addEventListener('click', () => {
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

    bootstrap.Modal.getInstance(document.getElementById('modalEmojiAtalho')).hide();
  });
});

function abrirAjudaMural() {
  const modal = new bootstrap.Modal(document.getElementById('modalAjudaMural'));
  modal.show();
}

function aplicarModoEscuro(ativar) {
  const body = document.body;
  const icone = document.getElementById('iconeModoEscuro');
  
  if (ativar) {
    body.classList.add('modo-escuro');
    localStorage.setItem('modoEscuroAtivo', 'true');
    if (icone) icone.className = 'fas fa-sun';
  } else {
    body.classList.remove('modo-escuro');
    localStorage.setItem('modoEscuroAtivo', 'false');
    if (icone) icone.className = 'fas fa-moon';
  }
}

document.getElementById('toggleModoEscuro').addEventListener('click', () => {
  const modoAtivo = document.body.classList.contains('modo-escuro');
  aplicarModoEscuro(!modoAtivo);
});

document.addEventListener('DOMContentLoaded', () => {
  const preferencia = localStorage.getItem('modoEscuroAtivo') === 'true';
  aplicarModoEscuro(preferencia);
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

function ativarSortableChecklist(lembreteId) {
  const container = document.querySelector(`[data-id='${lembreteId}'] .checklist-container`);
  if (!container) return;

  new Sortable(container, {
    animation: 150,
    handle: '.drag-handle-check',
    onEnd: () => {
      const card = lembretes.find(l => l.id === lembreteId);
      if (!card || !Array.isArray(card.checklist)) return;

      const novaOrdem = Array.from(container.children).map(el => {
        const index = el.dataset.checkIndex;
        return card.checklist[parseInt(index, 10)];
      });

      card.checklist = novaOrdem;
      salvarLembretes();
      renderizarLembretes();
    }
  });
}

function ativarSortableChecklistModal(lembreteId) {
  const container = document.querySelector(`#tabDetalhes .checklist-container`);
  if (!container) return;

  new Sortable(container, {
    animation: 150,
    handle: '.drag-handle-check',
    onEnd: () => {
      const lembrete = lembretes.find(l => l.id === lembreteId);
      if (!lembrete || !lembrete.checklist) return;

      const novaOrdem = Array.from(container.children).map(el => {
        const index = el.dataset.checkIndex;
        return lembrete.checklist[parseInt(index, 10)];
      });

      lembrete.checklist = novaOrdem;
      salvarLembretes();
      preencherAbaDetalhes(lembrete); // só atualiza a aba
      renderizarLembretes(); // atualiza o card principal também
    }
  });
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

function formatarPrazo(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

function statusPrazoCor(prazo, checklist = []) {
  if (Array.isArray(checklist) && checklist.length > 0 && checklist.every(i => i.feito)) {
    return '#16a34a';
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let [ano, mes, dia] = prazo.split('-');
  const dataPrazo = new Date(ano, mes - 1, dia);
  dataPrazo.setHours(0, 0, 0, 0);

  if (dataPrazo < hoje) return '#dc2626';
  if (dataPrazo.getTime() === hoje.getTime()) return '#facc15';
  return '#16a34a';
}

function statusPrazoTitulo(prazo, checklist = []) {
  if (Array.isArray(checklist) && checklist.length > 0 && checklist.every(i => i.feito)) {
    return 'Concluído';
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let [ano, mes, dia] = prazo.split('-');
  const dataPrazo = new Date(ano, mes - 1, dia);
  dataPrazo.setHours(0, 0, 0, 0);

  if (dataPrazo < hoje) return 'Atrasado';
  if (dataPrazo.getTime() === hoje.getTime()) return 'Vence hoje';
  return 'Em dia';
}

function estaConcluido(checklist = []) {
  return Array.isArray(checklist) && checklist.length > 0 && checklist.every(i => i.feito);
}
