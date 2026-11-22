# desafio_teste_campo_minado

Campo minado em JavaScript com casos de teste em JavaScript (Jest).

**Colaborador:** Gabriel Carvalho

## Especificação

- Tabuleiro de 18 colunas x 14 linhas com 40 bombas.
- As bombas são sorteadas na primeira jogada, nunca na célula clicada nem nas 8 vizinhas dela.
- Abrir uma bomba faz perder; todas as bombas aparecem no mapa.
- Abrir uma célula sem bombas vizinhas abre a região em volta automaticamente (cascata), parando nos números e nas bandeiras.
- Bandeiras marcam as bombas suspeitas, até o limite de 40. Célula com bandeira não abre.
- Atalho: numa célula com número, se já houver a mesma quantidade de bandeiras em volta, `abrirAoRedor` abre o resto das vizinhas.
- Ganha quem abrir todas as células sem bomba, mesmo sem usar bandeiras.
- Depois do fim, nenhuma jogada é aceita.

O jogo fica em `src/campoMinado.js` (classe `CampoMinado`) e os testes em `__tests__/campoMinado.spec.js`.

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
