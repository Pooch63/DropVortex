export class ConsoleGameOptions {
  public depth?: number = 10;
  public bot_first?: boolean = false;
  public time_evaluation?: boolean = true;

  constructor(options: Record<string, any>) {
    if (options.depth != null) this.depth = options.depth;
    if (options.bot_first != null) this.bot_first = options.bot_first;
    if (options.time_evaluation != null) {
      this.time_evaluation = options.time_evaluation;
    }
  }
}
