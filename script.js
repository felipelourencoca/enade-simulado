/* ENADE ADS 2021 — HTML/CSS/JavaScript, sem bibliotecas e sem servidor.
   Histórico local é auxiliar; o relatório PDF exportado constitui a cópia para entrega. */
'use strict';
const KEY_ACTIVE='enade_ads_2021_active_v2';
const KEY_HISTORY='enade_ads_2021_history_v2';
const MAX_HISTORY=15;
const LETTERS=Object.freeze(['A','B','C','D','E']);
const ORDER=Object.freeze(['D1','D2',...Array.from({length:8},(_,i)=>'Q'+String(i+1).padStart(2,'0')),
  'D3','D4','D5',...Array.from({length:27},(_,i)=>'Q'+String(i+9).padStart(2,'0'))]);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isAnswered(q,a){return q.type==='objective'?LETTERS.includes(a):(typeof a==='string'&&a.trim().length>0);}
function pending(qs,answers){return qs.filter(q=>!isAnswered(q,answers?.[q.id]));}
function grade(qs,answers){
  const eligible=qs.filter(q=>q.type==='objective'&&q.status==='Válida');
  const byGroup={},byArea={};let correct=0;
  for(const q of eligible){const right=answers?.[q.id]===q.correct;correct+=Number(right);
    for(const [out,k] of [[byGroup,q.group],[byArea,q.area]]){
      if(!out[k])out[k]={total:0,correct:0};out[k].total++;out[k].correct+=Number(right);
    }
  }
  return {total:eligible.length,correct,incorrect:eligible.length-correct,
    percentage:eligible.length?100*correct/eligible.length:0,byGroup,byArea};
}
function makeOrder(qs){const map=new Map(qs.map(q=>[q.id,q]));if(map.size!==ORDER.length||ORDER.some(id=>!map.has(id)))throw Error('Banco de questões incompleto.');return ORDER.map(id=>map.get(id));}
function fmtPercent(n){return Number(n).toFixed(1).replace('.',',')+'%';}
function fmtDate(s){try{return new Date(s).toLocaleString('pt-BR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return s||'';}}
function safeFilename(s){return String(s??'aluno').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-+$/g,'').slice(0,50).toLowerCase()||'aluno';}
function csvCell(x){let s=String(x??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csvData(report){
  const cols=['ID da tentativa','Estudante','Turma','Matrícula (opcional)','Início','Conclusão','Questão','Título','Tipo','Componente','Área','Origem','Resposta integral do estudante','Gabarito oficial','Situação','Comentário','Critérios discursivos','Enunciado (transcrição auxiliar)','Páginas do caderno','Imagens originais','Imagens do padrão oficial'];
  const rows=report.answers.map(q=>[report.header.id,report.header.studentName,report.header.turma,report.header.matricula,
    report.header.startedAt,report.header.completedAt,q.originalNumber,q.title,q.type,q.group,q.area,q.origin,
    q.studentAnswer,q.correctAnswer??'',q.result,q.explanation,q.modelText,q.transcript,q.sourcePages.join(','),q.images.join(';'),q.modelImages.join(';')]);
  return '\ufeff'+[cols,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
function codeFence(s){const n=Math.max(2,...(String(s).match(/`+/g)||[]).map(x=>x.length))+1;const fence='`'.repeat(n);return fence+'text\n'+s+'\n'+fence;}
function markdownData(r){
  const h=r.header,s=r.scores;
  const out=[`# Gabarito completo respondido — ENADE ADS 2021`,``,
    `**Estudante:** ${h.studentName}  `,`**Turma:** ${h.turma||'Não informada'}  `,
    `**Matrícula:** ${h.matricula||'Não informada'}  `,`**ID da tentativa:** ${h.id}  `,
    `**Início:** ${fmtDate(h.startedAt)}  `,`**Conclusão:** ${fmtDate(h.completedAt)}  `,
    `**Objetivas:** ${s.correct}/${s.total} acertos, ${s.incorrect} erros, ${fmtPercent(s.percentage)} de aproveitamento.  `,
    `**Discursivas:** 5 respostas registradas; aguardam correção humana.`,``,
    `> Resultado do simulado, não é nota oficial do ENADE. A transcrição textual pode ser imperfeita em diagramas e tabelas; utilize o PDF ilustrado para a análise integral.`,``,
    `## Desempenho por componente`];
  for(const [name,score] of Object.entries(s.byGroup))out.push(`- ${name}: ${score.correct}/${score.total} (${fmtPercent(100*score.correct/score.total)})`);
  for(const q of r.answers){out.push('','---','',`## ${q.type==='objective'?'Questão':'Discursiva'} ${q.originalNumber} — ${q.title}`,'',
    `**Componente:** ${q.group} | **Área:** ${q.area} | **Situação:** ${q.result}`,'',
    `**Origem:** ${q.origin}. Página(s) ${q.sourcePages.join(', ')}.`,'',
    `### Enunciado (transcrição auxiliar)`,'',q.transcript||'Consultar a imagem original no PDF do relatório.','');
    if(q.type==='objective')out.push(`**Resposta do estudante:** ${q.studentAnswer}  `,`**Gabarito definitivo do INEP:** ${q.correctAnswer}`,'',
      `### Comentário pedagógico`,q.explanation,'');
    else out.push('### Resposta integral escrita pelo estudante','',codeFence(q.studentAnswer),'',
      '### Síntese dos critérios para avaliação manual',q.modelText,'');
    if(q.caveat)out.push('**Ressalva documental:** '+q.caveat,'');
    out.push('*Recortes visuais e padrões oficiais completos estão disponíveis no relatório PDF. Arquivos de imagem não estão incorporados neste Markdown.*');
  }
  return out.join('\n')+'\n';
}
function reportData(rec,qs){const scores=grade(qs,rec.answers);return {
  schema:'enade-ads-2021-relatorio-v2',
  header:{id:rec.id,exam:'Simulado ENADE 2021 — ADS (não oficial)',studentName:rec.student.name,
    turma:rec.student.turma||'',matricula:rec.student.matricula||'',startedAt:rec.startedAt,completedAt:rec.completedAt,
    scoring:'100 × acertos objetivos / 35; discursivas sem correção automática; não equivale à nota oficial ENADE'},
  scores,
  answers:qs.map(q=>({id:q.id,originalNumber:q.originalNumber,title:q.title,type:q.type,group:q.group,
    area:q.area,origin:q.origin,status:q.status,sourcePages:q.sourcePages,transcript:q.transcript,
    images:q.images,studentAnswer:String(rec.answers[q.id]??''),correctAnswer:q.type==='objective'?q.correct:null,
    result:q.type==='objective'?(rec.answers[q.id]===q.correct?'Acertou':'Errou'):'Discursiva — requer avaliação docente',
    explanation:q.explanation||'',modelText:q.modelText||'',modelImages:q.modelImages||[],caveat:q.caveat||''}))};
}
if(typeof module!=='undefined'&&module.exports){module.exports={ORDER,esc,isAnswered,pending,grade,makeOrder,fmtPercent,csvData,markdownData,reportData};}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
(function(){
  const bank=window.ENADE_BANK;
  if(!bank?.questions){document.body.textContent='Não foi possível carregar questions.js; mantenha os arquivos no mesmo diretório.';return;}
  const qs=makeOrder(bank.questions),idMap=Object.fromEntries(qs.map(q=>[q.id,q]));
  const $=id=>document.getElementById(id);
  let active=load(KEY_ACTIVE,null),history=load(KEY_HISTORY,[]),selected=null,current=0;
  history=Array.isArray(history)?history.filter(validFinished).slice(-MAX_HISTORY):[];
  if(!validActive(active))active=null;
  if(active)current=Math.max(0,Math.min(39,Number(active.current)||0));
  function load(k,fallback){try{const v=JSON.parse(localStorage.getItem(k));return v??fallback;}catch{return fallback;}}
  function store(k,obj){try{localStorage.setItem(k,JSON.stringify(obj));return true;}catch{return false;}}
  function del(k){try{localStorage.removeItem(k);}catch{}}
  function validActive(x){return x&&typeof x.id==='string'&&x.answers&&x.student&&['in-progress','finished'].includes(x.status);}
  function validFinished(x){return validActive(x)&&x.status==='finished'&&qs.every(q=>isAnswered(q,x.answers[q.id]));}
  function uid(){return `ADS2021-${Date.now().toString(36)}-${(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10))}`;}
  function currentRecord(){return selected||active;}
  function saveActive(){if(active)store(KEY_ACTIVE,active);}
  function saveHistory(){const success=store(KEY_HISTORY,history.slice(-MAX_HISTORY));if(!success)alert('O navegador não conseguiu gravar o histórico. Exporte o relatório completo para manter uma cópia.');}
  function show(screen){['welcome','exam','results','teacherReport'].forEach(id=>$(id).hidden=id!==screen);window.scrollTo(0,0);}
  function displayTitle(q){return q.type==='objective'?'Questão '+q.originalNumber:'Discursiva '+q.id;}
  function label(q){return q.type==='objective'?String(q.originalNumber):q.id;}
  function allImages(paths,q,what){return (paths||[]).map((path,i)=>`<div class="question-image"><img src="${esc(path)}" alt="${esc(what)} de ${esc(displayTitle(q))}, parte ${i+1} de ${paths.length}" loading="${i===0?'eager':'lazy'}"></div><div class="image-meta"><span>Imagem ${i+1} de ${paths.length} • Fonte oficial</span><a href="${esc(path)}" target="_blank" rel="noopener">Abrir ampliada ↗</a></div>`).join('');}
  function transcript(q){return q.transcript?`<details class="transcription"><summary>Transcrição textual auxiliar do PDF (diagramas podem exigir a imagem)</summary><pre>${esc(q.transcript)}</pre></details>`:'';}
  function fillWelcome(){if(active?.status==='in-progress'){
      $('studentName').value=active.student.name;$('studentClass').value=active.student.turma||'';$('studentCode').value=active.student.matricula||'';
      $('startBtn').textContent='Retomar simulado →';$('resumeMessage').hidden=false;
    }else{$('resumeMessage').hidden=true;$('startBtn').textContent='Iniciar simulado →';}
    renderHistory();show('welcome');}
  function start(e){e.preventDefault();const name=$('studentName').value.trim();if(!name){$('studentName').focus();return;}
    const student={name,turma:$('studentClass').value.trim(),matricula:$('studentCode').value.trim()};
    if(active?.status==='in-progress'){active.student=student;saveActive();}
    else{active={id:uid(),startedAt:new Date().toISOString(),completedAt:null,status:'in-progress',student,answers:{},current:0};current=0;saveActive();}
    selected=null;show('exam');drawExam();}
  function drawExam(){if(!active||active.status!=='in-progress')return;
    $('examStudent').textContent=active.student.name+(active.student.turma?' • '+active.student.turma:'');
    drawQuestion();updateProgress();}
  function drawQuestion(){const q=qs[current];$('positionLabel').textContent=`Item ${current+1} de 40`;
    $('prevQuestion').disabled=current===0;$('nextQuestion').disabled=current===39;
    $('questionPanel').innerHTML=`<div class="question-top"><span class="question-number">${esc(displayTitle(q))} • ${esc(q.group)}</span><span class="source-tag">Questão oficial • ENADE 2021</span></div>
      <h2 id="questionTitle" tabindex="-1">${esc(q.title)}</h2><div class="question-tags"><span>${esc(q.area)}</span><span>${q.type==='objective'?'Objetiva':'Discursiva'}</span><span>Dificuldade estimada: ${esc(q.difficulty)}</span></div>
      <div class="source-intro"><strong>Enunciado e alternativas originais</strong><span>Página(s) ${q.sourcePages.join(', ')}</span></div>
      ${allImages(q.images,q,'Enunciado oficial e alternativas')}<p class="answer-help">Em telas pequenas, deslize horizontalmente a imagem ou abra-a ampliada.</p>${transcript(q)}
      <div class="answer-block">${q.type==='objective'?`<fieldset style="margin:0;padding:0;border:0"><legend style="font-weight:800;color:var(--navy);margin-bottom:12px">Selecione sua alternativa</legend><div class="choices">${LETTERS.map(c=>`<label class="choice"><input type="radio" name="answer" value="${c}" aria-label="Alternativa ${c}" ${active.answers[q.id]===c?'checked':''}><span>${c}</span></label>`).join('')}</div><p class="answer-help">Selecione uma única alternativa entre A e E, conforme o enunciado acima.</p></fieldset>`:
      `<label for="essayInput" class="essay-label">Sua resposta discursiva</label><textarea class="essay-field" id="essayInput" rows="8" placeholder="Registre sua resposta, pseudocódigo, código-fonte ou descrição de diagrama UML conforme a orientação do enunciado.">${esc(active.answers[q.id]||'')}</textarea><p class="answer-help">O preenchimento é obrigatório; sua qualidade será avaliada pelo professor. O texto integral será preservado no relatório.</p>`}</div>`;
    if(q.type==='objective')$('questionPanel').querySelectorAll('input[name="answer"]').forEach(r=>r.addEventListener('change',()=>{
      active.answers[q.id]=r.value;saveActive();updateProgress();}));
    else $('essayInput').addEventListener('input',e=>{active.answers[q.id]=e.target.value;saveActive();updateProgress();});
  }
  function drawMap(){const groups=[['Formação Geral — discursivas',['D1','D2']],['Formação Geral — objetivas',qs.filter(q=>q.group==='Formação Geral'&&q.type==='objective').map(q=>q.id)],
     ['Componente Específico — discursivas',['D3','D4','D5']],['Componente Específico — objetivas',qs.filter(q=>q.group==='Componente Específico'&&q.type==='objective').map(q=>q.id)]];
    $('questionMap').innerHTML=groups.map(([name,ids])=>`<section class="map-group"><h3>${esc(name)}</h3><div class="map-buttons">${ids.map(id=>{
       const q=idMap[id],answered=isAnswered(q,active.answers[id]);return `<button class="map-button" type="button" data-go="${esc(id)}" data-answered="${answered}" ${qs[current].id===id?'aria-current="step"':''} aria-label="${esc(displayTitle(q))}: ${answered?'respondida':'pendente'}">${esc(label(q))}</button>`;}).join('')}</div></section>`).join('');
    $('questionMap').querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));}
  function updateProgress(){const pend=pending(qs,active.answers),done=qs.length-pend.length;
    $('progressLabel').textContent=`${done} de 40 respondidas`;$('progressPercentage').textContent=`${Math.round(done/40*100)}%`;
    $('progressBar').setAttribute('aria-valuenow',String(done));$('progressFill').style.width=done/40*100+'%';
    $('objectiveProgress').textContent=`Objetivas: ${qs.filter(q=>q.type==='objective'&&isAnswered(q,active.answers[q.id])).length}/35`;
    $('discursiveProgress').textContent=`Discursivas: ${qs.filter(q=>q.type==='discursive'&&isAnswered(q,active.answers[q.id])).length}/5`;
    $('pendingNumber').textContent=pend.length;$('finishBtn').disabled=pend.length!==0;
    $('finishHint').textContent=pend.length?`Faltam ${pend.length} ${pend.length===1?'resposta obrigatória':'respostas obrigatórias'} para finalizar.`:'Todas as questões foram preenchidas. Você já pode finalizar.';
    drawMap();if(!$('pendingSection').hidden)drawPending(pend);
  }
  function drawPending(pend=pending(qs,active.answers)){
    $('pendingTitle').textContent=pend.length?`Questões pendentes (${pend.length})`:'Nenhuma pendência';
    $('pendingLinks').innerHTML=pend.map(q=>`<button type="button" data-to="${esc(q.id)}">${esc(displayTitle(q))}</button>`).join('');
    $('pendingLinks').querySelectorAll('[data-to]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.to)));
  }
  function go(id){const index=qs.findIndex(q=>q.id===id);if(index===-1||!active||active.status!=='in-progress')return;
    current=index;active.current=index;saveActive();drawQuestion();updateProgress();
    $('questionPanel').scrollIntoView({block:'start',behavior:'instant'});$('questionTitle').focus({preventScroll:true});}
  function openFinish(){const pend=pending(qs,active.answers);if(pend.length){$('pendingSection').hidden=false;drawPending(pend);$('pendingSection').scrollIntoView();return;}
    $('confirmDialog').showModal();}
  function complete(){if(!active||pending(qs,active.answers).length)return;
    active.status='finished';active.completedAt=new Date().toISOString();saveActive();
    history=history.filter(x=>x.id!==active.id);history.push(JSON.parse(JSON.stringify(active)));history=history.slice(-MAX_HISTORY);saveHistory();
    selected=JSON.parse(JSON.stringify(active));$('confirmDialog').close();openResults(selected);}
  function drawBars(target,obj){$(target).innerHTML=Object.entries(obj).sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([name,x])=>{
    const pct=x.total?100*x.correct/x.total:0;return `<div class="bar-item"><div class="bar-name"><strong>${esc(name)}</strong><span>${x.correct}/${x.total} • ${fmtPercent(pct)}</span></div><div class="bar-bg" role="img" aria-label="${esc(name)}, ${x.correct} de ${x.total} acertos"><div class="bar-fg" style="width:${pct}%"></div></div></div>`;}).join('');}
  function openResults(rec){if(!validFinished(rec))return;selected=JSON.parse(JSON.stringify(rec));show('results');
    const scores=grade(qs,selected.answers);$('resultsStudent').textContent=`${selected.student.name}${selected.student.turma?' • '+selected.student.turma:''} • Concluída em ${fmtDate(selected.completedAt)}`;
    $('scoreSummary').innerHTML=`<div class="stat primary"><span>Aproveitamento das objetivas</span><strong>${fmtPercent(scores.percentage)}</strong><small>Não é nota oficial do ENADE</small></div>
      <div class="stat"><span>Questões objetivas válidas</span><strong>${scores.total}</strong></div><div class="stat"><span>Acertos</span><strong>${scores.correct}</strong></div><div class="stat"><span>Erros</span><strong>${scores.incorrect}</strong></div>`;
    drawBars('groupResults',scores.byGroup);drawBars('areaResults',scores.byArea);
    $('reviewList').innerHTML=qs.map(q=>{
      const r=selected.answers[q.id],essay=q.type==='discursive',right=r===q.correct;
      return `<details class="review-item"><summary><span class="review-icon ${essay?'essay':right?'correct':'wrong'}" aria-hidden="true">${essay?'✎':right?'✓':'×'}</span><span class="review-label"><strong>${esc(displayTitle(q))} — ${esc(q.title)}</strong><span>${esc(q.group)} • ${esc(q.area)}</span></span><span class="review-outcome">${essay?'Avaliação manual':right?'Acertou':'Errou'}</span></summary>
        <div class="review-body">${essay?`<h3>Resposta integral do estudante</h3><div class="answer-text">${esc(r)}</div><h3>Critérios de avaliação</h3><p>${esc(q.modelText)}</p><h3>Padrão oficial de resposta</h3>${allImages(q.modelImages,q,'Padrão oficial de resposta')}`:
          `<div class="review-stats"><span>Sua resposta: <b>${esc(r)}</b></span><span>Gabarito definitivo: <b>${esc(q.correct)}</b></span></div><h3>Comentário pedagógico</h3><p>${esc(q.explanation)}</p>`}
          ${q.caveat?`<div class="caveat"><b>Ressalva documental:</b> ${esc(q.caveat)}</div>`:''}
          <details class="transcription"><summary>Consultar enunciado original com imagens</summary>${allImages(q.images,q,'Enunciado oficial')}${transcript(q)}</details></div></details>`;}).join('');
    $('resultsTitle').tabIndex=-1;$('resultsTitle').focus({preventScroll:true});}
  function renderHistory(){const items=history.slice().reverse();$('historyList').innerHTML=items.length?items.map(item=>{
    const g=grade(qs,item.answers);return `<div class="history-item"><div><strong>${esc(item.student.name)}</strong><span>${esc(fmtDate(item.completedAt))} • ${g.correct}/${g.total} acertos • ${esc(item.student.turma||'Turma não informada')} • ${esc(item.id)}</span></div>
     <button class="button button-outline" type="button" data-history="${esc(item.id)}">Abrir relatório</button></div>`;}).join(''):'<p class="subtle">Ainda não há tentativas concluídas.</p>';
    $('historyList').querySelectorAll('[data-history]').forEach(btn=>btn.addEventListener('click',()=>{const found=history.find(x=>x.id===btn.dataset.history);if(found)openResults(found);}));}
  function reset(){if(!window.confirm('Iniciar uma nova tentativa? Uma tentativa em andamento será descartada. As tentativas já concluídas permanecerão no histórico local.'))return;
    const old=selected?.student||active?.student;active=null;selected=null;current=0;del(KEY_ACTIVE);
    $('studentName').value=old?.name||'';$('studentClass').value=old?.turma||'';$('studentCode').value=old?.matricula||'';
    $('pendingSection').hidden=true;fillWelcome();$('studentName').focus();}
  function exportPayload(){const r=currentRecord();return r&&validFinished(r)?reportData(r,qs):null;}
  function baseName(){const r=currentRecord();return `enade-ads-2021-gabarito-${safeFilename(r.student.name)}-${(r.completedAt||'').slice(0,10)}-${safeFilename(r.id).slice(-12)}`;}
  function download(filename,body,mime){const blob=new Blob([body],{type:mime});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3500);}
  function exportFile(format){const report=exportPayload();if(!report){alert('Selecione uma tentativa concluída para exportar.');return;}
    const name=baseName();if(format==='csv')download(name+'.csv',csvData(report),'text/csv;charset=utf-8');
    if(format==='md')download(name+'.md',markdownData(report),'text/markdown;charset=utf-8');
    if(format==='json')download(name+'.json',JSON.stringify(report,null,2),'application/json;charset=utf-8');}
  function printImage(src,alt){return `<img class="report-img" src="${esc(src)}" loading="eager" alt="${esc(alt)}">`;}
  function drawPrint(report){const {header:h,scores:s}=report;
    const groupRows=Object.entries(s.byGroup).map(([name,g])=>`<tr><td>${esc(name)}</td><td>${g.correct}/${g.total}</td><td>${fmtPercent(100*g.correct/g.total)}</td></tr>`).join('');
    const areaRows=Object.entries(s.byArea).sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([name,g])=>`<tr><td>${esc(name)}</td><td>${g.correct}/${g.total}</td><td>${fmtPercent(100*g.correct/g.total)}</td></tr>`).join('');
    $('printDocument').innerHTML=`<header class="report-header"><p class="eyebrow">RELATÓRIO INDIVIDUAL • PROVA OFICIAL 2021 — CADERNO 28</p><h1 id="teacherTitle">Gabarito completo respondido — ENADE ADS 2021</h1>
       <p><strong>Estudante:</strong> ${esc(h.studentName)}<br><strong>Turma:</strong> ${esc(h.turma||'Não informada')}<br><strong>Matrícula / código:</strong> ${esc(h.matricula||'Não informado')}<br>
       <strong>Identificador da tentativa:</strong> ${esc(h.id)}<br><strong>Início:</strong> ${fmtDate(h.startedAt)}<br><strong>Conclusão:</strong> ${fmtDate(h.completedAt)}</p></header>
       <table class="report-table"><thead><tr><th>Objetivas válidas</th><th>Acertos</th><th>Erros</th><th>Aproveitamento</th></tr></thead><tbody><tr><td>${s.total}</td><td>${s.correct}</td><td>${s.incorrect}</td><td>${fmtPercent(s.percentage)}</td></tr></tbody></table>
       <p class="report-disclaimer">Esta pontuação considera apenas as 35 questões objetivas, com pesos iguais, e não corresponde à nota oficial do ENADE. As cinco discursivas estão transcritas na íntegra e aguardam análise do professor. Os critérios e os comentários pedagógicos não são pareceres oficiais; as imagens do padrão de resposta são do INEP.</p>
       <h2>Desempenho por componente</h2><table class="report-table"><thead><tr><th>Componente</th><th>Acertos</th><th>Percentual</th></tr></thead><tbody>${groupRows}</tbody></table>
       <h2>Desempenho por área (agrupamento pedagógico)</h2><table class="report-table"><thead><tr><th>Área</th><th>Acertos</th><th>Percentual</th></tr></thead><tbody>${areaRows}</tbody></table>
       <p class="report-print-note">Referências: Caderno de Prova ENADE 2021 ADS, Gabarito Definitivo e Padrão de Resposta para as questões discursivas, todos fornecidos com o projeto. Questões e imagens reproduzidas dos documentos oficiais.</p>
       ${report.answers.map(q=>`<article class="report-question"><h2>${q.type==='objective'?'Questão':'Discursiva'} ${esc(q.originalNumber)} — ${esc(q.title)}</h2>
         <p class="report-info"><strong>Componente:</strong> ${esc(q.group)} | <strong>Área:</strong> ${esc(q.area)} | <strong>Fonte:</strong> ${esc(q.origin)} | <strong>Página(s):</strong> ${q.sourcePages.join(', ')}</p>
         <p><span class="report-status">${esc(q.result)}</span></p><h3>Enunciado e alternativas oficiais</h3>
         ${q.images.map(src=>printImage(src,'Enunciado e alternativas originais da questão '+q.originalNumber)).join('')}
         ${q.type==='objective'?`<h3>Resposta registrada pelo estudante</h3><p><strong>Alternativa marcada:</strong> ${esc(q.studentAnswer)}<br><strong>Gabarito definitivo oficial:</strong> ${esc(q.correctAnswer)}</p>
           <h3>Comentário pedagógico (não oficial)</h3><p>${esc(q.explanation)}</p>`:
           `<h3>Resposta integral registrada pelo estudante</h3><div class="report-answer">${esc(q.studentAnswer)}</div>
           <p><strong>Situação:</strong> Aguardando correção humana. Não foi atribuída pontuação automática.</p><h3>Síntese dos critérios para o professor</h3><p>${esc(q.modelText)}</p>
           <h3>Padrão de resposta oficial — INEP</h3>${q.modelImages.map(src=>printImage(src,'Padrão oficial da discursiva '+q.originalNumber)).join('')}`}
         ${q.caveat?`<p class="caveat"><b>Observação da fonte:</b> ${esc(q.caveat)}</p>`:''}
         </article>`).join('')}`;
  }
  function showReport(){const r=exportPayload();if(!r)return;drawPrint(r);show('teacherReport');$('teacherTitle').tabIndex=-1;$('teacherTitle').focus({preventScroll:true});}
  function showPrevious(){show('results');$('resultsTitle').focus({preventScroll:true});}
  $('studentForm').addEventListener('submit',start);
  $('prevQuestion').addEventListener('click',()=>{if(current>0)go(qs[current-1].id);});
  $('nextQuestion').addEventListener('click',()=>{if(current<39)go(qs[current+1].id);});
  $('viewPending').addEventListener('click',()=>{$('pendingSection').hidden=!$('pendingSection').hidden;$('viewPending').setAttribute('aria-expanded',String(!$('pendingSection').hidden));if(!$('pendingSection').hidden){drawPending();$('pendingSection').scrollIntoView({block:'nearest'});}});
  $('finishBtn').addEventListener('click',openFinish);$('cancelFinish').addEventListener('click',()=>$('confirmDialog').close());$('confirmFinish').addEventListener('click',complete);
  $('newAttempt').addEventListener('click',reset);
  $('exportCsv').addEventListener('click',()=>exportFile('csv'));$('exportMd').addEventListener('click',()=>exportFile('md'));$('exportJson').addEventListener('click',()=>exportFile('json'));
  $('exportPdf').addEventListener('click',showReport);$('backReport').addEventListener('click',showPrevious);$('printReport').addEventListener('click',()=>window.print());
  if(active?.status==='finished'&&validFinished(active))openResults(active);else fillWelcome();
})();}
