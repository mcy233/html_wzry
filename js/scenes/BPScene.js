/**
 * BPScene - Ban/Pick 独立场景
 * 负责整个BP流程的UI渲染、交互与AI教练
 * BP完成后将结果存入 game.state，切换到 battle 场景
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId, TEAMS } from '../data/teams.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { HEROES, HERO_ROLES, getHero, getPlayerHeroes, getCounterInfo, getHeroesForPosition, heroImgHTML, evaluateComp } from '../data/heroes.js';
import { isMetaHero, getHeroMeta } from '../data/heroMeta.js';
import { getPlayerStats, getPlayerHeroStats, getPlayerTier, PLAYER_TIERS, TIER_COLORS as PTIER_COLORS } from '../data/playerStats.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';
import { sfxBan, sfxPick, sfxBattleStart, sfxSelect } from '../ui/SoundManager.js';
import { getCoachAnalysis, getCoachConfig, saveCoachConfig, estimateWinRate, getStructuredRecommendations } from '../systems/AICoach.js';

function _formatCoachText(text) {
    return text.split('\n').filter(l => l.trim()).map(line => {
        let cls = 'coach-line';
        const trimmed = line.trim();
        if (trimmed.startsWith('📋') || trimmed.startsWith('🎯') || trimmed.startsWith('📌')) cls += ' coach-line--heading';
        else if (trimmed.startsWith('⚠️')) cls += ' coach-line--warn';
        else if (trimmed.startsWith('💡') || trimmed.startsWith('🌟') || trimmed.startsWith('⚔️')) cls += ' coach-line--suggest';
        else if (trimmed.startsWith('📊')) cls += ' coach-line--winrate';
        else if (trimmed.startsWith('🔴')) cls += ' coach-line--warn';
        else if (trimmed.startsWith('🟢')) cls += ' coach-line--suggest';
        return `<div class="${cls}">${trimmed}</div>`;
    }).join('');
}

export class BPScene {
    async enter(container, params = {}) {
        this._container = container;
        const teamId = params.teamId || game.getState('teamId');
        this._myTeam = getTeamById(teamId);

        const season = this._loadSeason(teamId);
        const currentMatch = season.getPlayerMatch();
        if (currentMatch) {
            const opponentId = currentMatch.homeTeam === teamId ? currentMatch.awayTeam : currentMatch.homeTeam;
            this._enemyTeam = getTeamById(opponentId);
        } else {
            const opponents = TEAMS.filter(t => t.id !== teamId);
            this._enemyTeam = opponents[Math.floor(Math.random() * opponents.length)];
        }

        this._myStarters = this._getMyStarters(teamId);
        this._enemyStarters = getStartersByTeamId(this._enemyTeam.id);
        this._battleSystem = new BattleSystem(
            this._myTeam, this._enemyTeam, this._myStarters, this._enemyStarters,
            { morale: game.state.team?.morale || 70, playerConditions: {} }
        );

        this._activePlayerId = null;
        this._activePlayerSide = null;

        container.className = 'scene scene--battle';
        container.innerHTML = '<div class="bp-scene-root" id="bp-root"></div>';
        this._main = container.querySelector('#bp-root');

        setTimeout(() => this._startBP().catch(err => console.error('[BP Error]', err)), 50);
    }

    exit() { this._container = null; }

    _loadSeason(teamId) {
        if (game.state.seasonSystem) return SeasonSystem.fromSaveData(game.state.seasonSystem);
        const sys = new SeasonSystem(teamId); sys.initGroups(); return sys;
    }

    _getMyStarters(teamId) {
        const savedStarters = game.state.starters;
        const players = game.state.players?.length ? game.state.players : getTeamById(teamId).players;
        if (savedStarters?.length) {
            const ids = new Set(savedStarters);
            const result = players.filter(p => ids.has(p.id));
            if (result.length >= 5) return result;
        }
        return getStartersByTeamId(teamId);
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    /* ====================== BP 主流程 ====================== */
    async _startBP() {
        const bpCtx = this._battleSystem.generateBPContext();
        const main = this._main;
        const banned = { my: [], enemy: [] };
        const picks = { my: [null, null, null, null, null], enemy: [] };
        this._currentMyPicks = picks.my;
        this._currentEnemyPicks = picks.enemy;
        const myPickRoles = [null, null, null, null, null];
        const enemyPickRoles = [];
        const roles = ['对抗路', '打野', '中路', '发育路', '游走'];
        this._activePlayerIdx = null;
        const allBanned = () => [...banned.my, ...banned.enemy];
        const allPicked = () => [...picks.my.filter(Boolean), ...picks.enemy];

        this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'ban');

        const update = (phase, statusText) => {
            this._patchBPSlots(main, banned, picks, myPickRoles, enemyPickRoles, phase);
            if (statusText) this._updateBPStatus(main, statusText);
        };

        const myBan = async (label) => {
            update('ban', label);
            this._updateCoachAnalysis(banned, picks, myPickRoles.filter(Boolean), enemyPickRoles, 'ban', label);
            const h = await this._bpSelectHero(main, bpCtx, 'ban', allBanned(), allPicked(), picks, banned);
            banned.my.push(h); sfxBan();
            update('ban');
        };
        const enemyBan = async () => {
            update('ban', `${this._enemyTeam.shortName} 正在思考禁用...`);
            await this._sleep(1200 + Math.random() * 2300);
            const pool = this._getEnemyBanCandidates(bpCtx, allBanned());
            if (pool.length) { banned.enemy.push(pool[0]); sfxBan(); }
            update('ban');
        };
        const myPick = async (label) => {
            const emptySlots = picks.my.reduce((acc, p, i) => p === null ? [...acc, i] : acc, []);
            if (this._activePlayerIdx == null || picks.my[this._activePlayerIdx] !== null) {
                this._activePlayerIdx = emptySlots[0] ?? 0;
            }
            update('pick', label);
            this._updateCoachAnalysis(banned, picks, myPickRoles.filter(Boolean), enemyPickRoles, 'pick', label);
            const r = await this._bpPickWithRole(main, bpCtx, allBanned(), allPicked(), picks, myPickRoles, roles, banned);
            picks.my[r.slotIdx] = r.hero;
            myPickRoles[r.slotIdx] = r.role;
            this._activePlayerIdx = null;
            sfxPick();
            update('pick');
        };
        const enemyPick = async () => {
            update('pick', `${this._enemyTeam.shortName} 正在选人...`);
            await this._sleep(1500 + Math.random() * 2500);
            const r = this._autoEnemyPick(bpCtx, allBanned(), allPicked(), enemyPickRoles, roles);
            picks.enemy.push(r.hero); enemyPickRoles.push(r.role); sfxPick();
            update('pick');
        };

        // ---- 第1段：蓝Ban1 → 红Ban1 → 蓝Ban2 → 红Ban2 ----
        await myBan('蓝方Ban — 第1个');
        await enemyBan();
        await myBan('蓝方Ban — 第2个');
        await enemyBan();

        // ---- 第2段：蓝Pick1 → 红Pick1/2 → 蓝Pick2/3 → 红Pick3 ----
        await myPick(`${this._myTeam.shortName} 选择第1位`);
        await enemyPick();
        await enemyPick();
        await myPick(`${this._myTeam.shortName} 选择第2位`);
        await myPick(`${this._myTeam.shortName} 选择第3位`);
        await enemyPick();

        // ---- 第3段：红Ban3 → 蓝Ban3 → 红Ban4 → 蓝Ban4 → 红Ban5 → 蓝Ban5 ----
        await enemyBan();
        await myBan('蓝方Ban — 第3个');
        await enemyBan();
        await myBan('蓝方Ban — 第4个');
        await enemyBan();
        await myBan('蓝方Ban — 第5个');

        // ---- 第4段：红Pick4 → 蓝Pick4/5 → 红Pick5 ----
        await enemyPick();
        await myPick(`${this._myTeam.shortName} 选择第4位`);
        await myPick(`${this._myTeam.shortName} 选择第5位`);
        await enemyPick();

        const finalMyPicks = picks.my.filter(Boolean);
        const finalMyRoles = myPickRoles.filter(Boolean);
        const bpResult = this._battleSystem.resolveBP(banned.my, finalMyPicks, banned.enemy, picks.enemy);

        const compactPicks = { my: finalMyPicks, enemy: picks.enemy };
        main.innerHTML = this._renderBPResult(bpResult, compactPicks, banned, finalMyRoles, enemyPickRoles);
        await new Promise(res => main.querySelector('#btn-start-match').addEventListener('click', () => {
            sfxBattleStart();
            res();
        }));

        game.state.bpResult = {
            bpResult,
            picks: compactPicks,
            banned,
            myPickRoles: finalMyRoles,
            enemyPickRoles,
            myTeamId: this._myTeam.id,
            enemyTeamId: this._enemyTeam.id,
            myStarters: this._myStarters,
            enemyStarters: this._enemyStarters,
        };

        game.sceneManager.switchTo('battle', { fromBP: true });
    }

    /* ====================== BP 辅助方法 ====================== */
    _getEnemyBanCandidates(bpCtx, bannedList) {
        const pool = bpCtx.my.flatMap(c => c.heroes.map(h => h.name)).filter(h => !bannedList.includes(h));
        return pool.length ? pool : Object.keys(HEROES).filter(h => !bannedList.includes(h)).slice(0, 3);
    }

    _autoEnemyPick(bpCtx, bannedList, pickedList, enemyPickRoles, roles) {
        const unavailable = new Set([...bannedList, ...pickedList]);
        const remainRoles = roles.filter(r => !enemyPickRoles.includes(r));
        const role = remainRoles.length > 0 ? remainRoles[0] : roles[0];
        const ctx = bpCtx.enemy.find(c => c.role === role);
        const pool = (ctx?.heroes || []).map(h => h.name).filter(h => !unavailable.has(h));
        const hero = pool.length > 0 ? pool[0] : (Object.keys(HEROES).find(h => !unavailable.has(h)) || '赵云');
        return { hero, role };
    }

    /* ====================== BP 面板渲染 ====================== */
    _renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, phase) {
        const isBan = phase === 'ban';
        const wr = estimateWinRate(picks.my, picks.enemy, myPickRoles, enemyPickRoles);
        const hasPicks = picks.my.length > 0 || picks.enemy.length > 0;
        const wrColor = wr.my > 55 ? '#3ecf8e' : wr.my < 45 ? '#e74c3c' : '#888';

        const banSlots = (list) => {
            let html = '';
            for (let i = 0; i < 5; i++) {
                html += list[i]
                    ? `<span class="bp2-ban bp2-ban--filled">${this._heroCard(list[i], 30, false)}</span>`
                    : `<span class="bp2-ban"></span>`;
            }
            return html;
        };

        const playerCard = (player, pickHero, pickRole, side, idx) => {
            const teamColor = side === 'blue' ? (this._myTeam.color || '#4a90d9') : (this._enemyTeam.color || '#e74c3c');
            const avatar = playerAvatarHTML(player, teamColor, 42);
            const heroSlot = pickHero
                ? `<div class="bp2-player__hero bp2-player__hero--filled">${this._heroCard(pickHero, 52)}</div>`
                : `<div class="bp2-player__hero"><span class="bp2-player__role-hint">${pickRole || '?'}</span></div>`;
            const canClick = (side === 'red' && isBan) || (side === 'blue' && !isBan);
            const clickable = canClick ? 'bp2-player--clickable' : '';
            const highlight = canClick ? 'bp2-player--highlight' : '';
            const pTier = getPlayerTier(player.id);
            const pTierLabel = PLAYER_TIERS[pTier] || '';
            const pTierColor = PTIER_COLORS[pTier] || '#a4b0be';
            return `<div class="bp2-player bp2-player--${side} ${clickable} ${highlight}" data-side="${side}" data-idx="${idx}" data-player-id="${player.id}" data-player-role="${player.role || ''}">
                ${side === 'blue' ? `<div class="bp2-player__avatar">${avatar}</div>` : ''}
                <div class="bp2-player__info">
                    <div class="bp2-player__name">${player.nickname || player.id} <span class="bp2-player__tier" style="color:${pTierColor}">${pTierLabel}</span></div>
                    <div class="bp2-player__lane">${player.role || ''}</div>
                    <div class="bp2-player__rating">✦ ${player.rating || '--'}</div>
                    ${heroSlot}
                </div>
                ${side === 'red' ? `<div class="bp2-player__avatar">${avatar}</div>` : ''}
            </div>`;
        };

        const myPlayers = this._myStarters.slice(0, 5);
        const enemyPlayers = this._enemyStarters.slice(0, 5);
        const blueSide = myPlayers.map((p, i) => playerCard(p, picks.my[i], myPickRoles[i], 'blue', i)).join('');
        const redSide = enemyPlayers.map((p, i) => playerCard(p, picks.enemy[i], enemyPickRoles[i], 'red', i)).join('');

        const wrBar = hasPicks ? `<div class="bp2-wr">
            <span class="bp2-wr__val" style="color:${wrColor}">${wr.my}%</span>
            <div class="bp2-wr__track"><div class="bp2-wr__fill" style="width:${wr.my}%"></div></div>
            <span class="bp2-wr__val" style="color:${wr.enemy > 55 ? '#e74c3c' : '#888'}">${wr.enemy}%</span>
        </div>` : '';

        main.innerHTML = `<div class="bp2">
            <div class="bp2__top">
                <div class="bp2__top-side bp2__top-side--blue">
                    ${teamLogoHTML(this._myTeam.id, this._myTeam, 28)}
                    <span class="bp2__team-name">${this._myTeam.shortName}</span>
                    <div class="bp2__bans">${banSlots(banned.my)}</div>
                </div>
                <div class="bp2__top-center">
                    <div class="bp2__phase" id="bp-phase-label">${isBan ? '禁用 阶段' : '选用 阶段'}</div>
                    <div class="bp2__step" id="bp-status"></div>
                    ${wrBar}
                </div>
                <div class="bp2__top-side bp2__top-side--red">
                    <div class="bp2__bans bp2__bans--right">${banSlots(banned.enemy)}</div>
                    <span class="bp2__team-name">${this._enemyTeam.shortName}</span>
                    ${teamLogoHTML(this._enemyTeam.id, this._enemyTeam, 28)}
                </div>
            </div>
            <div class="bp2__mid">
                <div class="bp2__side bp2__side--blue">${blueSide}</div>
                <div class="bp2__grid" id="bp-select-area"></div>
                <div class="bp2__side bp2__side--red">${redSide}</div>
            </div>
            <div class="bp2__bot" id="bp-coach-panel">
                <div class="bp2__coach-bar">
                    <span class="coach-icon">🎙️</span><span class="coach-title">AI 教练</span>
                    <label class="coach-llm-toggle" title="启用/关闭大模型推理">
                        <input type="checkbox" id="coach-llm-switch" ${getCoachConfig().apiKey && getCoachConfig().enableBP !== false ? 'checked' : ''} />
                        <span class="coach-llm-toggle__label">LLM</span>
                    </label>
                </div>
                <div class="bp2__coach-body" id="coach-content"><div class="coach-loading">分析中...</div></div>
            </div>
        </div>`;

        this._updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, phase);
        this._bindCoachLLMToggle();
        this._bindPlayerClickEvents(main, phase);

        const board = main.querySelector('.bp2');
        if (board) {
            const blueCol = board.querySelector('.bp2__side--blue');
            const redCol = board.querySelector('.bp2__side--red');
            if (blueCol) blueCol.classList.toggle('bp2__side--dimmed', isBan);
            if (redCol) redCol.classList.toggle('bp2__side--dimmed', !isBan);
        }
    }

    _patchBPSlots(main, banned, picks, myPickRoles, enemyPickRoles, phase) {
        const board = main.querySelector('.bp2');
        if (!board) return;
        const isBan = phase === 'ban';

        const phaseEl = board.querySelector('#bp-phase-label');
        if (phaseEl) phaseEl.textContent = isBan ? '禁用 阶段' : '选用 阶段';

        board.querySelectorAll('.bp2-player').forEach(el => {
            const side = el.dataset.side;
            const idx = parseInt(el.dataset.idx);
            let canClick;
            if (isBan) {
                canClick = side === 'red';
            } else {
                canClick = side === 'blue' && !isNaN(idx) && picks.my[idx] === null;
            }
            el.classList.toggle('bp2-player--clickable', canClick);
            el.classList.toggle('bp2-player--highlight', canClick);
            if (!canClick) el.classList.remove('bp2-player--active');
        });

        const blueCol = board.querySelector('.bp2__side--blue');
        const redCol = board.querySelector('.bp2__side--red');
        if (blueCol) blueCol.classList.toggle('bp2__side--dimmed', isBan);
        if (redCol) redCol.classList.toggle('bp2__side--dimmed', !isBan);

        const updateBans = (selector, list) => {
            const container = board.querySelector(selector);
            if (!container) return;
            const slots = container.querySelectorAll('.bp2-ban');
            slots.forEach((slot, i) => {
                if (list[i] && !slot.classList.contains('bp2-ban--filled')) {
                    slot.classList.add('bp2-ban--filled');
                    slot.innerHTML = this._heroCard(list[i], 30, false);
                }
            });
        };
        const banContainers = board.querySelectorAll('.bp2__bans');
        if (banContainers[0]) updateBans('.bp2__top-side--blue .bp2__bans', banned.my);
        if (banContainers.length > 1) {
            const redBans = board.querySelector('.bp2__top-side--red .bp2__bans') || board.querySelector('.bp2__bans--right')?.parentElement?.querySelector('.bp2__bans');
            if (redBans) {
                const slots = redBans.querySelectorAll('.bp2-ban');
                slots.forEach((slot, i) => {
                    if (banned.enemy[i] && !slot.classList.contains('bp2-ban--filled')) {
                        slot.classList.add('bp2-ban--filled');
                        slot.innerHTML = this._heroCard(banned.enemy[i], 30, false);
                    }
                });
            }
        }

        const updateSidePicks = (sideClass, pickList) => {
            const side = board.querySelector(`.bp2__side${sideClass}`);
            if (!side) return;
            const players = side.querySelectorAll('.bp2-player');
            players.forEach((el, i) => {
                const heroSlot = el.querySelector('.bp2-player__hero');
                if (!heroSlot) return;
                if (pickList[i] && !heroSlot.classList.contains('bp2-player__hero--filled')) {
                    heroSlot.classList.add('bp2-player__hero--filled');
                    heroSlot.innerHTML = this._heroCard(pickList[i], 52);
                }
            });
        };
        updateSidePicks('.bp2__side--blue', picks.my);
        updateSidePicks('.bp2__side--red', picks.enemy);

        const wr = estimateWinRate(picks.my, picks.enemy, myPickRoles, enemyPickRoles);
        const hasPicks = picks.my.length > 0 || picks.enemy.length > 0;
        const wrContainer = board.querySelector('.bp2__top-center');
        const existingWr = wrContainer?.querySelector('.bp2-wr');
        if (hasPicks && wrContainer) {
            const wrColor = wr.my > 55 ? '#3ecf8e' : wr.my < 45 ? '#e74c3c' : '#888';
            const wrHTML = `<div class="bp2-wr">
                <span class="bp2-wr__val" style="color:${wrColor}">${wr.my}%</span>
                <div class="bp2-wr__track"><div class="bp2-wr__fill" style="width:${wr.my}%"></div></div>
                <span class="bp2-wr__val" style="color:${wr.enemy > 55 ? '#e74c3c' : '#888'}">${wr.enemy}%</span>
            </div>`;
            if (existingWr) { existingWr.outerHTML = wrHTML; }
            else { wrContainer.insertAdjacentHTML('beforeend', wrHTML); }
        }
    }

    async _updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, phase, stepLabel) {
        const panel = this._container.querySelector('#coach-content');
        if (!panel) return;
        panel.innerHTML = '<div class="coach-loading"><span class="coach-typing"></span> 分析中...</div>';
        const ctx = {
            phase, myBans: banned.my, enemyBans: banned.enemy,
            myPicks: picks.my, enemyPicks: picks.enemy,
            myPickRoles, enemyPickRoles,
            myTeamName: this._myTeam.shortName, enemyTeamName: this._enemyTeam.shortName,
            enemyStarters: this._enemyStarters,
            stepLabel: stepLabel || this._container.querySelector('#bp-status')?.textContent || '',
            banProgress: `我方已禁${banned.my.length}个，对方已禁${banned.enemy.length}个`,
            pickProgress: `我方已选${picks.my.length}个(${myPickRoles.join('/')}), 对方已选${picks.enemy.length}个`,
        };
        try {
            const text = await getCoachAnalysis(ctx);
            if (!panel.isConnected) return;
            panel.innerHTML = _formatCoachText(text);
        } catch { panel.innerHTML = '<div class="coach-error">分析失败</div>'; }
    }

    _bindCoachLLMToggle() {
        const sw = this._container.querySelector('#coach-llm-switch');
        if (!sw) return;
        const cfg = getCoachConfig();
        if (!cfg.apiKey) {
            sw.disabled = true;
            sw.checked = false;
            sw.parentElement.title = '请先在游戏设置中配置大模型API';
        }
        sw.addEventListener('change', () => {
            const config = getCoachConfig();
            config.enableBP = sw.checked;
            saveCoachConfig(config);
            const panel = this._container.querySelector('#coach-content');
            if (panel) panel.innerHTML = `<div class="coach-loading">${sw.checked ? '大模型已启用，分析中...' : '已切换为规则引擎模式'}</div>`;
        });
    }

    _bindPlayerClickEvents(main) {
        const board = main.querySelector('.bp2');
        if (!board || board._playerClickBound) return;
        board._playerClickBound = true;

        board.addEventListener('click', (e) => {
            const el = e.target.closest('.bp2-player--clickable');
            if (!el) return;

            board.querySelectorAll('.bp2-player--active').forEach(p => p.classList.remove('bp2-player--active'));
            el.classList.add('bp2-player--active');

            const playerId = el.dataset.playerId;
            const playerRole = el.dataset.playerRole;
            const playerSide = el.dataset.side;
            const playerIdx = parseInt(el.dataset.idx);
            this._activePlayerId = playerId;
            this._activePlayerSide = playerSide;
            if (!isNaN(playerIdx) && playerSide === 'blue') {
                this._activePlayerIdx = playerIdx;
            }

            const laneName = playerRole || '对抗路';
            const selectArea = board.querySelector('#bp-select-area');
            if (!selectArea) return;

            // 同步角色位置 tabs（选人阶段）
            if (playerSide === 'blue' && !isNaN(playerIdx)) {
                selectArea.querySelectorAll('.bp-role-tab').forEach(t => {
                    t.classList.toggle('bp-role-tab--active', t.dataset.slotIdx === String(playerIdx));
                });
                // 清除待定选择
                this._pendingHero = null;
                const bar = selectArea.querySelector('.bp-confirm-bar');
                if (bar) {
                    bar.classList.remove('bp-confirm-bar--visible');
                    const btn = bar.querySelector('.bp-confirm-bar__btn');
                    if (btn) btn.disabled = true;
                }
            }

            // 切换英雄分路 tab 到该选手的位置
            selectArea.querySelectorAll('.bp-type-tab').forEach(t => t.classList.remove('bp-type-tab--active'));
            selectArea.querySelectorAll('.bp-type-panel').forEach(p => p.classList.remove('bp-type-panel--active'));
            const targetTab = selectArea.querySelector(`.bp-type-tab[data-type="${laneName}"]`);
            const targetPanel = selectArea.querySelector(`.bp-type-panel[data-panel="${laneName}"]`);
            if (targetTab) targetTab.classList.add('bp-type-tab--active');
            if (targetPanel) targetPanel.classList.add('bp-type-panel--active');

            const pool = getPlayerHeroes(playerId, playerRole);
            const poolSet = new Set(pool);
            selectArea.querySelectorAll('.bp-hero-btn').forEach(btn => {
                btn.classList.remove('bp-hero-btn--sig');
                if (poolSet.has(btn.dataset.hero)) {
                    btn.classList.add('bp-hero-btn--sig');
                }
            });

            sfxSelect();
        });
    }

    _updateBPStatus(main, text) {
        const el = main.querySelector('#bp-status');
        if (!el) return;
        el.textContent = text;
        const isThinking = text.includes('正在思考') || text.includes('正在选人');
        el.classList.toggle('bp2__step--thinking', isThinking);
    }

    _heroCard(heroName, size = 40, showName = true) {
        const hero = getHero(heroName);
        if (!hero) return `<span class="bp-hero-mini">${heroName}</span>`;
        return `<span class="bp-hero-card" style="--hero-size:${size}px">
            ${heroImgHTML(hero.id, heroName, size)}
            ${showName ? `<span class="bp-hero-card__name">${heroName}</span>` : ''}
        </span>`;
    }

    _buildHeroTabsAndGrid(candidates, recMap, enemyPicks, defaultLane = '对抗路') {
        const LANE_INFO = {
            '对抗路': { icon: '⚔️', color: '#e76f51' },
            '打野':   { icon: '🗡️', color: '#9b2335' },
            '中路':   { icon: '🔮', color: '#7209b7' },
            '发育路': { icon: '🏹', color: '#f4a261' },
            '游走':   { icon: '💚', color: '#2ecc71' },
        };
        const laneOrder = ['对抗路', '打野', '中路', '发育路', '游走'];
        const candidateSet = new Set(candidates);
        const grouped = {};
        for (const lane of laneOrder) {
            const pool = (getHeroesForPosition(lane) || []).filter(h => candidateSet.has(h));
            grouped[lane] = [...new Set(pool)];
        }

        Object.values(grouped).forEach(arr => arr.sort((a, b) => {
            const ma = isMetaHero(a) ? 0 : 1, mb = isMetaHero(b) ? 0 : 1;
            return ma !== mb ? ma - mb : a.localeCompare(b);
        }));

        const tabs = laneOrder.map(lane => {
            const info = LANE_INFO[lane]; const count = grouped[lane].length;
            return `<button class="bp-type-tab ${lane === defaultLane ? 'bp-type-tab--active' : ''}" data-type="${lane}" style="--tab-color:${info.color}">${info.icon} ${lane}<span class="bp-type-tab__count">${count}</span></button>`;
        }).join('');
        const panels = laneOrder.map(lane => {
            const heroes = grouped[lane];
            return `<div class="bp-type-panel ${lane === defaultLane ? 'bp-type-panel--active' : ''}" data-panel="${lane}">
                ${heroes.length ? heroes.map(name => {
                    const hero = getHero(name);
                    const rec = recMap.get(name);
                    const ci = getCounterInfo(name);
                    const countersEnemy = enemyPicks.filter(ep => ci.counters.includes(ep));
                    const synWithPicked = (ci.bestWith || []).filter(bw => this._currentMyPicks?.includes(bw));
                    const recClass = rec ? (rec.type === 'ban' ? 'bp-hero-btn--rec-ban' : 'bp-hero-btn--rec-pick') : '';
                    const meta = isMetaHero(name);
                    return `<button class="bp-hero-btn ${recClass}" data-hero="${name}">
                        <span class="bp-hero-btn__avatar">${hero ? heroImgHTML(hero.id, name, 56) : ''}</span>
                        ${meta ? '<span class="bp-hero-btn__badge bp-hero-btn__badge--hot">强势</span>' : ''}
                        <span class="bp-hero-btn__name">${name}</span>
                        ${rec ? `<span class="bp-hero-btn__rec bp-hero-btn__rec--${rec.type}" title="${rec.reason}">${rec.type === 'ban' ? '禁' : '选'}</span>` : ''}
                        ${countersEnemy.length ? `<span class="bp-hero-btn__counter">克${countersEnemy[0]}</span>` : ''}
                        ${synWithPicked.length ? `<span class="bp-hero-btn__syn">配${synWithPicked[0]}</span>` : ''}
                    </button>`;
                }).join('') : '<div class="bp-type-empty">暂无</div>'}
            </div>`;
        }).join('');
        return `<div class="bp-type-tabs">${tabs}</div><div class="bp-type-panels">${panels}</div>`;
    }

    _bindHeroTabEvents(container, onHeroClick, confirmMode = null) {
        container.querySelectorAll('.bp-type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.bp-type-tab').forEach(t => t.classList.remove('bp-type-tab--active'));
                container.querySelectorAll('.bp-type-panel').forEach(p => p.classList.remove('bp-type-panel--active'));
                tab.classList.add('bp-type-tab--active');
                container.querySelector(`[data-panel="${tab.dataset.type}"]`)?.classList.add('bp-type-panel--active');
            });
        });
        if (!confirmMode) {
            container.querySelectorAll('.bp-hero-btn').forEach(btn => { btn.addEventListener('click', () => onHeroClick(btn.dataset.hero)); });
            return;
        }
        const confirmBar = container.closest('#bp-select-area')?.querySelector('.bp-confirm-bar')
            || container.parentElement?.querySelector('.bp-confirm-bar');
        container.querySelectorAll('.bp-hero-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.bp-hero-btn--selected').forEach(b => b.classList.remove('bp-hero-btn--selected'));
                btn.classList.add('bp-hero-btn--selected');
                this._pendingHero = btn.dataset.hero;
                if (confirmBar) {
                    const detailHTML = this._buildHeroConfirmDetail(btn.dataset.hero, confirmMode);
                    confirmBar.querySelector('.bp-confirm-bar__detail').innerHTML = detailHTML;
                    confirmBar.querySelector('.bp-confirm-bar__btn').disabled = false;
                    confirmBar.classList.add('bp-confirm-bar--visible');
                }
            });
        });
    }

    _buildHeroConfirmDetail(heroName, phase) {
        const hero = getHero(heroName);
        const meta = getHeroMeta(heroName);
        const ci = getCounterInfo(heroName);
        const myPicks = this._currentMyPicks || [];
        const enemyPicks = this._currentEnemyPicks || [];
        const isBan = phase === 'ban';

        const avatarHTML = hero ? heroImgHTML(hero.id, heroName, 52) : '';
        const roleInfo = hero ? HERO_ROLES[hero.role] : null;

        const tierLabel = { T0: '版本之子', T1: '强势', T2: '常规', T3: '冷门' }[meta.tier] || '';
        const tierColor = { T0: '#ff4757', T1: '#ffa502', T2: '#7bed9f', T3: '#a4b0be' }[meta.tier] || '#a4b0be';

        let playerStatsHTML = '';
        const activeId = this._activePlayerId;
        if (activeId) {
            const hs = getPlayerHeroStats(activeId, heroName);
            const ps = getPlayerStats(activeId);
            const pTier = getPlayerTier(activeId);
            const pTierLabel = PLAYER_TIERS[pTier] || '';
            const pTierColor = PTIER_COLORS[pTier] || '#a4b0be';
            if (hs) {
                const wr = hs.games > 0 ? Math.round(hs.wins / hs.games * 100) : 0;
                playerStatsHTML = `<div class="confirm-detail__player-stats">
                    <div class="confirm-detail__player-header">
                        <span class="confirm-detail__player-name">${activeId}</span>
                        <span class="confirm-detail__player-tier" style="color:${pTierColor}">${pTierLabel}</span>
                    </div>
                    <div class="confirm-detail__player-hero-data">
                        <span class="confirm-detail__pstat">使用${heroName} <b>${hs.games}</b>场</span>
                        <span class="confirm-detail__pstat">胜率 <b style="color:${wr >= 55 ? '#2ecc71' : wr >= 45 ? '#f1c40f' : '#e74c3c'}">${wr}%</b></span>
                        <span class="confirm-detail__pstat">KDA <b>${hs.kda}</b></span>
                    </div>
                </div>`;
            } else {
                playerStatsHTML = `<div class="confirm-detail__player-stats">
                    <div class="confirm-detail__player-header">
                        <span class="confirm-detail__player-name">${activeId}</span>
                        <span class="confirm-detail__player-tier" style="color:${pTierColor}">${pTierLabel}</span>
                    </div>
                    <div class="confirm-detail__player-hero-data confirm-detail__player-hero-data--empty">
                        尚未在KPL使用过此英雄
                    </div>
                </div>`;
            }
            if (ps) {
                playerStatsHTML += `<div class="confirm-detail__player-season">
                    赛季总: ${ps.seasonGames}场 ${ps.seasonWinRate}%胜率 KDA ${ps.kda} MVP×${ps.mvpCount}
                </div>`;
            }
        }

        let counterHTML = '';
        if (isBan) {
            const threatToUs = (ci.counters || []).filter(h => myPicks.includes(h));
            if (threatToUs.length) {
                counterHTML = `<div class="confirm-detail__row confirm-detail__row--warn">
                    <span class="confirm-detail__label">⚠️ 威胁己方</span>
                    <span>${threatToUs.map(h => `<span class="confirm-tag confirm-tag--danger">${h}</span>`).join('')}</span>
                </div>`;
            }
            const countersOurPool = (ci.counters || []).slice(0, 3);
            if (countersOurPool.length && !threatToUs.length) {
                counterHTML = `<div class="confirm-detail__row">
                    <span class="confirm-detail__label">克制英雄</span>
                    <span>${countersOurPool.map(h => `<span class="confirm-tag confirm-tag--counter">${h}</span>`).join('')}</span>
                </div>`;
            }
        } else {
            const countersEnemy = (ci.counters || []).filter(h => enemyPicks.includes(h));
            if (countersEnemy.length) {
                counterHTML = `<div class="confirm-detail__row confirm-detail__row--good">
                    <span class="confirm-detail__label">✅ 克制对面</span>
                    <span>${countersEnemy.map(h => `<span class="confirm-tag confirm-tag--counter">${h}</span>`).join('')}</span>
                </div>`;
            }
            const synergy = (ci.bestWith || []).filter(h => myPicks.includes(h));
            if (synergy.length) {
                counterHTML += `<div class="confirm-detail__row confirm-detail__row--good">
                    <span class="confirm-detail__label">🤝 搭配</span>
                    <span>${synergy.map(h => `<span class="confirm-tag confirm-tag--syn">${h}</span>`).join('')}</span>
                </div>`;
            }
            const beCountered = (ci.counteredBy || []).filter(h => enemyPicks.includes(h));
            if (beCountered.length) {
                counterHTML += `<div class="confirm-detail__row confirm-detail__row--warn">
                    <span class="confirm-detail__label">⚠️ 被克制</span>
                    <span>${beCountered.map(h => `<span class="confirm-tag confirm-tag--danger">${h}</span>`).join('')}</span>
                </div>`;
            }
        }

        return `<div class="confirm-detail">
            <div class="confirm-detail__hero">
                <div class="confirm-detail__avatar">${avatarHTML}</div>
                <div class="confirm-detail__info">
                    <div class="confirm-detail__name">${heroName}</div>
                    <div class="confirm-detail__role">${roleInfo ? `${roleInfo.icon} ${roleInfo.name}` : ''} · ${meta.hotLanes.join('/')}</div>
                    <div class="confirm-detail__meta">
                        <span class="confirm-detail__tier" style="color:${tierColor}">● ${tierLabel}</span>
                        <span class="confirm-detail__stat">胜率 ${meta.winRate}%</span>
                        <span class="confirm-detail__stat">出场 ${meta.pickRate}%</span>
                        <span class="confirm-detail__stat">禁用 ${meta.banRate}%</span>
                    </div>
                </div>
            </div>
            ${playerStatsHTML}
            ${counterHTML}
        </div>`;
    }

    async _bpSelectHero(main, bpCtx, phase, bannedList, pickedList, picks, banned) {
        const selectArea = main.querySelector('#bp-select-area');
        if (!selectArea) return '赵云';
        const unavailable = new Set([...bannedList, ...pickedList]);
        const allHeroNames = Object.keys(HEROES).filter(h => !unavailable.has(h));
        if (!allHeroNames.length) return '赵云';

        const recs = getStructuredRecommendations({
            phase: 'ban', myBans: banned?.my || [], enemyBans: banned?.enemy || [],
            myPicks: picks.my, enemyPicks: picks.enemy, myPickRoles: [],
            enemyStarters: this._enemyStarters,
        });
        const recMap = new Map(recs.map(r => [r.hero, r]));

        const confirmHTML = `<div class="bp-confirm-bar">
            <div class="bp-confirm-bar__detail"></div>
            <button class="btn bp-confirm-bar__btn bp-confirm-bar__btn--ban" disabled>确认禁用</button>
        </div>`;
        selectArea.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, recMap, picks.enemy) + confirmHTML;
        this._pendingHero = null;
        return new Promise(res => {
            this._bindHeroTabEvents(selectArea.querySelector('.bp-type-panels')?.parentElement || selectArea, null, 'ban');
            selectArea.querySelector('.bp-confirm-bar__btn').addEventListener('click', () => {
                if (this._pendingHero) res(this._pendingHero);
            });
        });
    }

    async _bpPickWithRole(main, bpCtx, bannedList, pickedList, picks, myPickRoles, roles, banned) {
        const selectArea = main.querySelector('#bp-select-area');
        if (!selectArea) return { hero: '赵云', role: '打野', slotIdx: 0 };
        const unavailable = new Set([...bannedList, ...pickedList]);
        const allHeroNames = Object.keys(HEROES).filter(h => !unavailable.has(h));

        const emptySlots = [];
        for (let i = 0; i < 5; i++) {
            if (picks.my[i] === null) {
                const p = this._myStarters[i];
                emptySlots.push({ idx: i, role: p?.role || roles[0], name: p?.id || p?.nickname || '' });
            }
        }
        if (!emptySlots.length) return { hero: '赵云', role: '打野', slotIdx: 0 };

        let initialSlot;
        if (this._activePlayerIdx != null && picks.my[this._activePlayerIdx] === null) {
            initialSlot = emptySlots.find(s => s.idx === this._activePlayerIdx) || emptySlots[0];
        } else {
            initialSlot = emptySlots[0];
        }
        this._activePlayerIdx = initialSlot.idx;
        let currentRole = initialSlot.role;

        // 高亮初始目标选手
        const board = main.querySelector('.bp2');
        if (board) {
            board.querySelectorAll('.bp2-player--active').forEach(p => p.classList.remove('bp2-player--active'));
            const target = board.querySelector(`.bp2-player[data-side="blue"][data-idx="${initialSlot.idx}"]`);
            if (target) target.classList.add('bp2-player--active');
        }

        const _buildRecMap = () => {
            const recs = getStructuredRecommendations({
                phase: 'pick', myBans: banned?.my || [], enemyBans: banned?.enemy || [],
                myPicks: picks.my.filter(Boolean), enemyPicks: picks.enemy,
                myPickRoles: myPickRoles.filter(Boolean),
                enemyStarters: this._enemyStarters,
            });
            return new Map(recs.map(r => [r.hero, r]));
        };

        const roleTabsHTML = `<div class="bp-role-tabs"><span class="bp-role-tab-hint">为哪个位置选人？</span>
            ${emptySlots.map(s => `<button class="bp-role-tab ${s.idx === initialSlot.idx ? 'bp-role-tab--active' : ''}" data-role="${s.role}" data-slot-idx="${s.idx}">${s.role}</button>`).join('')}</div>`;
        const confirmHTML = `<div class="bp-confirm-bar">
            <div class="bp-confirm-bar__detail"></div>
            <button class="btn bp-confirm-bar__btn bp-confirm-bar__btn--pick" disabled>确认选用</button>
        </div>`;
        selectArea.innerHTML = `${roleTabsHTML}<div id="bp-grid-container">${this._buildHeroTabsAndGrid(allHeroNames, _buildRecMap(), picks.enemy, currentRole)}</div>${confirmHTML}`;
        this._pendingHero = null;

        let resolveHero;
        const heroPromise = new Promise(res => { resolveHero = res; });
        const gridContainer = selectArea.querySelector('#bp-grid-container');
        this._bindHeroTabEvents(gridContainer, null, 'pick');

        selectArea.querySelector('.bp-confirm-bar__btn').addEventListener('click', () => {
            if (!this._pendingHero) return;
            const slotIdx = this._activePlayerIdx;
            const role = this._myStarters[slotIdx]?.role || currentRole;
            resolveHero({ hero: this._pendingHero, role, slotIdx });
        });

        selectArea.querySelectorAll('.bp-role-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                selectArea.querySelectorAll('.bp-role-tab').forEach(t => t.classList.remove('bp-role-tab--active'));
                tab.classList.add('bp-role-tab--active');
                const slotIdx = parseInt(tab.dataset.slotIdx);
                if (!isNaN(slotIdx)) {
                    this._activePlayerIdx = slotIdx;
                    currentRole = tab.dataset.role;
                }
                gridContainer.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, _buildRecMap(), picks.enemy, currentRole);
                this._bindHeroTabEvents(gridContainer, null, 'pick');
                this._pendingHero = null;
                const bar = selectArea.querySelector('.bp-confirm-bar');
                if (bar) { bar.classList.remove('bp-confirm-bar--visible'); bar.querySelector('.bp-confirm-bar__btn').disabled = true; }
                if (board) {
                    board.querySelectorAll('.bp2-player--active').forEach(p => p.classList.remove('bp2-player--active'));
                    const t = board.querySelector(`.bp2-player[data-side="blue"][data-idx="${slotIdx}"]`);
                    if (t) t.classList.add('bp2-player--active');
                }
            });
        });

        const result = await heroPromise;
        return result;
    }

    _renderBPResult(bpResult, picks, banned, myPickRoles, enemyPickRoles) {
        const wr = estimateWinRate(picks.my, picks.enemy, myPickRoles, enemyPickRoles);
        const wrColor = wr.my > 55 ? 'var(--color-success)' : wr.my < 45 ? 'var(--color-danger)' : '#ffc107';
        const wrStatus = wr.my > 60 ? '🔥 大优势' : wr.my > 55 ? '✅ 小优势' : wr.my >= 45 ? '⚖️ 均势' : wr.my >= 40 ? '⚠️ 小劣势' : '🚨 大劣势';
        return `<div class="round-panel bp-result">
            <h3 class="round-title">BP阶段完成</h3>
            <div class="bp-result__winrate">
                <div class="bp-result__winrate-bar"><div class="bp-result__winrate-fill" style="width:${wr.my}%;background:${wrColor}"></div></div>
                <div class="bp-result__winrate-labels">
                    <span style="color:${wrColor};font-weight:700;font-size:18px">${this._myTeam.shortName} ${wr.my}%</span>
                    <span class="bp-result__winrate-status">${wrStatus}</span>
                    <span style="color:var(--color-danger);font-weight:700;font-size:18px">${wr.enemy}% ${this._enemyTeam.shortName}</span>
                </div>
            </div>
            <div class="bp-result__lineup">
                <div class="bp-result__side bp-result__side--my"><h4>${this._myTeam.shortName}</h4>
                    <div class="bp-result__heroes">${picks.my.map((h, i) => `<div class="bp-result__hero">${this._heroCard(h, 44)}<span class="bp-result__role">${myPickRoles[i] || ''}</span></div>`).join('')}</div>
                    <div class="bp-result__eval">配合度 ${bpResult.myComp.synergy} | ${bpResult.myComp.desc}</div></div>
                <div class="bp-result__vs">VS</div>
                <div class="bp-result__side bp-result__side--enemy"><h4>${this._enemyTeam.shortName}</h4>
                    <div class="bp-result__heroes">${picks.enemy.map((h, i) => `<div class="bp-result__hero">${this._heroCard(h, 44)}<span class="bp-result__role">${enemyPickRoles[i] || ''}</span></div>`).join('')}</div>
                    <div class="bp-result__eval">配合度 ${bpResult.enemyComp.synergy} | ${bpResult.enemyComp.desc}</div></div>
            </div>
            <div class="bp-result__banned">禁用: ${[...banned.my, ...banned.enemy].map(h => `<span class="bp-ban-tag">🚫${h}</span>`).join(' ')}</div>
            <button class="btn btn--gold btn--large" id="btn-start-match">开始比赛 ⚔️</button>
        </div>`;
    }
}
