"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const board_1 = require("./board");
let a = 0,
  b = 0,
  c = 0,
  d = 0;
let positions = 0;
const MAX_CACHE_SIZE = 10000;
const evalTable = [
  3, 4, 5, 7, 5, 4, 3, 4, 6, 8, 10, 8, 6, 4, 5, 8, 11, 13, 11, 8, 5, 5, 8, 11,
  13, 11, 8, 5, 4, 6, 8, 10, 8, 6, 4, 3, 4, 5, 7, 5, 4, 3,
];
class Game {
  constructor() {
    this.position_cache = {};
    this.board = new board_1.Board();
  }
  //Positive score if position is better for red.
  //Negative score if position is better for blue.
  //0 if it is completely equal for both sides.
  //Depth is the depth of moves we've ALREADY explored
  //This way, we prioritize winning faster and makiing our opponent
  //win in fewer moves.
  eval(position, depth) {
    let win = position.win();
    if (win == board_1.RED) return 1000000000 - depth;
    if (win == board_1.BLUE) return -1000000000 + depth;
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
    depth,
    player,
    position = this.board,
    alpha = Number.NEGATIVE_INFINITY,
    beta = Number.POSITIVE_INFINITY,
    og_depth = depth
  ) {
    this.board.set_player_turn(player);
    let color = player == board_1.RED ? 1 : -1;
    if (depth <= 0) return color * this.eval(position, og_depth - depth);
    //If someone already won, we can't keep exploring moves.
    //NOTE: Without this line, the bot makes insane blunders.
    //This is because we don't actually terminate the search when there is a win,
    //and we thus don't consider the win on the search.
    let win_status = position.win();
    if (win_status != board_1.NO_PLAYER) {
      return (
        color *
        (win_status == board_1.RED
          ? 1000000000 - (og_depth - depth)
          : -1000000000 + (og_depth - depth))
      );
    }
    let value = Number.NEGATIVE_INFINITY;
    let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
    let found_move = false;
    for (let col = 0; col < position.avail_moves.length; col += 1) {
      let move = position.avail_moves[col];
      if (move == board_1.INVALID_MOVE) continue;
      found_move = true;
      // let m = performance.now();
      let next_board = position.duplicate();
      next_board.set_chip(player, move, col);
      // d += performance.now() - m;
      let negamax_eval;
      // let z = performance.now();
      //Convert board state to string, makes inserting into object way faster
      // let position_ind = next_board.full_board_state().toString();
      let position_ind = next_board.full_board_state().toString();
      let flipped_set_positions = (0, board_1.flip)(
        next_board.set_positions,
        false
      );
      //Check if we've already evaluated the mirrored position
      let mirrored_ind = (0, board_1.full_board_state)(
        (0, board_1.flip)(next_board.board, true),
        flipped_set_positions
      ).toString();
      //Invert the board so that blue becomes red and red becomes blue.
      let inverted_board =
        (~next_board.board & next_board.set_positions) ^
        board_1.player_turn_bit;
      let inverted_ind = (0, board_1.full_board_state)(
        (~next_board.board & next_board.set_positions) ^
          board_1.player_turn_bit,
        next_board.set_positions
      ).toString();
      let inverted_mirrored_ind = (0, board_1.full_board_state)(
        (0, board_1.flip)(inverted_board, true),
        flipped_set_positions
      ).toString();
      // a += performance.now() - z;
      // console.log(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
      // log.writeln(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
      // console.log(position_ind, this.position_cache[position_ind]?.depth);
      if (this.position_cache[position_ind]?.depth >= depth) {
        negamax_eval = this.position_cache[position_ind].eval;
        // log.writeln(
        //   `- Cache hit. Storing evaluation of depth ${this.position_cache[position_ind].depth} = ${negamax_eval}`
        // );
      }
      //?? The computer plays really weirdly when we enable mirrored indices, I'll need to debug these.
      else if (this.position_cache[mirrored_ind]?.depth >= depth && false) {
        // console.log("This was mirrored and found in the cache:");
        // next_board.log_board_color();
        // console.log("It's mirror:");
        // let m = new Board();
        // m.set_board_state(BigInt(mirrored_ind));
        // m.log_board_color();
        negamax_eval = this.position_cache[mirrored_ind].eval;
      } else if (this.position_cache[inverted_ind]?.depth >= depth) {
        negamax_eval = this.position_cache[inverted_ind].eval;
      }
      // else if (this.position_cache[inverted_mirrored_ind]?.depth >= depth) {
      //     negamax_eval = this.position_cache[inverted_mirrored_ind].eval;
      // }
      else {
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
        let obj = {
          depth: depth,
          eval: negamax_eval,
        };
        this.position_cache[position_ind] = obj;
      }
      value = Math.max(value, -negamax_eval);
      // console.log(`\tEvaluation returned ${negamax_eval}`);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }
  //Doesn't use iterative deepening... for now
  bestMove(depth, player = board_1.RED) {
    if (this.board.win() != board_1.NO_PLAYER) return { col: null, row: null };
    let moves = this.board.avail_moves;
    let best_move = -1,
      best_score = null;
    let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
    for (let col = 0; col < board_1.COL_COUNT; col += 1) {
      let move = moves[col];
      if (move == board_1.INVALID_MOVE) continue;
      let board = this.board.duplicate();
      board.set_chip(player, move, col);
      //Evaluate position from perspective of next player, negate the result
      //because we want to know what is best for OUR side.
      let eval_ = -this.negamax(depth - 1, next_player, board);
      // board.log_board_color();
      // console.log(`\nTHIS BOARD RETURNS EVAL OF ${eval_}\n`);
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
exports.Game = Game;
// let m = new Board();
// m.set_board_state(554153860399167n);
// // m.log_board();
let game = new Game();
// game.board.set_board_state(9442948171184016130984539n);
// // game.board.set_board_state(
// //   BigInt(parseInt("1111110000000000000000000000000000000000000111011", 2))
// // );
// game.board.log_board();
// console.log(game.bestMove(5));
console.time();
let eval_ = game.negamax(9, board_1.RED);
console.timeEnd();
console.log(
  eval_,
  positions,
  Reflect.ownKeys(game.position_cache).length,
  a,
  d
);
