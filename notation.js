const topicosHashtags = {
  urgente:      { label: 'urgente', icon: 'fas fa-exclamation-triangle', cor: '#FF4545' },
  tarefa:       { label: 'tarefa', icon: 'fas fa-check-circle', cor: '#367DB5' },
  lembrete:     { label: 'lembrete', icon: 'fas fa-bell', cor: '#DF7943' },
  code_review:  { label: 'code_review', icon: 'fas fa-code', cor: '#2D4263' },
  acompanhar:   { label: 'acompanhar', icon: 'fas fa-eye', cor: '#3D5A59' },
  analise:      { label: 'analise', icon: 'fas fa-chart-line', cor: '#4B6982' }
};

let lembretes = (JSON.parse(localStorage.getItem('lembretes')) || []).map(item => {
        if (!item.id) {
            item.id = gerarId();
        }
        return item;
    });

let anotacoes = JSON.parse(localStorage.getItem('anotacoes')) || [];


    function gerarId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

  function salvarLembretes() {
    localStorage.setItem('lembretes', JSON.stringify(lembretes));
  }

  function destacarHashtags(texto) {
    return texto.replace(/#(\w+)/g, `<span class="hashtag">#$1</span>`);
  }

  function renderizarLembretes() {
    const container = document.getElementById('coluna-lembretes');
    container.innerHTML = '';

    const ativos = lembretes.filter(l => !l.arquivado);

    ativos.forEach((item, index) => {
      const card = document.createElement('div');
      card.dataset.id = item.id;
      const corClasse = item.cor ? `card-borda-${item.cor}` : '';
      card.className = `card mb-3 ${corClasse}`;
      card.style = `position: relative;`;
      if (item.alarme) card.classList.add('card-alarme');
      card.innerHTML = `
      <div class="card-body">
        <div class="d-flex gap-2 mb-2">
        ${(item.tags || []).map(tag => {
            const icone = topicosHashtags[tag]?.icon || 'fas fa-tag';
            const cor = topicosHashtags[tag]?.cor || '#6c757d';
            return `<i class="${icone}" style="color:${cor}; font-size: 1rem;" title="#${tag}"></i>`;
        }).join('')}
        </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
                <i class="fas fa-up-down-left-right"></i>
            </div>
            <h5 class="card-title">${destacarHashtags(item.titulo)}</h5>
            </div>
            <p class="card-text">
            ${transformarLinks(removerHashtags(item.descricao))}
            </p>

            <div class="tags mt-2">
            ${extrairHashtags(item.descricao).map(tag => `
                <span class="badge bg-primary-subtle text-primary fw-medium me-1">#${tag}</span>
            `).join('')}
            </div>

            <p class="text-muted small mt-2">
                ${item.alarme ? `⏰ Alarme definido para <strong>${item.alarme}</strong>` : ''}
            </p>

          <div class="checklist-container">
            ${item.checklist?.map((chk, i) => `
            <div class="d-flex align-items-start gap-2 mb-1 check rounded">
                <input class="form-check-input mt-1" type="checkbox" id="check-${index}-${i}" ${chk.feito ? 'checked' : ''}>
                <label class="form-check-label flex-grow-1 p-1" for="check-${index}-${i}">${chk.texto}</label>
                <button class="btn btn-sm no-border btn-outline-secondary" onclick="editarChecklistItem('${item.id}', ${i})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm no-border btn-outline-secondary" onclick="removerChecklistItem('${item.id}', ${i})" title="Remover"><i class="fas fa-trash"></i></button>
            </div>
            `).join('') || ''}
          </div>

        <div class="d-flex justify-content-end mt-2 gap-2">
            <button class="btn btn-sm no-border btn-outline-secondary" title="Arquivar" onclick="arquivarLembrete('${item.id}')"><i class="fas fa-box-archive"></i></button>
            <button class="btn btn-sm no-border btn-outline-secondary" title="Editar" onclick="editarLembrete('${item.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn btn-sm no-border btn-outline-secondary" title="Adicionar check-list" onclick="adicionarChecklist('${item.id}')"><i class="fas fa-list-check"></i></button>
            <button class="btn btn-sm no-border btn-outline-secondary" title="Definir alarme" onclick="definirAlarme('${item.id}')"><i class="fas fa-bell"></i></button>
            <button class="btn btn-sm no-border btn-outline-secondary" title="Remover" onclick="removerLembrete('${item.id}')"><i class="fas fa-trash"></i></button>
            <button class="btn btn-sm no-border btn-outline-secondary info-btn" title="Informações" onclick="abrirModalInformacoes('${item.id}')">
              <i class="fas fa-circle-info"></i>
            </button>
        </div>
        </div>
      `;
        container.appendChild(card);

        item.checklist?.forEach((chk, i) => {
        const checkbox = document.getElementById(`check-${index}-${i}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                lembretes[index].checklist[i].feito = checkbox.checked;
                salvarLembretes();
            });
        }
        });
    });

    ativarSortableLembretes();
  }

function adicionarLembrete(titulo, descricao, cor) {
  const tagsTitulo = extrairTags(titulo);
const tagsDescricao = extrairTags(descricao);
const tagsUnicas = [...new Set([...tagsTitulo, ...tagsDescricao])];

lembretes.push({
  id: gerarId(),
  titulo,
  descricao,
  checklist: [],
  alarme: null,
  cor,
  tags: tagsUnicas,
  arquivado: false
});
  salvarLembretes();
  renderizarLembretes();
}

function extrairTags(texto) {
  return (texto.match(/#(\w+)/g) || []).map(tag => tag.slice(1));
}

function adicionarChecklist(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  if (!lembretes[index].checklist) {
    lembretes[index].checklist = [];
  }

  Swal.fire({
    title: 'Novo item da checklist',
    input: 'text',
    inputPlaceholder: 'Descreva a tarefa...',
    showCancelButton: true,
    confirmButtonText: 'Adicionar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed && result.value.trim()) {
      lembretes[index].checklist.push({ texto: result.value.trim(), feito: false });
      salvarLembretes();
      renderizarLembretes();
    }
  });
}

function removerLembrete(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  // Confirmação opcional
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

function definirAlarme(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  const lembrete = lembretes[index];
  const horaAtual = lembrete.alarme || '';

  Swal.fire({
    title: 'Alarme',
    html: `
      <label for="horaAlarme">Horário:</label>
      <input type="time" id="horaAlarme" class="form-control mb-2" value="${horaAtual}" style="max-width: 200px; margin: 0 auto;">
      ${horaAtual ? `<button id="removerAlarme" class="btn btn-sm btn-outline-danger mt-2">Remover alarme</button>` : ''}
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      const btnRemover = document.getElementById('removerAlarme');
      if (btnRemover) {
        btnRemover.addEventListener('click', () => {
          delete lembretes[index].alarme;
          salvarLembretes();
          renderizarLembretes();
          Swal.close();
          Swal.fire('Alarme removido!', '', 'success');
        });
      }
    },
    preConfirm: () => {
      const hora = document.getElementById('horaAlarme').value;
      if (!hora) {
        Swal.showValidationMessage('Por favor, selecione um horário!');
      }
      return hora;
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      lembretes[index].alarme = result.value;
      salvarLembretes();
      renderizarLembretes();
      Swal.fire({
        icon: 'success',
        title: '⏰ Alarme salvo!',
        text: `O lembrete tocará às ${result.value}`
      });
    }
  });
}

function checarAlarme() {
  const agora = new Date();
  const horaAtual = agora.toTimeString().substring(0, 5);

  lembretes.forEach((l, i) => {
    if (l.alarme === horaAtual) {
      Swal.fire({
        icon: 'info',
        title: '⏰ Alarme!',
        text: `Lembrete: ${l.titulo}`,
        timer: 4000
      });

      // Remove o alarme do lembrete
      delete lembretes[i].alarme;

      salvarLembretes();
      renderizarLembretes(); // Atualiza o card visualmente
    }
  });
}

  setInterval(checarAlarme, 60000); // verifica a cada minuto

  renderizarLembretes();

document.getElementById('formNovoLembrete').addEventListener('submit', function (e) {
  e.preventDefault();
  const titulo = document.getElementById('tituloLembrete').value.trim();
  const descricao = document.getElementById('descricaoLembrete').value.trim();
  const cor = document.getElementById('corLembrete').value;

  if (titulo && descricao) {
    adicionarLembrete(titulo, descricao, cor);
    document.getElementById('formNovoLembrete').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovoLembrete')).hide();
  }
});

function editarLembrete(id) {
  const index = lembretes.findIndex(l => l.id === id);
  if (index === -1) return;

  const item = lembretes[index];
  document.getElementById('editarIndex').value = index;
  document.getElementById('editarTitulo').value = item.titulo;
  document.getElementById('editarDescricao').value = item.descricao;
  
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

  const tagsTitulo = extrairTags(titulo);
  const tagsDescricao = extrairTags(descricao);
  const tagsUnicas = [...new Set([...tagsTitulo, ...tagsDescricao])];

  if (titulo && descricao && cor) {
    lembretes[index].titulo = titulo;
    lembretes[index].descricao = descricao;
    lembretes[index].cor = cor;
    lembretes[index].tags = tagsUnicas;

    salvarLembretes();
    renderizarLembretes();
    bootstrap.Modal.getInstance(document.getElementById('modalEditarLembrete')).hide();
  }
});

function ativarSortableLembretes() {
  new Sortable(document.getElementById('coluna-lembretes'), {
    group: 'cards',
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

let snippets = JSON.parse(localStorage.getItem('snippets') || '[]');

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

  snippets.forEach(snippet => {
    const card = document.createElement('div');
    card.className = 'card mb-3 snippet-card';

    card.innerHTML = `
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
            <i class="fas fa-up-down-left-right"></i>
        </div>
        <h5 class="card-title mb-0">${snippet.titulo}</h5>
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
    snippets.push({
        id: gerarId(),
        titulo,
        descricao,
        linguagem,
        codigo
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
  group: 'cards',
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
    anotacoes.push({
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

  const ativos = anotacoes.filter(a => !a.arquivado);

  ativos.forEach(anot => {
    const card = document.createElement('div');

    card.className = 'card mb-3 anotacao-card';
    card.dataset.id = anot.id;

    card.innerHTML = `
    <div class="card-body position-relative d-flex flex-column">
      <div class="position-absolute top-0 end-0 m-2 drag-handle text-muted" style="cursor: grab;" title="Arrastar para mover">
        <i class="fas fa-up-down-left-right"></i>
      </div>
  
      <h5 class="card-title">${anot.titulo || 'Sem título'}</h5>
  
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
}

function removerAnotacao(id) {
  anotacoes = anotacoes.filter(a => a.id !== id);
  salvarAnotacoes();
  renderizarAnotacoes();
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

function editarChecklistItem(lembreteId, itemIndex) {
  const lembreteIndex = lembretes.findIndex(l => l.id === lembreteId);
  if (lembreteIndex === -1) return;

  Swal.fire({
    title: 'Editar item',
    input: 'text',
    inputValue: lembretes[lembreteIndex].checklist[itemIndex].texto,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed && result.value.trim()) {
      lembretes[lembreteIndex].checklist[itemIndex].texto = result.value.trim();
      salvarLembretes();
      renderizarLembretes();
    }
  });
}

function removerChecklistItem(lembreteId, itemIndex) {
  const lembreteIndex = lembretes.findIndex(l => l.id === lembreteId);
  if (lembreteIndex === -1) return;

  lembretes[lembreteIndex].checklist.splice(itemIndex, 1);
  salvarLembretes();
  renderizarLembretes();
}

function ativarSortableAnotacoes() {
  new Sortable(document.getElementById('coluna-outros'), {
    animation: 150,
    group: 'cards',
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
      let checkbox = (tipo === 'lembretes' || tipo === 'anotacoes')
  ? `<input type="checkbox" class="form-check-input me-2" data-id="${item.id}" onchange="toggleSelecaoArquivado('${item.id}')">`
  : '';

    const cleanText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
    };

    const descricao = item.descricao || cleanText(item.conteudoHtml).slice(0, 60) || '';

    return `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
        <div class="d-flex align-items-start">
            ${checkbox}
            <div>
            <strong>${item.titulo || 'Sem título'}</strong>
            <div class="text-muted small">${descricao}</div>
            </div>
        </div>
        <button class="btn btn-sm no-border btn-outline-secondary" onclick="desarquivar('${tipo}', '${item.id}')" title="Restaurar">
            <i class="fas fa-undo"></i>
        </button>
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
  atualizarEstadoBotoesArquivados();
}

function atualizarEstadoBotoesArquivados() {
  const temSelecao = arquivadosSelecionados.size > 0;

  const btnRestaurar = document.getElementById('btnRestaurarSelecionados');
  const btnExcluir = document.getElementById('btnExcluirSelecionados');

  if (btnRestaurar) btnRestaurar.disabled = !temSelecao;
  if (btnExcluir) btnExcluir.disabled = !temSelecao;
}

function toggleSelecionarTodosArquivados(checkbox) {
  arquivadosSelecionados.clear();
  const checkboxes = document.querySelectorAll('.form-check-input[data-id]');
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    if (checkbox.checked) {
      arquivadosSelecionados.add(cb.dataset.id);
    }
  });
  atualizarEstadoBotoesArquivados();
}

function restaurarSelecionadosArquivados(tipo = 'lembretes') {
  if (tipo === 'lembretes') {
    lembretes.forEach(l => {
      if (arquivadosSelecionados.has(l.id)) l.arquivado = false;
    });
    salvarLembretes();
    renderizarLembretes();
  } else if (tipo === 'anotacoes') {
    anotacoes.forEach(a => {
      if (arquivadosSelecionados.has(a.id)) a.arquivado = false;
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
  const lembrete = lembretes.find(l => l.id === id);
  if (!lembrete) return;

  lembreteAtual = lembrete;
  atualizarComentariosModal();

  const modal = new bootstrap.Modal(document.getElementById('modalInfoLembrete'));
  modal.show();

  const qtd = lembrete.comentarios?.length || 0;
  const badge = document.getElementById('badgeQtdComentarios');
  badge.textContent = qtd;
  badge.style.display = qtd > 0 ? 'inline-block' : 'none';
  badge.style.color = ''
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