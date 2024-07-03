import { BLUE, INVALID_MOVE, NO_PLAYER, RED, column, row } from "./board";
import { Game } from "./game";
import colors from "colors/safe";
import prompt_ from "prompt-sync";

const prompt = prompt_();

export function start_game(depth: number) {
  let game = new Game();
  console.log(`You are playing against the computer at depth = ${depth}`);

  enum Turn {
    BOT,
    HUMAN,
  }
  let turn = Turn.BOT;
  while (game.board.win() == NO_PLAYER) {
    //No winner but no available moves -- draw!!
    if (game.board.set_positions == (1n << 43n) - 1n) {
      console.log("Draw!");
      break;
    }
    if (turn == Turn.BOT) {
      let best = game.bestMove(depth);
      game.board.set_chip(RED, best.row as row, best.col as column);
    } else {
      game.board.log_board_color();
      let moves = game.board.avail_moves;
      let valid_moves: { row: row; col: column }[] = [];
      console.log("Moves:");
      for (let col = 0; col < moves.length; col += 1) {
        let move = moves[col];
        if (move == INVALID_MOVE) continue;
        valid_moves.push({ row: move, col: col as column });
        console.log(
          colors.blue(`   ${valid_moves.length}: (${col + 1}, ${move + 1})`)
        );
      }
      let val = prompt("Which move do you want? >> ");
      let int = parseInt(val);
      while (
        int < 1 ||
        int > valid_moves.length ||
        isNaN(int) ||
        val === null
      ) {
        if (val == null) break;
        val = prompt("Invalid move number. Please try again: ");
        int = parseInt(val);
      }
      let move = valid_moves[int - 1];
      game.board.set_chip(BLUE, move.row, move.col);
    }

    turn = turn == Turn.BOT ? Turn.HUMAN : Turn.BOT;
  }
  game.board.log_board_color();
  let winner = game.board.win();
  if (winner == RED) {
    console.log(`Wow. The bot beat you!`);
  } else {
    console.log(`Nice job! You just beat the bot.`);
  }
}
