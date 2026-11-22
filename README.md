# desafio_teste_campo_minado

Campo minado em JavaScript com casos de teste em JavaScript (Jest).

## Colaborador

- Gabriel Carvalho | RA: 24027655-2

## Especificação

- Tabuleiro de 18 colunas x 14 linhas com 40 bombas.
- As bombas são sorteadas na primeira jogada, nunca na célula clicada nem nas 8 vizinhas dela.
- Abrir uma bomba faz perder; todas as bombas aparecem no mapa.
- Abrir uma célula sem bombas vizinhas abre a região em volta automaticamente (cascata), parando nos números e nas bandeiras.
- Bandeiras marcam as bombas suspeitas, até o limite de 40. Célula com bandeira não abre.
- Atalho: numa célula com número, se já houver a mesma quantidade de bandeiras em volta, `abrirAoRedor` abre o resto das vizinhas.
- Ganha quem abrir todas as células sem bomba, mesmo sem usar bandeiras.
- Depois do fim, nenhuma jogada é aceita.

## Contrato da implementação

O jogo fica em `src/campoMinado.js` (CommonJS) e é importado nos testes com `require('../src/campoMinado')`:

```js
module.exports = { CampoMinado, PADRAO };
```

- `PADRAO`: `{ linhas: 14, colunas: 18, bombas: 40 }`.
- As posições são sempre `(linha, coluna)`, começando em 0.

### `new CampoMinado(opcoes?)`

Opções (todas opcionais):

- `linhas`, `colunas`, `bombas`: tamanho do tabuleiro e quantidade de bombas (padrão: 14, 18 e 40);
- `aleatorio`: função que devolve um número entre 0 e 1, usada no sorteio das bombas (padrão: `Math.random`);
- `posicoesBombas`: lista de `[linha, coluna]` com as bombas fixas. Nesse caso a quantidade de bombas é o tamanho da lista e o jogo já começa `em andamento`.

Erros do construtor:

- linhas ou colunas que não são inteiros positivos: mensagem com `"dimensões"`;
- bombas fora do intervalo de 1 até (células − 9): mensagem com `"bombas"`;
- bomba fixa fora do tabuleiro ou repetida: mensagem com `"fora do tabuleiro"` ou `"repetida"`.

### Propriedades

- `linhas`, `colunas`, `bombas`;
- `status`: `'aguardando'` (antes da primeira jogada), `'em andamento'`, `'ganhou'` ou `'perdeu'`;
- `totalAbertas`: quantas células já foram abertas;
- `bandeirasRestantes`: bombas menos bandeiras colocadas.

### Métodos

- `abrir(linha, coluna)`: abre a célula (e a região em volta, se for vazia). Devolve quantas células abriu. Na primeira jogada sorteia as bombas.
- `alternarBandeira(linha, coluna)`: põe ou tira a bandeira. Devolve `true` se a célula ficou com bandeira.
- `abrirAoRedor(linha, coluna)`: atalho do número; devolve quantas células abriu (0 se as bandeiras não batem com o número).
- `ehBomba`, `estaAberta`, `temBandeira` (`boolean`) e `bombasVizinhas` (0 a 8), todos recebendo `(linha, coluna)`.
- `revelarTudo()`: deixa todas as bombas visíveis.
- `mapa()`: lista de textos, uma por linha: `#` fechada, `F` bandeira, `*` bomba, espaço para célula sem bombas vizinhas e `1` a `8` para a contagem.

Erros dos métodos:

- posição fora do tabuleiro: `RangeError`;
- qualquer jogada depois do fim: mensagem com `"encerrado"`;
- bandeira em célula aberta: mensagem com `"aberta"`;
- bandeira além da quantidade de bombas: mensagem com `"bandeiras"`.

## Casos de teste

Os testes usam dois tipos de tabuleiro:

- o **padrão 18 x 14**, com o sorteio feito por um gerador com semente, para dar sempre o mesmo resultado;
- um **tabuleiro 4 x 5 com 3 bombas em posições fixas**, desenhado no começo do arquivo de testes, onde dá para saber exatamente o que cada jogada deve abrir.

O que é testado:

- tamanho, quantidade de bombas e estado inicial do tabuleiro padrão;
- primeira jogada sempre segura (nos 4 cantos, na borda e no meio, com 30 sementes cada);
- configurações inválidas (dimensões, bombas demais, bomba fora do tabuleiro ou repetida);
- contagem de bombas vizinhas, de 0 a 8;
- abrir número, abrir célula vazia (cascata), abrir bomba e posição fora do tabuleiro;
- bandeiras: marcar, desmarcar, limite de 40 e célula com bandeira que não abre;
- atalho `abrirAoRedor` com bandeiras certas, faltando e no lugar errado;
- vitória, derrota e uma partida completa no tabuleiro 18 x 14.

São 35 casos de teste. Uma implementação correta deve terminar com `Tests: 35 passed, 35 total`.

## Como rodar

Precisa do Node.js 18 ou mais novo.

```bash
npm install
```

```bash
npm test
```

Para ver a cobertura dos testes:

```bash
npm run coverage
```
