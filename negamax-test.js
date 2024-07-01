const X = 0,
  O = 1;

class TTT {
  constructor() {
    this.player = X;
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
  }

  moves() {
    let moves = [];
    //prettier-ignore
    for (let y = 0; y < 3; y += 1) 
        for (let x = 0; x < 3; x += 1) 
            if (this.board[y][x] == null)
                moves.push([x, y]);

    return moves;
  }
  make_move(x, y) {
    this.board[y][x] = this.player;
    this.player = this.player == X ? O : X;
  }
  duplicate() {
    let t = new TTT();
    t.board = JSON.parse(JSON.stringify(this.board));
    t.player = this.player;
    return t;
  }

  match(board) {
    for (let y = 0; y < 3; y += 1)
      for (let x = 0; x < 3; x += 1)
        if (this.board[y][x] != null && board[y][x] != null)
          if (board[y][x] != this.board[y][x]) return false;

    return true;
  }
  matches(boards) {
    for (let board of boards) if (this.match(board)) return true;
    return false;
  }
  winner() {
    //prettier-ignore
    if (this.matches(

        [
            [O, O, O],
            [, , ,],
            [, , ,]
        ],
        [
            [O, , ,],
            [O, , ,],
            [O, , ,]
        ]
    ))return -1;

    //prettier-ignore
    if (this.matches([
        [
            [X, X, X],
            [, , ,],
            [, , ,]
        ],
        [
            [X, , ,],
            [X, , ,],
            [X, , ,]
        ],
    ])) return 1

    return null;
  }
}
function eval_(pos) {
  let winner = pos.winner();
  if (winner) return winner;
  return 0;
}

/**
 *
 * @param {number} depth
 * @param {TTT} position
 * @returns
 */
function negamax(
  depth,

  position
) {
  let player = position.player;

  let color = player == X ? 1 : -1;
  if (depth <= 0) return color * eval_(position);

  let value = Number.NEGATIVE_INFINITY;
  let next_player = position.player == X ? O : X;

  for (let move of position.moves()) {
    console.log(position.moves());
    let next_board = position.duplicate();
    next_board.make_move(move[0], move[1]);

    let negamax_eval;

    negamax_eval = negamax(depth - 1, next_board);

    value = Math.max(value, -negamax_eval);
  }

  return value;
}

let b = new TTT();
console.log(negamax(3, b));
