"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.perf_tests = void 0;
const board_1 = require("./board");
exports.perf_tests = { a: 0, b: 0 };
let positions = 0;
const MAX_CACHE_SIZE = 10000;
const evalTable = [
  3, 4, 5, 7, 5, 4, 3, 4, 6, 8, 10, 8, 6, 4, 5, 8, 11, 13, 11, 8, 5, 5, 8, 11,
  13, 11, 8, 5, 4, 6, 8, 10, 8, 6, 4, 3, 4, 5, 7, 5, 4, 3,
];
const MIN_WIN_SCORE = 1_000_000_000 - 42;
class Game {
  board;
  position_cache = {};
  constructor() {
    this.board = new board_1.Board();
  }
  //Positive score if position is better for red.
  //Negative score if position is better for blue.
  //0 if it is completely equal for both sides.
  //Depth is the depth of moves we've ALREADY explored
  //This way, we prioritize winning faster and makiing our opponent
  //win in fewer moves.
  eval(position, depth, player) {
    let start = performance.now();
    let win = position.win();
    if (win == board_1.RED) return 1_000_000_000 - depth;
    if (win == board_1.BLUE) return -1_000_000_000 + depth;
    //Essentially a modified search extension:
    //We're checking if, on the next move, we can win.
    //If we can, great!!!!!!!!!!!!!!!!!!!!!!
    if (this.board.available_win(player)) {
      exports.perf_tests.a += performance.now() - start;
      return (1_000_000_000 - depth) * (player == board_1.RED ? 1 : -1);
    }
    positions += 1;
    let score = position.piece_eval;
    score += position.lane_difference();
    // let score = 0;
    // for (let i = 0; i < COL_COUNT * ROW_COUNT; i += 1) {
    //   let piece = position.piece_at_ind(BigInt(i));
    //   if (piece == BLUE) score -= evalTable[i];
    //   else if (piece == RED) score += evalTable[i];
    // }
    // console.log(score, position.piece_eval);
    // return score;
    exports.perf_tests.a += performance.now() - start;
    return score;
  }
  //Negamax algorithm
  //Throws an error whenwe run out of time so that the call stack unwinds.
  //If you're just searching at a fixed depth, just use the default max time of infinity.
  negamax(
    depth,
    player,
    position = this.board,
    start_time = 0,
    max_time = Number.POSITIVE_INFINITY,
    alpha = Number.NEGATIVE_INFINITY,
    beta = Number.POSITIVE_INFINITY,
    og_depth = depth
  ) {
    if (Date.now() - start_time > max_time) {
      throw new Error(`Exceeded max evaluation time of ${max_time}ms`);
    }
    let start = performance.now();
    this.board.set_player_turn(player);
    let color = player == board_1.RED ? 1 : -1;
    if (depth <= 0)
      return color * this.eval(position, og_depth - depth, player);
    //If someone already won, we can't keep exploring moves.
    //NOTE: Without this line, the bot makes insane blunders.
    //This is because we don't actually terminate the search when there is a win,
    //and we thus don't consider the win on the search.
    let win_status = position.win();
    if (win_status != board_1.NO_PLAYER) {
      return (
        color *
        (win_status == board_1.RED
          ? 1_000_000_000 - (og_depth - depth)
          : -1_000_000_000 + (og_depth - depth))
      );
    }
    let value = Number.NEGATIVE_INFINITY;
    let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
    for (let col = 0; col < position.avail_moves.length; col += 1) {
      let move = position.avail_moves[col];
      if (move == board_1.INVALID_MOVE) continue;
      let next_board = position.duplicate();
      next_board.set_chip(player, move, col);
      let negamax_eval;
      //Convert board state to string, makes inserting into object way faster
      // let position_ind = next_board.full_board_state().toString();
      // let flipped_set_positions = flip(next_board.set_positions, false);
      // // Check if we've already evaluated the mirrored position
      // let mirrored_ind = full_board_state(
      //   flip(next_board.board, true),
      //   flipped_set_positions
      // ).toString();
      // //Invert the board so that blue becomes red and red becomes blue.
      // let inverted_board =
      //   (~next_board.board & next_board.set_positions) ^ player_turn_bit;
      // let inverted_ind = full_board_state(
      //   (~next_board.board & next_board.set_positions) ^ player_turn_bit,
      //   next_board.set_positions
      // ).toString();
      // let inverted_mirrored_ind = full_board_state(
      //   flip(inverted_board, true),
      //   flipped_set_positions
      // ).toString();
      // console.log(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
      // log.writeln(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
      // console.log(position_ind, this.position_cache[position_ind]?.depth);
      // if (this.position_cache[position_ind]?.depth >= depth) {
      //   negamax_eval = this.position_cache[position_ind].eval;
      //   // log.writeln(
      //   //   `- Cache hit. Storing evaluation of depth ${this.position_cache[position_ind].depth} = ${negamax_eval}`
      //   // );
      // }
      // // ?? The computer plays really weirdly when we enable mirrored indices, I'll need to debug these.
      // else if (this.position_cache[mirrored_ind]?.depth >= depth && false) {
      //   // console.log("This was mirrored and found in the cache:");
      //   // next_board.log_board_color();
      //   // console.log("It's mirror:");
      //   // let m = new Board();
      //   // m.set_board_state(BigInt(mirrored_ind));
      //   // m.log_board_color();
      //   negamax_eval = this.position_cache[mirrored_ind].eval;
      // } else if (this.position_cache[inverted_ind]?.depth >= depth) {
      //   negamax_eval = this.position_cache[inverted_ind].eval;
      // } else if (this.position_cache[inverted_mirrored_ind]?.depth >= depth) {
      //   negamax_eval = this.position_cache[inverted_mirrored_ind].eval;
      // } else
      {
        // log.writeln(
        //   `- Evaluating position with negamax function, storing in cache.`
        // );
        negamax_eval = this.negamax(
          depth - 1,
          next_player,
          next_board,
          start_time,
          max_time,
          -beta,
          -alpha,
          og_depth
        );
        // let obj = {
        //   depth: depth,
        //   eval: negamax_eval,
        // };
        // this.position_cache[position_ind] = obj;
        // }
        value = Math.max(value, -negamax_eval);
        // console.log(`\tEvaluation returned ${negamax_eval}`);
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
    }
    exports.perf_tests.b += performance.now() - start;
    return value;
  }
  //Doesn't use iterative deepening... for now
  best_move_fixed_depth(depth, player = board_1.RED) {
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
  //We mark return type as potentially never because the search just stops when it runs out of time and
  //returns the best move so far. It never has an ending return statement -- the search goes as far as possible.
  best_move(
    time, //ms
    player
  ) {
    let start = Date.now();
    let moves = this.board.avail_moves.map((value, index) => {
      return { row: value, col: index };
    });
    let bestMove = moves[0];
    let best_col = 0,
      //OK, technically, moves[0].row COULD equal -1, but it never will. because as soon as we
      //find a valid move, we're gonna set this to a valid row.
      best_row = moves[0].row;
    let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
    for (let depth = 1; depth <= Number.POSITIVE_INFINITY; depth += 1) {
      //There are no moves available, which means they are all losing. Just pick one.
      if (moves.length == 0) {
        for (let col = 0; col < this.board.avail_moves.length; col += 1) {
          if (this.board.avail_moves[col] == board_1.INVALID_MOVE) continue;
          return { col: col, row: this.board.avail_moves[0] };
        }
      }
      /*
            What are we doing here?
            We always update the best move with the best move OF THAT interation.
            As an example, say we're searching at depth 3, and red (the minimizing player) finds
            a play at index 23 that scores -100. We then search at depth 4, and red finds a play at
            index 20 that only scores -50. We'll still update the current best move as index 20.
      
            Why do we do this? Well, take our example. After searching at depth 4, red finds that
            the best play is index 20, which scores -50. If we then search at depth 5 and realize
            that playing at index 20 ACTUALLY yields a score of -Infinity, red will OBVIOUSLY not want to
            play that, because that will lead to a win for blue. However, if we check whether or not we should
            update the best move, we would normally check if the current score is better than the last best score.
            -50 < INFINITY, so we would NOT update the best move and score. This means that by comparing the best move
            from seaches at depth n doesnn't account for realizing that best move is actually losing at a further depth.
      
            To compensate for that, we again update the best move with the best move of one SINGLE iteration.
            I.E., when we move on to depth 2, we will completely disregard the best move we found at depth 1.
            
            BUT, say the move in the first column is a losing move. If we go to depth, say, 7, and the search runs out
            of time after checking the FIRST move, we'll return that one even if we had a winning play. This is because,
            remember, we're using the best move from ONLY searches at depth 7.
            To fix this, after every search, we can update the move list to go from best to worst, based on the results from
            the previous search depth. In this way, we'll check the best possible moves first, so if we run out of time,
            there's a better chance we'll have already searched the winning move.
            */
      let scores = [];
      //An array of moves that will be ordered from best to worst
      let new_moves = [];
      let best_score = null;
      // console.log(`Searching @ depth of ${depth}`);
      for (let move of moves) {
        if (move.row == board_1.INVALID_MOVE) continue;
        let board = this.board.duplicate();
        board.set_chip(player, move.row, move.col);
        if (Date.now() - start >= time) return { col: best_col, row: best_row };
        let score;
        //Wrap in a try block because if the evaluation takes too long,
        //it throws an error
        try {
          score = -this.negamax(depth, next_player, board, start, time);
          // console.log(
          //   `Position (${move.col}, ${move.row}) returns score of ${score}`
          // );
        } catch (e) {
          return { col: best_col, row: best_row };
        }
        if (score >= MIN_WIN_SCORE) return { col: move.col, row: move.row };
        if (Date.now() - start >= time) return { col: best_col, row: best_row };
        //Format moves so that next iteration, we look at the most promising moves first
        //If we've found a losing move, we don't want to explore it at a lower depth,
        //so we only add moves if they have some kind of winning potential.
        if (score >= -MIN_WIN_SCORE) {
          if (new_moves.length == 0) {
            new_moves.push(move);
            scores.push(score);
          } else {
            //Here, we're putting the move in the move list so that it is ordered frmo best to worst
            //for the next iteration.
            let ind = 0;
            for (let i = 0; i < scores.length; i += 1) {
              if (scores[i] > score) ind += 1;
            }
            scores.splice(ind, 0, score);
            new_moves.splice(ind, 0, move);
          }
        }
        //If a move wasn't added, that means it was a losing move. If there are
        //no moves added, that means EVERY MOVE we've checked so far has been losing,
        //so just return the first column.
        // bestMove = new_moves[0] || moves[0];
        if (best_score == null || score > best_score) {
          best_col = move.col;
          best_row = move.row;
          best_score = score;
        }
      }
      moves = new_moves;
    }
  }
}
exports.Game = Game;
// let m = new Board();
// m.set_board_state(554153860399167n);
// // m.log_board();
let game = new Game();
game.board.set_board_state(9442948171184016130984539n);
// // game.board.set_board_state(
// //   BigInt(parseInt("1111110000000000000000000000000000000000000111011", 2))
// // );
game.board.log_board();
game.negamax(90, 0 /* PLAYER.RED */, game.board, Date.now(), 1000000);
// setTimeout(() => console.log(positions), 10000);
// console.log(game.bestMove(5));
// console.time();
// let eval_ = game.best_move_fixed_depth(9, RED);
// console.timeEnd();
// console.log(
//   eval_,
//   positions,
//   Reflect.ownKeys(game.position_cache).length,
//   a,
//   d
// );
// game.position_cache = {};
// console.time();
// let _eval_ = game.best_move(1000, RED);
// console.timeEnd();
// console.log(
//   _eval_,
//   positions,
//   Reflect.ownKeys(game.position_cache).length,
//   a,
//   d
// );
