"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("board");
//Log all the possible moves of a board, and all the possible moves following all those possible moves, etc.
//Basically visualizing minimax w/o alpha-beta pruning.
function log_board_moves(depth = 2, b = new board_1.Board(), player = board_1.RED) {
    if (depth == 0)
        return;
    let moves = b.avail_moves;
    for (let col = 0; col < board_1.COL_COUNT; col += 1) {
        let move = moves[col];
        if (move == board_1.INVALID_MOVE)
            continue;
        let duplicate = b.duplicate();
        duplicate.set_chip(player, move, col);
        console.log(`${depth}:\n${duplicate.board_str()}\n`);
        log_board_moves(depth - 1, duplicate, player == board_1.RED ? board_1.BLUE : board_1.RED);
    }
}
