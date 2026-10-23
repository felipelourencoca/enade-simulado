"""Testes de integração Chromium. A rota em memória emula arquivos estáticos locais;
nenhum backend da aplicação nem dependência para uso pelo estudante.
Requer Python Playwright e Chromium apenas para executar os testes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse, unquote
import json, csv, mimetypes, re, fitz, base64

ROOT=Path(__file__).resolve().parents[1]
URL='https://enade.test.local/index.html'

def go():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  context=browser.new_context(accept_downloads=True,viewport={'width':1370,'height':900},device_scale_factor=1)
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  html=(ROOT/'index.html').read_text(encoding='utf-8')
  html=re.sub(r'<link rel="stylesheet" href="style\.css">','',html)
  html=re.sub(r'<script src="(?:questions|script)\.js"></script>','',html)
  bank=json.loads((ROOT/'questions.json').read_text())
  for question in bank['questions']:
   for key in ('images','modelImages'):
    if key not in question:continue
    new=[]
    for img_path in question[key]:
     new.append('data:image/jpeg;base64,'+base64.b64encode((ROOT/img_path).read_bytes()).decode('ascii'))
    question[key]=new
  def boot(saved=None):
   page.goto('about:blank')
   page.set_content(html)
   page.add_style_tag(content=(ROOT/'style.css').read_text(encoding='utf-8'))
   page.evaluate("""data=>{window.__store={...data};Object.defineProperty(window,'localStorage',{configurable:true,value:{
       getItem:k=>Object.prototype.hasOwnProperty.call(window.__store,k)?window.__store[k]:null,
       setItem:(k,v)=>{window.__store[k]=String(v)},removeItem:k=>delete window.__store[k]
   }});}""",saved or {})
   page.evaluate('window.ENADE_BANK = '+json.dumps(bank,ensure_ascii=False))
   page.add_script_tag(content=(ROOT/'script.js').read_text(encoding='utf-8'))
  boot()
  assert page.title()=='Simulado ENADE ADS 2021 — Prova e Gabarito'
  assert page.locator('#studentName').get_attribute('required') is not None
  page.locator('#studentName').fill('Maria Teste')
  page.locator('#studentClass').fill('ADS 6º semestre')
  page.locator('#studentCode').fill('RA 000123')
  page.screenshot(path=str(ROOT/'tests'/'captura-inicio.png'),full_page=False)
  page.locator('#startBtn').click()
  assert page.locator('#exam').is_visible()
  assert page.locator('#finishBtn').is_disabled()
  page.locator('#viewPending').click()
  assert page.locator('#pendingLinks button').count()==40
  page.locator('#essayInput').fill('A liberdade de manifestação artística é protegida pela Constituição; duas ações educativas: encontros e visita a museus.')
  page.locator('#nextQuestion').click()
  page.locator('#essayInput').fill('Uma cidade inteligente reduz emissões e otimiza transporte público; criar plataforma de caronas.')
  page.locator('#nextQuestion').click()
  page.get_by_role('radio',name='Alternativa E').check()
  assert page.locator('#progressLabel').inner_text()=='3 de 40 respondidas'
  page.locator('#prevQuestion').click()
  page.locator('#prevQuestion').click()
  page.locator('#nextQuestion').click()
  page.locator('#nextQuestion').click()
  assert page.get_by_role('radio',name='Alternativa E').is_checked()
  page.screenshot(path=str(ROOT/'tests'/'captura-questao.png'),full_page=False)
  # Persistência parcial após reinício da página.
  saved=page.evaluate('window.__store')
  boot(saved)
  assert page.locator('#resumeMessage').is_visible()
  page.locator('#startBtn').click()
  assert page.locator('#progressLabel').inner_text()=='3 de 40 respondidas'
  qs=page.evaluate('window.ENADE_BANK.questions.map(q=>({id:q.id,type:q.type,correct:q.correct}))')
  for q in qs:
   page.locator(f'[data-go="{q["id"]}"]').click()
   if q['type']=='objective':
    letter = 'B' if q['id']=='Q35' else q['correct']
    page.get_by_role('radio',name=f'Alternativa {letter}').check()
   else:
    if q['id'] not in ('D1','D2'):
     text='Resposta completa para o professor.\nLinha com código: x = 5;\nMétodo UML associado ao problema de avaliação.\nFim.'
     page.locator('#essayInput').fill(text)
  assert page.locator('#progressLabel').inner_text()=='40 de 40 respondidas'
  assert page.locator('#finishBtn').is_enabled()
  page.locator('#finishBtn').click()
  assert page.locator('#confirmDialog').is_visible()
  page.locator('#cancelFinish').click()
  assert page.locator('#exam').is_visible()
  page.locator('#finishBtn').click();page.locator('#confirmFinish').click()
  assert page.locator('#results').is_visible()
  assert '97,1%' in page.locator('#scoreSummary').inner_text()
  assert page.locator('#reviewList details.review-item').count()==40
  page.evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:0,behavior:'instant'})")
  page.wait_for_timeout(150)
  page.screenshot(path=str(ROOT/'tests'/'captura-resultados.png'),full_page=False)
  # Download e validação de todos os 40 registros incluindo textos discursivos multilinha.
  with page.expect_download() as download:page.locator('#exportCsv').click()
  data=Path(download.value.path()).read_text(encoding='utf-8-sig')
  csv.field_size_limit(40_000_000) # Os recursos de imagem do teste estão em data: URIs, ao contrário dos caminhos relativos do produto final.
  matrix=list(csv.reader(data.splitlines(keepends=True),delimiter=';',quotechar='"'))
  assert len(matrix)==41,(len(matrix),matrix[:2])
  assert all(len(row)==len(matrix[0]) for row in matrix)
  assert any('x = 5' in row[12] for row in matrix[1:])
  assert any(row[13]=='A' and row[12]=='B' and row[14]=='Errou' for row in matrix[1:])
  with page.expect_download() as download:page.locator('#exportMd').click()
  markdown=Path(download.value.path()).read_text(encoding='utf-8')
  assert markdown.count('## Questão ')==35 and markdown.count('## Discursiva ')==5
  assert 'Maria Teste' in markdown and 'x = 5;' in markdown
  with page.expect_download() as download:page.locator('#exportJson').click()
  payload=json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
  assert len(payload['answers'])==40 and payload['scores']['correct']==34
  assert payload['header']['matricula']=='RA 000123'
  assert sum(q['type']=='discursive' for q in payload['answers'])==5
  page.locator('#exportPdf').click()
  assert page.locator('#teacherReport').is_visible()
  assert page.locator('#printDocument article.report-question').count()==40
  assert page.locator('#printDocument img.report-img').count()==52
  assert page.evaluate("[...document.querySelectorAll('#printDocument img')].every(i => i.complete && i.naturalWidth>0)")
  pdf_file=ROOT/'tests'/'relatorio-teste.pdf'
  page.pdf(path=str(pdf_file),format='A4',print_background=True,prefer_css_page_size=True)
  pdf=fitz.open(pdf_file)
  assert len(pdf)>=40,len(pdf)
  all_text=' '.join(pg.get_text() for pg in pdf)
  for term in ['Maria Teste','RA 000123','Discursiva D5','Questão 35','x = 5','Gabarito definitivo oficial']:
   assert term in all_text,term
  assert sum(bool(pg.get_images(full=True)) for pg in pdf)>=40,'Insufficient image pages'
  print('PDF pages generated',len(pdf))
  pdf.close()
  pdf_file.unlink()
  page.locator('#backReport').click()
  assert page.locator('#results').is_visible()
  saved=page.evaluate('window.__store')
  boot(saved)
  assert page.locator('#results').is_visible()
  # iniciar nova tentativa, histórico da anterior mantém-se e não contamina novo desempenho
  page.once('dialog',lambda dialog:dialog.accept())
  page.locator('#newAttempt').click()
  assert page.locator('#welcome').is_visible()
  assert page.locator('#historyList .history-item').count()==1
  page.locator('#studentName').fill('João Segundo')
  page.locator('#startBtn').click()
  assert page.locator('#progressLabel').inner_text()=='0 de 40 respondidas'
  assert page.locator('#finishBtn').is_disabled()
  for q in qs:
   page.locator(f'[data-go="{q["id"]}"]').click()
   if q['type']=='objective':
    letter = 'B' if q['id'] in ('Q35','Q01') else q['correct']
    page.get_by_role('radio',name=f'Alternativa {letter}').check()
   else:page.locator('#essayInput').fill('Resposta integral da segunda tentativa.\nLinha de código e explicação.')
  page.locator('#finishBtn').click();page.locator('#confirmFinish').click()
  assert '94,3%' in page.locator('#scoreSummary').inner_text()
  with page.expect_download() as download:page.locator('#exportJson').click()
  newer=json.loads(Path(download.value.path()).read_text('utf-8'))
  assert newer['scores']['correct']==33
  assert newer['header']['id']!=payload['header']['id']
  page.once('dialog',lambda dialog:dialog.accept())
  page.locator('#newAttempt').click()
  assert page.locator('#historyList .history-item').count()==2
  page.locator('#historyList [data-history]').last.click()
  assert '97,1%' in page.locator('#scoreSummary').inner_text()
  page.set_viewport_size({'width':390,'height':844})
  page.once('dialog',lambda dialog:dialog.accept())
  page.locator('#newAttempt').click()
  page.locator('#startBtn').click()
  assert page.locator('#exam').is_visible()
  page.locator('#questionPanel').scroll_into_view_if_needed()
  page.screenshot(path=str(ROOT/'tests'/'captura-celular.png'),full_page=False)
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
  assert not errors,errors
  browser.close()
  print('OK: 40 respostas, CSV/MD/JSON, PDF impresso, 52 imagens, histórico independente e restauro da tentativa, cálculo e proteção contra prematuridade.')

if __name__=='__main__':go()
