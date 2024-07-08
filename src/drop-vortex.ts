import * as log from "./log";
import { Game } from "./game";
import { start_game } from "./cli";
import { ConsoleGameOptions } from "./options";

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

new DropVortex().start({ depth: 9 });

log.close();
