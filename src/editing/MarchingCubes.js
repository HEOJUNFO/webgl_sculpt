import Utils from '../misc/Utils';

var MarchingCubes = {};
MarchingCubes.BLOCK = false;

var edgeTable = new Uint32Array([
    0x0,
    0x109,
    0x203,
    0x30a,
    0x406,
    0x50f,
    0x605,
    0x70c,
    0x80c,
    0x905,
    0xa0f,
    0xb06,
    0xc0a,
    0xd03,
    0xe09,
    0xf00,
    0x190,
    0x99,
    0x393,
    0x29a,
    0x596,
    0x49f,
    0x795,
    0x69c,
    0x99c,
    0x895,
    0xb9f,
    0xa96,
    0xd9a,
    0xc93,
    0xf99,
    0xe90,
    0x230,
    0x339,
    0x33,
    0x13a,
    0x636,
    0x73f,
    0x435,
    0x53c,
    0xa3c,
    0xb35,
    0x83f,
    0x936,
    0xe3a,
    0xf33,
    0xc39,
    0xd30,
    0x3a0,
    0x2a9,
    0x1a3,
    0xaa,
    0x7a6,
    0x6af,
    0x5a5,
    0x4ac,
    0xbac,
    0xaa5,
    0x9af,
    0x8a6,
    0xfaa,
    0xea3,
    0xda9,
    0xca0,
    0x460,
    0x569,
    0x663,
    0x76a,
    0x66,
    0x16f,
    0x265,
    0x36c,
    0xc6c,
    0xd65,
    0xe6f,
    0xf66,
    0x86a,
    0x963,
    0xa69,
    0xb60,
    0x5f0,
    0x4f9,
    0x7f3,
    0x6fa,
    0x1f6,
    0xff,
    0x3f5,
    0x2fc,
    0xdfc,
    0xcf5,
    0xfff,
    0xef6,
    0x9fa,
    0x8f3,
    0xbf9,
    0xaf0,
    0x650,
    0x759,
    0x453,
    0x55a,
    0x256,
    0x35f,
    0x55,
    0x15c,
    0xe5c,
    0xf55,
    0xc5f,
    0xd56,
    0xa5a,
    0xb53,
    0x859,
    0x950,
    0x7c0,
    0x6c9,
    0x5c3,
    0x4ca,
    0x3c6,
    0x2cf,
    0x1c5,
    0xcc,
    0xfcc,
    0xec5,
    0xdcf,
    0xcc6,
    0xbca,
    0xac3,
    0x9c9,
    0x8c0,
    0x8c0,
    0x9c9,
    0xac3,
    0xbca,
    0xcc6,
    0xdcf,
    0xec5,
    0xfcc,
    0xcc,
    0x1c5,
    0x2cf,
    0x3c6,
    0x4ca,
    0x5c3,
    0x6c9,
    0x7c0,
    0x950,
    0x859,
    0xb53,
    0xa5a,
    0xd56,
    0xc5f,
    0xf55,
    0xe5c,
    0x15c,
    0x55,
    0x35f,
    0x256,
    0x55a,
    0x453,
    0x759,
    0x650,
    0xaf0,
    0xbf9,
    0x8f3,
    0x9fa,
    0xef6,
    0xfff,
    0xcf5,
    0xdfc,
    0x2fc,
    0x3f5,
    0xff,
    0x1f6,
    0x6fa,
    0x7f3,
    0x4f9,
    0x5f0,
    0xb60,
    0xa69,
    0x963,
    0x86a,
    0xf66,
    0xe6f,
    0xd65,
    0xc6c,
    0x36c,
    0x265,
    0x16f,
    0x66,
    0x76a,
    0x663,
    0x569,
    0x460,
    0xca0,
    0xda9,
    0xea3,
    0xfaa,
    0x8a6,
    0x9af,
    0xaa5,
    0xbac,
    0x4ac,
    0x5a5,
    0x6af,
    0x7a6,
    0xaa,
    0x1a3,
    0x2a9,
    0x3a0,
    0xd30,
    0xc39,
    0xf33,
    0xe3a,
    0x936,
    0x83f,
    0xb35,
    0xa3c,
    0x53c,
    0x435,
    0x73f,
    0x636,
    0x13a,
    0x33,
    0x339,
    0x230,
    0xe90,
    0xf99,
    0xc93,
    0xd9a,
    0xa96,
    0xb9f,
    0x895,
    0x99c,
    0x69c,
    0x795,
    0x49f,
    0x596,
    0x29a,
    0x393,
    0x99,
    0x190,
    0xf00,
    0xe09,
    0xd03,
    0xc0a,
    0xb06,
    0xa0f,
    0x905,
    0x80c,
    0x70c,
    0x605,
    0x50f,
    0x406,
    0x30a,
    0x203,
    0x109,
    0x0
  ]),
  triTable = [
    [],
    [0, 8, 3],
    [0, 1, 9],
    [1, 8, 3, 9, 8, 1],
    [1, 2, 10],
    [0, 8, 3, 1, 2, 10],
    [9, 2, 10, 0, 2, 9],
    [2, 8, 3, 2, 10, 8, 10, 9, 8],
    [3, 11, 2],
    [0, 11, 2, 8, 11, 0],
    [1, 9, 0, 2, 3, 11],
    [1, 11, 2, 1, 9, 11, 9, 8, 11],
    [3, 10, 1, 11, 10, 3],
    [0, 10, 1, 0, 8, 10, 8, 11, 10],
    [3, 9, 0, 3, 11, 9, 11, 10, 9],
    [9, 8, 10, 10, 8, 11],
    [4, 7, 8],
    [4, 3, 0, 7, 3, 4],
    [0, 1, 9, 8, 4, 7],
    [4, 1, 9, 4, 7, 1, 7, 3, 1],
    [1, 2, 10, 8, 4, 7],
    [3, 4, 7, 3, 0, 4, 1, 2, 10],
    [9, 2, 10, 9, 0, 2, 8, 4, 7],
    [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4],
    [8, 4, 7, 3, 11, 2],
    [11, 4, 7, 11, 2, 4, 2, 0, 4],
    [9, 0, 1, 8, 4, 7, 2, 3, 11],
    [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1],
    [3, 10, 1, 3, 11, 10, 7, 8, 4],
    [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4],
    [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3],
    [4, 7, 11, 4, 11, 9, 9, 11, 10],
    [9, 5, 4],
    [9, 5, 4, 0, 8, 3],
    [0, 5, 4, 1, 5, 0],
    [8, 5, 4, 8, 3, 5, 3, 1, 5],
    [1, 2, 10, 9, 5, 4],
    [3, 0, 8, 1, 2, 10, 4, 9, 5],
    [5, 2, 10, 5, 4, 2, 4, 0, 2],
    [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8],
    [9, 5, 4, 2, 3, 11],
    [0, 11, 2, 0, 8, 11, 4, 9, 5],
    [0, 5, 4, 0, 1, 5, 2, 3, 11],
    [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5],
    [10, 3, 11, 10, 1, 3, 9, 5, 4],
    [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10],
    [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3],
    [5, 4, 8, 5, 8, 10, 10, 8, 11],
    [9, 7, 8, 5, 7, 9],
    [9, 3, 0, 9, 5, 3, 5, 7, 3],
    [0, 7, 8, 0, 1, 7, 1, 5, 7],
    [1, 5, 3, 3, 5, 7],
    [9, 7, 8, 9, 5, 7, 10, 1, 2],
    [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3],
    [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2],
    [2, 10, 5, 2, 5, 3, 3, 5, 7],
    [7, 9, 5, 7, 8, 9, 3, 11, 2],
    [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11],
    [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7],
    [11, 2, 1, 11, 1, 7, 7, 1, 5],
    [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11],
    [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0],
    [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0],
    [11, 10, 5, 7, 11, 5],
    [10, 6, 5],
    [0, 8, 3, 5, 10, 6],
    [9, 0, 1, 5, 10, 6],
    [1, 8, 3, 1, 9, 8, 5, 10, 6],
    [1, 6, 5, 2, 6, 1],
    [1, 6, 5, 1, 2, 6, 3, 0, 8],
    [9, 6, 5, 9, 0, 6, 0, 2, 6],
    [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8],
    [2, 3, 11, 10, 6, 5],
    [11, 0, 8, 11, 2, 0, 10, 6, 5],
    [0, 1, 9, 2, 3, 11, 5, 10, 6],
    [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11],
    [6, 3, 11, 6, 5, 3, 5, 1, 3],
    [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6],
    [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9],
    [6, 5, 9, 6, 9, 11, 11, 9, 8],
    [5, 10, 6, 4, 7, 8],
    [4, 3, 0, 4, 7, 3, 6, 5, 10],
    [1, 9, 0, 5, 10, 6, 8, 4, 7],
    [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4],
    [6, 1, 2, 6, 5, 1, 4, 7, 8],
    [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7],
    [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6],
    [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9],
    [3, 11, 2, 7, 8, 4, 10, 6, 5],
    [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11],
    [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6],
    [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6],
    [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6],
    [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11],
    [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7],
    [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9],
    [10, 4, 9, 6, 4, 10],
    [4, 10, 6, 4, 9, 10, 0, 8, 3],
    [10, 0, 1, 10, 6, 0, 6, 4, 0],
    [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10],
    [1, 4, 9, 1, 2, 4, 2, 6, 4],
    [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4],
    [0, 2, 4, 4, 2, 6],
    [8, 3, 2, 8, 2, 4, 4, 2, 6],
    [10, 4, 9, 10, 6, 4, 11, 2, 3],
    [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6],
    [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10],
    [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1],
    [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3],
    [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1],
    [3, 11, 6, 3, 6, 0, 0, 6, 4],
    [6, 4, 8, 11, 6, 8],
    [7, 10, 6, 7, 8, 10, 8, 9, 10],
    [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10],
    [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0],
    [10, 6, 7, 10, 7, 1, 1, 7, 3],
    [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7],
    [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9],
    [7, 8, 0, 7, 0, 6, 6, 0, 2],
    [7, 3, 2, 6, 7, 2],
    [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7],
    [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7],
    [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11],
    [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1],
    [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6],
    [0, 9, 1, 11, 6, 7],
    [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0],
    [7, 11, 6],
    [7, 6, 11],
    [3, 0, 8, 11, 7, 6],
    [0, 1, 9, 11, 7, 6],
    [8, 1, 9, 8, 3, 1, 11, 7, 6],
    [10, 1, 2, 6, 11, 7],
    [1, 2, 10, 3, 0, 8, 6, 11, 7],
    [2, 9, 0, 2, 10, 9, 6, 11, 7],
    [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8],
    [7, 2, 3, 6, 2, 7],
    [7, 0, 8, 7, 6, 0, 6, 2, 0],
    [2, 7, 6, 2, 3, 7, 0, 1, 9],
    [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6],
    [10, 7, 6, 10, 1, 7, 1, 3, 7],
    [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8],
    [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7],
    [7, 6, 10, 7, 10, 8, 8, 10, 9],
    [6, 8, 4, 11, 8, 6],
    [3, 6, 11, 3, 0, 6, 0, 4, 6],
    [8, 6, 11, 8, 4, 6, 9, 0, 1],
    [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6],
    [6, 8, 4, 6, 11, 8, 2, 10, 1],
    [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6],
    [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9],
    [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3],
    [8, 2, 3, 8, 4, 2, 4, 6, 2],
    [0, 4, 2, 4, 6, 2],
    [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8],
    [1, 9, 4, 1, 4, 2, 2, 4, 6],
    [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1],
    [10, 1, 0, 10, 0, 6, 6, 0, 4],
    [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3],
    [10, 9, 4, 6, 10, 4],
    [4, 9, 5, 7, 6, 11],
    [0, 8, 3, 4, 9, 5, 11, 7, 6],
    [5, 0, 1, 5, 4, 0, 7, 6, 11],
    [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5],
    [9, 5, 4, 10, 1, 2, 7, 6, 11],
    [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5],
    [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2],
    [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6],
    [7, 2, 3, 7, 6, 2, 5, 4, 9],
    [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7],
    [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0],
    [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8],
    [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7],
    [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4],
    [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10],
    [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10],
    [6, 9, 5, 6, 11, 9, 11, 8, 9],
    [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5],
    [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11],
    [6, 11, 3, 6, 3, 5, 5, 3, 1],
    [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6],
    [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10],
    [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5],
    [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3],
    [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2],
    [9, 5, 6, 9, 6, 0, 0, 6, 2],
    [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8],
    [1, 5, 6, 2, 1, 6],
    [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6],
    [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0],
    [0, 3, 8, 5, 6, 10],
    [10, 5, 6],
    [11, 5, 10, 7, 5, 11],
    [11, 5, 10, 11, 7, 5, 8, 3, 0],
    [5, 11, 7, 5, 10, 11, 1, 9, 0],
    [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1],
    [11, 1, 2, 11, 7, 1, 7, 5, 1],
    [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11],
    [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7],
    [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2],
    [2, 5, 10, 2, 3, 5, 3, 7, 5],
    [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5],
    [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2],
    [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2],
    [1, 3, 5, 3, 7, 5],
    [0, 8, 7, 0, 7, 1, 1, 7, 5],
    [9, 0, 3, 9, 3, 5, 5, 3, 7],
    [9, 8, 7, 5, 9, 7],
    [5, 8, 4, 5, 10, 8, 10, 11, 8],
    [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0],
    [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5],
    [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4],
    [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8],
    [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11],
    [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5],
    [9, 4, 5, 2, 11, 3],
    [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4],
    [5, 10, 2, 5, 2, 4, 4, 2, 0],
    [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9],
    [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2],
    [8, 4, 5, 8, 5, 3, 3, 5, 1],
    [0, 4, 5, 1, 0, 5],
    [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5],
    [9, 4, 5],
    [4, 11, 7, 4, 9, 11, 9, 10, 11],
    [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11],
    [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11],
    [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4],
    [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2],
    [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3],
    [11, 7, 4, 11, 4, 2, 2, 4, 0],
    [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4],
    [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9],
    [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7],
    [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10],
    [1, 10, 2, 8, 7, 4],
    [4, 9, 1, 4, 1, 7, 7, 1, 3],
    [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1],
    [4, 0, 3, 7, 4, 3],
    [4, 8, 7],
    [9, 10, 8, 10, 11, 8],
    [3, 0, 9, 3, 9, 11, 11, 9, 10],
    [0, 1, 10, 0, 10, 8, 8, 10, 11],
    [3, 1, 10, 11, 3, 10],
    [1, 2, 11, 1, 11, 9, 9, 11, 8],
    [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9],
    [0, 2, 11, 8, 0, 11],
    [3, 2, 11],
    [2, 3, 8, 2, 8, 10, 10, 8, 9],
    [9, 10, 2, 0, 9, 2],
    [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8],
    [1, 10, 2],
    [1, 3, 8, 9, 1, 8],
    [0, 9, 1],
    [0, 3, 8],
    []
  ],
  cubeVerts = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1]
  ],
  edgeIndex = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
  ];

var readScalarValues = function (voxels, grid, dims, n, cols, mats) {
  var colors = voxels.colorField;
  var materials = voxels.materialField;
  var data = voxels.distanceField;

  // Read in 8 field values around this vertex and store them in an array
  // Also calculate 8-bit mask, like in marching cubes, so we can speed up sign checks later
  var c1 = 0;
  var c2 = 0;
  var c3 = 0;
  var m1 = 0;
  var m2 = 0;
  var m3 = 0;
  var invSum = 0;

  var mask = 0;
  var rx = dims[0];
  var rxy = dims[0] * dims[1];

  for (var i = 0; i < 8; ++i) {
    var v = cubeVerts[i];
    var id = n + v[0] + v[1] * rx + v[2] * rxy;

    var id3 = id * 3;
    var p = data[id];
    grid[i] = p;
    mask |= p > 0.0 ? 1 << i : 0;
    if (p !== Infinity) {
      p = Math.min(1 / Math.abs(p), 1e15);
      invSum += p;
      c1 += colors[id3] * p;
      c2 += colors[id3 + 1] * p;
      c3 += colors[id3 + 2] * p;
      m1 += materials[id3] * p;
      m2 += materials[id3 + 1] * p;
      m3 += materials[id3 + 2] * p;
    }
  }

  if (edgeTable[mask] !== 0) {
    if (invSum > 0.0) invSum = 1.0 / invSum;

    cols[0] = c1 * invSum;
    cols[1] = c2 * invSum;
    cols[2] = c3 * invSum;

    mats[0] = m1 * invSum;
    mats[1] = m2 * invSum;
    mats[2] = m3 * invSum;
  }

  return mask;
};

MarchingCubes.computeSurface = function (voxels) {
  var dims = voxels.dims;

  var mapVertices = new Map();

  var vertices = [];
  var cols = [];
  var mats = [];
  var faces = [];
  var n = 0;
  var x = new Int32Array(3);
  var grid = new Float32Array(8);

  var edges = new Array(12);

  var tmpV = new Float32Array(3);
  var tmpC = new Float32Array(3);
  var tmpM = new Float32Array(3);

  //March over the voxel grid
  for (x[2] = 0; x[2] < dims[2] - 1; ++x[2], n += dims[0]) {
    for (x[1] = 0; x[1] < dims[1] - 1; ++x[1], ++n) {
      for (x[0] = 0; x[0] < dims[0] - 1; ++x[0], ++n) {
        var cubeIndex = readScalarValues(voxels, grid, dims, n, tmpC, tmpM);

        var edgeMask = edgeTable[cubeIndex];
        if (edgeMask === 0) {
          continue;
        }

        for (var k = 0; k < 12; ++k) {
          if (!(edgeMask & (1 << k))) continue;

          var e = edgeIndex[k];
          var p0 = cubeVerts[e[0]];
          var p1 = cubeVerts[e[1]];
          var a = grid[e[0]];
          var b = grid[e[1]];
          var d = a - b;
          var t = 0;
          if (Math.abs(d) > 1e-6) {
            t = a / d;
          }

          for (var h = 0; h < 3; ++h) {
            tmpV[h] = x[h] + p0[h] + t * (p1[h] - p0[h]);
          }

          var hash = tmpV[0] + '+' + tmpV[1] + '+' + tmpV[2];
          var idVertex = mapVertices.get(hash);

          if (idVertex >= 0) {
            edges[k] = idVertex;
          } else {
            edges[k] = vertices.length / 3;
            mapVertices.set(hash, edges[k]);
            vertices.push(tmpV[0], tmpV[1], tmpV[2]);
            cols.push(tmpC[0], tmpC[1], tmpC[2]);
            mats.push(tmpM[0], tmpM[1], tmpM[2]);
          }
        }

        var f = triTable[cubeIndex];
        for (var l = 0; l < f.length; l += 3) {
          faces.push(edges[f[l]], edges[f[l + 1]], edges[f[l + 2]], Utils.TRI_INDEX);
        }
      }
    }
  }

  //All done!  Return the result
  return {
    colors: new Float32Array(cols),
    materials: new Float32Array(mats),
    vertices: new Float32Array(vertices),
    faces: new Uint32Array(faces)
  };
};

export default MarchingCubes;