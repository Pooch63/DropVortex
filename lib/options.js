"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleGameOptions = void 0;
class ConsoleGameOptions {
    //Can't have both a move time and a fixed depth for the bot
    move_time = 1000; //ms
    fixed_depth = undefined;
    bot_first = false;
    time_evaluation = true;
    constructor(options) {
        //Can't have both a fixed deprh AND a move time
        if (options.move_time != undefined && options.depth != undefined) {
            console.error("Error: You cannot assign DropVortex both a fixed depth and move time. You must choose only one, OR use the defaults");
        }
        if (options.depth != null)
            this.fixed_depth = options.depth;
        if (options.move_time != null)
            this.move_time = options.move_time;
        if (options.bot_first != null)
            this.bot_first = options.bot_first;
        if (options.time_evaluation != null) {
            this.time_evaluation = options.time_evaluation;
        }
    }
}
exports.ConsoleGameOptions = ConsoleGameOptions;
