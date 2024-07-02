"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("./board");
const game_1 = require("./game");
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const prompt = (0, prompt_sync_1.default)();
console.log(`You are playing against the computer at depth = 7`);
let game = new game_1.Game();
console.log(game.board.win(), game.board.win(), board_1.NO_PLAYER);
var Turn;
(function (Turn) {
    Turn[Turn["BOT"] = 0] = "BOT";
    Turn[Turn["HUMAN"] = 1] = "HUMAN";
})(Turn || (Turn = {}));
let turn = Turn.BOT;
while (game.board.win() == board_1.NO_PLAYER) {
    //No winner but no available moves -- draw!!
    if (game.board.set_positions == (1n << 43n) - 1n) {
        console.log("Draw!");
        break;
    }
    if (turn == Turn.BOT) {
        let best = game.bestMove(9);
        game.board.set_chip(board_1.RED, best.row, best.col);
    }
    else {
        game.board.log_board();
        let moves = game.board.avail_moves;
        let valid_moves = [];
        console.log("Moves:");
        for (let col = 0; col < moves.length; col += 1) {
            let move = moves[col];
            if (move == board_1.INVALID_MOVE)
                continue;
            valid_moves.push({ row: move, col: col });
            console.log(`  ${valid_moves.length}: (${col + 1}, ${move + 1})`);
        }
        let val = prompt("Which move do you want? >> ");
        let int = parseInt(val);
        while (int < 1 || int > moves.length || isNaN(int) || val === null) {
            if (val == null)
                break;
            val = prompt("Invalid move number. Please try again: ");
            int = parseInt(val);
        }
        let move = valid_moves[int - 1];
        game.board.set_chip(board_1.BLUE, move.row, move.col);
    }
    turn = turn == Turn.BOT ? Turn.HUMAN : Turn.BOT;
}
game.board.log_board();
let winner = game.board.win();
if (winner == board_1.RED) {
    console.log(`Wow. The bot beat you!`);
}
else {
    console.log(`Nice job! You just beat the bot.`);
}
