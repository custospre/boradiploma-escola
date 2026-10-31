/* BoraDiploma Escola — Relatórios da escola (usado pelo app, em 🏫 Minha escola, e pelo Painel da escola)
   Recebe os dados de escola_relatorio (SQL em _montagem/relatorios-escola.sql) e agrupa por colégio, curso, turma,
   disciplina, idade, notas, engajamento, famílias e aniversariantes. Cada tabela baixa em planilha (CSV para o Excel). */
(function(){
  var ABAS=[['geral','📋 Visão geral'],['turma','🏷️ Por turma'],['curso','🎓 Por curso'],['disc','📚 Por disciplina'],['idade','🎂 Por idade'],
    ['notas','📊 Por notas'],['atencao','⚠️ Alunos em atenção'],['engaj','📱 Uso do app'],['familia','👨‍👩‍👧 Famílias'],['aniv','🎉 Aniversariantes']];
  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function E(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function css(){
    if(document.getElementById('rl-css')) return;
    var st=document.createElement('style'); st.id='rl-css';
    st.textContent='.rl-f{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}.rl-f select{flex:1 1 180px;min-width:0;padding:8px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--bg,#fff);color:inherit;font:inherit;font-size:.92rem}'
      +'.rl-abas{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.rl-abas button{border:1px solid var(--line,#ddd);background:none;color:inherit;border-radius:999px;padding:6px 11px;font:inherit;font-size:.85rem;cursor:pointer}'
      +'.rl-abas button.on{background:var(--accent,#1f4e8c);border-color:var(--accent,#1f4e8c);color:#fff}'
      +'.rl-k{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin:0 0 12px}.rl-k div{border:1px solid var(--line,#ddd);border-radius:12px;padding:10px;text-align:center;font-size:.8rem;opacity:.95}'
      +'.rl-k b{display:block;font-size:1.45rem;color:var(--accent,#1f4e8c);line-height:1.2}'
      +'.rl-tw{overflow-x:auto;border:1px solid var(--line,#ddd);border-radius:12px;margin:0 0 8px}.rl-t{border-collapse:collapse;width:100%;font-size:.86rem}'
      +'.rl-t th,.rl-t td{padding:7px 9px;border-bottom:1px solid var(--line,#ddd);text-align:left;vertical-align:top;white-space:nowrap}.rl-t td.w{white-space:normal;min-width:160px}'
      +'.rl-t th{background:var(--accent-soft,var(--soft,#e3ebf6));font-weight:700;position:sticky;top:0}.rl-t td.n,.rl-t th.n{text-align:right}'
      +'.rl-b{display:inline-block;width:70px;height:8px;border-radius:5px;background:var(--line,#ddd);overflow:hidden;vertical-align:middle;margin-right:6px}.rl-b i{display:block;height:100%}'
      +'.rl-red{color:#c0392b;font-weight:700}.rl-dim{opacity:.7;font-size:.82rem}.rl-h{font-weight:700;margin:14px 0 6px}.rl-x{margin:6px 0 4px}'
      +'.rl-x button{border:1px solid var(--line,#ddd);background:none;color:inherit;border-radius:10px;padding:7px 11px;font:inherit;font-size:.85rem;cursor:pointer}';
    document.head.appendChild(st);
  }
  function idade(n){ if(!n) return null; var p=String(n).split('-'), h=new Date(), i=h.getFullYear()-(+p[0]); if(h.getMonth()+1<+p[1]||(h.getMonth()+1===+p[1]&&h.getDate()<+p[2])) i--; return i; }
  function media(l){ l=l.filter(function(v){ return v!=null&&!isNaN(v); }); return l.length?l.reduce(function(a,b){ return a+b; },0)/l.length:null; }
  function f1(v){ return v==null?'–':(Math.round(v*10)/10).toFixed(1).replace('.',','); }
  function pc(a,b){ return b?Math.round(100*a/b):null; }
  function cor(v10){ return v10==null?'#999':(v10>=7?'#2e8b57':(v10>=6?'#d39b22':'#c0392b')); }
  function barra10(v){ return v==null?'–':'<span class="rl-b"><i style="width:'+Math.max(0,Math.min(100,v*10))+'%;background:'+cor(v)+'"></i></span>'+f1(v); }
  function barraP(p){ return p==null?'–':'<span class="rl-b"><i style="width:'+p+'%;background:'+cor(p/10)+'"></i></span>'+p+'%'; }
  function dias(iso){ return iso?Math.floor((Date.now()-new Date(iso).getTime())/86400000):null; }
  function dm(n){ var p=String(n||'').split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:''; }

  // prepara: liga alunos a turmas, notas (0 a 10) e simulados
  function prepara(D){
    var T={}; (D.turmas||[]).forEach(function(t){ T[t.id]=t; });
    var A=(D.alunos||[]).filter(function(a){ return !a.bloqueado; });
    var porA={}; A.forEach(function(a){ var t=T[a.turma_id]||{}; a.turma=t.nome||'Sem turma'; a.curso=t.curso||'Sem curso'; a.turno=t.turno||''; a.idade=idade(a.nascimento); a.notas=[]; porA[a.id]=a; });
    var N=[]; (D.notas||[]).forEach(function(n){ var a=porA[n.aluno_id]; if(!a) return; var v=+n.nota/(+n.nota_max||10)*10; var x={aluno:a,materia:n.materia,avaliacao:n.avaliacao,v:v}; a.notas.push(x); N.push(x); });
    var S=[]; (D.sim_materias||[]).forEach(function(s){ var a=porA[s.aluno_id]; if(a&&s.total) S.push({aluno:a,materia:s.materia,p:100*s.acertos/s.total}); });
    return {T:T,A:A,N:N,S:S};
  }
  function filtra(P,esc,disc){
    function ok(a){ if(!esc||esc==='*') return true; var k=esc.split(':'); return k[0]==='c'?a.curso===k[1]:a.turma_id===k[1]; }
    var A=P.A.filter(ok);
    var N=P.N.filter(function(n){ return ok(n.aluno)&&(!disc||n.materia.toLowerCase()===disc.toLowerCase()); });
    var S=P.S.filter(function(s){ return ok(s.aluno)&&(!disc||s.materia.toLowerCase()===disc.toLowerCase()); });
    A.forEach(function(a){ a.med=media(N.filter(function(n){ return n.aluno===a; }).map(function(n){ return n.v; })); });
    return {A:A,N:N,S:S};
  }
  // tabela + CSV
  function tabela(id,cab,linhas,csv){ // cab: [[título,'n'?]], linhas: [[html...]], csv: [[texto...]]
    if(!linhas.length) return '<div class="rl-dim" style="padding:6px 2px">Nada para mostrar com estes filtros.</div>';
    return '<div class="rl-tw"><table class="rl-t"><thead><tr>'+cab.map(function(c){ return '<th'+(c[1]?' class="n"':'')+'>'+c[0]+'</th>'; }).join('')+'</tr></thead><tbody>'
      +linhas.map(function(l){ return '<tr>'+l.map(function(v,i){ return '<td class="'+(cab[i][1]||'')+'">'+v+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table></div>'
      +'<div class="rl-x"><button type="button" data-rlcsv="'+id+'">⬇ Baixar planilha</button></div>'+(CSV[id]=[cab.map(function(c){ return c[0].replace(/<[^>]+>/g,''); })].concat(csv),'');
  }
  var CSV={};
  function baixa(id,nome){
    var L=CSV[id]; if(!L) return;
    function c(v){ v=String(v==null?'':v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
    var b=new Blob(['﻿'+L.map(function(l){ return l.map(c).join(';'); }).join('\r\n')],{type:'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=nome+'.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000);
  }
  function grupo(A,N,S,chave){ // agrupa alunos por chave(a)
    var g={}; A.forEach(function(a){ var k=chave(a); (g[k]=g[k]||{k:k,A:[]}).A.push(a); });
    return Object.keys(g).sort(function(x,y){ return x.localeCompare(y,'pt',{numeric:true}); }).map(function(k){ var o=g[k], set=new Set(o.A);
      o.N=N.filter(function(n){ return set.has(n.aluno); }); o.S=S.filter(function(s){ return set.has(s.aluno); }); return o; });
  }
  function linhaGrupo(o){
    var A=o.A, ent=A.filter(function(a){ return a.entrou; }).length, at7=A.filter(function(a){ var d=dias(a.ultimo_acesso); return d!=null&&d<=7; }).length;
    var mn=media(o.N.map(function(n){ return n.v; })), ms=media(o.S.map(function(s){ return s.p; })), ms2=ms==null?null:Math.round(ms);
    var abaixo=A.filter(function(a){ return a.med!=null&&a.med<6; }).length;
    var av=A.reduce(function(s,a){ return s+(+a.avisos||0); },0), al=A.reduce(function(s,a){ return s+(+a.avisos_lidos||0); },0), sem=A.filter(function(a){ return a.sim_semana; }).length;
    return {h:[E(o.k),A.length,ent+' ('+(pc(ent,A.length)||0)+'%)',at7,barra10(mn),abaixo?'<span class="rl-red">'+abaixo+'</span>':'0',barraP(ms2),(pc(sem,A.length)||0)+'%',av?pc(al,av)+'%':'–'],
      c:[o.k,A.length,ent,at7,mn==null?'':f1(mn),abaixo,ms2==null?'':ms2,pc(sem,A.length)||0,av?pc(al,av):'']};
  }
  var CABG=[['Grupo'],['Alunos','n'],['Já entraram','n'],['Usaram em 7 dias','n'],['Média das notas'],['Abaixo de 6','n'],['Simulados (acertos)'],['Fizeram o da semana','n'],['Leram os avisos','n']];

  function abas(id,P,F,ctx){
    var A=F.A, N=F.N, S=F.S, h='';
    if(id==='geral'){
      var ent=A.filter(function(a){ return a.entrou; }).length, at7=A.filter(function(a){ var d=dias(a.ultimo_acesso); return d!=null&&d<=7; }).length;
      var mn=media(N.map(function(n){ return n.v; })), ms=media(S.map(function(s){ return s.p; })), sem=A.filter(function(a){ return a.sim_semana; }).length;
      var av=A.reduce(function(s,a){ return s+(+a.avisos||0); },0), al=A.reduce(function(s,a){ return s+(+a.avisos_lidos||0); },0);
      var fam=A.filter(function(a){ return +a.resp_entraram>0; }).length, abaixo=A.filter(function(a){ return a.med!=null&&a.med<6; }).length;
      h='<div class="rl-k"><div><b>'+A.length+'</b>alunos</div><div><b>'+(pc(ent,A.length)||0)+'%</b>já entraram no app</div><div><b>'+at7+'</b>usaram nos últimos 7 dias</div>'
        +'<div><b>'+f1(mn)+'</b>média das notas (0 a 10)</div><div><b style="color:#c0392b">'+abaixo+'</b>com média abaixo de 6</div><div><b>'+(ms==null?'–':Math.round(ms)+'%')+'</b>acertos nos simulados</div>'
        +'<div><b>'+(pc(sem,A.length)||0)+'%</b>fizeram o simulado da semana</div><div><b>'+(av?pc(al,av)+'%':'–')+'</b>dos avisos foram lidos</div><div><b>'+(pc(fam,A.length)||0)+'%</b>com família no app</div></div>';
      var g=grupo(A,N,S,function(a){ return a.turma; }).map(linhaGrupo);
      h+='<div class="rl-h">Resumo por turma</div>'+tabela('geral',[['Turma']].concat(CABG.slice(1)),g.map(function(x){ return x.h; }),g.map(function(x){ return x.c; }));
    }
    else if(id==='turma'||id==='curso'){
      var g2=grupo(A,N,S,function(a){ return id==='turma'?a.turma:a.curso; }).map(linhaGrupo);
      h=tabela(id,[[id==='turma'?'Turma':'Curso']].concat(CABG.slice(1)),g2.map(function(x){ return x.h; }),g2.map(function(x){ return x.c; }));
      if(id==='curso'&&P.A.every(function(a){ return a.curso==='Sem curso'; })) h='<p class="rl-dim">Dica: informe o <b>curso</b> (série/etapa) de cada turma em ✏️ Editar turma para juntar as turmas do mesmo curso.</p>'+h;
    }
    else if(id==='disc'){
      var ms3={}; N.forEach(function(n){ (ms3[n.materia]=ms3[n.materia]||{n:[],s:[]}).n.push(n); }); S.forEach(function(s){ (ms3[s.materia]=ms3[s.materia]||{n:[],s:[]}).s.push(s); });
      var ks=Object.keys(ms3).sort(function(x,y){ return (media(ms3[x].n.map(function(n){ return n.v; }))||99)-(media(ms3[y].n.map(function(n){ return n.v; }))||99); });
      var L=ks.map(function(k){ var o=ms3[k], mn=media(o.n.map(function(n){ return n.v; })), ms=media(o.s.map(function(s){ return s.p; }));
        var al={}; o.n.forEach(function(n){ (al[n.aluno.id]=al[n.aluno.id]||[]).push(n.v); }); var ab=Object.keys(al).filter(function(i){ return media(al[i])<6; }).length;
        return {h:[E(k),o.n.length,barra10(mn),ab?'<span class="rl-red">'+ab+'</span>':'0',o.s.length,barraP(ms==null?null:Math.round(ms))],c:[k,o.n.length,mn==null?'':f1(mn),ab,o.s.length,ms==null?'':Math.round(ms)]}; });
      h='<p class="rl-dim">Das mais difíceis para as mais fáceis (pela média das notas oficiais).</p>'+tabela('disc',[['Disciplina'],['Notas lançadas','n'],['Média'],['Alunos abaixo de 6','n'],['Simulados','n'],['Acertos nos simulados']],L.map(function(x){ return x.h; }),L.map(function(x){ return x.c; }));
    }
    else if(id==='idade'){
      var g3=grupo(A,N,S,function(a){ return a.idade==null?'zz':(a.idade<=14?'00':(a.idade>=19?'19':String(a.idade))); });
      var nome=function(k){ return k==='zz'?'Sem data de nascimento':(k==='00'?'Até 14 anos':(k==='19'?'19 anos ou mais':k+' anos')); };
      var L3=g3.map(function(o){ var x=linhaGrupo(o); x.h[0]=nome(o.k); x.c[0]=nome(o.k); return x; });
      var sem=A.filter(function(a){ return a.idade==null; }).length;
      h=(sem?'<p class="rl-dim">'+sem+' aluno(s) sem data de nascimento. Dá para informar no cadastro do aluno ou na planilha de importação (coluna “Nascimento”).</p>':'')
        +tabela('idade',[['Idade']].concat(CABG.slice(1)),L3.map(function(x){ return x.h; }),L3.map(function(x){ return x.c; }));
      // fora da idade esperada para o curso (distorção idade-série): só quando o curso tem número de série
      var dist=A.filter(function(a){ var m=/(\d)\s*º?\s*(ano|s[ée]rie)/i.exec(a.curso||''); if(!m||a.idade==null) return false; var s=+m[1], ef=/fundamental|ef\b/i.test(a.curso); var esp=ef?s+5:s+14; return a.idade>=esp+2; });
      if(dist.length) h+='<div class="rl-h">⚠️ Alunos 2 anos ou mais acima da idade esperada para a série</div>'+tabela('dist',[['Aluno'],['Turma'],['Curso'],['Idade','n']],dist.map(function(a){ return [E(a.nome),E(a.turma),E(a.curso),a.idade]; }),dist.map(function(a){ return [a.nome,a.turma,a.curso,a.idade]; }));
    }
    else if(id==='notas'){
      var F2=[['Abaixo de 5 (crítico)',0,5],['De 5 a 5,9',5,6],['De 6 a 6,9',6,7],['De 7 a 8,4',7,8.5],['De 8,5 a 10',8.5,10.01]];
      var com=A.filter(function(a){ return a.med!=null; });
      var L4=F2.map(function(f){ var q=com.filter(function(a){ return a.med>=f[1]&&a.med<f[2]; }).length; return {h:[f[0],q,barraP(pc(q,com.length))],c:[f[0],q,pc(q,com.length)]}; });
      L4.push({h:['Sem nota lançada',A.length-com.length,''],c:['Sem nota lançada',A.length-com.length,'']});
      h=tabela('notas',[['Faixa da média'],['Alunos','n'],['% dos alunos com nota']],L4.map(function(x){ return x.h; }),L4.map(function(x){ return x.c; }));
      var rk=com.slice().sort(function(x,y){ return y.med-x.med; });
      var lin=function(a,i){ return [i+1,E(a.nome),E(a.turma),barra10(a.med)]; }, lc=function(a,i){ return [i+1,a.nome,a.turma,f1(a.med)]; };
      h+='<div class="rl-h">🏆 Maiores médias</div>'+tabela('top',[['#','n'],['Aluno'],['Turma'],['Média']],rk.slice(0,10).map(lin),rk.slice(0,10).map(lc));
      var bt=rk.slice().reverse().slice(0,10);
      h+='<div class="rl-h">🆘 Menores médias</div>'+tabela('bot',[['#','n'],['Aluno'],['Turma'],['Média']],bt.map(lin),bt.map(lc));
      var todos=A.slice().sort(function(x,y){ return x.turma.localeCompare(y.turma,'pt',{numeric:true})||x.nome.localeCompare(y.nome); });
      var mats=[]; N.forEach(function(n){ if(mats.indexOf(n.materia)<0) mats.push(n.materia); }); mats.sort();
      if(mats.length){ var mm=function(a,m){ return media(N.filter(function(n){ return n.aluno===a&&n.materia===m; }).map(function(n){ return n.v; })); };
        h+='<div class="rl-h">📒 Boletim (média por disciplina)</div>'+tabela('bol',[['Aluno'],['Turma']].concat(mats.map(function(m){ return [E(m),'n']; })).concat([['Média','n']]),
          todos.map(function(a){ return [E(a.nome),E(a.turma)].concat(mats.map(function(m){ var v=mm(a,m); return v==null?'–':(v<6?'<span class="rl-red">'+f1(v)+'</span>':f1(v)); })).concat([f1(a.med)]); }),
          todos.map(function(a){ return [a.nome,a.turma].concat(mats.map(function(m){ var v=mm(a,m); return v==null?'':f1(v); })).concat([a.med==null?'':f1(a.med)]); })); }
    }
    else if(id==='atencao'){
      var L5=[]; A.forEach(function(a){ var mot=[];
        var porM={}; N.filter(function(n){ return n.aluno===a; }).forEach(function(n){ (porM[n.materia]=porM[n.materia]||[]).push(n.v); });
        var baixas=Object.keys(porM).filter(function(m){ return media(porM[m])<6; }); if(baixas.length) mot.push('média abaixo de 6 em '+baixas.join(', '));
        var d=dias(a.ultimo_acesso); if(!a.entrou) mot.push('ainda não entrou no app'); else if(d==null||d>14) mot.push(d==null?'sem acesso registrado':'sem usar o app há '+d+' dias');
        if(a.entrou&&+a.sim_gerados===0) mot.push('nunca fez simulado'); else if(+a.sim_gerados>+a.sim_feitos) mot.push('gerou simulado e não respondeu');
        if(+a.avisos>=3&&pc(+a.avisos_lidos,+a.avisos)<50) mot.push('leu menos da metade dos avisos');
        if(+a.resp===0) mot.push('sem responsável cadastrado');
        if(mot.length) L5.push({a:a,m:mot}); });
      L5.sort(function(x,y){ return y.m.length-x.m.length||x.a.nome.localeCompare(y.a.nome); });
      h='<p class="rl-dim">Alunos com algum sinal de alerta, dos que têm mais motivos para os que têm menos.</p>'
        +tabela('atencao',[['Aluno'],['Turma'],['Motivos'],['Qtd.','n']],L5.map(function(x){ return [E(x.a.nome),E(x.a.turma),'<span style="white-space:normal">'+E(x.m.join(' · '))+'</span>',x.m.length]; }),L5.map(function(x){ return [x.a.nome,x.a.turma,x.m.join(' · '),x.m.length]; }));
    }
    else if(id==='engaj'){
      var cat=function(a){ var d=dias(a.ultimo_acesso); return !a.entrou?'4 Nunca entrou':(d==null||d>30?'3 Parado (mais de 30 dias)':(d>7?'2 Morno (8 a 30 dias)':'1 Ativo (até 7 dias)')); };
      var g6=grupo(A,N,S,cat).map(function(o){ return {h:[E(o.k.slice(2)),o.A.length,barraP(pc(o.A.length,A.length))],c:[o.k.slice(2),o.A.length,pc(o.A.length,A.length)]}; });
      h=tabela('engaj',[['Situação'],['Alunos','n'],['%']],g6.map(function(x){ return x.h; }),g6.map(function(x){ return x.c; }));
      var L6=A.slice().sort(function(x,y){ return (dias(y.ultimo_acesso)==null?1e9:dias(y.ultimo_acesso))-(dias(x.ultimo_acesso)==null?1e9:dias(x.ultimo_acesso)); });
      h+='<div class="rl-h">Por aluno</div>'+tabela('engaj2',[['Aluno'],['Turma'],['Último acesso'],['Dias de uso (30 dias)','n'],['Simulados feitos','n'],['Avisos lidos','n']],
        L6.map(function(a){ var d=dias(a.ultimo_acesso); return [E(a.nome),E(a.turma),!a.entrou?'<span class="rl-red">nunca entrou</span>':(d==null?'–':(d===0?'hoje':'há '+d+' dia'+(d===1?'':'s'))),+a.acessos_30d||0,+a.sim_feitos||0,(+a.avisos_lidos||0)+' de '+(+a.avisos||0)]; }),
        L6.map(function(a){ var d=dias(a.ultimo_acesso); return [a.nome,a.turma,!a.entrou?'nunca entrou':(d==null?'':d+' dias'),+a.acessos_30d||0,+a.sim_feitos||0,(+a.avisos_lidos||0)+' de '+(+a.avisos||0)]; }));
    }
    else if(id==='familia'){
      var g7=grupo(A,N,S,function(a){ return a.turma; }).map(function(o){ var sr=o.A.filter(function(a){ return +a.resp===0; }).length, ne=o.A.filter(function(a){ return +a.resp>0&&+a.resp_entraram===0; }).length, ok=o.A.filter(function(a){ return +a.resp_entraram>0; }).length;
        return {h:[E(o.k),o.A.length,ok+' ('+(pc(ok,o.A.length)||0)+'%)',ne,sr?'<span class="rl-red">'+sr+'</span>':'0'],c:[o.k,o.A.length,ok,ne,sr]}; });
      h=tabela('familia',[['Turma'],['Alunos','n'],['Com família no app','n'],['Responsável cadastrado, mas não entrou','n'],['Sem responsável cadastrado','n']],g7.map(function(x){ return x.h; }),g7.map(function(x){ return x.c; }));
      var pend=A.filter(function(a){ return +a.resp_entraram===0; });
      h+='<div class="rl-h">Alunos sem família no app</div>'+tabela('familia2',[['Aluno'],['Turma'],['Situação']],pend.map(function(a){ return [E(a.nome),E(a.turma),+a.resp===0?'sem responsável cadastrado':'convite do responsável não usado']; }),pend.map(function(a){ return [a.nome,a.turma,+a.resp===0?'sem responsável cadastrado':'convite do responsável não usado']; }));
    }
    else if(id==='aniv'){
      var mes=+(ctx.mes||new Date().getMonth()+1);
      var L8=A.filter(function(a){ return a.nascimento&&+String(a.nascimento).split('-')[1]===mes; }).sort(function(x,y){ return +x.nascimento.split('-')[2]-+y.nascimento.split('-')[2]; });
      h='<div class="rl-f"><select data-rlmes>'+MESES.map(function(m,i){ return '<option value="'+(i+1)+'"'+(i+1===mes?' selected':'')+'>'+m[0].toUpperCase()+m.slice(1)+'</option>'; }).join('')+'</select></div>'
        +tabela('aniv',[['Dia','n'],['Aluno'],['Turma'],['Faz','n']],L8.map(function(a){ return [a.nascimento.split('-')[2],E(a.nome),E(a.turma),(a.idade+(new Date().getMonth()+1<mes||(new Date().getMonth()+1===mes&&new Date().getDate()<+a.nascimento.split('-')[2])?1:0))+' anos']; }),
          L8.map(function(a){ return [a.nascimento.split('-')[2],a.nome,a.turma,dm(a.nascimento)]; }));
    }
    return h;
  }

  // desenha tudo dentro de el; o estado (aba, filtros) fica guardado no próprio elemento
  window.BDRelatorios={ desenhar:function(el,D,nomeEscola){
    css();
    var P=prepara(D), st=el._rl||(el._rl={aba:'geral',esc:'*',disc:'',mes:0});
    var cursos=[]; P.A.forEach(function(a){ if(a.curso!=='Sem curso'&&cursos.indexOf(a.curso)<0) cursos.push(a.curso); }); cursos.sort(function(x,y){ return x.localeCompare(y,'pt',{numeric:true}); });
    var mats=[]; P.N.concat(P.S).forEach(function(n){ if(mats.indexOf(n.materia)<0) mats.push(n.materia); }); mats.sort();
    var F=filtra(P,st.esc,st.disc);
    var h='<div class="rl-f"><select data-rlesc><option value="*">🏫 Colégio inteiro</option>'
      +(cursos.length?'<optgroup label="Curso">'+cursos.map(function(c){ return '<option value="c:'+E(c)+'"'+(st.esc==='c:'+c?' selected':'')+'>🎓 '+E(c)+'</option>'; }).join('')+'</optgroup>':'')
      +'<optgroup label="Turma">'+(D.turmas||[]).map(function(t){ return '<option value="t:'+t.id+'"'+(st.esc==='t:'+t.id?' selected':'')+'>🏷️ '+E(t.nome)+'</option>'; }).join('')+'</optgroup></select>'
      +'<select data-rldisc><option value="">📚 Todas as disciplinas</option>'+mats.map(function(m){ return '<option'+(st.disc===m?' selected':'')+'>'+E(m)+'</option>'; }).join('')+'</select></div>'
      +'<div class="rl-abas">'+ABAS.map(function(a){ return '<button type="button" data-rlaba="'+a[0]+'"'+(st.aba===a[0]?' class="on"':'')+'>'+a[1]+'</button>'; }).join('')+'</div>';
    CSV={};
    h+=abas(st.aba,P,F,st)+'<p class="rl-dim" style="margin-top:8px">Notas convertidas para a escala de 0 a 10. Dados de '+new Date(D.gerado_em||Date.now()).toLocaleString('pt-BR')+'.</p>';
    el.innerHTML=h;
    if(!el._rlOk){ el._rlOk=true;
      el.addEventListener('click',function(e){ var b=e.target.closest('[data-rlaba]'); if(b){ el._rl.aba=b.getAttribute('data-rlaba'); window.BDRelatorios.desenhar(el,el._rlD,el._rlN); return; }
        var c=e.target.closest('[data-rlcsv]'); if(c){ var ab=ABAS.filter(function(a){ return a[0]===el._rl.aba; })[0]; baixa(c.getAttribute('data-rlcsv'),'relatorio-'+String(el._rlN||'escola').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').toLowerCase()+'-'+c.getAttribute('data-rlcsv')); } });
      el.addEventListener('change',function(e){ var t=e.target;
        if(t.hasAttribute('data-rlesc')) el._rl.esc=t.value; else if(t.hasAttribute('data-rldisc')) el._rl.disc=t.value; else if(t.hasAttribute('data-rlmes')) el._rl.mes=+t.value; else return;
        window.BDRelatorios.desenhar(el,el._rlD,el._rlN); });
    }
    el._rlD=D; el._rlN=nomeEscola;
  }};
})();
