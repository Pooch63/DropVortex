import colors from "colors/safe";

/** DEBUG */
function log_board(board: bigint) {
  let output = "";
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      output += (board & (1n << BigInt(col + row * 7))) == 0n ? "0" : "1";
    }
    output += "\n";
  }
  console.log(output);
}

export const enum PLAYER {
  RED = 0,
  BLUE = 1,
  NO_PLAYER = 2,
}
export const RED = PLAYER.RED,
  BLUE = PLAYER.BLUE,
  NO_PLAYER = PLAYER.NO_PLAYER;

/** NOTE: if you update these values, you will also need to update the lane bitboard gen code.*/
export const ROW_COUNT = 6,
  COL_COUNT = 7;
const WIN_LENGTH = 4;
export type row = 0 | 1 | 2 | 3 | 4 | 5;
export type column = 0 | 1 | 2 | 3 | 4 | 5 | 6;

//Bitboards of all the lanes. That means that, if every square on the board matching up to a set bit
//on the lane bitboard is of the same player, that player wins
const lane_bitboards: bigint[] = [];

//Get row lanes
let rows_bits = BigInt(0b1111);

for (let row = 0; row < ROW_COUNT; row += 1) {
  for (let col = 0; col <= COL_COUNT - WIN_LENGTH; col += 1) {
    lane_bitboards.push(rows_bits << BigInt(col + row * COL_COUNT));
  }
}
//Get column lanes
let col_bits = BigInt(0b1000000100000010000001);
//Basically, no matter what, the number of columns is equal to the number of squares - win length - 1
for (
  let offset = 0n;
  offset < ROW_COUNT * COL_COUNT - WIN_LENGTH;
  offset += 1n
) {
  lane_bitboards.push(col_bits << offset);
}
//And, finally, the diagonals. These are a bit more annoying to implement.
for (let row = ROW_COUNT - 1; row >= WIN_LENGTH - 1; row -= 1) {
  for (let set_bit_x = WIN_LENGTH - 1; set_bit_x < COL_COUNT; set_bit_x += 1) {
    let board: bigint = 0n;
    let mirrored_board: bigint = 0n;
    for (let under_row = 0; under_row < WIN_LENGTH; under_row += 1) {
      board |=
        (1n << BigInt(set_bit_x - under_row)) <<
        BigInt(COL_COUNT * (row - under_row));
      mirrored_board |=
        (1n << BigInt(COL_COUNT - (set_bit_x - under_row) - 1)) <<
        BigInt(COL_COUNT * (row - under_row));
    }
    lane_bitboards.push(board);
    lane_bitboards.push(mirrored_board);
  }
}

//SHOULD BE 86 for a 7x6 board with a win length of 4
// console.log(lane_bitboards.length);

export const INVALID_MOVE = -1;
const evalTable = [
  3, 4, 5, 7, 5, 4, 3, 4, 6, 8, 10, 8, 6, 4, 5, 8, 11, 13, 11, 8, 5, 5, 8, 11,
  13, 11, 8, 5, 4, 6, 8, 10, 8, 6, 4, 3, 4, 5, 7, 5, 4, 3,
];

function clone1DArr<type>(arr: type[]) {
  let new_: type[] = [];
  for (let el of arr) new_.push(el);
  return new_;
}

//43rd bit in the representation shows whose turn it is to go
export class Board {
  //Properties to quicken board evaluation
  //One of the things eval takes into consideration is where the pieces are placed.
  public piece_eval: number = 0;

  //Bit in board is set to 0 if red, 1 if blue.
  //However, empty cells will also be 0. To account for this, we also have
  //a bitboard of all positions that have already been filled
  public board: bigint = 0n;
  public set_positions: bigint = 0n;
  //Array of all available moves, one for each column
  //If the column is full, it's negative 1. Otherwise, it's the row of the move.
  public avail_moves: (row | -1)[] = [];

  constructor() {
    for (let i = 0; i < COL_COUNT; i += 1) this.avail_moves.push(0);
  }

  set_at_ind(ind: bigint): boolean {
    return (this.set_positions & (1n << ind)) != 0n;
  }
  piece_at_ind(ind: bigint): PLAYER {
    return (this.board & (1n << ind)) == 0n ? RED : BLUE;
  }

  duplicate(): Board {
    let board = new Board();
    board.board = this.board;
    board.set_positions = this.set_positions;
    board.avail_moves = clone1DArr<row | -1>(this.avail_moves);
    board.piece_eval = this.piece_eval;
    return board;
  }

  set_ind(player: PLAYER, ind: bigint, column: number) {
    //Only do the work of creating a BigInt if we need to update a bit: if it's one
    // if (player == 1) this.board |= 1n << ind;
    this.board |= BigInt(player) << ind;

    this.set_positions |= 1n << ind;

    //Augment the index of the available move on this column so that it goes up by 1 row
    this.avail_moves[column] += 1;
    //If it overflowed, set it to NaN
    if (this.avail_moves[column] >= ROW_COUNT) {
      this.avail_moves[column] = INVALID_MOVE;
    }

    // console.log(ind, column, evalTable[Number(ind)], player);
    this.piece_eval += evalTable[Number(ind)] * (player == PLAYER.RED ? 1 : -1);
  }
  set_chip(player: PLAYER, row: row, column: column) {
    let ind = BigInt(column + row * COL_COUNT);
    this.set_ind(player, ind, column);
  }
  set_col(player: PLAYER, column: column) {
    let move = this.avail_moves[column];
    if (move == -1) return;
    this.set_chip(player, move, column);
  }

  //Which player (if any) has won
  win(): PLAYER {
    for (let lane of lane_bitboards) {
      //Not all cells in the lane are filled
      if ((this.set_positions & lane) != lane) continue;

      let result = this.board & lane;

      //All bits are zero: All slots are that of one player
      //ALL bits are equal to the bitboard: ALL slots are set to 1, the other player had won
      if (result == 0n || result == lane) return result == 0n ? 0 : 1;
    }
    return PLAYER.NO_PLAYER;
  }

  full_board_state(): bigint {
    return this.board | (this.set_positions << 43n);
    // return this.board.toString() + this.set_positions.toString();
  }
  set_board_state(state: bigint) {
    this.board = state & ((1n << 43n) - 1n);
    this.set_positions = state >> 43n;
  }
  board_str(red = "0", blue = "1", pipe = "|") {
    let output = "";
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        let set_bit = 1n << BigInt(col + (5 - row) * 7);
        output +=
          pipe +
          (this.set_positions & set_bit
            ? (this.board & set_bit) == 0n
              ? red
              : blue
            : " ");
      }
      output += pipe + "\n";
    }
    return output;
  }
  log_board() {
    console.log(this.board_str());
  }
  log_board_color() {
    console.log(
      this.board_str(
        colors.red("\u2022"),
        colors.blue("\u2022"),
        colors.yellow("|")
      )
    );
  }
}
