export class HUD {
    render(ctx, gameState, width, height) {
        ctx.save();

        // 1. Temporizador de 2 Minutos (Arriba al centro)
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = Math.floor(gameState.timeRemaining % 60).toString().padStart(2, '0');
        const timeText = `${minutes}:${seconds}`;

        ctx.font = 'bold 32px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = gameState.timeRemaining < 20 ? '#ff3255' : '#00f0ff';
        ctx.shadowColor = gameState.timeRemaining < 20 ? '#ff3255' : '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fillText(`TIEMPO: ${timeText}`, width / 2, 20);

        // 2. Barra de Integridad del Núcleo (Arriba Izquierda)
        const barWidth = 200;
        const barHeight = 16;
        const barX = 25;
        const barY = 25;
        const healthPct = Math.max(0, gameState.coreHealth / gameState.maxCoreHealth);

        ctx.fillStyle = 'rgba(10, 15, 30, 0.7)';
        ctx.shadowBlur = 0;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = healthPct > 0.4 ? '#00f0ff' : '#ff3232';
        ctx.shadowColor = healthPct > 0.4 ? '#00f0ff' : '#ff3232';
        ctx.shadowBlur = 8;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`NÚCLEO: ${Math.ceil(healthPct * 100)}%`, barX + 5, barY + 3);

        // 3. Marcador de Puntuación y Combo (Arriba Derecha)
        ctx.textAlign = 'right';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 8;
        ctx.fillText(`SCORE: ${Math.floor(gameState.score)}`, width - 25, 20);

        if (gameState.combo > 1) {
            ctx.font = 'italic bold 16px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ff00aa';
            ctx.shadowColor = '#ff00aa';
            ctx.fillText(`COMBO x${gameState.combo.toFixed(1)}`, width - 25, 52);
        }

        ctx.restore();
    }
}
