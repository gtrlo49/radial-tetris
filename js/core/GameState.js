export const STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
    LEADERBOARD: 'LEADERBOARD'
};

export class GameState {
    constructor() {
        this.currentState = STATES.MENU;
        this.maxTime = 120;
        this.timeRemaining = this.maxTime;
        this.coreHealth = 100;
        this.maxCoreHealth = 100;
        this.score = 0;
        this.combo = 1;
        this.linesCleared = 0;
        this.hasHandledResult = false;

        // SISTEMA PULSE BOMB CON ALIVIO INVISIBLE DE VELOCIDAD (-25s)
        this.pulseBombUnlocked = false;
        this.pulseBombUsed = false;
        this.pulseBombPauseTimer = 0;
        this.speedTimeOffset = 0;

        this.pulseBombBonusActive = false;
        this.pulseBombTargetScore = 0;
        this.pulseBombRollSpeed = 0;
    }

    start() {
        this.currentState = STATES.PLAYING;
        this.timeRemaining = this.maxTime;
        this.coreHealth = this.maxCoreHealth;
        this.score = 0;
        this.combo = 1;
        this.linesCleared = 0;
        this.hasHandledResult = false;

        this.pulseBombUnlocked = false;
        this.pulseBombUsed = false;
        this.pulseBombPauseTimer = 0;
        this.speedTimeOffset = 0;

        this.pulseBombBonusActive = false;
        this.pulseBombTargetScore = 0;
        this.pulseBombRollSpeed = 0;
    }

    getEffectiveElapsedTime() {
        const realElapsedTime = 120 - this.timeRemaining;
        return Math.max(0, realElapsedTime - this.speedTimeOffset);
    }

    triggerPulseBombBonus(totalBonusPoints) {
        this.pulseBombBonusActive = true;
        this.pulseBombTargetScore = this.score + totalBonusPoints;
        this.pulseBombRollSpeed = Math.max(50, totalBonusPoints / 3.2);
    }

    update(dt) {
        if (this.currentState !== STATES.PLAYING) return;

        if (this.pulseBombBonusActive) {
            if (this.score < this.pulseBombTargetScore) {
                this.score += this.pulseBombRollSpeed * dt;
                if (this.score >= this.pulseBombTargetScore) {
                    this.score = this.pulseBombTargetScore;
                    this.pulseBombBonusActive = false;
                }
            } else {
                this.pulseBombBonusActive = false;
            }
        }

        if (this.pulseBombPauseTimer > 0) {
            this.pulseBombPauseTimer -= dt;
            if (this.pulseBombPauseTimer < 0) this.pulseBombPauseTimer = 0;
        }

        if (!this.pulseBombUnlocked && this.score >= 10000) {
            this.pulseBombUnlocked = true;
        }

        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.currentState = STATES.VICTORY;
        }

        if (this.coreHealth <= 0) {
            this.coreHealth = 0;
            this.currentState = STATES.GAME_OVER;
        }
    }

    damageCore(amount) {
        this.coreHealth -= amount;
        if (this.coreHealth <= 0) {
            this.coreHealth = 0;
            this.currentState = STATES.GAME_OVER;
        }
    }

    addScore(points) {
        this.score += points * this.combo;
        if (!this.pulseBombUnlocked && this.score >= 10000) {
            this.pulseBombUnlocked = true;
        }
    }

    addLines(count) {
        this.linesCleared += count;
        this.combo += count * 0.5;
        this.addScore(count * 100);
    }

    resetCombo() {
        this.combo = 1;
    }
}
