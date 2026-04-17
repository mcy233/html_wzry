/**
 * GameEngine - 游戏主引擎
 * 整合所有核心模块，管理游戏全局状态
 */
import { eventBus } from './EventBus.js';
import { SceneManager } from './SceneManager.js';
import { SaveManager } from './SaveManager.js';
import { ECONOMY, MORALE, PLAYER } from '../data/balance.js';

class GameEngine {
    constructor() {
        this.sceneManager = null;
        this.state = this._createInitialState();
        this._initialized = false;
    }

    _createInitialState() {
        return {
            teamId: null,
            season: {
                phase: 'spring_regular',
                round: 0,
                week: 0,
            },
            team: {
                morale: MORALE.START,
                synergy: 50,
                fame: 0,
                fans: 1000,
                gold: ECONOMY.START_GOLD,
                culturePieces: 0,
            },
            players: [],
            starters: [],
            results: [],
            collection: {
                landmarks: [],
                foods: [],
                achievements: [],
            },
            explore: {},
            storyFlags: {},
            seasonSystem: null,

            rosterAll: [],
            trainingExp: 0,
            recruit: { goldPity: 0, bluePity: 0, wishList: [], history: [] },
            transfer: { market: [], lastRefreshPhase: '' },
            collectionData: { unlocked: [], totalValue: 0, claimedRewards: [] },
            fragments: { universal: 0 },
            tickets: { gold: 5, blue: 20 },
            recruitGold: 0,
            quickBattle: { defaultMode: 'detailed' },
        };
    }

    init(containerEl) {
        if (this._initialized) return;

        this.sceneManager = new SceneManager(containerEl);

        const saved = SaveManager.load();
        if (saved) {
            this.state = { ...this._createInitialState(), ...saved };
        }

        eventBus.on('game:save', () => this.save());
        eventBus.on('game:newGame', () => this.newGame());

        this._initialized = true;
        console.log('[GameEngine] Initialized');
    }

    save() {
        SaveManager.save(this.state);
        eventBus.emit('ui:toast', '存档成功');
    }

    silentSave() {
        SaveManager.save(this.state);
    }

    newGame() {
        this.state = this._createInitialState();
        SaveManager.deleteSave();
    }

    hasSave() {
        return SaveManager.hasSave();
    }

    updateState(path, value) {
        const keys = path.split('.');
        let obj = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        eventBus.emit('state:change', path, value);
    }

    getState(path) {
        const keys = path.split('.');
        let obj = this.state;
        for (const key of keys) {
            if (obj == null) return undefined;
            obj = obj[key];
        }
        return obj;
    }
}

export const game = new GameEngine();
