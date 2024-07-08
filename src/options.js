"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleGameOptions = void 0;
class ConsoleGameOptions {
    constructor(options) {
        this.depth = 10;
        this.bot_first = false;
        this.time_evaluation = true;
        if (options.depth != null)
            this.depth = options.depth;
        if (options.bot_first != null)
            this.bot_first = options.bot_first;
        if (options.time_evaluation != null) {
            this.time_evaluation = options.time_evaluation;
        }
    }
}
exports.ConsoleGameOptions = ConsoleGameOptions;
