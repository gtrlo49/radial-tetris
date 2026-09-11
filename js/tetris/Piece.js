export const DIRECTIONS = {
    NORTH: 'NORTH',
    SOUTH: 'SOUTH',
    EAST: 'EAST',
    WEST: 'WEST'
};

export const SHAPES = {
    I: {
        matrix: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0]
        ],
        color: '#00f0ff'
    },
    J: {
        matrix: [
            [1,0,0],
            [1,1,1],
            [0,0,0]
        ],
        color: '#0066ff'
    },
    L: {
        matrix: [
            [0,0,1],
            [1,1,1],
            [0,0,0]
        ],
        color: '#ff7700'
    },
    O: {
        matrix: [
            [1,1],
            [1,1]
        ],
        color: '#ffea00'
    },
    S: {
        matrix: [
            [0,1,1],
            [1,1,0],
            [0,0,0]
        ],
        color: '#00ff66'
    },
    T: {
        matrix: [
            [0,1,0],
            [1,1,1],
            [0,0,0]
        ],
        color: '#a000ff'
    },
    Z: {
        matrix: [
            [1,1,0],
            [0,1,1],
            [0,0,0]
        ],
        color: '#ff3255'
    }
};

export class Piece {
    constructor(typeKey, direction) {
        const shapeDef = SHAPES[typeKey] || SHAPES.I;
        this.typeKey = typeKey;
        this.matrix = shapeDef.matrix.map(row => [...row]);
        this.color = shapeDef.color;
        this.direction = direction; // NORTH, SOUTH, EAST, WEST
        this.step = 0; // Distancia desde el núcleo (0 = recién emergida)
        this.colOffset = 2; // Offset horizontal dentro de la grilla del cuadrante
    }

    rotateRight() {
        const size = this.matrix.length;
        const newMatrix = Array.from({ length: size }, () => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                newMatrix[c][size - 1 - r] = this.matrix[r][c];
            }
        }
        this.matrix = newMatrix;
    }

    rotateLeft() {
        const size = this.matrix.length;
        const newMatrix = Array.from({ length: size }, () => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                newMatrix[size - 1 - c][r] = this.matrix[r][c];
            }
        }
        this.matrix = newMatrix;
    }
}
