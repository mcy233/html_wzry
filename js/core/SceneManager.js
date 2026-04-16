/**
 * SceneManager - 场景生命周期管理
 * 负责场景的注册、切换、过渡动画
 * 每个场景实现 { enter(container, params), exit() } 接口
 */
import { eventBus } from './EventBus.js';

export class SceneManager {
    constructor(containerEl) {
        this._container = containerEl;
        this._scenes = new Map();
        this._currentScene = null;
        this._currentName = null;
        this._transitioning = false;
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
        this._transitioning = false;
        eventBus.emit('scene:ready', name);
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
