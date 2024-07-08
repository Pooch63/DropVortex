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
  full_board_state,
  flip,
  player_turn_bit,
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
    player: PLAYER.RED | PLAYER.BLUE,
    position: Board = this.board,
    alpha: number = Number.NEGATIVE_INFINITY,
    beta: number = Number.POSITIVE_INFINITY,
    og_depth: number = depth
  ): number {
    this.board.set_player_turn(player);
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

      let flipped_set_positions = flip(next_board.set_positions, false);

      //Check if we've already evaluated the mirrored position
      let mirrored_ind = full_board_state(
        flip(next_board.board, true),
        flipped_set_positions
      ).toString();

      //Invert the board so that blue becomes red and red becomes blue.
      let inverted_board =
        (~next_board.board & next_board.set_positions) ^ player_turn_bit;
      let inverted_ind = full_board_state(
        (~next_board.board & next_board.set_positions) ^ player_turn_bit,
        next_board.set_positions
      ).toString();

      let inverted_mirrored_ind = full_board_state(
        flip(inverted_board, true),
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
      } else if (this.position_cache[inverted_mirrored_ind]?.depth >= depth) {
        negamax_eval = this.position_cache[inverted_mirrored_ind].eval;
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
  best_move_fixed_depth(depth: number, player: PLAYER = RED) {
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

  best_move(time = 1_000, player: PLAYER.RED | PLAYER.BLUE = BLUE) {
    let start = Date.now();

    let moves = this.board.avail_moves;
    let bestMove = moves[0];

    let losing =
      player == RED ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (let depth = 1; depth <= Number.POSITIVE_INFINITY; depth += 1) {
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

      console.log("Checking at depth of", depth, bestMove);
      for (let col = 0; col < moves.length; col += 1) {
        let move = moves[col];
        if (move == INVALID_MOVE) continue;
        let board = this.board.duplicate();
        board.set_ind(player, BigInt(move), col);

        if (Date.now() - start >= time) return bestMove;

        let score = this.negamax(depth, player, board);

        if (Date.now() - start >= time) return bestMove;

        //Format moves so that next iteration, we look at the most promising moves first

        //If we've found a losing move, we don't want to explore it at a lower depth,
        //so we only add moves if they have some kind of winning potential.
        if (score != losing) {
          if (new_moves.length == 0) {
            new_moves.push(move);
            scores.push(score);
          } else {
            //Here, we're putting the move in the move list so that it is ordered frmo best to worst
            //for the next iteration.
            let ind = 0;
            for (let i = 0; i < scores.length; i += 1) {
              if (player == RED && scores[i] > score) ind += 1;
              if (player == BLUE && scores[i] < score) ind += 1;
            }
            scores.splice(ind, 0, score);
            new_moves.splice(ind, 0, move);
          }
        }

        //If a move wasn't added, that means it was a losing move. If there are
        //no moves added, that means EVERY MOVE we've checked so far has been losing,
        //so just return the first column.
        bestMove = new_moves[0] || moves[0];
      }
      moves = new_moves;
    }
    return bestMove;
  }
}

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
let eval_ = game.negamax(9, RED);
console.timeEnd();
console.log(
  eval_,
  positions,
  Reflect.ownKeys(game.position_cache).length,
  a,
  d
);
