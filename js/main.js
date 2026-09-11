import { Engine } from './core/Engine.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine('gameCanvas');
    engine.start();
    console.log('🚀 Radial Tetris Defense Engine iniciado con éxito.');
});
