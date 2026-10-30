/* BoraDiploma Escola - configuracao da instituicao (white label)
   Para cada escola/cursinho, basta trocar os valores abaixo.
   - tipo: 'escola' (ensino medio) ou 'cursinho'
   - cor / corEscura: cor principal no modo claro / no modo escuro (corSuave: fundo dos botoes)
   - logo: caminho de uma imagem (ou '' para usar o logo do BoraDiploma)
   - prova: so aparece no modo cursinho (contagem regressiva na tela inicial)
   Para testar o outro modo sem mexer aqui: abrir app.html?tipo=cursinho (ou ?tipo=escola).
*/
window.BD_ESC = {
  nome: 'BoraDiploma Escola',
  marcaHTML: 'Bora<b>Diploma</b>',
  subtitulo: 'Escola',
  slogan: 'App do estudante',
  tipo: 'escola',
  cor: '#1f4e8c',
  corEscura: '#9cc0ef',
  corSuave: '#e3ebf6',        // fundo clarinho dos botoes (modo claro)
  corSuaveEscura: '#1d2a3a',  // fundo dos botoes no modo escuro
  logo: '',
  prova: { nome: 'ENEM', data: '2026-11-08' }
};
