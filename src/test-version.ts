import { Game, perf_tests } from "./game";
import { start_game } from "./cli";
import { ConsoleGameOptions } from "./options";

import * as Board from "../tests/old-bot.js";
import { BLUE, NO_PLAYER, RED } from "./board";

import colors from "colors/safe";

const log = (str: string) => process.stdout.write(str);
// const clearLine = () => process.stdout.write("\r\x1b[K");
const clearLine = () => {
  process.stdout.moveCursor(0, -1); // up one line
  process.stdout.clearLine(1); // from cursor to end
};

let red = 0,
  blue = 0;
const THINK_TIME = 100;
const ROUND_COUNT = 30;

let games_completed = 0;

log(
  colors.magenta(
    `Running shallow test suite. Each side is playing ${ROUND_COUNT} rounds playing first for a total of ${
      ROUND_COUNT * 2
    } rounds.` +
      "\n" +
      `Both players are given ${THINK_TIME}ms per turn to think.` +
      "\n"
  ) +
    colors.italic(
      `Do not expect this to take more than ${
        42 * THINK_TIME * ROUND_COUNT * 2
      }ms`
    ) +
    "\n"
);

log(colors.bold("Beginning suite now.") + "\n\n\n");

let start = Date.now();

function percent_bar(percent: number) {
  //Show percentage with 50 characters
  let output = "[";
  let hashes = Math.floor(percent / 2);

  for (let i = 0; i < hashes; i += 1) output += "#";
  for (let i = 0; i < 50 - hashes; i += 1) output += " ";

  output += `] ${Math.floor(percent)}%`;

  return output;
}
function log_info() {
  clearLine();
  clearLine();
  log(percent_bar((games_completed / (ROUND_COUNT * 2)) * 100) + "\n");
  log(colors.green(`${Date.now() - start}ms elapsed`) + "\n");
}

for (let i = 0; i < ROUND_COUNT; i += 1) {
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

  games_completed += 1;
  log_info();
}
for (let i = 0; i < ROUND_COUNT; i += 1) {
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

  games_completed += 1;
  log_info();

  let win = game.board.win();
  if (win == RED) red += 1;
  if (win == BLUE) blue += 1;
}

log("\n");
log(
  colors.bold("Final results: ") +
    colors.red(red.toString()) +
    colors.bold(" - ") +
    colors.blue(blue.toString()) +
    "\n"
);
