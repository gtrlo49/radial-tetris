export class Ship {
    constructor(centerX, centerY, orbitRadius) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.orbitRadius = orbitRadius;
        this.angle = -Math.PI / 2; // Empieza arriba (Norte)
        this.rotationSpeed = 3.5; // rad/s
        this.size = 18;
        this.color = '#00ffcc';
        
        this.moveLeft = false;
        this.moveRight = false;
        this.isFiring = false;
        this.fireCooldown = 0;
        this.fireRate = 0.15; // Tiempo en segundos entre disparos

        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveLeft = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveRight = true;
            if (e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'ShiftLeft') this.isFiring = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveLeft = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveRight = false;
            if (e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'ShiftLeft') this.isFiring = false;
        });

        window.addEventListener('mousemove', (e) => {
            // Permite apuntar suavemente con el cursor
            const dx = e.clientX - this.centerX;
            const dy = e.clientY - this.centerY;
            this.angle = Math.atan2(dy, dx);
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isFiring = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isFiring = false;
        });
    }

    updateCenter(cx, cy, orbitRadius) {
        this.centerX = cx;
        this.centerY = cy;
        this.orbitRadius = orbitRadius;
    }

    update(dt, createProjectileCallback) {
        // Movimiento por teclado (rotación orbital continua)
        if (this.moveLeft) {
            this.angle -= this.rotationSpeed * dt;
        }
        if (this.moveRight) {
            this.angle += this.rotationSpeed * dt;
        }

        // Sistema de enfriamiento de disparo
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        if (this.isFiring && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate;
            const shipPos = this.getPosition();
            createProjectileCallback(shipPos.x, shipPos.y, this.angle);
        }
    }

    getPosition() {
        return {
            x: this.centerX + Math.cos(this.angle) * this.orbitRadius,
            y: this.centerY + Math.sin(this.angle) * this.orbitRadius
        };
    }

    render(ctx) {
        const pos = this.getPosition();

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(this.angle + Math.PI / 2); // Apunta hacia afuera radialmente

        // Dibujo de la nave cibernética (Triángulo futurista)
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(-this.size * 0.7, this.size * 0.7);
        ctx.lineTo(0, this.size * 0.3);
        ctx.lineTo(this.size * 0.7, this.size * 0.7);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.fill();

        // Propulsor
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, this.size * 0.5);
        ctx.lineTo(0, this.size * 1.1);
        ctx.lineTo(this.size * 0.3, this.size * 0.5);
        ctx.fillStyle = '#ff00aa';
        ctx.fill();

        ctx.restore();
    }
}
