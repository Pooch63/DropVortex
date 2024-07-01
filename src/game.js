"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const board_1 = require("./board");
let positions = 0;
const MAX_CACHE_SIZE = 10000;
class Game {
    constructor(first_player = board_1.RED) {
        this.position_cache = {};
        this.board = new board_1.Board();
        this.board.set_player_turn(first_player);
    }
    //Positive score if position is better for red.
    //Negative score if position is better for blue.
    //0 if it is completely equal for both sides.
    eval(position) {
        let win = position.win();
        if (win == board_1.RED)
            return Number.POSITIVE_INFINITY;
        if (win == board_1.BLUE)
            return Number.NEGATIVE_INFINITY;
        positions += 1;
        return 0;
        return Math.random();
        positions += 1;
        let total = 0;
        for (let ind = 0n; ind < BigInt(7); ind += 1n) {
            if (position.set_at_ind(ind)) {
                let player = position.piece_at_ind(ind);
                total += player == 1 ? 1 : -1;
            }
        }
        return total;
    }
    //Negamax algorithm
    negamax(depth, player, position = this.board, alpha = Number.NEGATIVE_INFINITY, beta = Number.POSITIVE_INFINITY) {
        position.set_player_turn(player);
        let color = player == board_1.RED ? 1 : -1;
        if (depth <= 0)
            return color * this.eval(position);
        let value = Number.NEGATIVE_INFINITY;
        let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
        for (let col = 0; col < this.board.avail_moves.length; col += 1) {
            let move = position.avail_moves[col];
            if (move == board_1.INVALID_MOVE)
                continue;
            let next_board = position.duplicate();
            next_board.set_chip(player, move, col);
            let negamax_eval;
            let position_ind = next_board.full_board_state().toString(2);
            // log.writeln(`Depth = ${depth}, Evaluating Pos ${position_ind}`);
            // console.log(position_ind, this.position_cache[position_ind]?.depth);
            if (this.position_cache[position_ind]?.depth >= depth) {
                negamax_eval = this.position_cache[position_ind].eval;
                // log.writeln(
                //   `- Cache hit. Storing evaluation of depth ${this.position_cache[position_ind].depth} = ${negamax_eval}`
                // );
            }
            else {
                // log.writeln(
                //   `- Evaluating position with negamax function, storing in cache.`
                // );
                negamax_eval = this.negamax(depth - 1, next_player, next_board, -beta, -alpha);
                this.position_cache[position_ind] = {
                    depth: depth,
                    eval: negamax_eval,
                };
            }
            value = Math.max(value, -negamax_eval);
            alpha = Math.max(alpha, value);
            if (alpha >= beta)
                break;
        }
        return value;
    }
}
exports.Game = Game;
let m = new board_1.Board();
m.set_board_state(554153860399167n);
// m.log_board();
let game = new Game();
// game.board.set_board_state(
//   BigInt(parseInt("1111110000000000000000000000000000000000000111011", 2))
// );
game.board.log_board();
console.time();
let eval_ = game.negamax(14, board_1.BLUE);
console.timeEnd();
console.log(eval_, positions, Reflect.ownKeys(game.position_cache).length);
let board = new board_1.Board();
function log_(depth = 2, b = board, player = board_1.RED) {
    if (depth == 0)
        return;
    let moves = b.avail_moves;
    for (let col = 0; col < board_1.COL_COUNT; col += 1) {
        let move = moves[col];
        if (move == board_1.INVALID_MOVE)
            continue;
        let duplicate = b.duplicate();
        duplicate.set_chip(player, move, col);
        console.log(move, col);
        console.log(`${depth}:\n${duplicate.board_str()}\n`);
        log_(depth - 1, duplicate, player == board_1.RED ? board_1.BLUE : board_1.RED);
    }
}
// log_();
