import {
  Board,
  PLAYER,
  RED,
  BLUE,
  INVALID_MOVE,
  ROW_COUNT,
  COL_COUNT,
  type row,
  type column,
} from "./board";

import * as log from "./log";

let a = 0,
  b = 0,
  c = 0,
  d: number = 0;

let positions = 0;
const MAX_CACHE_SIZE = 10000;
export class Game {
  public board: Board;
  public position_cache: Record<
    string,
    {
      depth: number;
      eval: number;
    }
  > = {};

  constructor() {
    this.board = new Board();
  }

  //Positive score if position is better for red.
  //Negative score if position is better for blue.
  //0 if it is completely equal for both sides.
  eval(position: Board): number {
    let win = position.win();
    if (win == RED) return Number.POSITIVE_INFINITY;
    if (win == BLUE) return Number.NEGATIVE_INFINITY;

    positions += 1;
    return 0;
    return Math.random();
  }

  //Negamax algorithm
  negamax(
    depth: number,
    player: PLAYER,
    position: Board = this.board,
    alpha: number = Number.NEGATIVE_INFINITY,
    beta: number = Number.POSITIVE_INFINITY
  ): number {
    let color = player == RED ? 1 : -1;
    if (depth <= 0) return color * this.eval(position);

    let value = Number.NEGATIVE_INFINITY;
    let next_player: PLAYER = player == RED ? BLUE : RED;

    for (let col = 0; col < this.board.avail_moves.length; col += 1) {
      let move = position.avail_moves[col];
      if (move == INVALID_MOVE) continue;
      // let m = performance.now();
      let next_board = position.duplicate();
      next_board.set_chip(player, move as row, col as column);
      // d += performance.now() - m;

      let negamax_eval: number;
      // let z = performance.now();
      //Convert board state to string, makes inserting into object way faster
      // let position_ind = next_board.full_board_state().toString();
      let position_ind = next_board.full_board_state().toString();

      // a += performance.now() - z;

      // log.writeln(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
      // console.log(position_ind, this.position_cache[position_ind]?.depth);
      if (this.position_cache[position_ind]?.depth >= depth) {
        negamax_eval = this.position_cache[position_ind].eval;
        // log.writeln(
        //   `- Cache hit. Storing evaluation of depth ${this.position_cache[position_ind].depth} = ${negamax_eval}`
        // );
      } else {
        // log.writeln(
        //   `- Evaluating position with negamax function, storing in cache.`
        // );
        negamax_eval = this.negamax(
          depth - 1,
          next_player,
          next_board,
          -beta,
          -alpha
        );
        this.position_cache[position_ind] = {
          depth: depth,
          eval: negamax_eval,
        };
      }
      value = Math.max(value, -negamax_eval);

      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }

    return value;
  }
}

let m = new Board();
m.set_board_state(554153860399167n);
// m.log_board();

let game = new Game();
// game.board.set_board_state(
//   BigInt(parseInt("1111110000000000000000000000000000000000000111011", 2))
// );
game.board.log_board();

console.time();
let eval_ = game.negamax(14, BLUE);
console.timeEnd();
console.log(
  eval_,
  positions,
  Reflect.ownKeys(game.position_cache).length,
  a,
  d
);
