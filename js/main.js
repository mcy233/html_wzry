/**
 * main.js - 游戏主入口
 * 初始化引擎、注册场景、启动游戏
 */
import { game } from './core/GameEngine.js';
import { eventBus } from './core/EventBus.js';
import { TitleScene } from './scenes/TitleScene.js';
import { TeamSelectScene } from './scenes/TeamSelectScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { ExploreScene } from './scenes/ExploreScene.js';
import { TrainingScene } from './scenes/TrainingScene.js';
import { RosterScene } from './scenes/RosterScene.js';
import { SeasonScene } from './scenes/SeasonScene.js';
import { showToast } from './ui/Components.js';

function boot() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('找不到 #game-container');
        return;
    }

    game.init(container);

    game.sceneManager.register('title', new TitleScene());
    game.sceneManager.register('teamSelect', new TeamSelectScene());
    game.sceneManager.register('home', new HomeScene());
    game.sceneManager.register('battle', new BattleScene());
    game.sceneManager.register('explore', new ExploreScene());
    game.sceneManager.register('training', new TrainingScene());
    game.sceneManager.register('roster', new RosterScene());
    game.sceneManager.register('season', new SeasonScene());

    eventBus.on('ui:toast', (msg) => showToast(msg));

    game.sceneManager.switchTo('title');

    console.log('[Game] 城市荣耀 · KPL传奇之路 — 已启动');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
