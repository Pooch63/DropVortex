"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleGameOptions = void 0;
const log_1 = require("./log");
const game_1 = require("./game");
const cli_1 = require("./cli");
new game_1.Game();
(0, log_1.write)("");
class ConsoleGameOptions {
    constructor() {
        this.depth = 10;
    }
}
exports.ConsoleGameOptions = ConsoleGameOptions;
class DropVortex {
    /**
     * Start a console game.
     */
    start(options) {
        (0, cli_1.start_game)(options.depth);
    }
}
exports.default = DropVortex;
new DropVortex().start({ depth: 9 });
