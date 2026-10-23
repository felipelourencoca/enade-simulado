# Simulado ENADE ADS 2021 — aplicação completa e gabarito individual do professor

Aplicação web estática, em **HTML5 + CSS3 + JavaScript puro**, para aplicação da prova oficial ENADE 2021 de Tecnologia em Análise e Desenvolvimento de Sistemas (caderno 28). Contém **40 questões oficiais**, correção das **35 objetivas** conforme o **gabarito definitivo** e registro das **cinco discursivas** para correção humana. O aluno pode exportar **um relatório integral e identificado com todas as respostas**.

## 1. Execução local

1. Extraia o arquivo `Simulado_ENADE_ADS_2021_Completo.zip` integralmente.
2. Entre na pasta `Simulado_ENADE_ADS_2021_Completo`.
3. Abra o arquivo **`index.html`** no navegador, mantendo `questions.js`, `script.js`, `style.css` e **`assets/`** no mesmo local.
4. Não é necessário instalar Node.js, Python, frameworks, bibliotecas, extensões, backend ou banco de dados.

Os dados das questões são carregados por um `<script>` tradicional (`questions.js`), **sem `fetch`**. Isso evita os obstáculos mais comuns de `fetch` ao usar `file://`. O funcionamento de armazenamento local pode variar em páginas `file://` conforme o navegador; mantenha os relatórios exportados como backup.

Se um navegador específico restringir a abertura local, é possível usar um servidor estático opcional como `python -m http.server 8000` dentro da pasta, acessando `http://localhost:8000/`. **Esse servidor é apenas uma alternativa de hospedagem local, não parte obrigatória do aplicativo.**

## 2. Funcionamento do estudante

- Na tela inicial, preencha **nome completo (obrigatório)**, turma e matrícula/código (opcionais). Os dados são inseridos no relatório do professor.
- Clique **Iniciar simulado**. Responda às alternativas A–E ou escreva as respostas discursivas completas. Para desenho UML, o campo aceita **descrição textual**, não um editor de diagrama.
- Navegue pelo **mapa de questões** ou pelos controles anterior/próxima. As respostas são preservadas na tentativa ativa.
- Use **Ver pendências**. O botão **Finalizar simulado** só é habilitado quando todas as 40 questões são preenchidas (35 marcações objetivas e cinco textos discursivos não vazios).
- A finalização exige confirmação. Após concluir, a tentativa é bloqueada e os resultados são exibidos.
- Resultado: acertos, erros, percentual simples, desempenho por componente e por área, e comentários pedagógicos. **O percentual do simulado não é uma nota oficial ENADE.**
- O botão **Nova tentativa** limpa apenas a tentativa ativa; as concluídas permanecem no histórico local, enquanto houver capacidade de armazenamento.

## 3. Gabarito completo para o professor

Após concluir o questionário, vá a **Entrega ao professor → Gabarito individual completo**. O relatório inclui:

- Nome, turma, matrícula (quando informada), ID único, início e conclusão da tentativa.
- Resumo dos **35 itens objetivos**: total de acertos e erros, percentual simples, desempenho por componente e por área.
- **Todas as 40 questões**, em sua ordem original, com enunciados, códigos, gráficos, tabelas e diagramas visíveis nos **recortes do PDF oficial**.
- Para **cada objetiva**: letra efetivamente marcada pelo aluno, gabarito definitivo do INEP, status (acerto ou erro), comentário pedagógico e ressalvas documentais quando necessário.
- Para as **cinco discursivas**: **resposta integral digitada pelo aluno**, sem truncamento deliberado, síntese de critérios de avaliação e **imagem do padrão de resposta oficial** do INEP. **Não há atribuição automática de nota às discursivas**.

### PDF: formato recomendado para o professor

Clique **Visualizar / Salvar PDF completo**. Na página de prévia, clique **Imprimir / Salvar em PDF**; na caixa de impressão do navegador selecione **Salvar como PDF** como destino e confirme. O PDF é gerado pelo motor de impressão do próprio navegador, **sem bibliotecas externas**; inclui as imagens no próprio arquivo. A quantidade de páginas varia com as respostas e configurações de impressão.

Se o navegador imprimir apenas páginas vazias, verifique se as imagens carregaram corretamente antes de imprimir; mantenha `assets/` junto ao HTML. Permita impressão de imagens e seleção de papel A4 quando disponível.

### Arquivos complementares

- **CSV (`.csv`):** 40 registros mais linha de cabeçalho; codificação UTF-8 com BOM, delimitador `;`. Inclui identificação, questão, resposta integral, gabarito, status, explicação, critérios discursivos, transcrição textual auxiliar e caminhos dos recursos visuais. Importável pelo Excel/LibreOffice. Os campos multilinha são devidamente colocados entre aspas. Não contém as imagens binárias.
- **Markdown (`.md`):** relatório textual legível, adequado ao estudo dos erros e das respostas discursivas. As imagens não estão incorporadas; para fidelidade a diagramas e gráficos, use PDF.
- **JSON (`.json`):** estrutura de dados de uma tentativa, com todas as 40 respostas, metadados, notas e caminhos relativos de imagens. Os caminhos não incorporam as imagens e a importação automática de JSON para o simulado **não está implementada**.

**O aplicativo não salva automaticamente em uma pasta do projeto.** Isso é bloqueado ou limitado pelos navegadores; o estudante escolhe onde salvar o arquivo pelo download/impressão. Não há envio automático para professores, e-mail ou servidor. O arquivo precisa ser encaminhado pelo estudante.

## 4. Persistência e privacidade

O navegador usa `localStorage` (quando disponível) para manter a tentativa em andamento e **histórico de até 15 tentativas concluídas**. O histórico conserva a identificação e as respostas individuais. Em caso de limpeza dos dados do navegador, troca de computador, uso em modo privado ou falta de capacidade de armazenamento, os dados podem se perder. **Após concluir, exporte o PDF e faça seu envio ao professor.**

Nome, turma, matrícula e respostas podem constituir dados pessoais. Compartilhe apenas com o docente responsável e evite publicar o documento. O aplicativo não faz chamadas de rede nem coleta centralizada de dados.

## 5. Conteúdo e pontuação

| Componente | Objetivas | Discursivas | Total |
|---|---:|---:|---:|
| Formação Geral | 8 | 2 | 10 |
| Componente Específico | 27 | 3 | 30 |
| **Total** | **35** | **5** | **40** |

**Todas as 40 questões são oficiais (ENADE 2021)**; nenhuma questão inédita foi adicionada. Os comentários e agrupamentos temáticos foram elaborados especificamente para esta aplicação e não são comentários oficiais do INEP. As imagens contêm o texto original e as alternativas, enquanto as transcrições auxiliares podem ser imperfeitas nas páginas com múltiplas colunas ou diagramas.

A pontuação do simulado é `100 × respostas objetivas corretas / 35`, com peso igual, sem computar nota discursiva. Essa regra não reproduz os pesos institucionais mostrados na capa da prova ENADE 2021. As cinco discursivas exigem **análise do professor**.

## 6. Estrutura

```text
Simulado_ENADE_ADS_2021_Completo/
  index.html            Interface: início, prova, resultado e relatório imprimível
  style.css             Estilos responsivos e estilos para impressão A4
  script.js             Navegação, persistência, validação, correção e exportação
  questions.js          Banco de dados carregado diretamente pelo navegador
  questions.json        Mesmo banco, para consulta e auditoria
  assets/               46 recortes originais das questões + 6 de padrões discursivos
  README.md             Este guia
  VALIDACAO.md          Evidências e limitações dos testes
  tests/
    test_logic.cjs      Testes da lógica JavaScript (opcional)
    test_browser.py     Testes de integração (opcional)
```

## 7. Fontes primárias (documentos fornecidos)

1. **Caderno de Prova ENADE 2021 — Tecnologia em Análise e Desenvolvimento de Sistemas**, caderno 28, 48 páginas: `2021_PV_tecnologia_analise_desenvolvimento_sistemas.pdf`.
2. **Gabarito Definitivo ENADE 2021 — ADS**, caderno 28, uma página: `2021_GB_tecnologia_analise_desenvolvimento_sistemas.pdf`.
3. **Padrão de Resposta das Questões Discursivas ENADE 2021 — ADS**, seis páginas: `2021_tecnologia_em_analise_e_desenvolvimento_de_sistemas.pdf`.

O aplicativo usa recortes extraídos destes PDFs, sem depender dos PDFs originais para executar. Os três PDFs completos não são redistribuídos na pasta; eles foram fornecidos pelo próprio usuário do projeto.

**Ressalvas documentais:** questões 2, 17 e 35 e padrão D5 contêm pontos de interpretação ou consistência sinalizados nas explicações, sem alterar gabarito definitivo nem imagens originais. Ver `VALIDACAO.md`.
# enade-simulado
