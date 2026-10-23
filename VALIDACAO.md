# Relatório técnico de validação — versão com gabarito completo do professor

## Fontes e integridade documental

- Conferidas as **48 páginas** do caderno da prova ENADE 2021 ADS, caderno **28**.
- Identificados **8 objetivos + 2 discursivos** em Formação Geral; **27 objetivos + 3 discursivos** em Componente Específico. Não inclui o questionário de percepção da prova, que é separado das questões de conhecimento.
- As **35 letras do gabarito** foram extraídas do PDF `2021_GB_tecnologia_analise_desenvolvimento_sistemas.pdf` e confrontadas programaticamente com as 35 chaves utilizadas no banco. **35/35 coincidências; nenhuma anulação indicada.**
- **40 questões oficiais, zero questões inéditas**; 46 recortes dos enunciados e alternativas; seis imagens de partes dos padrões das cinco discursivas. Os comentários foram redigidos para este software, **não são oficiais**.

## Testes

| Item | Resultado |
|---|---|
| Carregamento de 40 questões e ordem compatível com a prova | Aprovado |
| Correspondência dos 35 gabaritos objetivos com o documento definitivo | Aprovado |
| Enunciados, alternativas e imagens/padrões com caminhos válidos | Aprovado (52 recursos visuais) |
| Nome obrigatório para iniciar | Aprovado |
| Seleção da alternativa e resposta discursiva multilinha | Aprovado |
| Navegação anterior, próxima e mapa sem perda de respostas | Aprovado |
| Barra de progresso e lista de pendências | Aprovado |
| Bloqueio de finalização enquanto falta qualquer resposta obrigatória | Aprovado |
| Confirmação para encerrar, com opção de cancelar | Aprovado |
| Correção com casos de 35/35, 34/35 e 33/35 | Aprovado |
| Resultado por grupo/área e gabarito comentado | Aprovado |
| CSV: 40 linhas de respostas + cabeçalho; respostas discursivas multilinha completas | Aprovado |
| Markdown: 35 seções objetivas, cinco discursivas e textos completos | Aprovado |
| JSON: 40 respostas com identificação e 35 chaves | Aprovado |
| Impressão em PDF: 40 itens, **52 imagens**, metadados e respostas discursivas | Aprovado — gerado PDF A4 de **54 páginas** no caso sintético testado |
| Histórico e reinício: duas tentativas com IDs e pontuações diferentes | Aprovado |
| Restauro do estado em uma nova inicialização da interface | Aprovado com armazenamento simulado no navegador de teste |
| Responsividade em desktop 1370 × 900 e celular 390 × 844 | Aprovado nos dois tamanhos testados |
| JavaScript sem erro de sintaxe ou de página no fluxo testado | Aprovado |
| Dependências externas / backend para uso cotidiano | Nenhuma |

## Restrições e cuidados

1. O **Chromium deste ambiente não permite navegar diretamente** para `file://`, `localhost` nem o domínio de teste. Por isso, os testes de interface foram realizados com HTML, CSS, banco e JavaScript carregados diretamente no navegador, com armazenamento local simulado para exercer restauro e histórico; as imagens originais foram embutidas como data URIs **apenas durante os testes**, preservando o banco distribuído com caminhos relativos. A execução real por duplo clique em `index.html` está prevista pela arquitetura, mas **não foi testada empiricamente neste ambiente**.
2. A versão imprimível foi renderizada por Chromium em PDF A4 e examinada com PyMuPDF, incluindo texto integral, padrões visuais e imagens. O número de páginas depende da extensão das respostas e das preferências de impressão do usuário.
3. **As discursivas não recebem nota automática**. O PDF preserva as respostas do estudante e os padrões oficiais para julgamento do professor. Para a D4, a interface aceita explicação textual de um diagrama, não desenho UML próprio.
4. CSV, Markdown e JSON são arquivos textuais que **não incorporam os binários de imagens**. Para professor que necessita das figuras do enunciado e dos padrões, prefira o **PDF imprimível**.
5. `localStorage` não é armazenamento institucional ou backup confiável; acesso `file://`, navegação privada, limpeza de dados, limites de espaço e política do navegador podem alterar sua persistência. O histórico está limitado a 15 tentativas por dispositivo/navegador; exporte cada resultado e compartilhe o arquivo.
6. A questão 2 pode gerar discussão quanto à expressão “proporcional”; a questão 17 apresenta nomes de campos discrepantes no desenho versus as consultas; a questão 35 traz expressões de código C questionáveis; o padrão oficial da D5 usa `cartao` onde a estrutura usa `cor`. Não se alterou nenhuma dessas passagens nas imagens nem se substituiu o gabarito oficial.
7. Agrupamento por conteúdo e grau de dificuldade são **classificação pedagógica**, não categorização declarada pelo INEP. O percentual usa pesos iguais apenas nas 35 objetivas, portanto **não corresponde à nota oficial ENADE**.

## Reprodução dos testes opcionais

Testes JavaScript (com Node.js, apenas para desenvolvedores):

```bash
node tests/test_logic.cjs
```

Teste integral no navegador (requer Python, `playwright`, PyMuPDF, Chromium; **não são necessários para executar o simulado**):

```bash
python tests/test_browser.py
```

Os testes automatizados usam respostas **sintéticas** e não geram qualquer gabarito pertencente a um estudante real.
