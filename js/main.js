/**
 * main.js - 游戏主入口
 */
import { game } from './core/GameEngine.js';
import { eventBus } from './core/EventBus.js';
import { TitleScene } from './scenes/TitleScene.js';
import { TeamSelectScene } from './scenes/TeamSelectScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { BPScene } from './scenes/BPScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { ExploreScene } from './scenes/ExploreScene.js';
import { TrainingScene } from './scenes/TrainingScene.js';
import { RosterScene } from './scenes/RosterScene.js';
import { SeasonScene } from './scenes/SeasonScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { PostcardScene } from './scenes/PostcardScene.js';
import { StrategyGuideScene } from './scenes/StrategyGuideScene.js';
import { MatchCalendarScene } from './scenes/MatchCalendarScene.js';
import { RecruitScene } from './scenes/RecruitScene.js';
import { TransferScene } from './scenes/TransferScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { QuickBattleScene } from './scenes/QuickBattleScene.js';
import { showToast } from './ui/Components.js';
import { setVolume, setEnabled, initSceneBGM } from './ui/SoundManager.js';


/* ── 加载界面控制 ── */

const TIPS = [
    '💡 合理的BP可以让胜率提升30%',
    '🎮 AG超玩会是KPL历史上夺冠次数最多的战队之一',
    '📊 打野选手的节奏对前期发育影响很大',
    '🏟️ 每个城市都有独特的文旅路线等你探索',
    '🗂️ 集齐城市明信片可以解锁特殊徽章',
    '🍜 美食小游戏评分越高，增益buff越强',
    '⭐ 城市声望达到5星可获得"荣誉市民"称号',
    '🧠 AI教练可以帮你分析对手阵容并推荐英雄',
    '🔥 赛前探索客场城市可获得比赛增益',
];

let _tipTimer = null;

function updateLoading(pct, text) {
    const bar = document.getElementById('load-bar');
    const glow = document.getElementById('load-glow');
    const txt = document.getElementById('load-text');
    if (bar) bar.style.width = pct + '%';
    if (glow) glow.style.right = (100 - pct) + '%';
    if (txt) {
        txt.style.animation = 'none';
        txt.textContent = text;
    }
}

function showRandomTip() {
    const el = document.getElementById('load-tip');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => {
        el.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        el.style.opacity = '0.6';
    }, 200);
}

function removeLoading() {
    if (_tipTimer) clearInterval(_tipTimer);
    const el = document.getElementById('loading-screen');
    if (el) {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
    }
}

/* ── 启动流程 ── */

function boot() {
    updateLoading(10, '加载游戏引擎...');
    showRandomTip();
    _tipTimer = setInterval(showRandomTip, 3000);

    const container = document.getElementById('game-container');
    if (!container) {
        console.error('找不到 #game-container');
        return;
    }

    updateLoading(25, '初始化核心系统...');
    game.init(container);

    updateLoading(40, '注册游戏场景...');
    game.sceneManager.register('title', new TitleScene());
    game.sceneManager.register('teamSelect', new TeamSelectScene());
    game.sceneManager.register('home', new HomeScene());
    game.sceneManager.register('bp', new BPScene());
    game.sceneManager.register('battle', new BattleScene());
    game.sceneManager.register('explore', new ExploreScene());
    game.sceneManager.register('training', new TrainingScene());
    game.sceneManager.register('roster', new RosterScene());
    game.sceneManager.register('season', new SeasonScene());
    game.sceneManager.register('settings', new SettingsScene());
    game.sceneManager.register('postcards', new PostcardScene());
    game.sceneManager.register('strategyGuide', new StrategyGuideScene());
    game.sceneManager.register('matchCalendar', new MatchCalendarScene());
    game.sceneManager.register('recruit', new RecruitScene());
    game.sceneManager.register('transfer', new TransferScene());
    game.sceneManager.register('collection', new CollectionScene());
    game.sceneManager.register('quickBattle', new QuickBattleScene());

    updateLoading(70, '加载数据模块...');
    eventBus.on('ui:toast', (msg) => showToast(msg));

    try {
        const saved = JSON.parse(localStorage.getItem('kpl_game_settings') || '{}');
        if (saved.soundEnabled === false) setEnabled(false);
        if (saved.bgmVolume != null) setVolume('bgm', saved.bgmVolume / 100);
        if (saved.sfxVolume != null) setVolume('sfx', saved.sfxVolume / 100);
    } catch { /* ignore */ }

    updateLoading(85, '初始化音效系统...');
    initSceneBGM();

    updateLoading(90, '准备就绪...');

    requestAnimationFrame(() => {
        updateLoading(100, '启动游戏！');
        setTimeout(() => {
            removeLoading();
            game.sceneManager.switchTo('title');
            console.log('[Game] 城市荣耀 · KPL传奇之路 — 已启动');
        }, 300);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
