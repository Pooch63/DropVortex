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

/** NOTE: if you want to update these values... DON'T. This engine is specifically built for 7x6 Connect 4.*/
export const ROW_COUNT = 6,
  COL_COUNT = 7;
const WIN_LENGTH = 4;
export type row = 0 | 1 | 2 | 3 | 4 | 5;
export type column = 0 | 1 | 2 | 3 | 4 | 5 | 6;

//Bitboards of all the lanes. That means that, if every square on the board matching up to a set bit
//on the lane bitboard is of the same player, that player wins
const lane_bitboards: bigint[] = [];

let potential_lane_bitboards: {
  match: bigint;
  empty_bit: bigint;
  row: row;
  col: column;
}[] = [];

//Get row lanes
let rows_bits = BigInt(0b1111);
for (let row = 0; row < ROW_COUNT; row += 1) {
  for (let col = 0; col <= COL_COUNT - WIN_LENGTH; col += 1) {
    let shift = BigInt(col + row * COL_COUNT);
    let lane = rows_bits << shift;
    lane_bitboards.push(lane);

    for (let i = 0n; i < 4n; i += 1n) {
      potential_lane_bitboards.push({
        col: (col + Number(i)) as column,
        row: row as row,
        match: lane ^ (1n << (shift + i)),
        empty_bit: 1n << (shift + i),
      });
    }
  }
}

//Get column lanes
let col_bits = BigInt(0b1000000100000010000001);
for (
  let offset = 0n;
  offset < (ROW_COUNT - WIN_LENGTH + 1) * COL_COUNT;
  offset += 1n
) {
  let lane = col_bits << offset;
  lane_bitboards.push(lane);

  let offset_col = offset / 7n;
  let offset_row = Number(offset) - Number(offset_col) * 7;

  for (let i = 0n; i < 4n; i += 1n) {
    let shift = 7n * i;
    potential_lane_bitboards.push({
      row: Number(offset_col + i) as row,
      col: offset_row as column,
      match: lane ^ (1n << (offset + shift)),
      empty_bit: 1n << (offset + shift),
    });
  }
}

//And, finally, the diagonals. These are a bit more annoying to implement.
for (let row = ROW_COUNT - 1; row >= WIN_LENGTH - 1; row -= 1) {
  for (let set_bit_x = WIN_LENGTH - 1; set_bit_x < COL_COUNT; set_bit_x += 1) {
    let board: bigint = 0n;
    let mirrored_board: bigint = 0n;

    let potential_lanes = [];
    let mirrored_potential_lanes = [];
    for (let i = 0; i < WIN_LENGTH; i += 1) {
      potential_lanes.push({
        match: 0n,
        empty: 0n,
        col: 0,
        row: 0,
      });
      mirrored_potential_lanes.push({
        match: 0n,
        empty: 0n,
        col: 0,
        row: 0,
      });
    }

    for (let under_row = 0; under_row < WIN_LENGTH; under_row += 1) {
      let bit =
        (1n << BigInt(set_bit_x - under_row)) <<
        BigInt(COL_COUNT * (row - under_row));
      let mirrored_bit =
        (1n << BigInt(COL_COUNT - (set_bit_x - under_row) - 1)) <<
        BigInt(COL_COUNT * (row - under_row));

      board |= bit;
      mirrored_board |= mirrored_bit;

      for (let i = 0; i < WIN_LENGTH; i += 1) {
        if (under_row == i) {
          potential_lanes[i].empty = bit;
          mirrored_potential_lanes[i].empty = mirrored_bit;

          potential_lanes[i].col = set_bit_x - under_row;
          mirrored_potential_lanes[i].col =
            COL_COUNT - (set_bit_x - under_row) - 1;

          potential_lanes[i].row = mirrored_potential_lanes[i].row =
            row - under_row;
          continue;
        }
        potential_lanes[i].match |= bit;
        mirrored_potential_lanes[i].match |= mirrored_bit;
      }
    }
    lane_bitboards.push(board);
    lane_bitboards.push(mirrored_board);

    for (let i = 0; i < WIN_LENGTH; i += 1) {
      potential_lane_bitboards.push(
        ...potential_lanes,
        ...mirrored_potential_lanes
      );
    }
  }
}

log_board(1n);
let ind = Math.floor(Math.random() * potential_lane_bitboards.length);
log_board(potential_lane_bitboards[ind].match);
console.log(potential_lane_bitboards[ind]);
console.log(potential_lane_bitboards.length);

//SHOULD BE 86 for a 7x6 board with a win length of 4
// console.log(lane_bitboards.length);

const BIGINT_RED = BigInt(PLAYER.RED);

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

export function full_board_state(board: bigint, set_positions: bigint) {
  return board | (set_positions << 43n);
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

  set_player_turn(player: PLAYER.RED | PLAYER.BLUE) {
    this.board ^= BigInt(player) << 42n;
  }
  get_player_turn(): PLAYER.RED | PLAYER.BLUE {
    return (this.board & player_turn_bit) == 1n ? PLAYER.BLUE : PLAYER.RED;
  }
  get_chip(row: row, col: column): PLAYER {
    let bit = 1n << BigInt(col + row * COL_COUNT);
    if ((this.set_positions & bit) == 0n) return NO_PLAYER;
    return (this.board & bit) == 0n ? PLAYER.RED : PLAYER.BLUE;
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
  //Difference between # of lanes red has and blue has
  lane_difference() {
    let diff = 0;
    for (let lane of potential_lane_bitboards) {
      if (
        //Not all cells in the lane are filled
        (this.set_positions & lane.match) != lane.match ||
        //It's already set
        this.get_chip(lane.row, lane.col) != NO_PLAYER
      )
        continue;

      let result = this.board & lane.match;

      //All bits are zero: All slots are that of one player
      //ALL bits are equal to the bitboard: ALL slots are set to 1, the other player had a lane
      if (result == 0n || result == lane.match) {
        diff += result == BIGINT_RED ? 1 : -1;
      }
    }
    return diff;
  }

  // lane_info(): { win: PLAYER.RED | PLAYER.BLUE } | { difference: number } {
  //   let diff = 0;
  //   for (let lane of potential_lane_bitboards) {
  //     //Not all cells in the lane are filled
  //     if ((this.set_positions & lane.match) != lane.match) continue;

  //     //It's already set
  //     if (this.get_chip(lane.row, lane.col) != NO_PLAYER) continue;

  //     let result = this.board & lane.match;

  //     //All bits are zero: All slots are that of one player
  //     //ALL bits are equal to the bitboard: ALL slots are set to 1, the other player had a lane
  //     if (result == 0n || result == lane.match) {
  //       diff += result == BIGINT_RED ? 1 : -1;
  //     }
  //   }
  //   return diff;
  // }

  //Does a certain player have an available win?
  available_win(player: PLAYER.RED | PLAYER.BLUE): boolean {
    for (let lane of potential_lane_bitboards) {
      //Not all cells in the lane are filled
      if ((this.set_positions & lane.match) != lane.match) continue;

      let result = this.board & lane.match;

      //If ALL the lane bits aren't set, then that person can't take the lane
      //Very important note: In previous versions, I had made this line into two parts to make this code more readable:
      /**
       * if (
          !(
            (result == 0n && player != RED) ||
            (result == lane.match && player != BLUE)
          )
          ) continue;
          if (this.avail_moves[lane.col] == lane.row) return true;
      */
      //Once I removed the continue statement, evaluation speed was increased by 6 times (730ms to 120ms)
      if (
        !(
          (result == 0n && player != RED) ||
          (result == lane.match && player != BLUE)
        ) &&
        this.avail_moves[lane.col] == lane.row
      ) {
        return true;
      }
    }
    return false;
  }

  full_board_state(): bigint {
    return full_board_state(this.board, this.set_positions);
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

let b = new Board();
b.set_board_state(633318697599040n);

console.log(b.piece_eval);

b.log_board_color();

let inverted_ind = full_board_state(
  ~b.board & b.set_positions,
  b.set_positions
);
let m = new Board();
m.set_board_state(inverted_ind);
m.log_board_color();

//Bitboard of column in last positon of the connect4 board
const col = BigInt(0b1_000000_1_000000_1_000000_1_000000_1_000000_1_000000);
//Mirror bitboard on the y-axis
export const player_turn_bit = 1n << 43n;
//If the bitboard is the game board, also maintain the bit that says whose turn it is to move
export function flip(bitboard: bigint, is_game_board: boolean) {
  let val =
    ((bitboard & (col >> 0n)) >> 6n) |
    ((bitboard & (col >> 1n)) >> 4n) |
    ((bitboard & (col >> 2n)) >> 2n) |
    (bitboard & (col >> 3n)) |
    ((bitboard & (col >> 4n)) << 2n) |
    ((bitboard & (col >> 5n)) << 4n) |
    ((bitboard & (col >> 6n)) << 6n);
  if (is_game_board) val |= bitboard & player_turn_bit;
  return val;
}

// let z = b.board;
// let flipped_ = flip(z);

// console.time();
// for (let i = 0; i < 1_000_000; i += 1) flip(z);
// console.timeEnd();

// let k = new Board();
// k.board = flipped_;
// k.set_positions = flip(b.set_positions);
// k.log_board_color();
