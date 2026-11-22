const { CampoMinado, PADRAO } = require('../src/campoMinado');

// Gerador pseudoaleatório (congruencial linear) para sorteios repetíveis nos testes.
function geradorComSemente(semente) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

// Tabuleiro pequeno e previsível, usado nos testes de regras
// (* = bomba; espaço = célula sem bombas vizinhas):
//
//    0 1 2 3 4
// 0  * 2 * 1 _
// 1  1 2 1 1 _
// 2  _ _ _ 1 1
// 3  _ _ _ 1 *
//
// Há duas regiões vazias separadas: {(0,4), (1,4)} e o bloco do canto inferior esquerdo.
function tabuleiroPequeno() {
  return new CampoMinado({ linhas: 4, colunas: 5, posicoesBombas: [[0, 0], [0, 2], [3, 4]] });
}

function contarBombas(jogo) {
  let total = 0;
  for (let l = 0; l < jogo.linhas; l++) {
    for (let c = 0; c < jogo.colunas; c++) {
      if (jogo.ehBomba(l, c)) total++;
    }
  }
  return total;
}

describe('Tabuleiro padrão do desafio', () => {
  test('tem 14 linhas, 18 colunas e 40 bombas', () => {
    const jogo = new CampoMinado();
    expect(jogo.linhas).toBe(14);
    expect(jogo.colunas).toBe(18);
    expect(jogo.bombas).toBe(40);
    expect(PADRAO).toEqual({ linhas: 14, colunas: 18, bombas: 40 });
  });

  test('começa aguardando a primeira jogada, sem nenhuma célula aberta', () => {
    const jogo = new CampoMinado();
    expect(jogo.status).toBe('aguardando');
    expect(jogo.totalAbertas).toBe(0);
    expect(jogo.bandeirasRestantes).toBe(40);
  });

  test('as bombas só são sorteadas na primeira jogada', () => {
    const jogo = new CampoMinado({ aleatorio: geradorComSemente(7) });
    expect(contarBombas(jogo)).toBe(0);
    jogo.abrir(7, 9);
    expect(contarBombas(jogo)).toBe(40);
    expect(jogo.status).toBe('em andamento');
  });

  test.each([
    [0, 0], [0, 17], [13, 0], [13, 17], [6, 8], [0, 9],
  ])('primeira jogada em (%i, %i) nunca tem bomba nela nem nas vizinhas', (l, c) => {
    for (let semente = 1; semente <= 30; semente++) {
      const jogo = new CampoMinado({ aleatorio: geradorComSemente(semente) });
      jogo.abrir(l, c);
      for (let dl = -1; dl <= 1; dl++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nl = l + dl;
          const nc = c + dc;
          if (nl >= 0 && nl < 14 && nc >= 0 && nc < 18) {
            expect(jogo.ehBomba(nl, nc)).toBe(false);
          }
        }
      }
      expect(jogo.status).toBe('em andamento');
    }
  });

  test('mesma semente gera o mesmo tabuleiro; sementes diferentes geram outro', () => {
    const a = new CampoMinado({ aleatorio: geradorComSemente(42) });
    const b = new CampoMinado({ aleatorio: geradorComSemente(42) });
    const c = new CampoMinado({ aleatorio: geradorComSemente(43) });
    a.abrir(0, 0);
    b.abrir(0, 0);
    c.abrir(0, 0);
    a.revelarTudo();
    b.revelarTudo();
    c.revelarTudo();
    expect(a.mapa()).toEqual(b.mapa());
    expect(a.mapa()).not.toEqual(c.mapa());
  });
});

describe('Configuração inválida', () => {
  test('não aceita tabuleiro sem linhas ou colunas', () => {
    expect(() => new CampoMinado({ linhas: 0 })).toThrow('dimensões');
    expect(() => new CampoMinado({ colunas: -3 })).toThrow('dimensões');
    expect(() => new CampoMinado({ linhas: 2.5 })).toThrow('dimensões');
  });

  test('não aceita bombas a mais para garantir a primeira jogada segura', () => {
    // 4 x 4 = 16 células; a primeira jogada pode proteger até 9 células
    expect(() => new CampoMinado({ linhas: 4, colunas: 4, bombas: 8 })).toThrow('bombas');
    expect(() => new CampoMinado({ linhas: 4, colunas: 4, bombas: 7 })).not.toThrow();
  });

  test('não aceita quantidade de bombas zero ou negativa', () => {
    expect(() => new CampoMinado({ bombas: 0 })).toThrow('bombas');
    expect(() => new CampoMinado({ bombas: -1 })).toThrow('bombas');
  });

  test('não aceita bomba fixa fora do tabuleiro ou repetida', () => {
    expect(() => new CampoMinado({ linhas: 3, colunas: 3, posicoesBombas: [[3, 0]] }))
      .toThrow('fora do tabuleiro');
    expect(() => new CampoMinado({ linhas: 3, colunas: 3, posicoesBombas: [[1, 1], [1, 1]] }))
      .toThrow('repetida');
  });
});

describe('Contagem de bombas vizinhas', () => {
  test('conta corretamente no canto, na borda e no meio', () => {
    const jogo = tabuleiroPequeno();
    expect(jogo.bombasVizinhas(0, 1)).toBe(2);
    expect(jogo.bombasVizinhas(1, 0)).toBe(1);
    expect(jogo.bombasVizinhas(1, 1)).toBe(2);
    expect(jogo.bombasVizinhas(0, 4)).toBe(0);
    expect(jogo.bombasVizinhas(2, 2)).toBe(0);
    expect(jogo.bombasVizinhas(2, 3)).toBe(1);
    expect(jogo.bombasVizinhas(3, 3)).toBe(1);
  });

  test('conta até 8 bombas ao redor', () => {
    const vizinhas = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]];
    const jogo = new CampoMinado({ linhas: 3, colunas: 3, posicoesBombas: vizinhas });
    expect(jogo.bombasVizinhas(1, 1)).toBe(8);
  });
});

describe('Abrir células', () => {
  test('abrir um número revela só aquela célula', () => {
    const jogo = tabuleiroPequeno();
    expect(jogo.abrir(0, 1)).toBe(1);
    expect(jogo.estaAberta(0, 1)).toBe(true);
    expect(jogo.estaAberta(1, 1)).toBe(false);
  });

  test('abrir uma célula vazia abre a região em cascata até os números', () => {
    const jogo = tabuleiroPequeno();
    const abertas = jogo.abrir(3, 0);
    expect(abertas).toBe(12);
    expect(jogo.mapa()).toEqual([
      '#####',
      '1211#',
      '   1#',
      '   1#',
    ]);
  });

  test('a cascata não abre células com bandeira', () => {
    const jogo = tabuleiroPequeno();
    jogo.alternarBandeira(1, 1);
    jogo.abrir(3, 0);
    expect(jogo.estaAberta(1, 1)).toBe(false);
    expect(jogo.temBandeira(1, 1)).toBe(true);
    expect(jogo.estaAberta(1, 2)).toBe(true);
  });

  test('abrir de novo uma célula já aberta não muda nada', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(0, 1);
    expect(jogo.abrir(0, 1)).toBe(0);
    expect(jogo.totalAbertas).toBe(1);
  });

  test('abrir uma bomba faz perder e revela todas as bombas', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(0, 1);
    jogo.abrir(3, 4);
    expect(jogo.status).toBe('perdeu');
    expect(jogo.mapa()).toEqual([
      '*2*##',
      '#####',
      '#####',
      '####*',
    ]);
  });

  test('posição fora do tabuleiro gera RangeError', () => {
    const jogo = tabuleiroPequeno();
    expect(() => jogo.abrir(-1, 0)).toThrow(RangeError);
    expect(() => jogo.abrir(0, 5)).toThrow(RangeError);
    expect(() => jogo.abrir(4, 0)).toThrow(RangeError);
  });
});

describe('Bandeiras', () => {
  test('marcar e desmarcar atualiza o contador', () => {
    const jogo = tabuleiroPequeno();
    expect(jogo.alternarBandeira(0, 0)).toBe(true);
    expect(jogo.bandeirasRestantes).toBe(2);
    expect(jogo.alternarBandeira(0, 0)).toBe(false);
    expect(jogo.bandeirasRestantes).toBe(3);
  });

  test('célula com bandeira não abre', () => {
    const jogo = tabuleiroPequeno();
    jogo.alternarBandeira(0, 0);
    expect(jogo.abrir(0, 0)).toBe(0);
    expect(jogo.status).not.toBe('perdeu');
  });

  test('não dá para pôr bandeira em célula aberta', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(0, 1);
    expect(() => jogo.alternarBandeira(0, 1)).toThrow('aberta');
  });

  test('não dá para usar mais bandeiras do que bombas', () => {
    const jogo = tabuleiroPequeno();
    jogo.alternarBandeira(2, 0);
    jogo.alternarBandeira(2, 1);
    jogo.alternarBandeira(2, 2);
    expect(() => jogo.alternarBandeira(3, 0)).toThrow('bandeiras');
  });

  test('pôr bandeira antes da primeira jogada não sorteia bombas', () => {
    const jogo = new CampoMinado({ aleatorio: geradorComSemente(3) });
    jogo.alternarBandeira(5, 5);
    expect(jogo.status).toBe('aguardando');
    expect(contarBombas(jogo)).toBe(0);
  });

  test('o mapa mostra F nas bandeiras', () => {
    const jogo = tabuleiroPequeno();
    jogo.alternarBandeira(0, 0);
    expect(jogo.mapa()[0]).toBe('F####');
  });
});

describe('Abrir ao redor de um número (atalho)', () => {
  test('com as bandeiras certas, abre as vizinhas restantes', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(1, 0);
    jogo.alternarBandeira(0, 0);
    const abertas = jogo.abrirAoRedor(1, 0);
    expect(abertas).toBe(12);
    expect(jogo.estaAberta(0, 1)).toBe(true);
    expect(jogo.estaAberta(1, 1)).toBe(true);
    expect(jogo.estaAberta(2, 2)).toBe(true);
    expect(jogo.status).toBe('em andamento');
  });

  test('sem bandeiras suficientes, não faz nada', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(1, 0);
    expect(jogo.abrirAoRedor(1, 0)).toBe(0);
    expect(jogo.totalAbertas).toBe(1);
  });

  test('com bandeira no lugar errado, explode', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(1, 0);
    jogo.alternarBandeira(1, 1);
    jogo.abrirAoRedor(1, 0);
    expect(jogo.status).toBe('perdeu');
  });

  test('em célula ainda fechada, não faz nada', () => {
    const jogo = tabuleiroPequeno();
    expect(jogo.abrirAoRedor(2, 2)).toBe(0);
  });
});

describe('Fim de jogo', () => {
  test('ganha ao abrir todas as células sem bomba, mesmo sem bandeiras', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(3, 0);
    jogo.abrir(0, 4);
    expect(jogo.status).toBe('em andamento');
    expect(jogo.totalAbertas).toBe(16);
    jogo.abrir(0, 1);
    expect(jogo.status).toBe('ganhou');
  });

  test('depois que o jogo acaba, nenhuma jogada é aceita', () => {
    const jogo = tabuleiroPequeno();
    jogo.abrir(0, 0);
    expect(() => jogo.abrir(2, 2)).toThrow('encerrado');
    expect(() => jogo.alternarBandeira(2, 2)).toThrow('encerrado');
    expect(() => jogo.abrirAoRedor(1, 0)).toThrow('encerrado');
  });

  test('partida completa 18 x 14: abrindo só células seguras, o jogador vence', () => {
    const jogo = new CampoMinado({ aleatorio: geradorComSemente(2026) });
    jogo.abrir(7, 9);
    for (let l = 0; l < 14; l++) {
      for (let c = 0; c < 18; c++) {
        if (!jogo.ehBomba(l, c) && !jogo.estaAberta(l, c)) jogo.abrir(l, c);
      }
    }
    expect(jogo.status).toBe('ganhou');
    expect(jogo.totalAbertas).toBe(14 * 18 - 40);
  });
});
