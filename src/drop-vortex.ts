import { write } from "./log";
import { Game } from "./game";
import { start_game } from "./cli";

new Game();
write("");

export class ConsoleGameOptions {
  public depth?: number = 10;
}

export default class DropVortex {
  /**
   * Start a console game.
   */
  start(options: ConsoleGameOptions) {
    start_game(options.depth);
  }
}

new DropVortex().start({ depth: 9 });
