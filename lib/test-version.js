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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
const Board = __importStar(require("../tests/old-bot.js"));
const board_1 = require("./board");
const safe_1 = __importDefault(require("colors/safe"));
const log = (str) => process.stdout.write(str);
// const clearLine = () => process.stdout.write("\r\x1b[K");
const clearLine = () => {
    process.stdout.moveCursor(0, -1); // up one line
    process.stdout.clearLine(1); // from cursor to end
};
let red = 0, blue = 0;
const THINK_TIME = 100;
const ROUND_COUNT = 30;
let games_completed = 0;
log(safe_1.default.magenta(`Running shallow test suite. Each side is playing ${ROUND_COUNT} rounds playing first for a total of ${ROUND_COUNT * 2} rounds.` +
    "\n" +
    `Both players are given ${THINK_TIME}ms per turn to think.` +
    "\n") +
    safe_1.default.italic(`Do not expect this to take more than ${42 * THINK_TIME * ROUND_COUNT * 2}ms`) +
    "\n");
log(safe_1.default.bold("Beginning suite now.") + "\n\n\n");
let start = Date.now();
function percent_bar(percent) {
    //Show percentage with 50 characters
    let output = "[";
    let hashes = Math.floor(percent / 2);
    for (let i = 0; i < hashes; i += 1)
        output += "#";
    for (let i = 0; i < 50 - hashes; i += 1)
        output += " ";
    output += `] ${Math.floor(percent)}%`;
    return output;
}
function log_info() {
    clearLine();
    clearLine();
    log(percent_bar((games_completed / (ROUND_COUNT * 2)) * 100) + "\n");
    log(safe_1.default.green(`${Date.now() - start}ms elapsed`) + "\n");
}
for (let i = 0; i < ROUND_COUNT; i += 1) {
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
    games_completed += 1;
    log_info();
}
for (let i = 0; i < ROUND_COUNT; i += 1) {
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
    games_completed += 1;
    log_info();
    let win = game.board.win();
    if (win == board_1.RED)
        red += 1;
    if (win == board_1.BLUE)
        blue += 1;
}
log("\n");
log(safe_1.default.bold("Final results: ") +
    safe_1.default.red(red.toString()) +
    safe_1.default.bold(" - ") +
    safe_1.default.blue(blue.toString()) +
    "\n");
