import { GameState, STATES } from './GameState.js';
import { Renderer } from './Renderer.js';
import { GridManager } from '../tetris/GridManager.js';
import { Ship } from '../entities/Ship.js';
import { Projectile } from '../entities/Projectile.js';
import { CollisionSystem } from '../physics/Collision.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { SoundFX } from '../ui/Sound.js';
import { HUD } from '../ui/HUD.js';

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.gameState = new GameState();
        this.renderer = new Renderer(this.canvas, this.ctx);

        this.gridManager = new GridManager();
        this.ship = new Ship(this.renderer.centerX, this.renderer.centerY, this.renderer.coreRadius + 25);
        this.projectiles = [];
        this.particleSystem = new ParticleSystem();
        this.soundFX = new SoundFX();
        this.hud = new HUD();

        this.lastTime = 0;
        this.isRunning = false;

        this.setupResize();
        this.setupInputs();
    }

    setupResize() {
        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.renderer.resize(w, h);
            this.ship.updateCenter(this.renderer.centerX, this.renderer.centerY, this.renderer.coreRadius + 25);
        };
        window.addEventListener('resize', resize);
        resize();
    }

    setupInputs() {
        const handleStart = () => {
            this.soundFX.init();
            if (this.gameState.currentState === STATES.MENU || 
                this.gameState.currentState === STATES.GAME_OVER || 
                this.gameState.currentState === STATES.VICTORY) {
                this.gameState.start();
                this.gridManager.reset();
                this.projectiles = [];
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                handleStart();
            }
        });

        this.canvas.addEventListener('click', () => {
            handleStart();
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    createProjectile(x, y, angle) {
        this.projectiles.push(new Projectile(x, y, angle));
        this.soundFX.playLaser();
    }

    update(dt) {
        this.gameState.update(dt);

        if (this.gameState.currentState === STATES.PLAYING) {
            // Actualizar Grillas de Tetris
            this.gridManager.update(
                dt,
                this.gameState,
                this.soundFX,
                this.particleSystem,
                this.renderer.centerX,
                this.renderer.centerY,
                this.renderer.coreRadius
            );

            // Actualizar Nave espacial
            this.ship.update(dt, (x, y, angle) => this.createProjectile(x, y, angle));

            // Actualizar Proyectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.update(dt, this.renderer.maxRadius, this.renderer.centerX, this.renderer.centerY);
                if (!p.active) {
                    this.projectiles.splice(i, 1);
                }
            }

            // Chequeo de Físicas y Colisiones
            CollisionSystem.handleProjectileGridCollisions(
                this.projectiles,
                this.gridManager,
                this.particleSystem,
                this.soundFX,
                this.gameState,
                this.renderer.centerX,
                this.renderer.centerY,
                this.renderer.coreRadius,
                this.renderer.maxRadius
            );
        }

        // Actualizar Partículas
        this.particleSystem.update(dt);
    }

    render() {
        this.renderer.clear();
        this.renderer.renderBackground();
        this.renderer.renderCore(this.gameState);

        if (this.gameState.currentState === STATES.PLAYING) {
            // Dibujar bloques radiales de Tetris
            this.renderer.renderGrids(this.gridManager);

            // Dibujar Proyectiles
            for (const p of this.projectiles) {
                p.render(this.ctx);
            }

            // Dibujar Nave
            this.ship.render(this.ctx);
        }

        // Dibujar Partículas
        this.particleSystem.render(this.ctx);

        // Dibujar HUD
        this.hud.render(this.ctx, this.gameState, this.canvas.width, this.canvas.height);

        // Dibujar Overlays de estado (Menu / Game Over / Victory)
        this.renderer.renderUIOverlay(this.gameState);
    }
}
