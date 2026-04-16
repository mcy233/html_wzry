import { eventBus } from './EventBus.js';

export class SceneManager {
    constructor(containerEl) {
        this._container = containerEl;
        this._scenes = new Map();
        this._currentScene = null;
        this._currentName = null;
        this._transitioning = false;
        this._overlay = null;
    }

    register(name, scene) {
        this._scenes.set(name, scene);
    }

    get currentScene() {
        return this._currentName;
    }

    async switchTo(name, params = {}) {
        if (this._transitioning) return;
        if (!this._scenes.has(name)) {
            console.error(`[SceneManager] Scene "${name}" not found`);
            return;
        }
        this._transitioning = true;
        this._showTransitionOverlay();

        try {
            if (this._currentScene) {
                await this._fadeOut();
                if (typeof this._currentScene.exit === 'function') {
                    this._currentScene.exit();
                }
                this._container.innerHTML = '';
            }

            this._currentName = name;
            this._currentScene = this._scenes.get(name);
            eventBus.emit('scene:change', name, params);

            if (typeof this._currentScene.enter === 'function') {
                await this._currentScene.enter(this._container, params);
            }

            await this._fadeIn();
            eventBus.emit('scene:ready', name);
        } catch (err) {
            console.error(`[SceneManager] Error switching to "${name}":`, err);
        } finally {
            this._hideTransitionOverlay();
            this._transitioning = false;
        }
    }

    _showTransitionOverlay() {
        if (this._overlay) return;
        const o = document.createElement('div');
        o.className = 'scene-transition-overlay';
        o.innerHTML = '<div class="scene-transition-spinner"></div>';
        document.body.appendChild(o);
        this._overlay = o;
        requestAnimationFrame(() => o.classList.add('scene-transition-overlay--active'));
    }

    _hideTransitionOverlay() {
        const o = this._overlay;
        if (!o) return;
        o.classList.remove('scene-transition-overlay--active');
        o.classList.add('scene-transition-overlay--out');
        setTimeout(() => { o.remove(); this._overlay = null; }, 350);
    }

    _fadeOut() {
        return new Promise(resolve => {
            this._container.classList.add('scene-fade-out');
            setTimeout(() => {
                this._container.classList.remove('scene-fade-out');
                resolve();
            }, 300);
        });
    }

    _fadeIn() {
        return new Promise(resolve => {
            this._container.classList.add('scene-fade-in');
            setTimeout(() => {
                this._container.classList.remove('scene-fade-in');
                resolve();
            }, 400);
        });
    }
}
