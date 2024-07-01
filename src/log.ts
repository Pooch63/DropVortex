import * as fs from "fs";

let stream = fs.createWriteStream("./LOG", { flags: "w" });

export function write(value: string) {
  stream.write(value);
}
export function writeln(value: string) {
  stream.write(value + "\n");
}
