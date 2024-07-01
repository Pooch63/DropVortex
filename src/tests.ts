import {
  Board,
  PLAYER,
  RED,
  BLUE,
  COL_COUNT,
  INVALID_MOVE,
  type row,
  type column,
} from "board";

//Log all the possible moves of a board, and all the possible moves following all those possible moves, etc.
//Basically visualizing minimax w/o alpha-beta pruning.
function log_board_moves(
  depth = 2,
  b: Board = new Board(),
  player: PLAYER = RED
) {
  if (depth == 0) return;
  let moves = b.avail_moves;

  for (let col = 0; col < COL_COUNT; col += 1) {
    let move = moves[col];
    if (move == INVALID_MOVE) continue;

    let duplicate = b.duplicate();
    duplicate.set_chip(player, move as row, col as column);

    console.log(`${depth}:\n${duplicate.board_str()}\n`);
    log_board_moves(depth - 1, duplicate, player == RED ? BLUE : RED);
  }
}
