export class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 650; // px/s
        this.radius = 4;
        this.color = '#ff00aa';
        this.active = true;
    }

    update(dt, maxDistance, cx, cy) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Desactivar si sale fuera del alcance máximo del Canvas
        const distFromCenter = Math.hypot(this.x - cx, this.y - cy);
        if (distFromCenter > maxDistance * 1.2) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#ff00aa';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}
