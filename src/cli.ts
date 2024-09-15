import { ConsoleGameOptions } from "options";
import {
  BLUE,
  Board,
  INVALID_MOVE,
  NO_PLAYER,
  RED,
  column,
  row,
} from "./board";
import { Game } from "./game";
import colors from "colors/safe";
import prompt_ from "prompt-sync";

const prompt = prompt_();

export function start_game(options: ConsoleGameOptions) {
  let { move_time, fixed_depth: depth, bot_first, time_evaluation } = options;
  let game = new Game();

  let boards = [];
  if (options.fixed_depth != undefined) {
    console.log(`You are playing against the computer at depth = ${depth}`);
  } else if (options.move_time != undefined) {
    console.log(
      `You are playing against the bot. It has ${options.move_time}ms to think.`
    );
  }

  enum Turn {
    BOT,
    HUMAN,
  }
  let turn = bot_first ? Turn.BOT : Turn.HUMAN;
  game_loop: while (true) {
    let winner = game.board.win();

    if (winner != NO_PLAYER) {
      game.board.log_board_color();

      if (winner == RED) {
        console.log(`Wow. The bot beat you!`);
      } else {
        console.log(`Nice job! You just beat the bot.`);
      }

      console.log("You may still go back through the positions of this game.");

      while (true) {
        let command = prompt(">> ");
        let result = process_command(command);
        if (result.reprint) continue game_loop;
      }
    }

    //No winner but no available moves -- draw!!
    if (game.board.set_positions == (1n << 43n) - 1n) {
      console.log("Draw!");
      break;
    }
    if (turn == Turn.BOT) {
      let time_taken: number = 0;
      let start = Date.now();
      let best: { col: number; row: number } =
        options.fixed_depth == undefined
          ? game.best_move(options.move_time, RED)
          : game.best_move_fixed_depth(depth, RED);
      time_taken = Date.now() - start;

      game.board.set_chip(RED, best.row as row, best.col as column);
      boards.push(game.board.duplicate());
      if (time_evaluation)
        console.log(`\nBot evaluation took ${time_taken}ms.\n`);
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
      let int = int_parse(val);

      while (true) {
        if (
          !(int < 1 || int > valid_moves.length || isNaN(int) || val === null)
        ) {
          break;
        }

        if (val == null) process.exit();

        let prompt_text = "Invalid move number. Please try again: ";
        //There are certain commands you can use during the game
        let command = process_command(val);

        if (command.reprint) continue game_loop;
        if (command.processed) {
          prompt_text = "Which move do you want? >> ";
        }

        val = prompt(prompt_text);
        int = int_parse(val);
      }

      let move = valid_moves[int - 1];
      game.board.set_chip(BLUE, move.row, move.col);
      boards.push(game.board.duplicate());
    }

    turn = turn == Turn.BOT ? Turn.HUMAN : Turn.BOT;
  }

  function process_command(val: string): {
    processed: boolean;
    /* Should we reprint the board and ask for the user's move? */
    reprint?: boolean;
  } {
    let command_name = val.toLowerCase().split(" ")[0];
    let args = val
      .split(" ")
      .filter((arg) => arg.length != 0)
      .slice(1);
    if (command_name == "quit") process.exit();
    if (command_name == "get-board") {
      console.log(
        "Board State: " +
          colors.cyan(`${game.board.full_board_state().toString()}n`)
      );
      return { processed: true };
    }
    if (command_name == "set-board") {
      if (args[0] == null) {
        console.log(colors.red("You must specify a board state"));
        return { processed: true };
      }

      let num = args[0];
      //They might specify an n at the end if they copied and pasted a BigInt,
      //just remove it
      if (num[num.length - 1] == "n") num = num.substring(0, num.length - 1);

      try {
        let bigint = BigInt(num);
        game.board.board = bigint;
        //Whoever's turn it is to go in the board state should go next.
        turn = game.board.get_player_turn() == RED ? Turn.BOT : Turn.HUMAN;

        return { processed: true, reprint: true };
      } catch (e) {
        console.log(colors.red("Unable to parse board state."));
      }

      return { processed: true };
    }
    if (command_name == "last") {
      boards.pop();
      if (boards.length > 0) game.board = boards[boards.length - 1];
      else game.board = new Board();
      return { processed: true, reprint: true };
    }
    if (command_name == "set-depth") {
      if (args[0] == null) {
        console.log(colors.red("You must specify a depth"));
      } else if (isNaN(int_parse(args[0])) || int_parse(args[0]) < 1) {
        console.log(
          colors.red("You must specify a positive integer as a depth.")
        );
      }
      depth = int_parse(args[0]);

      return { processed: true };
    }
    if (command_name == "set-bot") {
      turn = Turn.BOT;
      return { processed: true, reprint: true };
    }
    return { processed: false };
  }
}

function int_parse(str: string) {
  if (!/^([0-9])+$/.test(str)) return NaN;
  return parseInt(str);
}
