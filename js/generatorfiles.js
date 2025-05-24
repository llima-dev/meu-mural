function exportarAnotacaoParaPDF() {
    const titulo = document.getElementById('tituloAnotacaoInfo').textContent || 'Anotacao';
    const conteudo = document.getElementById('conteudoAnotacaoInfo').innerHTML;
    const data = document.getElementById('dataAnotacaoInfo').textContent;
  
    const html = `
      <h2>${titulo}</h2>
      <p><small>${data}</small></p>
      <hr>
      ${conteudo}
    `;
  
    const opt = {
      margin:       10,
      filename:     `${titulo.replace(/\s+/g, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
  
    html2pdf().from(html).set(opt).save();
  }
  