/**
 * BattleScene - 比赛场景 v3 (卡牌博弈版)
 * 流程：BP → 卡牌对战(9轮+决胜) → 赛果
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId, TEAMS } from '../data/teams.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { CardBattleSystem } from '../systems/CardBattleSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { HEROES, HERO_ROLES, getHero, getPlayerHeroes, getCounterInfo, getHeroesForPosition, heroImgHTML, evaluateComp } from '../data/heroes.js';
import { createElement, typeWriter } from '../ui/Components.js';
import { shakeElement, pulseElement } from '../ui/Transitions.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';
import { ECONOMY, PLAYER, MORALE } from '../data/balance.js';
import { CARD_TYPES, LANES } from '../data/cards.js';
import { createMobaMapSVG } from '../ui/MobaMap.js';
import { renderCard, renderHandArea, renderCommandZone, renderEnemyCards, renderSettlements, renderCardCompact, renderLaneSelector } from '../ui/CardRenderer.js';
import { sfxBan, sfxPick, sfxBattleStart, sfxVictory, sfxDefeat, sfxCheer, sfxConfirm, sfxSelect, sfxKill, sfxCardPlay, sfxCardReveal, sfxTowerDestroy, sfxObjective, sfxDiscard, startBGM, stopBGM } from '../ui/SoundManager.js';
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
        else if (trimmed.startsWith('✅')) cls += ' coach-line--ok';
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
        this._battleSystem = new BattleSystem(
            this._myTeam, this._enemyTeam, this._myStarters, this._enemyStarters,
            { morale: game.state.team?.morale || 70, playerConditions: {} }
        );
        container.className = 'scene scene--battle';
        this._renderBattleUI();
        // BP is a long interactive flow — run it *after* enter() returns
        // so SceneManager can finish the transition and remove the overlay
        setTimeout(() => this._startBP(), 50);
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
    _updateScoreboard(bs) {
        const s = bs || this._cardBattle;
        if (!s) return;
        this._container.querySelector('#kills-my').textContent = s.kills.my;
        this._container.querySelector('#kills-enemy').textContent = s.kills.enemy;
        this._container.querySelector('#towers-my').textContent = s.towers.my;
        this._container.querySelector('#towers-enemy').textContent = s.towers.enemy;
        this._container.querySelector('#gold-my').textContent = s.gold.my;
        this._container.querySelector('#gold-enemy').textContent = s.gold.enemy;
    }
    async _comment(text) { const el = this._container.querySelector('#commentary-text'); if (el) await typeWriter(el, text, 20); }
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

    /* ====================== BP 阶段（保持原有逻辑） ====================== */
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
            this._updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, 'ban', label);
            const h = await this._bpSelectHero(main, bpCtx, 'ban', allBanned(), allPicked(), picks, banned);
            banned.my.push(h); sfxBan();
        };
        const enemyBan = async () => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'ban');
            this._updateBPStatus(main, `${this._enemyTeam.shortName} 正在思考禁用...`);
            await this._sleep(1200 + Math.random() * 2300);
            const pool = this._getEnemyBanCandidates(bpCtx, allBanned());
            if (pool.length) { banned.enemy.push(pool[0]); sfxBan(); }
        };
        const myPick = async (label) => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'pick');
            this._updateBPStatus(main, label);
            this._updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, 'pick', label);
            const r = await this._bpPickWithRole(main, bpCtx, allBanned(), allPicked(), picks, myPickRoles, roles, banned);
            picks.my.push(r.hero); myPickRoles.push(r.role); sfxPick();
        };
        const enemyPick = async () => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, 'pick');
            this._updateBPStatus(main, `${this._enemyTeam.shortName} 正在选人...`);
            await this._sleep(1500 + Math.random() * 2500);
            const r = this._autoEnemyPick(bpCtx, allBanned(), allPicked(), enemyPickRoles, roles);
            picks.enemy.push(r.hero); enemyPickRoles.push(r.role); sfxPick();
        };
        const refresh = (phase) => {
            this._renderBPBoard(main, bpCtx, banned, picks, myPickRoles, enemyPickRoles, phase);
        };

        // ---- 第1段：蓝Ban1 → 红Ban1 → 蓝Ban2 → 红Ban2 ----
        await myBan('蓝方Ban — 第1个'); refresh('ban');
        await enemyBan(); refresh('ban');
        await myBan('蓝方Ban — 第2个'); refresh('ban');
        await enemyBan(); refresh('ban');
        await this._comment(`第一轮Ban完成 — 蓝禁:${banned.my.join('/')} 红禁:${banned.enemy.join('/')}`);

        // ---- 第2段：蓝Pick1 → 红Pick1/2 → 蓝Pick2/3 → 红Pick3 ----
        await myPick(`${this._myTeam.shortName} 选择第1位`); refresh('pick');
        await enemyPick(); refresh('pick');
        await enemyPick(); refresh('pick');
        await myPick(`${this._myTeam.shortName} 选择第2位`); refresh('pick');
        await myPick(`${this._myTeam.shortName} 选择第3位`); refresh('pick');
        await enemyPick(); refresh('pick');
        await this._comment('第一轮Pick完成');

        // ---- 第3段：红Ban3 → 蓝Ban3 → 红Ban4 → 蓝Ban4 → 红Ban5 → 蓝Ban5 ----
        await enemyBan(); refresh('ban');
        await myBan('蓝方Ban — 第3个'); refresh('ban');
        await enemyBan(); refresh('ban');
        await myBan('蓝方Ban — 第4个'); refresh('ban');
        await enemyBan(); refresh('ban');
        await myBan('蓝方Ban — 第5个'); refresh('ban');
        await this._comment(`第二轮Ban完成 — 共禁用${allBanned().length}位英雄`);

        // ---- 第4段：红Pick4 → 蓝Pick4/5 → 红Pick5 ----
        await enemyPick(); refresh('pick');
        await myPick(`${this._myTeam.shortName} 选择第4位`); refresh('pick');
        await myPick(`${this._myTeam.shortName} 选择第5位`); refresh('pick');
        await enemyPick(); refresh('pick');

        const bpResult = this._battleSystem.resolveBP(banned.my, picks.my, banned.enemy, picks.enemy);
        this._bpResult = bpResult;
        this._updateMomentum(this._battleSystem.momentum);

        main.innerHTML = this._renderBPResult(bpResult, picks, banned, myPickRoles, enemyPickRoles);
        await new Promise(res => main.querySelector('#btn-start-match').addEventListener('click', () => {
            sfxBattleStart(); startBGM('battle'); res();
        }));

        this._startCardBattle();
    }

    /* ====================== 卡牌对战主循环 ====================== */
    async _startCardBattle() {
        this._cardBattle = new CardBattleSystem(
            this._myTeam, this._enemyTeam,
            this._myStarters, this._enemyStarters,
            this._bpResult,
            { morale: game.state.team?.morale || 70 }
        );

        for (let i = 0; i < this._cardBattle.totalRounds; i++) {
            if (this._cardBattle.gameOver) break;
            const roundData = this._cardBattle.startRound();
            await this._playRound(roundData);
        }

        if (!this._cardBattle.gameOver) {
            await this._playFinale();
        }

        await this._showFinalResult();
    }

    async _playRound(roundData) {
        const { round, phaseLabel, ap, event } = roundData;
        this._setRoundLabel(`第${round}轮 · ${phaseLabel}`);
        this._updateTimer(round * 3);

        if (event) {
            await this._comment(`${event.icon} ${event.name}：${event.desc}`);
            this._fireDanmaku(`${event.icon} ${event.name}！`);
            await this._sleep(1000);
        }

        const main = this._main;
        const cbs = this._cardBattle;

        // 渲染对战界面
        const commandSlots = [];
        let currentAP = cbs.currentAP;

        const render = () => {
            main.innerHTML = `<div class="card-battle">
                <div class="cb-layout">
                    <div class="cb-left">
                        <div class="cb-map-wrap">
                            ${createMobaMapSVG(cbs.lanes, { baronAlive: cbs.baronAlive, lordAlive: cbs.lordAlive, showLordPlaceholder: round >= 5 })}
                        </div>
                        <div class="cb-coach" id="cb-coach">
                            <div class="cb-coach__header">🎙️ AI教练</div>
                            <div class="cb-coach__body" id="cb-coach-body">
                                ${cbs.getCoachAdvice().map(t => `<div class="cb-coach__tip">${t}</div>`).join('')}
                            </div>
                        </div>
                        <div class="cb-coach-llm" id="cb-coach-llm" style="display:none"></div>
                    </div>
                    <div class="cb-right">
                        ${renderEnemyCards(cbs.enemyHand.length, cbs.revealedEnemyCards)}
                        ${renderCommandZone(commandSlots, 3)}
                        ${renderHandArea(cbs.myHand, currentAP, 5)}
                        <button class="btn btn--gold btn--large cb-confirm" id="btn-confirm-round" ${commandSlots.length === 0 ? 'disabled' : ''}>
                            确认出牌 ⚔️
                        </button>
                    </div>
                </div>
            </div>`;

            this._bindCardInteractions(main, cbs, commandSlots, currentAP, render);
        };

        render();

        this._loadLLMCoachAdvice(cbs, main);

        // 等待玩家确认出牌
        const playedCards = await new Promise(resolve => {
            const waitForConfirm = () => {
                const btn = main.querySelector('#btn-confirm-round');
                if (btn) {
                    btn.addEventListener('click', () => {
                        sfxConfirm();
                        resolve(commandSlots.map(s => ({ card: s.card, targetLane: s.targetLane })));
                    });
                }
            };
            waitForConfirm();
            this._onReRender = waitForConfirm;
        });

        // 结算回合
        const result = cbs.resolveRound(playedCards);
        this._updateMomentum(result.momentum);
        this._updateScoreboard(cbs);

        // 显示结算动画
        await this._showRoundResult(result);
    }

    _loadLLMCoachAdvice(cbs, main) {
        cbs.getCoachAdviceAsync().then(result => {
            if (result.type !== 'llm') return;
            const llmEl = main.querySelector('#cb-coach-llm');
            if (!llmEl) return;
            llmEl.style.display = 'block';
            llmEl.innerHTML = `
                <div class="cb-coach-llm__header">🧠 AI大模型分析</div>
                <div class="cb-coach-llm__body">${result.content.replace(/\n/g, '<br>')}</div>
            `;
        }).catch(() => {});
    }

    _bindCardInteractions(main, cbs, commandSlots, currentAP, reRender) {
        // 手牌点击 -> 出牌
        main.querySelectorAll('#hand-cards .card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                const uid = cardEl.dataset.uid;
                const card = cbs.myHand.find(c => c.uid === uid);
                if (!card) return;

                const check = cbs.canPlayCard(card);
                if (!check.ok) {
                    cardEl.classList.add('card--shake');
                    setTimeout(() => cardEl.classList.remove('card--shake'), 400);
                    return;
                }

                if (card.target === 'choose') {
                    this._showLaneSelector(main, (lane) => {
                        if (card.cost <= currentAP) {
                            currentAP -= card.cost;
                            if (card.bonusAP) currentAP += card.bonusAP;
                            commandSlots.push({ card, targetLane: lane });
                            reRender();
                            if (this._onReRender) this._onReRender();
                        }
                    });
                    return;
                }

                if (card.cost <= currentAP) {
                    currentAP -= card.cost;
                    if (card.bonusAP) currentAP += card.bonusAP;
                    commandSlots.push({ card, targetLane: null });
                    sfxCardPlay();
                    reRender();
                    if (this._onReRender) this._onReRender();
                }
            });

            // 双击弃牌
            cardEl.addEventListener('dblclick', () => {
                const uid = cardEl.dataset.uid;
                const card = cbs.myHand.find(c => c.uid === uid);
                if (card) {
                    cbs.discard(card);
                    sfxDiscard();
                    reRender();
                    if (this._onReRender) this._onReRender();
                }
            });
        });

        // 指令区移除
        main.querySelectorAll('.cmd-slot__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const removed = commandSlots.splice(idx, 1)[0];
                if (removed) {
                    currentAP += removed.card.cost;
                    if (removed.card.bonusAP) currentAP -= removed.card.bonusAP;
                    cbs.myHand.push(removed.card);
                }
                reRender();
                if (this._onReRender) this._onReRender();
            });
        });
    }

    _showLaneSelector(main, callback) {
        const existing = main.querySelector('#lane-selector');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'lane-selector-overlay';
        overlay.id = 'lane-selector';
        overlay.innerHTML = `
            <div class="lane-selector">
                <div class="lane-selector__title">选择目标路线</div>
                <div class="lane-selector__options">
                    <button class="lane-opt" data-lane="top">${LANES.top.icon} ${LANES.top.name}</button>
                    <button class="lane-opt" data-lane="mid">${LANES.mid.icon} ${LANES.mid.name}</button>
                    <button class="lane-opt" data-lane="bot">${LANES.bot.icon} ${LANES.bot.name}</button>
                </div>
            </div>`;
        main.appendChild(overlay);

        overlay.querySelectorAll('.lane-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.remove();
                callback(btn.dataset.lane);
            });
        });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    async _showRoundResult(result) {
        const main = this._main;
        const settlements = result.settlements;

        main.innerHTML = `<div class="round-result-panel">
            <h3 class="round-result__title">第${result.round}轮结算</h3>
            <div class="round-result__body">
                <div class="round-result__map">
                    ${createMobaMapSVG(result.lanes, { baronAlive: this._cardBattle.baronAlive, lordAlive: this._cardBattle.lordAlive })}
                </div>
                <div class="round-result__events">
                    <div class="result-section">
                        <h4>📋 对手出牌</h4>
                        <div class="enemy-played">
                            ${result.enemyActions.map(a => `<div class="enemy-action">
                                <span class="enemy-action__icon">${CARD_TYPES[a.type]?.icon || '⚡'}</span>
                                <span>${a.name}</span>
                            </div>`).join('')}
                        </div>
                    </div>
                    <div class="result-section">
                        <h4>⚔️ 结算结果</h4>
                        ${renderSettlements(settlements)}
                    </div>
                    <div class="result-section result-lane-status">
                        <h4>🗺️ 当前战况</h4>
                        ${Object.entries(result.lanes).map(([lane, l]) => {
                            const laneLabel = { top: '上路', mid: '中路', bot: '下路' }[lane];
                            const myProg = 100 - l.progress;
                            const color = myProg > 60 ? '#2ecc71' : myProg < 40 ? '#e74c3c' : '#f0c040';
                            return `<div class="lane-status-row">
                                <span class="lane-status__name">${laneLabel}</span>
                                <div class="lane-status__bar"><div class="lane-status__fill" style="width:${myProg}%;background:${color}"></div></div>
                                <span class="lane-status__value" style="color:${color}">${myProg}%</span>
                                <span class="lane-status__towers">🏰${l.myTowers} vs ${l.enemyTowers}🏰</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
            <button class="btn btn--gold btn--large" id="btn-next-round">${result.gameOver ? '查看结果' : '下一轮 →'}</button>
        </div>`;

        sfxCardReveal();
        const killEvents = settlements.filter(s => s.type === 'kill' || s.type === 'ambush' || s.type === 'teamfight_win');
        if (killEvents.length) setTimeout(() => sfxKill(), 300);
        if (settlements.some(s => s.type === 'tower')) setTimeout(() => sfxTowerDestroy(), 500);
        if (settlements.some(s => s.type === 'objective')) setTimeout(() => sfxObjective(), 400);

        // 弹幕
        for (const s of settlements.slice(0, 3)) {
            this._fireDanmaku(s.desc);
            await this._sleep(300);
        }

        if (settlements.length) {
            await this._comment(settlements[0].desc);
        }

        await new Promise(res => main.querySelector('#btn-next-round')?.addEventListener('click', res));
    }

    async _playFinale() {
        const cbs = this._cardBattle;
        const m = cbs.momentum;
        this._setRoundLabel('决胜轮');

        const main = this._main;
        const status = m >= 60 ? '顺风' : m > 40 ? '均势' : '逆风';
        const statusColor = m >= 60 ? '#2ecc71' : m > 40 ? '#f0c040' : '#e74c3c';

        main.innerHTML = `<div class="finale-panel">
            <h2 class="finale-title">⚔️ 决胜时刻</h2>
            <div class="finale-status">
                <span>当前势能</span>
                <span class="finale-momentum" style="color:${statusColor}">${Math.round(m)} — ${status}</span>
            </div>
            <div class="finale-map">${createMobaMapSVG(cbs.lanes, { baronAlive: false, lordAlive: cbs.lordAlive })}</div>
            ${m >= 60 ? `
                <p class="finale-desc">我方优势明显！选择终结方式：</p>
                <div class="finale-choices">
                    <button class="finale-btn finale-btn--push" data-choice="push">🏰 强攻水晶<br><span>快速但有风险</span></button>
                    <button class="finale-btn finale-btn--safe" data-choice="safe">🛡️ 步步为营<br><span>稳健推进</span></button>
                </div>
            ` : m > 40 ? `
                <p class="finale-desc">局势焦灼！将进行最终团战决定胜负！</p>
                <button class="btn btn--gold btn--large finale-fight" data-choice="fight">⚔️ 最终团战</button>
            ` : `
                <p class="finale-desc">形势危急！拼死一搏！</p>
                <button class="btn btn--danger btn--large finale-fight" data-choice="desperate">🔥 绝境反击</button>
            `}
        </div>`;

        const choice = await new Promise(res => {
            main.querySelectorAll('[data-choice]').forEach(btn => {
                btn.addEventListener('click', () => res(btn.dataset.choice));
            });
        });

        const result = cbs.resolveFinale(choice);
        this._finaleResult = result;
    }

    async _showFinalResult() {
        const cbs = this._cardBattle;
        const result = this._finaleResult || cbs.resolveFinale('safe');
        this._recordMatchResult(result);

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
        const main = this._main;

        if (result.won) {
            sfxVictory(); setTimeout(() => sfxCheer(), 1200);
            main.innerHTML = `<div class="round-result round-result--victory">
                <div class="victory-banner"><h2>🏆 VICTORY</h2><p>${this._myTeam.name} 赢得比赛！</p></div>
                <div class="match-stats">
                    <div class="match-stat">击杀 ${result.kills.my}:${result.kills.enemy}</div>
                    <div class="match-stat">推塔 ${result.towers.my}:${result.towers.enemy}</div>
                    <div class="match-stat">经济 ${result.gold.my}:${result.gold.enemy}</div>
                    <div class="match-stat">MVP: ${result.mvp?.id || '—'}</div>
                </div>
                ${otherHTML}
                <button class="btn btn--gold btn--large" id="btn-finish">返回基地</button>
            </div>`;
        } else {
            sfxDefeat();
            main.innerHTML = `<div class="round-result round-result--defeat">
                <div class="defeat-banner"><h2>DEFEAT</h2><p>${this._enemyTeam.name} 赢得比赛</p></div>
                <div class="match-stats">
                    <div class="match-stat">击杀 ${result.kills.my}:${result.kills.enemy}</div>
                    <div class="match-stat">推塔 ${result.towers.my}:${result.towers.enemy}</div>
                    <div class="match-stat">经济 ${result.gold.my}:${result.gold.enemy}</div>
                </div>
                ${otherHTML}
                <button class="btn btn--outline btn--large" id="btn-finish">返回基地</button>
            </div>`;
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

    /* ====================== BP 辅助方法（保持原有） ====================== */
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
        const hasPicks = picks.my.length > 0 || picks.enemy.length > 0;
        const wrColor = wr.my > 55 ? 'var(--color-success)' : wr.my < 45 ? 'var(--color-danger)' : 'var(--color-text-dim)';
        const wrEnemyColor = wr.enemy > 55 ? 'var(--color-danger)' : wr.enemy < 45 ? 'var(--color-success)' : 'var(--color-text-dim)';

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
                const h = pickList[i]; const r = roleList[i];
                html += `<div class="bp-pick-slot ${h ? 'bp-pick-slot--filled' : ''}">${h ? this._heroCard(h, 42) : `<span class="bp-pick-placeholder">${r || '?'}</span>`}${r ? `<span class="bp-pick-role-tag">${r}</span>` : ''}</div>`;
            }
            return html;
        };

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
                    ${hasPicks ? `<div class="bp-winrate">
                        <div class="bp-winrate__bar"><div class="bp-winrate__fill bp-winrate__fill--my" style="width:${wr.my}%"></div></div>
                        <div class="bp-winrate__labels">
                            <span style="color:${wrColor}">${this._myTeam.shortName} ${wr.my}%</span>
                            <span class="bp-winrate__vs">预估胜率</span>
                            <span style="color:${wrEnemyColor}">${wr.enemy}% ${this._enemyTeam.shortName}</span>
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
                    <div class="coach-header"><span class="coach-icon">🎙️</span><span class="coach-title">AI 教练</span>
                        <label class="coach-llm-toggle" title="启用/关闭大模型推理"><input type="checkbox" id="coach-llm-switch" ${getCoachConfig().apiKey && getCoachConfig().enableBP !== false ? 'checked' : ''} /><span class="coach-llm-toggle__label">LLM</span></label></div>
                    <div class="coach-content" id="coach-content"><div class="coach-loading">分析中...</div></div>
                </div>
            </div>
        </div>`;

        this._updateCoachAnalysis(banned, picks, myPickRoles, enemyPickRoles, phase);
        this._bindCoachLLMToggle();
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

    _updateBPStatus(main, text) {
        const el = main.querySelector('#bp-status');
        if (!el) return;
        el.textContent = text;
        const isThinking = text.includes('正在思考') || text.includes('正在选人');
        el.classList.toggle('bp-board__step--thinking', isThinking);
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

    _buildHeroTabsAndGrid(candidates, recMap, enemyPicks, defaultType = 'warrior') {
        const grouped = { warrior: [], mage: [], tank: [], assassin: [], marksman: [], support: [] };
        candidates.forEach(name => { const hero = getHero(name); if (hero && grouped[hero.role]) grouped[hero.role].push(name); });
        const roleOrder = ['warrior', 'mage', 'assassin', 'tank', 'marksman', 'support'];
        const tabs = roleOrder.map(role => {
            const ri = HERO_ROLES[role]; const count = grouped[role].length;
            return `<button class="bp-type-tab ${role === defaultType ? 'bp-type-tab--active' : ''}" data-type="${role}" style="--tab-color:${ri.color}">${ri.icon} ${ri.name}<span class="bp-type-tab__count">${count}</span></button>`;
        }).join('');
        const panels = roleOrder.map(role => {
            const heroes = grouped[role];
            return `<div class="bp-type-panel ${role === defaultType ? 'bp-type-panel--active' : ''}" data-panel="${role}">
                ${heroes.length ? heroes.map(name => {
                    const hero = getHero(name);
                    const rec = recMap.get(name);
                    const ci = getCounterInfo(name); const countersEnemy = enemyPicks.filter(ep => ci.counters.includes(ep));
                    const recClass = rec ? (rec.type === 'ban' ? 'bp-hero-btn--rec-ban' : 'bp-hero-btn--rec-pick') : '';
                    return `<button class="bp-hero-btn ${recClass}" data-hero="${name}">
                        <span class="bp-hero-btn__avatar">${hero ? heroImgHTML(hero.id, name, 56) : ''}</span>
                        <span class="bp-hero-btn__name">${name}</span>
                        ${rec ? `<span class="bp-hero-btn__rec bp-hero-btn__rec--${rec.type}" title="${rec.reason}">${rec.type === 'ban' ? '禁' : '选'}</span>` : ''}
                        ${countersEnemy.length ? `<span class="bp-hero-btn__counter">克${countersEnemy[0]}</span>` : ''}
                    </button>`;
                }).join('') : '<div class="bp-type-empty">暂无</div>'}
            </div>`;
        }).join('');
        return `<div class="bp-type-tabs">${tabs}</div><div class="bp-type-panels">${panels}</div>`;
    }

    _bindHeroTabEvents(container, onHeroClick) {
        container.querySelectorAll('.bp-type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.bp-type-tab').forEach(t => t.classList.remove('bp-type-tab--active'));
                container.querySelectorAll('.bp-type-panel').forEach(p => p.classList.remove('bp-type-panel--active'));
                tab.classList.add('bp-type-tab--active');
                container.querySelector(`[data-panel="${tab.dataset.type}"]`)?.classList.add('bp-type-panel--active');
            });
        });
        container.querySelectorAll('.bp-hero-btn').forEach(btn => { btn.addEventListener('click', () => onHeroClick(btn.dataset.hero)); });
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

        selectArea.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, recMap, picks.enemy);
        return new Promise(res => { this._bindHeroTabEvents(selectArea, hero => res(hero)); });
    }

    async _bpPickWithRole(main, bpCtx, bannedList, pickedList, picks, myPickRoles, roles, banned) {
        const selectArea = main.querySelector('#bp-select-area');
        if (!selectArea) return { hero: '赵云', role: '打野' };
        const unavailable = new Set([...bannedList, ...pickedList]);
        const remainRoles = roles.filter(r => !myPickRoles.includes(r));
        let currentRole = remainRoles[0] || roles[0];
        const allHeroNames = Object.keys(HEROES).filter(h => !unavailable.has(h));

        const ROLE_TO_TYPE = { '对抗路': 'warrior', '打野': 'assassin', '中路': 'mage', '发育路': 'marksman', '游走': 'support' };

        const _buildRecMap = () => {
            const recs = getStructuredRecommendations({
                phase: 'pick', myBans: banned?.my || [], enemyBans: banned?.enemy || [],
                myPicks: picks.my, enemyPicks: picks.enemy, myPickRoles,
                enemyStarters: this._enemyStarters,
            });
            return new Map(recs.map(r => [r.hero, r]));
        };

        const _defaultType = () => ROLE_TO_TYPE[currentRole] || 'warrior';

        const roleTabsHTML = `<div class="bp-role-tabs"><span class="bp-role-tab-hint">为哪个位置选人？</span>
            ${remainRoles.map((r, i) => `<button class="bp-role-tab ${i===0?'bp-role-tab--active':''}" data-role="${r}">${r}</button>`).join('')}</div>`;
        selectArea.innerHTML = `${roleTabsHTML}<div id="bp-grid-container">${this._buildHeroTabsAndGrid(allHeroNames, _buildRecMap(), picks.enemy, _defaultType())}</div>`;
        let resolveHero;
        const heroPromise = new Promise(res => { resolveHero = res; });
        const gridContainer = selectArea.querySelector('#bp-grid-container');
        this._bindHeroTabEvents(gridContainer, hero => resolveHero(hero));
        selectArea.querySelectorAll('.bp-role-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                selectArea.querySelectorAll('.bp-role-tab').forEach(t => t.classList.remove('bp-role-tab--active'));
                tab.classList.add('bp-role-tab--active');
                currentRole = tab.dataset.role;
                gridContainer.innerHTML = this._buildHeroTabsAndGrid(allHeroNames, _buildRecMap(), picks.enemy, _defaultType());
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
