"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = exports.INVALID_MOVE = exports.COL_COUNT = exports.ROW_COUNT = exports.BLUE = exports.RED = void 0;
/** DEBUG */
function log_board(board) {
    let output = "";
    for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 7; col += 1) {
            output += (board & (1n << BigInt(col + row * 7))) == 0n ? "0" : "1";
        }
        output += "\n";
    }
    console.log(output);
}
exports.RED = 0 /* PLAYER.RED */, exports.BLUE = 1 /* PLAYER.BLUE */;
/** NOTE: if you update these values, you will also need to update the lane bitboard gen code.*/
exports.ROW_COUNT = 6, exports.COL_COUNT = 7;
const WIN_LENGTH = 4;
//Bitboards of all the lanes. That means that, if every square on the board matching up to a set bit
//on the lane bitboard is of the same player, that player wins
const lane_bitboards = [];
//Get row lanes
let rows_bits = 0b1111;
for (let row = 0; row < exports.ROW_COUNT; row += 1) {
    for (let col = 0; col <= exports.COL_COUNT - WIN_LENGTH; col += 1) {
        lane_bitboards.push(BigInt(rows_bits << (col + row * exports.COL_COUNT)));
    }
}
//Get column lanes
let col_bits = BigInt(0b1000000100000010000001);
//Basically, no matter what, the number of columns is equal to the number of squares - win length - 1
for (let offset = 0n; offset < exports.ROW_COUNT * exports.COL_COUNT - WIN_LENGTH; offset += 1n) {
    lane_bitboards.push(col_bits << offset);
}
//And, finally, the diagonals. These are a bit more annoying to implement.
for (let row = exports.ROW_COUNT - 1; row >= WIN_LENGTH - 1; row -= 1) {
    for (let set_bit_x = WIN_LENGTH - 1; set_bit_x < exports.COL_COUNT; set_bit_x += 1) {
        let board = 0n;
        let mirrored_board = 0n;
        for (let under_row = 0; under_row < WIN_LENGTH; under_row += 1) {
            board |=
                (1n << BigInt(set_bit_x - under_row)) <<
                    BigInt(exports.COL_COUNT * (row - under_row));
            mirrored_board |=
                (1n << BigInt(exports.COL_COUNT - (set_bit_x - under_row) - 1)) <<
                    BigInt(exports.COL_COUNT * (row - under_row));
        }
        lane_bitboards.push(board);
        lane_bitboards.push(mirrored_board);
    }
}
//SHOULD BE 86 for a 7x6 board with a win length of 4
console.log(lane_bitboards.length);
exports.INVALID_MOVE = -1;
function clone1DArr(arr) {
    let new_ = [];
    for (let el of arr)
        new_.push(el);
    return new_;
}
//43rd bit in the representation shows whose turn it is to go
class Board {
    constructor() {
        //Bit in board is set to 0 if red, 1 if blue.
        //However, empty cells will also be 0. To account for this, we also have
        //a bitboard of all positions that have already been filled
        this.board = 0n;
        this.set_positions = 0n;
        //Array of all available moves, one for each column
        //If the column is full, it's negative 1. Otherwise, it's the row of the move.
        this.avail_moves = [];
        for (let i = 0; i < exports.COL_COUNT; i += 1)
            this.avail_moves.push(0);
    }
    set_at_ind(ind) {
        return (this.set_positions & (1n << ind)) != 0n;
    }
    piece_at_ind(ind) {
        return (this.board & (1n << ind)) == 0n ? exports.RED : exports.BLUE;
    }
    duplicate() {
        let board = new Board();
        board.board = this.board;
        board.set_positions = this.set_positions;
        board.avail_moves = clone1DArr(this.avail_moves);
        return board;
    }
    set_ind(player, ind, column) {
        //Only do the work of creating a BigInt if we need to update a bit: if it's one
        // if (player == 1) this.board |= 1n << ind;
        this.board |= BigInt(player) << ind;
        this.set_positions |= 1n << ind;
        //Augment the index of the available move on this column so that it goes up by 1 row
        this.avail_moves[column] += 1;
        //If it overflowed, set it to NaN
        if (this.avail_moves[column] >= exports.ROW_COUNT) {
            this.avail_moves[column] = exports.INVALID_MOVE;
        }
    }
    set_chip(player, row, column) {
        let ind = BigInt(column + row * exports.COL_COUNT);
        this.set_ind(player, ind, column);
    }
    set_col(player, column) {
        let move = this.avail_moves[column];
        if (move == -1)
            return;
        this.set_chip(player, move, column);
    }
    //Which player (if any) has won
    win() {
        for (let lane of lane_bitboards) {
            //Not all cells in the lane are filled
            if ((this.set_positions & lane) != lane)
                continue;
            let result = this.board & lane;
            //All bits are zero: All slots are that of one player
            //ALL bits are equal to the bitboard: ALL slots are set to 1, the other player had won
            if (result == 0n || result == lane)
                return result == 0n ? 0 : 1;
        }
        return 2 /* PLAYER.NO_PLAYER */;
    }
    full_board_state() {
        return this.board | (this.set_positions << 43n);
        // return this.board.toString() + this.set_positions.toString();
    }
    set_board_state(state) {
        this.board = state & ((1n << 43n) - 1n);
        this.set_positions = state >> 43n;
    }
    board_str() {
        let output = "";
        for (let row = 0; row < 6; row += 1) {
            for (let col = 0; col < 7; col += 1) {
                let set_bit = 1n << BigInt(col + (5 - row) * 7);
                output +=
                    "|" +
                        (this.set_positions & set_bit
                            ? (this.board & set_bit) == 0n
                                ? "0"
                                : "1"
                            : " ");
            }
            output += "|\n";
        }
        return output;
    }
    log_board() {
        console.log(this.board_str());
    }
}
exports.Board = Board;
