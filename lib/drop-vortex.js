"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const log = __importStar(require("./log"));
const game_1 = require("./game");
const cli_1 = require("./cli");
const options_1 = require("./options");
const Board = __importStar(require("../tests/old-bot.js"));
const board_1 = require("./board");
console.log(Board);
new game_1.Game();
// log.write("");
class DropVortex {
    /**
     * Start a console game.
     */
    start(options) {
        let config = options instanceof options_1.ConsoleGameOptions
            ? options
            : new options_1.ConsoleGameOptions(options);
        (0, cli_1.start_game)(config);
    }
}
exports.default = DropVortex;
// new DropVortex().start({ move_time: 100, bot_first: true });
let red = 0, blue = 0;
const THINK_TIME = 1;
for (let i = 0; i < 5; i += 1) {
    let game = new game_1.Game();
    let old_game = new Board.Board();
    while (game.board.win() == board_1.NO_PLAYER) {
        let full = true;
        for (let row of game.board.avail_moves) {
            if (row != -1)
                full = false;
        }
        if (full)
            break;
        let best_first = game.best_move(THINK_TIME, board_1.RED);
        game.board.set_chip(board_1.RED, best_first.row, best_first.col);
        old_game.setSquareFromPos(best_first.col, best_first.row, 2);
        // game.board.log_board_color();
        full = true;
        for (let row of game.board.avail_moves) {
            if (row != -1)
                full = false;
        }
        if (full)
            break;
        let best_second = old_game.bestMove(THINK_TIME, 1_000_000, 1);
        old_game.setSquare(best_second, 1);
        game.board.set_ind(board_1.BLUE, BigInt(best_second), best_second % 7);
        // game.board.log_board_color();
    }
    let win = game.board.win();
    if (win == board_1.RED)
        red += 1;
    if (win == board_1.BLUE)
        blue += 1;
}
for (let i = 0; i < 5; i += 1) {
    let game = new game_1.Game();
    let old_game = new Board.Board();
    while (game.board.win() == board_1.NO_PLAYER) {
        let full = true;
        for (let row of game.board.avail_moves) {
            if (row != -1)
                full = false;
        }
        if (full)
            break;
        let best_second = old_game.bestMove(THINK_TIME, 1_000_000, 1);
        old_game.setSquare(best_second, 1);
        game.board.set_ind(board_1.BLUE, BigInt(best_second), best_second % 7);
        // game.board.log_board_color();
        full = true;
        for (let row of game.board.avail_moves) {
            if (row != -1)
                full = false;
        }
        if (full)
            break;
        let best_first = game.best_move(THINK_TIME, board_1.RED);
        game.board.set_chip(board_1.RED, best_first.row, best_first.col);
        old_game.setSquareFromPos(best_first.col, best_first.row, 2);
        // game.board.log_board_color();
    }
    let win = game.board.win();
    if (win == board_1.RED)
        red += 1;
    if (win == board_1.BLUE)
        blue += 1;
}
console.log(`Red-Blue: ${red}-${blue}`);
console.log(`RED PERFORMANE: `, game_1.perf_tests);
console.log(`BLUE PERFORMANE: `, Board.perf_tests);
log.close();
