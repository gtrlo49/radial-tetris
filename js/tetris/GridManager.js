import { DIRECTIONS, Piece, SHAPES } from './Piece.js';

export class GridManager {
    constructor() {
        this.cols = 6;
        this.maxSteps = 8;
        
        // 4 Matrices fijas para los 4 cuadrantes
        this.grids = {
            [DIRECTIONS.NORTH]: this.createEmptyGrid(),
            [DIRECTIONS.SOUTH]: this.createEmptyGrid(),
            [DIRECTIONS.EAST]: this.createEmptyGrid(),
            [DIRECTIONS.WEST]: this.createEmptyGrid()
        };

        this.activePieces = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.2; // segundos entre apariciones de piezas
        this.moveTimer = 0;
        this.moveInterval = 0.5; // segundos para avanzar 1 paso radial
    }

    createEmptyGrid() {
        return Array.from({ length: this.maxSteps }, () => Array(this.cols).fill(null));
    }

    reset() {
        for (const dir in this.grids) {
            this.grids[dir] = this.createEmptyGrid();
        }
        this.activePieces = [];
        this.spawnTimer = 0;
        this.moveTimer = 0;
        this.spawnInterval = 1.2;
    }

    clearAllPiecesWithTripleScore(gameState) {
        let lockedBlocksCount = 0;
        for (const dir in this.grids) {
            const grid = this.grids[dir];
            for (let step = 0; step < this.maxSteps; step++) {
                for (let col = 0; col < this.cols; col++) {
                    if (grid[step][col] !== null) {
                        lockedBlocksCount++;
                    }
                }
            }
        }

        const activePiecesCount = this.activePieces.length;
        const tripleScoreBonus = (lockedBlocksCount * 150 + activePiecesCount * 450) * (gameState ? gameState.combo : 1);

        this.reset();
        return tripleScoreBonus;
    }

    spawnPiece(gameState, soundFX) {
        const dirs = [DIRECTIONS.NORTH, DIRECTIONS.SOUTH, DIRECTIONS.EAST, DIRECTIONS.WEST];
        const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        const shapeKeys = Object.keys(SHAPES);
        const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];

        const newPiece = new Piece(randomShape, randomDir);
        
        // Verificar si la zona de spawn está libre
        if (!this.checkCollision(newPiece, randomDir, newPiece.step, newPiece.colOffset)) {
            this.activePieces.push(newPiece);
        } else {
            // ¡ATENCIÓN! La zona de salida del núcleo está bloqueada por apilamiento
            // Daño directo e inmediato al Núcleo por sobrepresión de bloques
            if (gameState) {
                gameState.damageCore(20);
                if (soundFX) soundFX.playCoreDamage();
            }
        }
    }

    update(dt, gameState, soundFX, particleSystem, cx, cy, coreRadius) {
        if (gameState.currentState !== 'PLAYING') return;
        if (gameState.pulseBombPauseTimer > 0) return;

        // 1. DAÑO CONTINUO POR BLOQUES APILADOS QUE TOCAN EL NÚCLEO (STEP 0)
        let blocksTouchingCoreCount = 0;
        for (const dir in this.grids) {
            const grid = this.grids[dir];
            for (let c = 0; c < this.cols; c++) {
                if (grid[0][c] !== null) {
                    blocksTouchingCoreCount++;
                }
            }
        }

        if (blocksTouchingCoreCount > 0) {
            // El núcleo recibe daño continuo si hay bloques tocándolo directamente
            const damage = blocksTouchingCoreCount * 25 * dt;
            gameState.damageCore(damage);
            
            if (particleSystem && Math.random() < 0.3) {
                particleSystem.createExplosion(
                    cx + (Math.random() - 0.5) * coreRadius,
                    cy + (Math.random() - 0.5) * coreRadius,
                    '#ff3232',
                    4
                );
            }
        }

        // 2. Temporizador de Spawn de piezas radiales
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPiece(gameState, soundFX);
            // Aumenta progresivamente la frecuencia conforme pasa el tiempo (hasta 0.4s por spawn)
            this.spawnInterval = Math.max(0.4, 1.2 - (120 - gameState.timeRemaining) * 0.008);
        }

        // 3. Temporizador de movimiento radial hacia afuera
        this.moveTimer += dt;
        const currentMoveInterval = Math.max(0.18, this.moveInterval - (120 - gameState.timeRemaining) * 0.003);
        
        if (this.moveTimer >= currentMoveInterval) {
            this.moveTimer = 0;
            this.stepPiecesOutward(gameState, soundFX);
        }
    }

    stepPiecesOutward(gameState, soundFX) {
        for (let i = this.activePieces.length - 1; i >= 0; i--) {
            const piece = this.activePieces[i];
            const nextStep = piece.step + 1;

            if (this.checkCollision(piece, piece.direction, nextStep, piece.colOffset)) {
                // Fijar la pieza en la matriz del cuadrante
                this.lockPiece(piece);
                this.activePieces.splice(i, 1);
                
                // Si la pieza se fijó tocando el núcleo (step 0 o step 1), infligir daño inmediato
                if (piece.step <= 1) {
                    gameState.damageCore(15);
                    if (soundFX) soundFX.playCoreDamage();
                }

                this.checkLines(piece.direction, gameState, soundFX);
            } else {
                piece.step = nextStep;
            }
        }
    }

    checkCollision(piece, direction, stepOffset, colOffset) {
        const grid = this.grids[direction];
        const matrix = piece.matrix;

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] !== 0) {
                    const gridStep = stepOffset + r;
                    const gridCol = colOffset + c;

                    // Si excede el borde exterior, colisiona
                    if (gridStep >= this.maxSteps) return true;
                    // Si excede los bordes laterales
                    if (gridCol < 0 || gridCol >= this.cols) return true;

                    // Si la celda de la grilla ya está ocupada
                    if (gridStep >= 0 && grid[gridStep][gridCol] !== null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece(piece) {
        const grid = this.grids[piece.direction];
        const matrix = piece.matrix;

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] !== 0) {
                    const gridStep = piece.step + r;
                    const gridCol = piece.colOffset + c;

                    if (gridStep >= 0 && gridStep < this.maxSteps && gridCol >= 0 && gridCol < this.cols) {
                        grid[gridStep][gridCol] = piece.color;
                    }
                }
            }
        }
    }

    checkLines(direction, gameState, soundFX) {
        const grid = this.grids[direction];
        let linesClearedInQuadrant = 0;

        for (let step = 0; step < this.maxSteps; step++) {
            const isFull = grid[step].every(cell => cell !== null);
            if (isFull) {
                linesClearedInQuadrant++;
                // Eliminar la línea completa y desplazar bloques hacia afuera
                grid.splice(step, 1);
                grid.unshift(Array(this.cols).fill(null)); // insertar fila vacía cerca del núcleo
            }
        }

        if (linesClearedInQuadrant > 0) {
            gameState.addLines(linesClearedInQuadrant);
            if (soundFX) soundFX.playLineClear();
        }
    }

    destroyBlockAt(direction, step, col) {
        const grid = this.grids[direction];
        if (step >= 0 && step < this.maxSteps && col >= 0 && col < this.cols) {
            if (grid[step][col] !== null) {
                grid[step][col] = null;
                return true;
            }
        }
        return false;
    }
}
