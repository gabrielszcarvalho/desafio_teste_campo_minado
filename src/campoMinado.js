'use strict';

const PADRAO = Object.freeze({ linhas: 14, colunas: 18, bombas: 40 });

const DESLOCAMENTOS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

class CampoMinado {
  constructor({
    linhas = PADRAO.linhas,
    colunas = PADRAO.colunas,
    bombas = PADRAO.bombas,
    posicoesBombas = null,
    aleatorio = Math.random,
  } = {}) {
    if (!inteiroPositivo(linhas) || !inteiroPositivo(colunas)) {
      throw new Error('As dimensões do tabuleiro devem ser inteiros positivos');
    }
    this.linhas = linhas;
    this.colunas = colunas;
    this.aleatorio = aleatorio;
    this.status = 'aguardando';
    this.totalAbertas = 0;
    this.bandeiras = 0;

    this.celulas = [];
    for (let l = 0; l < linhas; l++) {
      const linha = [];
      for (let c = 0; c < colunas; c++) {
        linha.push({ bomba: false, aberta: false, bandeira: false, vizinhas: 0 });
      }
      this.celulas.push(linha);
    }

    if (posicoesBombas) {
      this.bombas = posicoesBombas.length;
      this.#colocarBombasFixas(posicoesBombas);
    } else {
      // a primeira jogada protege até 9 células (a clicada e suas vizinhas)
      const maximo = linhas * colunas - 9;
      if (!inteiroPositivo(bombas) || bombas > maximo) {
        throw new Error(`Quantidade de bombas inválida: use de 1 a ${Math.max(maximo, 0)}`);
      }
      this.bombas = bombas;
    }
  }

  get bandeirasRestantes() {
    return this.bombas - this.bandeiras;
  }

  ehBomba(l, c) {
    return this.#celula(l, c).bomba;
  }

  estaAberta(l, c) {
    return this.#celula(l, c).aberta;
  }

  temBandeira(l, c) {
    return this.#celula(l, c).bandeira;
  }

  bombasVizinhas(l, c) {
    return this.#celula(l, c).vizinhas;
  }

  // Abre uma célula. Retorna quantas células foram abertas nesta jogada.
  abrir(l, c) {
    const celula = this.#celula(l, c);
    this.#exigirJogoAtivo();
    if (this.status === 'aguardando') {
      this.#sortearBombas(l, c);
      this.status = 'em andamento';
    }
    if (celula.aberta || celula.bandeira) return 0;

    if (celula.bomba) {
      celula.aberta = true;
      this.status = 'perdeu';
      return 1;
    }

    const abertas = this.#abrirEmCascata(l, c);
    if (this.totalAbertas === this.linhas * this.colunas - this.bombas) {
      this.status = 'ganhou';
    }
    return abertas;
  }

  // Põe ou tira a bandeira. Retorna true se a célula ficou com bandeira.
  alternarBandeira(l, c) {
    const celula = this.#celula(l, c);
    this.#exigirJogoAtivo();
    if (celula.aberta) throw new Error('Não é possível marcar uma célula aberta');
    if (!celula.bandeira && this.bandeirasRestantes === 0) {
      throw new Error('Não há mais bandeiras disponíveis');
    }
    celula.bandeira = !celula.bandeira;
    this.bandeiras += celula.bandeira ? 1 : -1;
    return celula.bandeira;
  }

  // Atalho: numa célula aberta cujo número já tem bandeiras suficientes ao redor,
  // abre todas as vizinhas sem bandeira.
  abrirAoRedor(l, c) {
    const celula = this.#celula(l, c);
    this.#exigirJogoAtivo();
    if (!celula.aberta) return 0;

    const vizinhas = this.#vizinhas(l, c);
    const bandeiras = vizinhas.filter(([vl, vc]) => this.celulas[vl][vc].bandeira).length;
    if (bandeiras !== celula.vizinhas) return 0;

    let abertas = 0;
    for (const [vl, vc] of vizinhas) {
      if (this.status !== 'em andamento') break;
      abertas += this.abrir(vl, vc);
    }
    return abertas;
  }

  // Mostra todas as bombas (usado ao fim do jogo e nos testes).
  revelarTudo() {
    for (const linha of this.celulas) {
      for (const celula of linha) {
        if (celula.bomba) celula.aberta = true;
      }
    }
  }

  // Representação em texto: '#' fechada, 'F' bandeira, '*' bomba,
  // ' ' sem bombas vizinhas e 1 a 8 para a contagem.
  mapa() {
    const fimDeJogo = this.status === 'perdeu';
    return this.celulas.map((linha) => linha.map((celula) => {
      if (celula.bomba && (celula.aberta || fimDeJogo)) return '*';
      if (celula.bandeira) return 'F';
      if (!celula.aberta) return '#';
      return celula.vizinhas === 0 ? ' ' : String(celula.vizinhas);
    }).join(''));
  }

  #abrirEmCascata(l, c) {
    let abertas = 0;
    const pilha = [[l, c]];
    while (pilha.length > 0) {
      const [al, ac] = pilha.pop();
      const celula = this.celulas[al][ac];
      if (celula.aberta || celula.bandeira) continue;
      celula.aberta = true;
      this.totalAbertas++;
      abertas++;
      if (celula.vizinhas === 0) pilha.push(...this.#vizinhas(al, ac));
    }
    return abertas;
  }

  #colocarBombasFixas(posicoes) {
    const vistas = new Set();
    for (const [l, c] of posicoes) {
      if (!this.#dentro(l, c)) throw new Error(`Bomba fora do tabuleiro: (${l}, ${c})`);
      const chave = `${l},${c}`;
      if (vistas.has(chave)) throw new Error(`Bomba repetida: (${l}, ${c})`);
      vistas.add(chave);
      this.celulas[l][c].bomba = true;
    }
    this.#calcularVizinhas();
    this.status = 'em andamento';
  }

  #sortearBombas(lInicial, cInicial) {
    const protegidas = new Set([`${lInicial},${cInicial}`]);
    for (const [l, c] of this.#vizinhas(lInicial, cInicial)) protegidas.add(`${l},${c}`);

    const candidatas = [];
    for (let l = 0; l < this.linhas; l++) {
      for (let c = 0; c < this.colunas; c++) {
        if (!protegidas.has(`${l},${c}`)) candidatas.push([l, c]);
      }
    }
    // Fisher-Yates parcial: só as primeiras posições embaralhadas viram bombas
    for (let i = 0; i < this.bombas; i++) {
      const j = i + Math.floor(this.aleatorio() * (candidatas.length - i));
      [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
      const [l, c] = candidatas[i];
      this.celulas[l][c].bomba = true;
    }
    this.#calcularVizinhas();
  }

  #calcularVizinhas() {
    for (let l = 0; l < this.linhas; l++) {
      for (let c = 0; c < this.colunas; c++) {
        this.celulas[l][c].vizinhas = this.#vizinhas(l, c)
          .filter(([vl, vc]) => this.celulas[vl][vc].bomba).length;
      }
    }
  }

  #vizinhas(l, c) {
    return DESLOCAMENTOS
      .map(([dl, dc]) => [l + dl, c + dc])
      .filter(([vl, vc]) => this.#dentro(vl, vc));
  }

  #dentro(l, c) {
    return Number.isInteger(l) && Number.isInteger(c)
      && l >= 0 && l < this.linhas && c >= 0 && c < this.colunas;
  }

  #celula(l, c) {
    if (!this.#dentro(l, c)) throw new RangeError(`Posição fora do tabuleiro: (${l}, ${c})`);
    return this.celulas[l][c];
  }

  #exigirJogoAtivo() {
    if (this.status === 'ganhou' || this.status === 'perdeu') {
      throw new Error('O jogo já foi encerrado');
    }
  }
}

function inteiroPositivo(n) {
  return Number.isInteger(n) && n > 0;
}

module.exports = { CampoMinado, PADRAO };
