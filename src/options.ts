export class ConsoleGameOptions {
  //Can't have both a move time and a fixed depth for the bot
  public move_time?: number | undefined = 1000; //ms
  public fixed_depth?: number | undefined = undefined;

  public bot_first?: boolean = false;
  public time_evaluation?: boolean = true;

  constructor(options: Record<string, any>) {
    //Can't have both a fixed deprh AND a move time
    if (options.move_time != undefined && options.depth != undefined) {
      console.error(
        "Error: You cannot assign DropVortex both a fixed depth and move time. You must choose only one, OR use the defaults"
      );
    }

    if (options.depth != null) this.fixed_depth = options.depth;
    if (options.move_time != null) this.move_time = options.move_time;
    if (options.bot_first != null) this.bot_first = options.bot_first;
    if (options.time_evaluation != null) {
      this.time_evaluation = options.time_evaluation;
    }
  }
}
