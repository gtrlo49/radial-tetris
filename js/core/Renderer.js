import { STATES } from './GameState.js';
import { DIRECTIONS } from '../tetris/Piece.js';

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.centerX = 0;
        this.centerY = 0;
        this.coreRadius = 40;
        this.maxRadius = 320;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.maxRadius = Math.min(width, height) * 0.42;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBackground() {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1.5;

        // Líneas diagonales divisoras de cuadrantes
        const diagDist = this.maxRadius * 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - diagDist, cy - diagDist);
        ctx.lineTo(cx + diagDist, cy + diagDist);
        ctx.moveTo(cx + diagDist, cy - diagDist);
        ctx.lineTo(cx - diagDist, cy + diagDist);
        ctx.stroke();

        // Anillos concentricos de cuadrícula radial
        const ringCount = 8;
        for (let i = 1; i <= ringCount; i++) {
            const r = this.coreRadius + (this.maxRadius - this.coreRadius) * (i / ringCount);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + (i / ringCount) * 0.07})`;
            ctx.stroke();
        }

        ctx.restore();
    }

    renderCore(gameState) {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const healthPct = gameState.coreHealth / gameState.maxCoreHealth;

        ctx.save();
        
        // Brillo exterior del núcleo
        const glowGradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, this.coreRadius * 1.8);
        const glowColor = healthPct > 0.4 ? 'rgba(0, 240, 255, ' : 'rgba(255, 50, 50, ';
        glowGradient.addColorStop(0, glowColor + '0.8)');
        glowGradient.addColorStop(0.5, glowColor + '0.3)');
        glowGradient.addColorStop(1, glowColor + '0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, this.coreRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo del núcleo
        ctx.beginPath();
        ctx.arc(cx, cy, this.coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = healthPct > 0.4 ? '#00f0ff' : '#ff3232';
        ctx.shadowColor = healthPct > 0.4 ? '#00f0ff' : '#ff3232';
        ctx.shadowBlur = 15;
        ctx.fill();

        // Detalle interior
        ctx.beginPath();
        ctx.arc(cx, cy, this.coreRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }

    renderGrids(gridManager) {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const stepDist = (this.maxRadius - this.coreRadius) / gridManager.maxSteps;

        // Renderizado de bloques fijados en las 4 matrices
        for (const dir in gridManager.grids) {
            const grid = gridManager.grids[dir];
            for (let step = 0; step < gridManager.maxSteps; step++) {
                for (let col = 0; col < gridManager.cols; col++) {
                    const color = grid[step][col];
                    if (color !== null) {
                        this.drawRadialBlock(ctx, cx, cy, dir, step, col, gridManager.cols, stepDist, color);
                    }
                }
            }
        }

        // Renderizado de piezas activas en movimiento
        for (const piece of gridManager.activePieces) {
            const matrix = piece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] !== 0) {
                        const step = piece.step + r;
                        const col = piece.colOffset + c;
                        if (step >= 0 && step < gridManager.maxSteps && col >= 0 && col < gridManager.cols) {
                            this.drawRadialBlock(ctx, cx, cy, piece.direction, step, col, gridManager.cols, stepDist, piece.color);
                        }
                    }
                }
            }
        }
    }

    drawRadialBlock(ctx, cx, cy, direction, step, col, totalCols, stepDist, color) {
        ctx.save();
        const rInner = this.coreRadius + step * stepDist;
        const rOuter = rInner + stepDist * 0.9;

        // Angular span por cuadrante (90 grados / 0.52 rad por columna)
        const angleSpan = (Math.PI / 2) / totalCols;
        let startAngle = 0;

        if (direction === DIRECTIONS.NORTH) startAngle = -Math.PI * 0.75 + col * angleSpan;
        else if (direction === DIRECTIONS.SOUTH) startAngle = Math.PI * 0.25 + col * angleSpan;
        else if (direction === DIRECTIONS.EAST) startAngle = -Math.PI * 0.25 + col * angleSpan;
        else if (direction === DIRECTIONS.WEST) startAngle = Math.PI * 0.75 + col * angleSpan;

        const endAngle = startAngle + angleSpan * 0.9;

        ctx.beginPath();
        ctx.arc(cx, cy, rInner, startAngle, endAngle, false);
        ctx.arc(cx, cy, rOuter, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    renderUIOverlay(gameState) {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (gameState.currentState === STATES.MENU) {
            ctx.fillStyle = 'rgba(8, 9, 20, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.font = 'bold 40px "Segoe UI", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.fillText('RADIAL TETRIS DEFENSE', cx, cy - 60);

            ctx.font = '18px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText('Nave Orbital: Usa A/D o Flechas o Cursor para Moverte', cx, cy);
            ctx.fillText('Disparo: Z / Clic para Destruir Bloques antes que choquen', cx, cy + 30);
            
            ctx.font = 'bold 22px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ff00aa';
            ctx.shadowColor = '#ff00aa';
            ctx.shadowBlur = 10;
            ctx.fillText('[ Presiona ESPACIO o haz Clic para Empezar ]', cx, cy + 90);
        } else if (gameState.currentState === STATES.GAME_OVER) {
            ctx.fillStyle = 'rgba(20, 5, 10, 0.85)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.font = 'bold 44px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ff3232';
            ctx.shadowColor = '#ff3232';
            ctx.shadowBlur = 20;
            ctx.fillText('NÚCLEO DESTRUIDO - GAME OVER', cx, cy - 40);

            ctx.font = '24px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText(`Puntuación Final: ${Math.floor(gameState.score)}`, cx, cy + 20);

            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('[ Presiona ESPACIO para Reiniciar ]', cx, cy + 80);
        } else if (gameState.currentState === STATES.VICTORY) {
            ctx.fillStyle = 'rgba(5, 20, 15, 0.85)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.font = 'bold 44px "Segoe UI", sans-serif';
            ctx.fillStyle = '#00ffcc';
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 20;
            ctx.fillText('¡VICTORIA! NÚCLEO PROTEGIDO', cx, cy - 40);

            ctx.font = '24px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText(`Puntuación Final: ${Math.floor(gameState.score)}`, cx, cy + 20);

            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('[ Presiona ESPACIO para Jugar de Nuevo ]', cx, cy + 80);
        }

        ctx.restore();
    }
}
