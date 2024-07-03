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
  NO_PLAYER,
} from "./board";

import * as log from "./log";

let a = 0,
  b = 0,
  c = 0,
  d: number = 0;

let positions = 0;
const MAX_CACHE_SIZE = 10000;

const evalTable = [
  3, 4, 5, 7, 5, 4, 3, 4, 6, 8, 10, 8, 6, 4, 5, 8, 11, 13, 11, 8, 5, 5, 8, 11,
  13, 11, 8, 5, 4, 6, 8, 10, 8, 6, 4, 3, 4, 5, 7, 5, 4, 3,
];

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
  //Depth is the depth of moves we've ALREADY explored
  //This way, we prioritize winning faster and makiing our opponent
  //win in fewer moves.
  eval(position: Board, depth: number): number {
    let win = position.win();
    if (win == RED) return 1_000_000_000 - depth;
    if (win == BLUE) return -1_000_000_000 + depth;

    positions += 1;

    // let score = 0;
    // for (let i = 0; i < COL_COUNT * ROW_COUNT; i += 1) {
    //   let piece = position.piece_at_ind(BigInt(i));
    //   if (piece == BLUE) score -= evalTable[i];
    //   else if (piece == RED) score += evalTable[i];
    // }
    // console.log(score, position.piece_eval);
    // return score;
    return position.piece_eval;
  }

  //Negamax algorithm
  negamax(
    depth: number,
    player: PLAYER,
    position: Board = this.board,
    alpha: number = Number.NEGATIVE_INFINITY,
    beta: number = Number.POSITIVE_INFINITY,
    og_depth: number = depth
  ): number {
    let color = player == RED ? 1 : -1;
    if (depth <= 0) return color * this.eval(position, og_depth - depth);

    //If someone already won, we can't keep exploring moves.
    //NOTE: Without this line, the bot makes insane blunders.
    //This is because we don't actually terminate the search when there is a win,
    //and we thus don't consider the win on the search.
    let win_status = position.win();
    if (win_status != NO_PLAYER) {
      return (
        color *
        (win_status == RED
          ? 1_000_000_000 - (og_depth - depth)
          : -1_000_000_000 + (og_depth - depth))
      );
    }

    let value = Number.NEGATIVE_INFINITY;
    let next_player: PLAYER = player == RED ? BLUE : RED;
    let found_move = false;

    for (let col = 0; col < position.avail_moves.length; col += 1) {
      let move = position.avail_moves[col];
      if (move == INVALID_MOVE) continue;

      found_move = true;
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
          -alpha,
          og_depth
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

  //Doesn't use iterative deepening... for now
  bestMove(depth: number, player: PLAYER = RED) {
    if (this.board.win() != NO_PLAYER) return { col: null, row: null };
    let moves = this.board.avail_moves;

    let best_move = -1,
      best_score = null;

    let next_player = player == RED ? BLUE : RED;

    for (let col = 0; col < COL_COUNT; col += 1) {
      let move = moves[col];
      if (move == INVALID_MOVE) continue;

      let board = this.board.duplicate();
      board.set_chip(player, move, col as column);

      //Evaluate position from perspective of next player, negate the result
      //because we want to know what is best for OUR side.
      let eval_ = -this.negamax(depth - 1, next_player, board);

      if (best_score == null || best_score < eval_) {
        best_score = eval_;
        best_move = col;
      }
    }

    //No moves available, draw
    if (best_move == -1) return { col: null, row: null };

    return { col: best_move, row: moves[best_move] };
  }
}

// let m = new Board();
// m.set_board_state(554153860399167n);
// // m.log_board();

let game = new Game();
// // game.board.set_board_state(
// //   BigInt(parseInt("1111110000000000000000000000000000000000000111011", 2))
// // );
// game.board.log_board();

// console.log(game.bestMove(5));

console.time();
let eval_ = game.negamax(9, BLUE);
console.timeEnd();
console.log(
  eval_,
  positions,
  Reflect.ownKeys(game.position_cache).length,
  a,
  d
);
