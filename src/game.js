"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const board_1 = require("./board");
let a = 0, b = 0, c = 0, d = 0;
let positions = 0;
const MAX_CACHE_SIZE = 10000;
class Game {
    constructor() {
        this.position_cache = {};
        this.board = new board_1.Board();
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
    }
    //Negamax algorithm
    negamax(depth, player, position = this.board, alpha = Number.NEGATIVE_INFINITY, beta = Number.POSITIVE_INFINITY) {
        let color = player == board_1.RED ? 1 : -1;
        if (depth <= 0)
            return color * this.eval(position);
        let value = Number.NEGATIVE_INFINITY;
        let next_player = player == board_1.RED ? board_1.BLUE : board_1.RED;
        for (let col = 0; col < this.board.avail_moves.length; col += 1) {
            let move = position.avail_moves[col];
            if (move == board_1.INVALID_MOVE)
                continue;
            // let m = performance.now();
            let next_board = position.duplicate();
            next_board.set_chip(player, move, col);
            // d += performance.now() - m;
            let negamax_eval;
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
console.log(eval_, positions, Reflect.ownKeys(game.position_cache).length, a, d);
