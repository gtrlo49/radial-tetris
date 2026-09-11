import { DIRECTIONS } from '../tetris/Piece.js';

export class CollisionSystem {
    static handleProjectileGridCollisions(projectiles, gridManager, particleSystem, soundFX, gameState, cx, cy, coreRadius, maxRadius) {
        const stepDist = (maxRadius - coreRadius) / gridManager.maxSteps;

        for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = projectiles[pIdx];
            if (!p.active) continue;

            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.hypot(dx, dy);
            
            // Si la bala está dentro de la zona radial de Tetris
            if (dist >= coreRadius && dist <= maxRadius) {
                const angle = Math.atan2(dy, dx); // [-PI, PI]
                const deg = (angle * 180 / Math.PI + 360) % 360;

                let dir = null;
                let angleOffset = 0;

                // Determinar dirección del cuadrante
                if (deg >= 45 && deg < 135) {
                    dir = DIRECTIONS.SOUTH;
                    angleOffset = deg - 45;
                } else if (deg >= 135 && deg < 225) {
                    dir = DIRECTIONS.WEST;
                    angleOffset = deg - 135;
                } else if (deg >= 225 && deg < 315) {
                    dir = DIRECTIONS.NORTH;
                    angleOffset = deg - 225;
                } else {
                    dir = DIRECTIONS.EAST;
                    angleOffset = (deg >= 315) ? (deg - 315) : (deg + 45);
                }

                // Calcular step (distancia radial) y col (columna angular)
                const step = Math.floor((dist - coreRadius) / stepDist);
                const col = Math.floor((angleOffset / 90) * gridManager.cols);

                if (step >= 0 && step < gridManager.maxSteps && col >= 0 && col < gridManager.cols) {
                    // Verificar colisión con bloques fijados en la grilla
                    if (gridManager.destroyBlockAt(dir, step, col)) {
                        p.active = false;
                        particleSystem.createExplosion(p.x, p.y, '#ff00aa', 15);
                        soundFX.playExplosion();
                        gameState.addScore(50);
                        continue;
                    }
                }
            }

            // Colisión con piezas activas en movimiento
            for (let i = gridManager.activePieces.length - 1; i >= 0; i--) {
                const piece = gridManager.activePieces[i];
                const pieceStepDist = coreRadius + piece.step * stepDist;
                
                // Aproximación circular simple para pieza activa
                const pieceRadius = stepDist * 1.2;
                let pieceX = cx;
                let pieceY = cy;

                if (piece.direction === DIRECTIONS.NORTH) pieceY -= pieceStepDist;
                else if (piece.direction === DIRECTIONS.SOUTH) pieceY += pieceStepDist;
                else if (piece.direction === DIRECTIONS.EAST) pieceX += pieceStepDist;
                else if (piece.direction === DIRECTIONS.WEST) pieceX -= pieceStepDist;

                const distToPiece = Math.hypot(p.x - pieceX, p.y - pieceY);
                if (distToPiece < pieceRadius) {
                    p.active = false;
                    gridManager.activePieces.splice(i, 1);
                    particleSystem.createExplosion(pieceX, pieceY, piece.color, 20);
                    soundFX.playExplosion();
                    gameState.addScore(150);
                    break;
                }
            }
        }
    }
}
