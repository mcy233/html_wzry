/**
 * BattleScene - 比赛场景 v2
 * 流程：BP → 对线期 → 野区博弈 → 中期团战 → 宏观策略 → 终局决战
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId, TEAMS } from '../data/teams.js';
import { BattleSystem, TF_STRATEGIES, MACRO_STRATEGIES } from '../systems/BattleSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { HEROES, HERO_ROLES, getHero, getPlayerHeroes, getCounterInfo, getHeroesForPosition, heroImgHTML, evaluateComp } from '../data/heroes.js';
import { createElement, typeWriter } from '../ui/Components.js';
import { shakeElement, pulseElement } from '../ui/Transitions.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';
import { ECONOMY, PLAYER, MORALE } from '../data/balance.js';
import { sfxBan, sfxPick, sfxBattleStart, sfxQTEPerfect, sfxCounterWin, sfxCounterLose, sfxVictory, sfxDefeat, sfxCheer, sfxConfirm, sfxSelect, startBGM, stopBGM } from '../ui/SoundManager.js';
import { getCoachAnalysis, getCoachConfig, saveCoachConfig, estimateWinRate } from '../systems/AICoach.js';

function _formatCoachText(text) {
    return text.split('\n').filter(l => l.trim()).map(line => {
        let cls = 'coach-line';
        const trimmed = line.trim();
        if (trimmed.startsWith('📋') || trimmed.startsWith('🎯') || trimmed.startsWith('📌')) cls += ' coach-line--heading';
        else if (trimmed.startsWith('⚠️') || trimmed.includes('注意')) cls += ' coach-line--warn';
        else if (trimmed.startsWith('💡') || trimmed.startsWith('🌟') || trimmed.startsWith('⚔️')) cls += ' coach-line--suggest';
        else if (trimmed.startsWith('📊')) cls += ' coach-line--winrate';
        else if (trimmed.startsWith('🔴')) cls += ' coach-line--warn';
        else if (trimmed.startsWith('✅')) cls += ' coach-line--ok';
        else if (trimmed.startsWith('🔄')) cls += ' coach-line--info';
        if (trimmed.startsWith('备选') || trimmed.startsWith('   ')) cls += ' coach-line--indent';
        const formatted = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return `<div class="${cls}">${formatted}</div>`;
    }).join('');
}

export class BattleScene {
    async enter(container, params = {}) {
        this._container = container;
        const teamId = params.teamId || game.getState('teamId');
        this._myTeam = getTeamById(teamId);

        this._season = this._loadSeason(teamId);
        this._currentMatch = this._season.getPlayerMatch();
        if (this._currentMatch) {
            const opponentId = this._currentMatch.homeTeam === teamId ? this._currentMatch.awayTeam : this._currentMatch.homeTeam;
            this._enemyTeam = getTeamById(opponentId);
        } else {
            const opponents = TEAMS.filter(t => t.id !== teamId);
            this._enemyTeam = opponents[Math.floor(Math.random() * opponents.length)];
        }

        this._myStarters = this._getMyStarters(teamId);
        this._enemyStarters = getStartersByTeamId(this._enemyTeam.id);
        const conditions = {};
        (game.state.players || []).forEach(p => { conditions[p.id] = p.condition || 80; });
        this._battleSystem = new BattleSystem(
            this._myTeam, this._enemyTeam, this._myStarters, this._enemyStarters,
            { morale: game.state.team?.morale || 70, playerConditions: conditions }
        );
        container.className = 'scene scene--battle';
        this._renderBattleUI();
        await this._startBP();
    }

    _loadSeason(teamId) {
        if (game.state.seasonSystem) return SeasonSystem.fromSaveData(game.state.seasonSystem);
        const sys = new SeasonSystem(teamId); sys.initGroups(); return sys;
    }

    exit() { this._container = null; }

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

    _renderBattleUI() {
        this._container.innerHTML = `
            <div class="battle">
                <div class="battle__header">
                    <div class="battle__team battle__team--my">
                        <span class="battle__team-logo">${teamLogoHTML(this._myTeam.id, this._myTeam, 36)}</span>
                        <span class="battle__team-name">${this._myTeam.name}</span>
                    </div>
                    <div class="battle__center-info">
                        <div class="battle__round" id="round-label">BP阶段</div>
                        <div class="battle__timer" id="battle-timer">--:--</div>
                    </div>
                    <div class="battle__team battle__team--enemy">
                        <span class="battle__team-name">${this._enemyTeam.name}</span>
                        <span class="battle__team-logo">${teamLogoHTML(this._enemyTeam.id, this._enemyTeam, 36)}</span>
                    </div>
                </div>
                <div class="battle__momentum" id="momentum-bar">
                    <div class="momentum" id="momentum">
                        <div class="momentum__fill momentum__fill--my" id="momentum-my" style="width:50%"></div>
                        <div class="momentum__indicator" id="momentum-indicator" style="left:50%">
                            <span class="momentum__value" id="momentum-value">50</span>
                        </div>
                    </div>
                    <div class="momentum__labels">
                        <span>${this._myTeam.shortName} 优势</span><span>均势</span><span>${this._enemyTeam.shortName} 优势</span>
                    </div>
                </div>
                <div class="battle__scoreboard">
                    <div class="scoreboard__item"><span id="kills-my">0</span> 击杀 <span id="kills-enemy">0</span></div>
                    <div class="scoreboard__item"><span id="towers-my">0</span> 推塔 <span id="towers-enemy">0</span></div>
                    <div class="scoreboard__item"><span id="gold-my">0</span> 经济 <span id="gold-enemy">0</span></div>
                </div>
                <div class="battle__main" id="battle-main"></div>
                <div class="battle__commentary" id="commentary">
                    <div class="commentary__icon">🎙️</div>
                    <div class="commentary__text" id="commentary-text">BP阶段开始...</div>
                </div>
                <div class="battle__danmaku" id="danmaku-layer"></div>
            </div>`;
    }

    /* ---------- 通用辅助 ---------- */
    _updateMomentum(value) {
        const myFill = this._container.querySelector('#momentum-my');
        const indicator = this._container.querySelector('#momentum-indicator');
        const valueEl = this._container.querySelector('#momentum-value');
        if (!myFill) return;
        myFill.style.transition = 'width 0.8s cubic-bezier(0.16,1,0.3,1)';
        indicator.style.transition = 'left 0.8s cubic-bezier(0.16,1,0.3,1)';
        myFill.style.width = value + '%';
        indicator.style.left = value + '%';
        valueEl.textContent = Math.round(value);
        if (Math.abs(value - 50) > 25) shakeElement(this._container.querySelector('#momentum-bar'), 3, 300);
    }
    _updateScoreboard() {
        const bs = this._battleSystem;
        this._container.querySelector('#kills-my').textContent = bs.kills.my;
        this._container.querySelector('#kills-enemy').textContent = bs.kills.enemy;
        this._container.querySelector('#towers-my').textContent = bs.towers.my;
        this._container.querySelector('#towers-enemy').textContent = bs.towers.enemy;
        this._container.querySelector('#gold-my').textContent = bs.gold.my;
        this._container.querySelector('#gold-enemy').textContent = bs.gold.enemy;
    }
    async _comment(text) { const el = this._container.querySelector('#commentary-text'); if (el) await typeWriter(el, text, 25); }
    _fireDanmaku(text) {
        const layer = this._container.querySelector('#danmaku-layer'); if (!layer) return;
        const d = createElement('div', 'danmaku-item', text);
        d.style.top = (10 + Math.random() * 30) + '%';
        d.style.animationDuration = (4 + Math.random() * 3) + 's';
        layer.appendChild(d); setTimeout(() => d.remove(), 8000);
    }
    _setRoundLabel(text) { const el = this._container.querySelector('#round-label'); if (el) el.textContent = text; }
    _updateTimer(m) { const el = this._container.querySelector('#battle-timer'); if (el) el.textContent = `${String(m).padStart(2,'0')}:00`; }
    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    get _main() { return this._container.querySelector('#battle-main'); }

    /* ====================== BP 阶段（KPL标准交替Ban/Pick） ====================== */
    async _startBP() {
        this._setRoundLabel('BP阶段');
        await this._comment('Ban/Pick阶段开始！');
        this._fireDanmaku('BP环节来了！');

        const bpCtx = this._battleSystem.generateBPContext();
        const main = this._main;
        const banned = { my: [], enemy: [] };
        const picks = { my: [], enemy: [] };
        const myPickRoles = [];
        const enemyPickRoles = [];
        const roles = ['对抗路', '打野', '中路', '发育路', '游走'];
        const allBanned = () => [...banned.my, ...banned.enemy];
        const allPicked = () => [...picks.my, ...picks.enemy];

        const myBan = async (label) => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'ban');
            this._updateBPStatus(main, label);
            const h = await this._bpSelectHero(main, bpCtx, 'ban', allBanned(), allPicked(), picks);
            banned.my.push(h); sfxBan();
        };
        const enemyBan = () => {
            const pool = this._getEnemyBanCandidates(bpCtx, allBanned());
            if (pool.length) { banned.enemy.push(pool[0]); sfxBan(); }
        };
        const myPick = async (label) => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'pick');
            this._updateBPStatus(main, label);
            const r = await this._bpPickWithRole(main, bpCtx, allBanned(), allPicked(), picks, myPickRoles, roles);
            picks.my.push(r.hero); myPickRoles.push(r.role); sfxPick();
        };
        const enemyPick = () => {
            const r = this._autoEnemyPick(bpCtx, allBanned(), allPicked(), enemyPickRoles, roles);
            picks.enemy.push(r.hero); enemyPickRoles.push(r.role);
        };
        const refresh = (phase) => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, phase);
        };

        /* ── (1) 蓝Ban1 → 红Ban1 → 蓝Ban1 → 红Ban1 ── */
        await myBan('蓝方Ban — 第1个');     refresh('ban'); await this._sleep(200);
        enemyBan();                          refresh('ban'); await this._sleep(300);
        await myBan('蓝方Ban — 第2个');     refresh('ban'); await this._sleep(200);
        enemyBan();                          refresh('ban'); await this._sleep(300);
        await this._comment(`第一轮Ban完成 — 蓝禁:${banned.my.join('/')} 红禁:${banned.enemy.join('/')}`);

        /* ── (2) 蓝Pick1 → 红Pick2 → 蓝Pick2 → 红Pick1 ── */
        await myPick(`${this._myTeam.shortName} 选择第1位`);                          refresh('pick'); await this._sleep(300);
        enemyPick(); enemyPick();                                                       refresh('pick'); await this._sleep(400);
        await myPick(`${this._myTeam.shortName} 选择第2位`); refresh('pick'); await this._sleep(200);
        await myPick(`${this._myTeam.shortName} 选择第3位`); refresh('pick'); await this._sleep(300);
        enemyPick();                                                                    refresh('pick'); await this._sleep(300);
        await this._comment(`第一轮Pick完成 — 双方各选3位英雄`);

        /* ── (3) 红Ban1 → 蓝Ban1 → 红Ban1 → 蓝Ban1 ── */
        enemyBan();                          refresh('ban'); await this._sleep(300);
        await myBan('蓝方追加Ban — 第3个'); refresh('ban'); await this._sleep(200);
        enemyBan();                          refresh('ban'); await this._sleep(300);
        await myBan('蓝方追加Ban — 第4个'); refresh('ban'); await this._sleep(200);
        enemyBan();                          refresh('ban'); await this._sleep(200);
        await this._comment(`第二轮Ban完成 — 共禁用${allBanned().length}位英雄`);

        /* ── (4) 红Pick1 → 蓝Pick2 → 红Pick1 ── */
        enemyPick();                                                                    refresh('pick'); await this._sleep(300);
        await myPick(`${this._myTeam.shortName} 选择第4位`); refresh('pick'); await this._sleep(200);
        await myPick(`${this._myTeam.shortName} 选择第5位`); refresh('pick'); await this._sleep(300);
        enemyPick();                                                                    refresh('pick'); await this._sleep(300);

        const bpResult = this._battleSystem.resolveBP(banned.my, picks.my, banned.enemy, picks.enemy);
        this._updateMomentum(this._battleSystem.momentum);

        main.innerHTML = this._renderBPResult(bpResult, picks, banned, myPickRoles, enemyPickRoles);
        await new Promise(res => main.querySelector('#btn-start-match').addEventListener('click', () => { sfxBattleStart(); startBGM('battle'); res(); }));
        this._startRound1();
    }

    _getEnemyBanCandidates(bpCtx, bannedList) {
        return bpCtx.my.flatMap(c => c.heroes.map(h => h.name)).filter(h => !bannedList.includes(h));
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

    _renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, phase) {
        const isBan = phase === 'ban';
        const wr = estimateWinRate(picks.my, picks.enemy, myPickRoles, enemyPickRoles);

        const banSlots = (list) => {
            let html = '';
            for (let i = 0; i < 5; i++) {
                html += list[i]
                    ? `<span class="bp-ban-slot bp-ban-slot--filled">${this._heroCard(list[i], 28, false)}</span>`
                    : `<span class="bp-ban-slot"></span>`;
            }
            return html;
        };

        const pickSlots = (pickList, roleList) => {
            let html = '';
            for (let i = 0; i < 5; i++) {
                const h = pickList[i];
                const r = roleList[i];
                html += `<div class="bp-pick-slot ${h ? 'bp-pick-slot--filled' : ''}">${h ? this._heroCard(h, 42) : `<span class="bp-pick-placeholder">${r || '?'}</span>`}${r ? `<span class="bp-pick-role-tag">${r}</span>` : ''}</div>`;
            }
            return html;
        };

        const wrColor = wr.my > 55 ? 'var(--color-success)' : wr.my < 45 ? 'var(--color-danger)' : 'var(--color-text-dim)';
        const wrEnemyColor = wr.enemy > 55 ? 'var(--color-danger)' : wr.enemy < 45 ? 'var(--color-success)' : 'var(--color-text-dim)';
        const hasPicks = picks.my.length > 0 || picks.enemy.length > 0;

        main.innerHTML = `<div class="bp-board">
            <div class="bp-board__header">
                <div class="bp-board__team bp-board__team--blue">
                    <div class="bp-board__team-name">${teamLogoHTML(this._myTeam.id, this._myTeam, 24)} ${this._myTeam.shortName}</div>
                    <div class="bp-board__bans">${banSlots(banned.my)}</div>
                    <div class="bp-board__picks">${pickSlots(picks.my, myPickRoles)}</div>
                </div>
                <div class="bp-board__center">
                    <div class="bp-board__phase" id="bp-phase-label">${isBan ? '禁用阶段' : '选人阶段'}</div>
                    <div class="bp-board__step" id="bp-status"></div>
                    ${hasPicks ? `<div class="bp-winrate" id="bp-winrate">
                        <div class="bp-winrate__bar">
                            <div class="bp-winrate__fill bp-winrate__fill--my" style="width:${wr.my}%"></div>
                        </div>
                        <div class="bp-winrate__labels">
                            <span class="bp-winrate__label" style="color:${wrColor}">${this._myTeam.shortName} ${wr.my}%</span>
                            <span class="bp-winrate__vs">预估胜率</span>
                            <span class="bp-winrate__label" style="color:${wrEnemyColor}">${wr.enemy}% ${this._enemyTeam.shortName}</span>
                        </div>
                    </div>` : ''}
                </div>
                <div class="bp-board__team bp-board__team--red">
                    <div class="bp-board__team-name">${this._enemyTeam.shortName} ${teamLogoHTML(this._enemyTeam.id, this._enemyTeam, 24)}</div>
                    <div class="bp-board__bans">${banSlots(banned.enemy)}</div>
                    <div class="bp-board__picks">${pickSlots(picks.enemy, enemyPickRoles)}</div>
                </div>
            </div>
            <div class="bp-board__body">
                <div class="bp-board__select" id="bp-select-area"></div>
                <div class="bp-board__coach" id="bp-coach-panel">
                    <div class="coach-header">
                        <span class="coach-icon">🎙️</span>
                        <span class="coach-title">AI 教练</span>
                        <button class="coach-config-btn" id="coach-config-btn" title="配置AI模型">⚙️</button>
                    </div>
                    <div class="coach-content" id="coach-content">
                        <div class="coach-loading">分析中...</div>
                    </div>
                </div>
            </div>
        </div>`;

        this._updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, phase);
        this._bindCoachConfig();
    }

    async _updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, phase) {
        const panel = this._container.querySelector('#coach-content');
        if (!panel) return;
        panel.innerHTML = '<div class="coach-loading"><span class="coach-typing"></span> 分析中...</div>';

        const ctx = {
            phase,
            myBans: banned.my,
            enemyBans: banned.enemy,
            myPicks: picks.my,
            enemyPicks: picks.enemy,
            myPickRoles,
            enemyPickRoles,
            myTeamName: this._myTeam.shortName,
            enemyTeamName: this._enemyTeam.shortName,
            enemyStarters: this._enemyStarters,
            stepLabel: this._container.querySelector('#bp-status')?.textContent || '',
        };

        try {
            const text = await getCoachAnalysis(ctx);
            if (!panel.isConnected) return;
            panel.innerHTML = _formatCoachText(text);
        } catch (e) {
            panel.innerHTML = '<div class="coach-error">分析生成失败</div>';
        }
    }

    _bindCoachConfig() {
        const btn = this._container.querySelector('#coach-config-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const config = getCoachConfig();
            const panel = this._container.querySelector('#coach-content');
            if (!panel) return;
            panel.innerHTML = `
                <div class="coach-config">
                    <p class="coach-config__desc">配置大模型API后，AI教练将提供更智能的分析（支持 DeepSeek、OpenAI 等兼容接口）</p>
                    <label>API 地址</label>
                    <input type="text" id="coach-api-url" value="${config.apiUrl || 'https://api.deepseek.com/v1/chat/completions'}" placeholder="https://api.deepseek.com/v1/chat/completions"/>
                    <label>API Key</label>
                    <input type="password" id="coach-api-key" value="${config.apiKey || ''}" placeholder="sk-..."/>
                    <label>模型名称</label>
                    <input type="text" id="coach-model" value="${config.model || 'deepseek-chat'}" placeholder="deepseek-chat"/>
                    <div class="coach-config__actions">
                        <button class="btn btn--sm" id="coach-save">保存</button>
                        <button class="btn btn--sm btn--outline" id="coach-cancel">取消</button>
                    </div>
                </div>`;
            panel.querySelector('#coach-save').addEventListener('click', () => {
                saveCoachConfig({
                    apiUrl: panel.querySelector('#coach-api-url').value.trim(),
                    apiKey: panel.querySelector('#coach-api-key').value.trim(),
                    model: panel.querySelector('#coach-model').value.trim(),
                });
                panel.innerHTML = '<div class="coach-success">✅ 配置已保存，下次操作时生效</div>';
            });
            panel.querySelector('#coach-cancel').addEventListener('click', () => {
                panel.innerHTML = '<div class="coach-loading">等待下一步操作...</div>';
            });
        });
    }

    _updateBPStatus(main, text) {
        const el = main.querySelector('#bp-status');
        if (el) el.textContent = text;
    }

    _heroCard(heroName, size = 40, showName = true) {
        const hero = getHero(heroName);
        if (!hero) return `<span class="bp-hero-mini">${heroName}</span>`;
        const roleInfo = HERO_ROLES[hero.role];
        return `<span class="bp-hero-card" title="${heroName} - ${roleInfo?.name || ''}">
            ${heroImgHTML(hero.id, heroName, size)}
            ${showName ? `<span class="bp-hero-card__name">${heroName}</span>` : ''}
        </span>`;
    }

    _buildHeroTabsAndGrid(candidates, recSet, enemyPicks, defaultType = 'warrior') {
        const grouped = { warrior: [], mage: [], tank: [], assassin: [], marksman: [], support: [] };
        candidates.forEach(name => {
            const hero = getHero(name);
            if (!hero) return;
            if (grouped[hero.role]) grouped[hero.role].push(name);
        });

        const roleOrder = ['warrior', 'mage', 'assassin', 'tank', 'marksman', 'support'];
        const tabs = roleOrder.map(role => {
            const ri = HERO_ROLES[role];
            const count = grouped[role].length;
            return `<button class="bp-type-tab ${role === defaultType ? 'bp-type-tab--active' : ''}" data-type="${role}" style="--tab-color:${ri.color}">
                ${ri.icon} ${ri.name}<span class="bp-type-tab__count">${count}</span>
            </button>`;
        }).join('');

        const panels = roleOrder.map(role => {
            const heroes = grouped[role];
            return `<div class="bp-type-panel ${role === defaultType ? 'bp-type-panel--active' : ''}" data-panel="${role}">
                ${heroes.length ? heroes.map(name => {
                    const hero = getHero(name);
                    const isRec = recSet.has(name);
                    const ci = getCounterInfo(name);
                    const countersEnemy = enemyPicks.filter(ep => ci.counters.includes(ep));
                    return `<button class="bp-hero-btn ${isRec ? 'bp-hero-btn--recommended' : ''}" data-hero="${name}">
                        <span class="bp-hero-btn__avatar">${hero ? heroImgHTML(hero.id, name, 56) : ''}</span>
                        <span class="bp-hero-btn__name">${name}</span>
                        ${isRec ? '<span class="bp-hero-btn__rec">荐</span>' : ''}
                        ${countersEnemy.length ? `<span class="bp-hero-btn__counter">克${countersEnemy[0]}</span>` : ''}
                    </button>`;
                }).join('') : '<div class="bp-type-empty">该分类暂无可选英雄</div>'}
            </div>`;
        }).join('');

        return `<div class="bp-type-tabs">${tabs}</div><div class="bp-type-panels">${panels}</div>`;
    }

    _bindHeroTabEvents(container, onHeroClick) {
        const tabs = container.querySelectorAll('.bp-type-tab');
        const panels = container.querySelectorAll('.bp-type-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('bp-type-tab--active'));
                panels.forEach(p => p.classList.remove('bp-type-panel--active'));
                tab.classList.add('bp-type-tab--active');
                const panel = container.querySelector(`[data-panel="${tab.dataset.type}"]`);
                if (panel) panel.classList.add('bp-type-panel--active');
            });
        });
        container.querySelectorAll('.bp-hero-btn').forEach(btn => {
            btn.addEventListener('click', () => onHeroClick(btn.dataset.hero));
        });
    }

    async _bpSelectHero(main, bpCtx, phase, bannedList, pickedList, picks) {
        const selectArea = main.querySelector('#bp-select-area');
        if (!selectArea) return '赵云';

        const unavailable = new Set([...bannedList, ...pickedList]);
        const allHeroNames = Object.keys(HEROES).filter(h => !unavailable.has(h));
        if (allHeroNames.length === 0) return '赵云';

        const banRecs = this._battleSystem.getRecommendedBan(this._enemyStarters);
        const recSet = new Set(banRecs.map(r => r.hero));

        selectArea.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, recSet, picks.enemy);

        return new Promise(res => {
            this._bindHeroTabEvents(selectArea, hero => res(hero));
        });
    }

    async _bpPickWithRole(main, bpCtx, bannedList, pickedList, picks, myPickRoles, roles) {
        const selectArea = main.querySelector('#bp-select-area');
        if (!selectArea) return { hero: '赵云', role: '打野' };

        const unavailable = new Set([...bannedList, ...pickedList]);
        const remainRoles = roles.filter(r => !myPickRoles.includes(r));
        let currentRole = remainRoles[0] || roles[0];

        const allHeroNames = Object.keys(HEROES).filter(h => !unavailable.has(h));
        const recsForRole = this._battleSystem.getHeroRecommendation(currentRole, bannedList, picks.my, picks.enemy);
        const recSet = new Set(recsForRole.map(r => r.name));

        const roleTabsHTML = `<div class="bp-role-tabs">
            <span class="bp-role-tab-hint">为哪个位置选人？</span>
            ${remainRoles.map((r, i) => `<button class="bp-role-tab ${i===0?'bp-role-tab--active':''}" data-role="${r}">${r}</button>`).join('')}
        </div>`;

        selectArea.innerHTML = `${roleTabsHTML}<div id="bp-grid-container">${this._buildHeroTabsAndGrid(allHeroNames, recSet, picks.enemy)}</div>`;

        let resolveHero;
        const heroPromise = new Promise(res => { resolveHero = res; });

        const gridContainer = selectArea.querySelector('#bp-grid-container');
        this._bindHeroTabEvents(gridContainer, hero => resolveHero(hero));

        selectArea.querySelectorAll('.bp-role-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                selectArea.querySelectorAll('.bp-role-tab').forEach(t => t.classList.remove('bp-role-tab--active'));
                tab.classList.add('bp-role-tab--active');
                currentRole = tab.dataset.role;
                const newRecs = this._battleSystem.getHeroRecommendation(currentRole, bannedList, picks.my, picks.enemy);
                const newRecSet = new Set(newRecs.map(r => r.name));
                gridContainer.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, newRecSet, picks.enemy);
                this._bindHeroTabEvents(gridContainer, hero => resolveHero(hero));
            });
        });

        const hero = await heroPromise;
        return { hero, role: currentRole };
    }

    _renderBPResult(bpResult, picks, banned, myPickRoles, enemyPickRoles) {
        const wr = estimateWinRate(picks.my, picks.enemy, myPickRoles, enemyPickRoles);
        const wrColor = wr.my > 55 ? 'var(--color-success)' : wr.my < 45 ? 'var(--color-danger)' : '#ffc107';
        const wrStatus = wr.my > 60 ? '🔥 大优势' : wr.my > 55 ? '✅ 小优势' : wr.my >= 45 ? '⚖️ 均势' : wr.my >= 40 ? '⚠️ 小劣势' : '🚨 大劣势';

        return `<div class="round-panel bp-result">
            <h3 class="round-title">BP阶段完成</h3>
            <div class="bp-result__winrate">
                <div class="bp-result__winrate-bar">
                    <div class="bp-result__winrate-fill" style="width:${wr.my}%;background:${wrColor}"></div>
                </div>
                <div class="bp-result__winrate-labels">
                    <span style="color:${wrColor};font-weight:700;font-size:18px">${this._myTeam.shortName} ${wr.my}%</span>
                    <span class="bp-result__winrate-status">${wrStatus}</span>
                    <span style="color:var(--color-danger);font-weight:700;font-size:18px">${wr.enemy}% ${this._enemyTeam.shortName}</span>
                </div>
            </div>
            <div class="bp-result__lineup">
                <div class="bp-result__side bp-result__side--my">
                    <h4>${this._myTeam.shortName}</h4>
                    <div class="bp-result__heroes">${picks.my.map((h, i) => `<div class="bp-result__hero">${this._heroCard(h, 44)}<span class="bp-result__role">${myPickRoles[i] || ''}</span></div>`).join('')}</div>
                    <div class="bp-result__eval">配合度 ${bpResult.myComp.synergy} | ${bpResult.myComp.desc}</div>
                </div>
                <div class="bp-result__vs">VS</div>
                <div class="bp-result__side bp-result__side--enemy">
                    <h4>${this._enemyTeam.shortName}</h4>
                    <div class="bp-result__heroes">${picks.enemy.map((h, i) => `<div class="bp-result__hero">${this._heroCard(h, 44)}<span class="bp-result__role">${enemyPickRoles[i] || ''}</span></div>`).join('')}</div>
                    <div class="bp-result__eval">配合度 ${bpResult.enemyComp.synergy} | ${bpResult.enemyComp.desc}</div>
                </div>
            </div>
            <div class="bp-result__banned">禁用: ${[...banned.my, ...banned.enemy].map(h => `<span class="bp-ban-tag">🚫${h}</span>`).join(' ')}</div>
            <div class="bp-momentum-shift">BP阵容优势: <strong style="color:${bpResult.bpMomentum>=0?'var(--color-success)':'var(--color-danger)'}">${bpResult.bpMomentum>=0?'+':''}${bpResult.bpMomentum}</strong> 势能</div>
            <button class="btn btn--gold btn--large" id="btn-start-match">开始比赛 ⚔️</button>
        </div>`;
    }

    /* ====================== 回合1: 对线期（增强信息） ====================== */
    async _startRound1() {
        this._setRoundLabel('回合1 · 对线期');
        this._updateTimer(0);
        await this._comment('比赛开始！进入对线期，请分配「指挥官的祝福」！');
        this._fireDanmaku('比赛开始了！加油！');

        const analysis = this._battleSystem.getLaningAnalysis();
        const main = this._main;
        main.innerHTML = `
            <div class="round-panel">
                <h3 class="round-title">回合 1 · 对线期</h3>
                <p class="round-desc">将3点「指挥官的祝福」🌟 分配到三条路上<br><span style="font-size:11px;color:var(--color-text-dim)">作为战队指挥官，你的鼓舞能让选手超常发挥</span></p>
                <div class="lane-allocation">
                    ${['top','mid','bot'].map(lane => {
                        const a = analysis[lane];
                        if (!a) return '';
                        const diffColor = a.diff > 3 ? 'var(--color-success)' : a.diff < -3 ? 'var(--color-danger)' : 'var(--color-text-dim)';
                        const prioClass = a.priority === 'high' ? 'lane-prio--high' : a.priority === 'medium' ? 'lane-prio--medium' : 'lane-prio--low';
                        return `<div class="lane-row" data-lane="${lane}">
                            <div class="lane-row__info">
                                <span class="lane-row__label">${({top:'上路',mid:'中路',bot:'下路'})[lane]}</span>
                                <span class="lane-row__matchup">
                                    ${playerAvatarHTML(a.myPlayer, this._myTeam.color, 24)}
                                    <strong>${a.myPlayer.id}</strong>
                                    <span class="vs-text">vs</span>
                                    <strong>${a.enemyPlayer.id}</strong>
                                    ${playerAvatarHTML(a.enemyPlayer, this._enemyTeam.color, 24)}
                                </span>
                                <div class="lane-row__detail">
                                    <span class="lane-stat" style="color:${diffColor}">对线: ${a.myPlayer.stats['对线']} vs ${a.enemyPlayer.stats['对线']} (${a.diff>0?'+':''}${a.diff})</span>
                                    <span class="lane-hint ${prioClass}">${a.hint}</span>
                                </div>
                            </div>
                            <div class="lane-row__controls">
                                <button class="btn btn--small lane-minus" data-lane="${lane}">−</button>
                                <span class="lane-row__stars" id="stars-${lane}">0</span>
                                <button class="btn btn--small lane-plus" data-lane="${lane}">+</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="round-remaining">剩余祝福: <span id="remaining-stars">3</span> 🌟</div>
                <button class="btn btn--gold btn--large" id="btn-confirm-laning" disabled>确认分配</button>
            </div>`;

        const alloc = {top:0,mid:0,bot:0};
        const update = () => {
            const rem = 3-alloc.top-alloc.mid-alloc.bot;
            ['top','mid','bot'].forEach(l => { main.querySelector(`#stars-${l}`).textContent = '⭐'.repeat(alloc[l])||'0'; });
            main.querySelector('#remaining-stars').textContent = rem;
            main.querySelector('#btn-confirm-laning').disabled = rem !== 0;
        };
        main.querySelectorAll('.lane-plus').forEach(b => b.addEventListener('click', () => { const l=b.dataset.lane; if(3-alloc.top-alloc.mid-alloc.bot>0&&alloc[l]<3){alloc[l]++;update();} }));
        main.querySelectorAll('.lane-minus').forEach(b => b.addEventListener('click', () => { const l=b.dataset.lane; if(alloc[l]>0){alloc[l]--;update();} }));

        await new Promise(res => {
            main.querySelector('#btn-confirm-laning').addEventListener('click', async () => {
                const result = this._battleSystem.resolveLaningPhase(alloc);
                this._updateMomentum(result.momentum); this._updateScoreboard(); this._updateTimer(4);
                main.innerHTML = `<div class="round-result"><h3>对线期结算</h3>
                    ${Object.entries(result.results).map(([,r])=>`<div class="lane-result lane-result--${r.advantage>0?'win':r.advantage<0?'lose':'draw'}">
                        <span class="lane-result__icon">${r.advantage>0?'✅':r.advantage<0?'❌':'➖'}</span><span>${r.desc}</span></div>`).join('')}
                </div>`;
                await this._comment(Object.values(result.results)[0].desc);
                await this._sleep(2000); res();
            });
        });
        this._startRound2();
    }

    /* ====================== 回合2: 野区博弈（信息透明） ====================== */
    async _startRound2() {
        this._setRoundLabel('回合2 · 野区博弈');
        this._updateTimer(5);
        await this._comment('进入野区博弈阶段！AI教练正在分析局势...');

        const analysis = this._battleSystem.getJungleAnalysis();
        const main = this._main;

        main.innerHTML = `<div class="round-panel">
            <h3 class="round-title">回合 2 · 野区博弈</h3>
            <div class="jungle-info">
                <div class="jungle-matchup">
                    <span>${analysis.myJungler?.id || '打野'} (综合${analysis.myStr})</span>
                    <span class="vs-text">vs</span>
                    <span>${analysis.enemyJungler?.id || '打野'} (综合${analysis.enStr})</span>
                </div>
                <div class="jungle-ai-suggest">🤖 AI建议: <strong>${analysis.aiSuggestion}</strong></div>
            </div>
            <div class="jungle-choices">
                ${Object.entries(analysis.choiceAnalysis).map(([id, ca]) => {
                    const meta = {invade:{icon:'⚔️',name:'入侵野区'},dragon:{icon:'🐉',name:'抢暴君'},gank_top:{icon:'⬆️',name:'上路Gank'},gank_mid:{icon:'⏺️',name:'中路Gank'},gank_bot:{icon:'⬇️',name:'下路Gank'}}[id];
                    const rateColor = ca.successRate >= 60 ? 'var(--color-success)' : ca.successRate >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
                    return `<button class="jungle-choice jungle-choice--enhanced" data-choice="${id}">
                        <span class="jungle-choice__icon">${meta.icon}</span>
                        <span class="jungle-choice__name">${meta.name}</span>
                        <span class="jungle-choice__rate" style="color:${rateColor}">成功率 ${ca.successRate}%</span>
                        <span class="jungle-choice__hint">${ca.hint}</span>
                        <span class="jungle-choice__rr">收益${ca.reward} / 风险${ca.risk}</span>
                    </button>`;
                }).join('')}
            </div>
        </div>`;

        await new Promise(res => {
            main.querySelectorAll('.jungle-choice').forEach(btn => btn.addEventListener('click', async () => {
                const result = this._battleSystem.resolveJunglePhase(btn.dataset.choice);
                this._updateMomentum(result.momentum); this._updateScoreboard(); this._updateTimer(8);
                main.innerHTML = `<div class="round-result round-result--${result.success?'success':'fail'}">
                    <div class="result-big-icon">${result.success?'✅':'❌'}</div><h3>${result.desc}</h3></div>`;
                await this._comment(result.desc);
                if(result.success) this._fireDanmaku(`${result.jungler} 太强了！`); else this._fireDanmaku('可惜了...');
                await this._sleep(2000); res();
            }));
        });
        this._startRound3();
    }

    /* ====================== 回合3-5保持原逻辑 ====================== */
    async _startRound3() {
        this._setRoundLabel('回合3 · 中期团战');
        this._updateTimer(12);
        await this._comment('中期团战即将爆发！');
        this._fireDanmaku('团战来了！');
        const main = this._main;

        main.innerHTML = `<div class="round-panel"><h3 class="round-title">回合 3 · 中期团战</h3>
            <p class="round-desc">在绿色区域按下「开团」！</p>
            <div class="qte-ring"><svg viewBox="0 0 200 200" class="qte-ring__svg">
                <circle cx="100" cy="100" r="85" class="qte-ring__track"/>
                <circle cx="100" cy="100" r="85" class="qte-ring__zone" stroke-dasharray="80 454" stroke-dashoffset="-30"/>
                <circle cx="100" cy="15" r="8" class="qte-ring__pointer" id="qte-pointer"/>
            </svg><button class="btn btn--gold qte-btn" id="qte-btn">开团！</button></div></div>`;
        const timingQuality = await this._runQTE();
        if (timingQuality === 'perfect') sfxQTEPerfect();
        await this._comment(timingQuality === 'perfect' ? '完美的开团时机！' : timingQuality === 'good' ? '不错的开团时机' : '开团时机不太好...');

        const strats = Object.values(TF_STRATEGIES);
        main.innerHTML = `<div class="round-panel strategy-duel">
            <h3 class="round-title">选择团战策略</h3>
            <div class="counter-triangle">
                <div class="ct-label ct-label--top">🗡️ 集火后排</div>
                <div class="ct-label ct-label--left">✂️ 切割战场</div>
                <div class="ct-label ct-label--right">🛡️ 保护C位</div>
                <svg viewBox="0 0 200 180" class="ct-svg">
                    <polygon points="100,15 15,165 185,165" fill="none" stroke="var(--color-surface-light)" stroke-width="2"/>
                    <text x="100" y="95" class="ct-arrow" text-anchor="middle" fill="var(--color-text-dim)" font-size="11">克制关系 ↻</text>
                </svg>
            </div>
            <p class="round-desc">集火后排 克制 保护C位 | 保护C位 克制 切割战场 | 切割战场 克制 集火后排</p>
            <div class="tf-strategies">${strats.map(s=>`<button class="tf-strategy" data-strategy="${s.id}">
                <span class="tf-strategy__icon">${s.icon}</span><span class="tf-strategy__name">${s.name}</span>
                <span class="tf-strategy__need">关联: ${s.statKey}</span></button>`).join('')}
            </div></div>`;

        const myStrategy = await new Promise(res => {
            main.querySelectorAll('.tf-strategy').forEach(b => b.addEventListener('click', () => { b.classList.add('tf-strategy--selected'); res(b.dataset.strategy); }));
        });

        const result = this._battleSystem.resolveTeamfight(timingQuality, myStrategy);
        const mySt = TF_STRATEGIES[result.myStrategy];
        const enSt = TF_STRATEGIES[result.enemyStrategy];
        const cr = result.counterResult;
        const crClass = cr === 'my_win' ? 'duel--my-win' : cr === 'enemy_win' ? 'duel--enemy-win' : 'duel--neutral';
        const crText = cr === 'my_win' ? '🎉 我方策略克制对手！' : cr === 'enemy_win' ? '💀 对方策略克制我方！' : '⚖️ 无克制关系';

        main.innerHTML = `<div class="round-panel duel-reveal ${crClass}">
            <h3 class="round-title">策略揭晓！</h3>
            <div class="duel-cards">
                <div class="duel-card duel-card--my"><div class="duel-card__label">${this._myTeam.shortName}</div><div class="duel-card__icon" id="my-reveal">${mySt.icon}</div><div class="duel-card__name">${mySt.name}</div></div>
                <div class="duel-vs">VS</div>
                <div class="duel-card duel-card--enemy"><div class="duel-card__label">${this._enemyTeam.shortName}</div><div class="duel-card__icon duel-card__icon--hidden" id="enemy-reveal">❓</div><div class="duel-card__name duel-card__name--hidden" id="enemy-name">???</div></div>
            </div>
            <div class="duel-result" id="duel-result" style="opacity:0">
                <div class="duel-result__counter">${crText}</div>
                <div class="duel-result__desc">${result.desc}</div>
                <div class="duel-result__shift">势能变化: <strong style="color:${result.momentumShift>0?'var(--color-success)':'var(--color-danger)'}">${result.momentumShift>0?'+':''}${result.momentumShift}</strong></div>
            </div></div>`;

        await this._sleep(500);
        await this._sleep(800);
        const enReveal = main.querySelector('#enemy-reveal');
        const enName = main.querySelector('#enemy-name');
        if (enReveal) { enReveal.textContent = enSt.icon; enReveal.classList.remove('duel-card__icon--hidden'); }
        if (enName) { enName.textContent = enSt.name; enName.classList.remove('duel-card__name--hidden'); }
        await this._sleep(600);
        const duelResult = main.querySelector('#duel-result');
        if (duelResult) duelResult.style.opacity = '1';
        if (cr === 'my_win') sfxCounterWin(); else if (cr === 'enemy_win') sfxCounterLose();
        this._updateMomentum(result.momentum); this._updateScoreboard(); this._updateTimer(15);
        await this._comment(result.desc);
        await this._sleep(2500);
        this._startRound4();
    }

    async _startRound4() {
        this._setRoundLabel('回合4 · 宏观策略');
        this._updateTimer(18);
        await this._comment('后期关键节点！选择你的宏观策略！');
        const main = this._main;
        const cards = MACRO_STRATEGIES;
        const counterDesc = cards.map(c => { const t = cards.find(x=>x.id===c.counters); return t ? `${c.icon}${c.name} 克 ${t.icon}${t.name}` : ''; }).filter(Boolean).join(' | ');

        main.innerHTML = `<div class="round-panel strategy-duel">
            <h3 class="round-title">回合 4 · 宏观策略对抗</h3>
            <p class="round-desc counter-desc">${counterDesc}</p>
            <div class="macro-cards">${cards.map(c=>`
                <div class="strategy-card macro-card" data-id="${c.id}">
                    <div class="strategy-card__icon">${c.icon}</div>
                    <div class="strategy-card__name">${c.name}</div>
                    <div class="strategy-card__desc">${c.desc}</div>
                    <div class="strategy-card__risk">${c.riskText}</div>
                    <div class="strategy-card__stats"><span class="card-stat card-stat--good">克制: +${c.reward}</span><span class="card-stat">平均: +${c.avgReward}</span></div>
                    <div class="strategy-card__counter">克制 → ${cards.find(t=>t.id===c.counters)?.name||'?'}</div>
                </div>`).join('')}
            </div></div>`;

        const myCardId = await new Promise(res => {
            main.querySelectorAll('.macro-card').forEach(el => el.addEventListener('click', () => { main.querySelectorAll('.macro-card').forEach(e => e.classList.remove('strategy-card--selected')); el.classList.add('strategy-card--selected'); res(el.dataset.id); }));
        });

        const result = this._battleSystem.resolveMacroStrategy(myCardId);
        const cr = result.counterResult;
        const crClass = cr === 'my_win' ? 'duel--my-win' : cr === 'enemy_win' ? 'duel--enemy-win' : 'duel--neutral';
        const crText = cr === 'my_win' ? '🎉 克制成功！' : cr === 'enemy_win' ? '💀 被克制！' : '⚖️ 无克制';

        main.innerHTML = `<div class="round-panel duel-reveal ${crClass}">
            <h3 class="round-title">策略揭晓！</h3>
            <div class="duel-cards">
                <div class="duel-card duel-card--my"><div class="duel-card__label">${this._myTeam.shortName}</div><div class="duel-card__icon">${result.myCard.icon}</div><div class="duel-card__name">${result.myCard.name}</div></div>
                <div class="duel-vs">VS</div>
                <div class="duel-card duel-card--enemy"><div class="duel-card__label">${this._enemyTeam.shortName}</div><div class="duel-card__icon duel-card__icon--hidden" id="r4-enemy-icon">❓</div><div class="duel-card__name duel-card__name--hidden" id="r4-enemy-name">???</div></div>
            </div>
            <div class="duel-result" id="r4-result" style="opacity:0">
                <div class="duel-result__counter">${crText}</div><div class="duel-result__desc">${result.desc}</div>
                <div class="duel-result__shift">势能变化: <strong style="color:${result.momentumShift>0?'var(--color-success)':result.momentumShift<0?'var(--color-danger)':'var(--color-text-dim)'}">${result.momentumShift>0?'+':''}${result.momentumShift}</strong></div>
            </div></div>`;

        await this._sleep(800);
        const eIcon = main.querySelector('#r4-enemy-icon'); const eName = main.querySelector('#r4-enemy-name');
        if (eIcon) { eIcon.textContent = result.enemyCard.icon; eIcon.classList.remove('duel-card__icon--hidden'); }
        if (eName) { eName.textContent = result.enemyCard.name; eName.classList.remove('duel-card__name--hidden'); }
        await this._sleep(600);
        const rEl = main.querySelector('#r4-result'); if (rEl) rEl.style.opacity = '1';
        this._updateMomentum(result.momentum); this._updateScoreboard(); this._updateTimer(22);
        await this._comment(result.desc);
        await this._sleep(2500);
        this._startRound5();
    }

    async _startRound5() {
        this._setRoundLabel('回合5 · 终局决战');
        this._updateTimer(25);
        const m = this._battleSystem.momentum;
        const main = this._main;

        main.innerHTML = `<div class="round-panel"><h3 class="round-title">回合 5 · 终局决战</h3>
            <p class="round-desc">当前势能: <strong style="color:${m>=55?'var(--color-success)':m<=45?'var(--color-danger)':'var(--color-warning)'}">${Math.round(m)}</strong> — ${m>=55?'我方优势':m<=45?'局势危急':'局势焦灼'}</p>
            ${m >= 60 ? `<p>我方优势明显，选择终结方式：</p>
                <div class="finale-choices">
                    <button class="btn btn--gold btn--large finale-btn" data-choice="push">🏰 强攻高地</button>
                    <button class="btn btn--outline btn--large finale-btn" data-choice="safe">🛡️ 步步为营</button>
                </div>` :
            m >= 40 ? `<p>局势焦灼！做出关键抉择：</p>` :
            `<p>需要绝境翻盘！抓住每一个机会：</p>`}
        </div>`;

        if (m >= 60) {
            await new Promise(res => main.querySelectorAll('.finale-btn').forEach(b => b.addEventListener('click', async () => {
                await this._showFinalResult(this._battleSystem.resolveFinale([b.dataset.choice])); res();
            })));
        } else if (m >= 40) {
            const dec = await this._runQuickDecisions([
                {text:'对方五人抱团推进，正面迎战？',yes:'迎战',no:'绕后'},
                {text:'发现对方走位失误！集火？',yes:'集火',no:'保留技能'},
            ]);
            await this._showFinalResult(this._battleSystem.resolveFinale(dec));
        } else {
            const dec = await this._runQuickDecisions([
                {text:'对方推高地，拼死一搏？',yes:'拼了！',no:'放弃',timeLimit:2000},
                {text:'找到绝佳开团角度！',yes:'立即开团⚡',no:'再等等',timeLimit:2000},
                {text:'对方走位失误！全力集火！',yes:'全力输出🔥',no:'先留技能',timeLimit:2000},
            ]);
            await this._showFinalResult(this._battleSystem.resolveFinale(dec));
        }
    }

    async _showFinalResult(result) {
        this._updateMomentum(result.momentum); this._updateScoreboard();
        this._recordMatchResult(result);

        const main = this._main;
        if (result.won) {
            game.state.team.gold += ECONOMY.MATCH_WIN_GOLD;
            game.state.team.fame += ECONOMY.MATCH_WIN_FAME;
            game.state.team.fans = (game.state.team.fans || 0) + ECONOMY.MATCH_WIN_FANS;
            game.state.team.morale = Math.min(MORALE.MAX, game.state.team.morale + MORALE.BOOST_PER_WIN);
        } else {
            game.state.team.gold += ECONOMY.MATCH_LOSE_GOLD;
            game.state.team.fame += ECONOMY.MATCH_LOSE_FAME;
            game.state.team.fans = (game.state.team.fans || 0) + ECONOMY.MATCH_LOSE_FANS;
            game.state.team.morale = Math.max(MORALE.MIN, game.state.team.morale - MORALE.DECAY_PER_LOSS);
        }
        (game.state.players || []).forEach(p => {
            p.condition = Math.max(PLAYER.MIN_CONDITION, (p.condition || PLAYER.START_CONDITION) - PLAYER.CONDITION_DECAY_PER_MATCH);
        });

        const otherHTML = this._renderOtherResults();
        stopBGM();
        if (result.won) {
            sfxVictory(); setTimeout(() => sfxCheer(), 1200);
            main.innerHTML = `<div class="round-result round-result--victory"><div class="victory-banner"><h2>🏆 VICTORY</h2><p>${this._myTeam.name} 赢得比赛！</p></div>
                <div class="match-stats"><div class="match-stat">击杀 ${result.kills.my}:${result.kills.enemy}</div><div class="match-stat">推塔 ${result.towers.my}:${result.towers.enemy}</div><div class="match-stat">MVP: ${result.mvp?.id||'—'}</div></div>
                ${otherHTML}<button class="btn btn--gold btn--large" id="btn-finish">返回基地</button></div>`;
            await this._comment(`${this._myTeam.name} 赢得比赛！MVP: ${result.mvp?.id}！`);
        } else {
            sfxDefeat();
            main.innerHTML = `<div class="round-result round-result--defeat"><div class="defeat-banner"><h2>DEFEAT</h2><p>${this._enemyTeam.name} 赢得比赛</p></div>
                <div class="match-stats"><div class="match-stat">击杀 ${result.kills.my}:${result.kills.enemy}</div><div class="match-stat">推塔 ${result.towers.my}:${result.towers.enemy}</div></div>
                ${otherHTML}<button class="btn btn--outline btn--large" id="btn-finish">返回基地</button></div>`;
            await this._comment('胜败乃兵家常事，下次再来！');
        }
        game.save();
        this._container.querySelector('#btn-finish')?.addEventListener('click', () => game.sceneManager.switchTo('home'));
    }

    _renderOtherResults() {
        const others = this._otherResults || [];
        if (!others.length) return '';
        return `<div class="other-results"><h4 class="other-results__title">📰 同期联赛战报</h4><div class="other-results__list">
            ${others.slice(0, 8).map(m => {
                const home = getTeamById(m.homeTeam); const away = getTeamById(m.awayTeam);
                if (!home || !away || !m.result) return '';
                return `<div class="other-result-row"><span class="${m.result.winner === m.homeTeam ? 'winner-text' : ''}">${home.shortName}</span><span class="other-result-score">${m.result.score[0]}:${m.result.score[1]}</span><span class="${m.result.winner === m.awayTeam ? 'winner-text' : ''}">${away.shortName}</span></div>`;
            }).join('')}</div></div>`;
    }

    _recordMatchResult(result) {
        if (this._currentMatch) {
            this._season.recordPlayerMatch(this._currentMatch, result.won, result.kills?.my || 0, result.kills?.enemy || 0);
        }
        this._otherResults = this._season.simulateOtherMatches();
        this._season.advanceRound();
        game.state.season.phase = this._season.currentPhase?.id || 'annual_finals';
        game.state.season.round = this._season.currentRound;
        game.state.seasonSystem = this._season.toSaveData();
    }

    /* ========== 工具方法 ========== */
    _runQTE() {
        return new Promise(resolve => {
            const pointer = this._container.querySelector('#qte-pointer');
            const btn = this._container.querySelector('#qte-btn');
            if (!pointer||!btn) { resolve('good'); return; }
            let angle = 0, running = true;
            const animate = () => { if (!running) return; angle = (angle + 3) % 360; const rad = (angle - 90) * Math.PI / 180; pointer.setAttribute('cx', 100 + 85 * Math.cos(rad)); pointer.setAttribute('cy', 100 + 85 * Math.sin(rad)); requestAnimationFrame(animate); };
            animate();
            btn.addEventListener('click', () => { running = false; const a = angle % 360; const q = (a>=60&&a<=120)?'perfect':(a>=30&&a<=150)?'good':'bad'; btn.textContent = q==='perfect'?'完美！':q==='good'?'不错':'偏了'; btn.className = `btn qte-btn qte-btn--${q}`; setTimeout(() => resolve(q), 800); });
            setTimeout(() => { if(running){running=false;resolve('bad');} }, 5000);
        });
    }

    _runQuickDecisions(list) {
        return new Promise(async resolve => {
            const results = [];
            for (const dec of list) {
                const tl = dec.timeLimit||3000;
                const r = await new Promise(res => {
                    this._main.innerHTML = `<div class="round-panel quick-decision"><div class="qd-timer" id="qd-timer">${Math.ceil(tl/1000)}</div><h3 class="qd-text">⚡ ${dec.text}</h3><div class="qd-buttons"><button class="btn btn--gold qd-btn" data-val="correct">${dec.yes}</button><button class="btn btn--outline qd-btn" data-val="wrong">${dec.no}</button></div></div>`;
                    let done = false, rem = tl/1000;
                    const iv = setInterval(() => { rem--; const el=this._main.querySelector('#qd-timer'); if(el)el.textContent=rem; if(rem<=0&&!done){done=true;clearInterval(iv);res('wrong');} }, 1000);
                    this._main.querySelectorAll('.qd-btn').forEach(b => b.addEventListener('click', () => { if(done)return; done=true; clearInterval(iv); res(b.dataset.val); }));
                });
                results.push(r); await this._sleep(400);
            }
            resolve(results);
        });
    }
}
