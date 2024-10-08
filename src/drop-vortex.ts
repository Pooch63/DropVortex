import * as log from "./log";
import { Game, perf_tests } from "./game";
import { start_game } from "./cli";
import { ConsoleGameOptions } from "./options";

import * as Board from "../tests/old-bot.js";
import { BLUE, NO_PLAYER, RED } from "./board";

console.log(Board);
new Game();
// log.write("");

export default class DropVortex {
  /**
   * Start a console game.
   */
  start(options: ConsoleGameOptions | Record<string, any>) {
    let config =
      options instanceof ConsoleGameOptions
        ? options
        : new ConsoleGameOptions(options);
    start_game(config);
  }
}

// new DropVortex().start({ move_time: 100, bot_first: true });

let red = 0,
  blue = 0;
const THINK_TIME = 1;
for (let i = 0; i < 5; i += 1) {
  let game = new Game();
  let old_game = new Board.Board();

  while (game.board.win() == NO_PLAYER) {
    let full = true;
    for (let row of game.board.avail_moves) {
      if (row != -1) full = false;
    }
    if (full) break;
    let best_first = game.best_move(THINK_TIME, RED);
    game.board.set_chip(RED, best_first.row, best_first.col);
    old_game.setSquareFromPos(best_first.col, best_first.row, 2);

    // game.board.log_board_color();

    full = true;
    for (let row of game.board.avail_moves) {
      if (row != -1) full = false;
    }
    if (full) break;

    let best_second = old_game.bestMove(THINK_TIME, 1_000_000, 1);
    old_game.setSquare(best_second, 1);
    game.board.set_ind(BLUE, BigInt(best_second), best_second % 7);

    // game.board.log_board_color();
  }

  let win = game.board.win();
  if (win == RED) red += 1;
  if (win == BLUE) blue += 1;
}
for (let i = 0; i < 5; i += 1) {
  let game = new Game();
  let old_game = new Board.Board();

  while (game.board.win() == NO_PLAYER) {
    let full = true;
    for (let row of game.board.avail_moves) {
      if (row != -1) full = false;
    }
    if (full) break;

    let best_second = old_game.bestMove(THINK_TIME, 1_000_000, 1);
    old_game.setSquare(best_second, 1);
    game.board.set_ind(BLUE, BigInt(best_second), best_second % 7);

    // game.board.log_board_color();

    full = true;
    for (let row of game.board.avail_moves) {
      if (row != -1) full = false;
    }
    if (full) break;

    let best_first = game.best_move(THINK_TIME, RED);
    game.board.set_chip(RED, best_first.row, best_first.col);
    old_game.setSquareFromPos(best_first.col, best_first.row, 2);

    // game.board.log_board_color();
  }

  let win = game.board.win();
  if (win == RED) red += 1;
  if (win == BLUE) blue += 1;
}
console.log(`Red-Blue: ${red}-${blue}`);
console.log(`RED PERFORMANE: `, perf_tests);
console.log(`BLUE PERFORMANE: `, Board.perf_tests);

log.close();
