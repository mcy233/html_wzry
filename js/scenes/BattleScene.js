/**
 * BattleScene - 比赛场景 (5节点事件时间轴制)
 * 从 BPScene 接收 BP 结果，执行5节点策略博弈
 */
import { game } from '../core/GameEngine.js';
import { getTeamById } from '../data/teams.js';
import { MatchEngine } from '../systems/MatchEngine.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { STRATEGY_PHASES, STRATEGY_TYPES, LANE_TARGETS, getCounterDescription } from '../data/strategyCards.js';
import { createElement, typeWriter } from '../ui/Components.js';
import { shakeElement } from '../ui/Transitions.js';
import { teamLogoHTML } from '../ui/ImageManager.js';
import { ECONOMY, PLAYER, MORALE, GROWTH } from '../data/balance.js';
import { addTrainingExp } from '../systems/PlayerGrowth.js';
import { getTeamStyle } from '../data/cards.js';
import { sfxBattleStart, sfxVictory, sfxDefeat, sfxCheer, sfxConfirm, sfxSelect, sfxKill, sfxCardReveal, sfxTowerDestroy, sfxObjective, startBGM, stopBGM } from '../ui/SoundManager.js';

export class BattleScene {
    async enter(container, params = {}) {
        this._container = container;

        const bpData = game.state.bpResult;
        if (!bpData) {
            console.error('[BattleScene] No BP data found, redirecting to BP');
            game.sceneManager.switchTo('bp');
            return;
        }

        this._myTeam = getTeamById(bpData.myTeamId);
        this._enemyTeam = getTeamById(bpData.enemyTeamId);
        this._myStarters = bpData.myStarters;
        this._enemyStarters = bpData.enemyStarters;
        this._bpResult = bpData.bpResult;

        const teamId = bpData.myTeamId;
        this._season = this._loadSeason(teamId);
        this._currentMatch = this._season.getPlayerMatch();

        container.className = 'scene scene--battle';
        this._renderBattleUI();
        startBGM('battle');
        setTimeout(() => this._startMatch().catch(err => console.error('[Battle Error]', err)), 50);
    }

    _loadSeason(teamId) {
        if (game.state.seasonSystem) return SeasonSystem.fromSaveData(game.state.seasonSystem);
        const sys = new SeasonSystem(teamId); sys.initGroups(); return sys;
    }
    exit() { this._container = null; }

    _renderBattleUI() {
        this._container.innerHTML = `
            <div class="battle">
                <div class="battle__header">
                    <div class="battle__team battle__team--my">
                        <span class="battle__team-logo">${teamLogoHTML(this._myTeam.id, this._myTeam, 36)}</span>
                        <span class="battle__team-name">${this._myTeam.name}</span>
                    </div>
                    <div class="battle__center-info">
                        <div class="battle__round" id="round-label">比赛开始</div>
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
                <div class="node-timeline" id="node-timeline">${this._renderTimeline(0)}</div>
                <div class="battle__main" id="battle-main"></div>
                <div class="battle__commentary" id="commentary">
                    <div class="commentary__icon">🎙️</div>
                    <div class="commentary__text" id="commentary-text">比赛即将开始...</div>
                </div>
                <div class="battle__danmaku" id="danmaku-layer"></div>
            </div>`;
    }

    _renderTimeline(activeIdx) {
        return STRATEGY_PHASES.map((p, i) => {
            let cls = 'node-timeline__node';
            if (i < activeIdx) cls += ' node-timeline__node--done';
            else if (i === activeIdx) cls += ' node-timeline__node--active';
            return `<div class="${cls}">
                <div class="node-timeline__icon">${p.icon}</div>
                <div class="node-timeline__label">${p.name}</div>
            </div>`;
        }).join('<div class="node-timeline__connector"></div>');
    }

    /* ---------- helpers ---------- */
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
        const e = this._engine;
        if (!e) return;
        const q = (s) => this._container.querySelector(s);
        if (q('#kills-my')) q('#kills-my').textContent = e.kills.my;
        if (q('#kills-enemy')) q('#kills-enemy').textContent = e.kills.enemy;
        if (q('#towers-my')) q('#towers-my').textContent = e.towers.my;
        if (q('#towers-enemy')) q('#towers-enemy').textContent = e.towers.enemy;
        if (q('#gold-my')) q('#gold-my').textContent = e.gold.my;
        if (q('#gold-enemy')) q('#gold-enemy').textContent = e.gold.enemy;
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

    /* ====================== 5节点比赛主循环 ====================== */
    async _startMatch() {
        const style = getTeamStyle(this._enemyTeam.id);
        this._engine = new MatchEngine(
            this._myTeam, this._enemyTeam,
            this._myStarters, this._enemyStarters,
            this._bpResult,
            { morale: game.state.team?.morale || 70, enemyStyle: style }
        );

        this._updateMomentum(this._engine.momentum);
        sfxBattleStart();
        await this._comment('比赛正式开始！');
        await this._sleep(800);

        while (!this._engine.isFinished) {
            const info = this._engine.getPhaseInfo();
            this._updateTimeline(info.index);
            await this._playNode(info);
            if (this._engine.gameOver) break;
        }

        await this._showFinalResult();
    }

    _updateTimeline(activeIdx) {
        const el = this._container.querySelector('#node-timeline');
        if (el) el.innerHTML = this._renderTimeline(activeIdx);
    }

    async _playNode(info) {
        const { phase, cards, index } = info;
        this._setRoundLabel(`${phase.icon} ${phase.name}`);
        this._updateTimer(phase.timerMinutes);

        await this._comment(`${phase.icon} ${phase.name}（${phase.time}）— ${phase.desc}`);
        this._fireDanmaku(`${phase.icon} ${phase.name}开始！`);
        await this._sleep(600);

        const main = this._main;
        const engine = this._engine;

        let selectedCardId = null;
        let selectedLane = null;

        const renderNode = () => {
            const advice = engine.getCoachAdvice();
            const stateLabel = info.momentum >= 60 ? '顺风' : info.momentum <= 40 ? '逆风' : '均势';

            const recCard = advice.recommended;
            const starRating = (score) => {
                const s = Math.min(5, Math.max(1, Math.round(score / 5)));
                return '★'.repeat(s) + '☆'.repeat(5 - s);
            };

            let coachHTML = `<div class="coach-u__situation">📊 ${advice.situation}</div>`;
            if (advice.playerInsight) {
                coachHTML += `<div class="coach-u__insight">🔍 ${advice.playerInsight}</div>`;
            }
            if (recCard) {
                coachHTML += `<div class="coach-u__rec">
                    <div class="coach-u__rec-header">
                        <span class="coach-u__rec-label">推荐策略</span>
                        <span class="coach-u__rec-name">「${recCard.card.name}」</span>
                        <span class="coach-u__rec-stars">${starRating(recCard.score)}</span>
                    </div>
                    ${recCard.reasons.length ? `<div class="coach-u__rec-reasons">${recCard.reasons.map(r => `<div class="coach-u__reason">↳ ${r}</div>`).join('')}</div>` : ''}
                </div>`;
            }
            if (advice.alternatives.length) {
                coachHTML += `<div class="coach-u__alts">${advice.alternatives.map(a =>
                    `<div class="coach-u__alt">
                        <span class="coach-u__alt-label">备选</span>
                        <span class="coach-u__alt-name">「${a.card.name}」</span>
                        <span class="coach-u__alt-stars">${starRating(a.score)}</span>
                        ${a.reasons[0] ? `<span class="coach-u__alt-reason">— ${a.reasons[0]}</span>` : ''}
                    </div>`
                ).join('')}</div>`;
            }
            if (advice.warnings.length) {
                coachHTML += `<div class="coach-u__warnings">${advice.warnings.map(w => `<div class="coach-u__warn">⚠️ ${w}</div>`).join('')}</div>`;
            }

            main.innerHTML = `<div class="node-decision">
                <div class="node-decision__left">
                    <div class="node-scene">
                        <div class="node-scene__title">${phase.icon} ${phase.name}</div>
                        <div class="node-scene__time">${phase.time}</div>
                        <div class="node-scene__desc">${phase.desc}</div>
                    </div>
                    <div class="node-stats">
                        <div class="node-stat"><span class="node-stat__label">势能</span><span class="node-stat__value">${Math.round(engine.momentum)}</span></div>
                        <div class="node-stat"><span class="node-stat__label">击杀</span><span class="node-stat__value">${engine.kills.my}:${engine.kills.enemy}</span></div>
                        <div class="node-stat"><span class="node-stat__label">经济</span><span class="node-stat__value">${engine.gold.my}:${engine.gold.enemy}</span></div>
                        <div class="node-stat"><span class="node-stat__label">推塔</span><span class="node-stat__value">${engine.towers.my}:${engine.towers.enemy}</span></div>
                        ${engine.buffs.baron ? '<div class="node-stat node-stat--buff">🐉 暴君buff</div>' : ''}
                        ${engine.buffs.lord ? '<div class="node-stat node-stat--buff">👑 主宰buff</div>' : ''}
                    </div>
                    <div class="node-coach" id="node-coach">
                        <div class="node-coach__header">🎙️ AI 教练</div>
                        <div class="node-coach__body" id="node-coach-body">${coachHTML}</div>
                        <div class="node-coach__llm" id="node-coach-llm"></div>
                    </div>
                </div>
                <div class="node-decision__right">
                    <div class="node-cards-title">选择策略</div>
                    <div class="node-cards" id="node-cards">
                        ${cards.map(c => this._renderStrategyCard(c, phase, selectedCardId === c.id)).join('')}
                    </div>
                    ${phase.requireLaneChoice ? `
                        <div class="node-lane-choice ${selectedCardId ? '' : 'node-lane-choice--hidden'}" id="lane-choice">
                            <div class="node-lane-choice__title">选择Gank路线</div>
                            <div class="node-lane-choice__opts">
                                ${Object.entries(LANE_TARGETS).map(([k, v]) =>
                                    `<button class="node-lane-btn ${selectedLane === k ? 'node-lane-btn--active' : ''}" data-lane="${k}">${v.icon} ${v.short}</button>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <button class="btn btn--gold btn--large node-confirm" id="btn-confirm-node"
                        ${(!selectedCardId || (phase.requireLaneChoice && !selectedLane)) ? 'disabled' : ''}>
                        确认策略 ⚔️
                    </button>
                </div>
            </div>`;

            this._bindNodeInteractions(main, cards, phase, (cardId, lane) => {
                selectedCardId = cardId;
                selectedLane = lane;
                renderNode();
            });
        };

        renderNode();
        this._loadLLMAdvice(engine, main);

        const choice = await new Promise(resolve => {
            const bind = () => {
                const btn = main.querySelector('#btn-confirm-node');
                if (btn) btn.addEventListener('click', () => {
                    sfxConfirm();
                    resolve({ cardId: selectedCardId, lane: selectedLane });
                });
            };
            bind();
            this._onNodeReRender = bind;
        });

        const result = engine.resolveNode(choice);

        this._updateMomentum(result.momentum);
        this._updateScoreboard();

        await this._showNodeResult(result);
    }

    _renderStrategyCard(card, phase, isSelected) {
        const typeInfo = STRATEGY_TYPES[card.type] || STRATEGY_TYPES.tactic;
        const counterDesc = phase.cards ? getCounterDescription(card, phase) : { counters: null, counteredBy: null };

        return `<div class="strategy-card ${isSelected ? 'strategy-card--selected' : ''} strategy-card--${card.type}" data-card-id="${card.id}">
            <div class="strategy-card__header">
                <span class="strategy-card__icon">${card.icon}</span>
                <span class="strategy-card__name">${card.name}</span>
                <span class="strategy-card__type" style="color:${typeInfo.color}">${typeInfo.icon} ${typeInfo.name}</span>
            </div>
            <div class="strategy-card__body">
                <div class="strategy-card__desc">${card.desc}</div>
                ${card.effect.momentum ? `<div class="strategy-card__effect">势能 +${card.effect.momentum}</div>` : ''}
                ${card.effect.gold ? `<div class="strategy-card__effect">经济 +${card.effect.gold}</div>` : ''}
                ${card.effect.buff ? `<div class="strategy-card__effect strategy-card__effect--buff">🐉 获取${card.effect.buff === 'lord' ? '主宰' : '暴君'}buff</div>` : ''}
            </div>
            <div class="strategy-card__footer">
                ${counterDesc.counters ? `<span class="strategy-card__counter strategy-card__counter--win">✓ ${counterDesc.counters}</span>` : ''}
                ${counterDesc.counteredBy ? `<span class="strategy-card__counter strategy-card__counter--lose">✕ ${counterDesc.counteredBy}</span>` : ''}
                ${card.noCounter ? `<span class="strategy-card__counter strategy-card__counter--safe">安全牌 · 无克制</span>` : ''}
            </div>
        </div>`;
    }

    _bindNodeInteractions(main, cards, phase, onSelect) {
        main.querySelectorAll('.strategy-card').forEach(el => {
            el.addEventListener('click', () => {
                sfxSelect();
                const cardId = el.dataset.cardId;
                onSelect(cardId, phase.requireLaneChoice ? null : undefined);
                if (this._onNodeReRender) this._onNodeReRender();
            });
        });
        main.querySelectorAll('.node-lane-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxSelect();
                const lane = btn.dataset.lane;
                const selectedCard = main.querySelector('.strategy-card--selected');
                const cardId = selectedCard?.dataset?.cardId;
                onSelect(cardId, lane);
                if (this._onNodeReRender) this._onNodeReRender();
            });
        });
    }

    _loadLLMAdvice(engine, main) {
        const llmEl = main.querySelector('#node-coach-llm');
        if (llmEl) llmEl.innerHTML = '<div class="coach-u__llm-loading"><span class="coach-typing"></span> 深度分析中...</div>';

        engine.getCoachAdviceAsync().then(result => {
            const el = main.querySelector('#node-coach-llm');
            if (!el) return;
            if (result.type === 'llm') {
                el.innerHTML = `<div class="coach-u__llm-section">
                    <div class="coach-u__llm-header">🧠 深度分析</div>
                    <div class="coach-u__llm-body">${result.content.replace(/\n/g, '<br>')}</div>
                </div>`;
            } else {
                el.innerHTML = '';
            }
        }).catch(() => {
            const el = main.querySelector('#node-coach-llm');
            if (el) el.innerHTML = '';
        });
    }

    async _showNodeResult(result) {
        const main = this._main;
        const { phase, myCard, enemyCard, counterResult, events } = result;

        const counterLabel = {
            win: { text: '克制成功！', cls: 'result-counter--win', icon: '🎯' },
            lose: { text: '被克制！', cls: 'result-counter--lose', icon: '💀' },
            draw: { text: '策略相同', cls: 'result-counter--draw', icon: '🤝' },
            neutral: { text: '互不克制', cls: 'result-counter--neutral', icon: '⚡' },
        }[counterResult] || { text: '', cls: '', icon: '' };

        main.innerHTML = `<div class="node-result">
            <h3 class="node-result__title">${phase.icon} ${phase.name} — 结算</h3>
            <div class="node-result__versus">
                <div class="node-result__card node-result__card--my">
                    <div class="node-result__card-label">我方策略</div>
                    <div class="node-result__card-icon">${myCard.icon}</div>
                    <div class="node-result__card-name">${myCard.name}</div>
                </div>
                <div class="node-result__vs">
                    <div class="node-result__counter ${counterLabel.cls}">
                        <span class="node-result__counter-icon">${counterLabel.icon}</span>
                        <span>${counterLabel.text}</span>
                    </div>
                </div>
                <div class="node-result__card node-result__card--enemy">
                    <div class="node-result__card-label">对方策略</div>
                    <div class="node-result__card-icon">${enemyCard.icon}</div>
                    <div class="node-result__card-name">${enemyCard.name}</div>
                </div>
            </div>
            <div class="node-result__events">
                ${events.map(e => `<div class="node-result__event node-result__event--${e.side}">
                    <span class="node-result__event-icon">${e.icon}</span>
                    <span>${e.desc}</span>
                </div>`).join('')}
            </div>
            <div class="node-result__stats">
                <div class="node-result__stat">势能 <strong>${Math.round(result.momentum)}</strong></div>
                <div class="node-result__stat">击杀 <strong>${result.kills.my}:${result.kills.enemy}</strong></div>
                <div class="node-result__stat">经济 <strong>${result.gold.my}:${result.gold.enemy}</strong></div>
                <div class="node-result__stat">推塔 <strong>${result.towers.my}:${result.towers.enemy}</strong></div>
            </div>
            <button class="btn btn--gold btn--large" id="btn-next-node">
                ${result.gameOver ? '查看比赛结果' : '下一节点 →'}
            </button>
        </div>`;

        sfxCardReveal();
        if (counterResult === 'win') setTimeout(() => sfxKill(), 300);
        if (events.some(e => e.type === 'tower')) setTimeout(() => sfxTowerDestroy(), 500);
        if (events.some(e => e.type === 'buff')) setTimeout(() => sfxObjective(), 400);

        for (const e of events.slice(0, 3)) {
            this._fireDanmaku(e.desc);
            await this._sleep(300);
        }

        if (events.length) await this._comment(events[0].desc);

        await new Promise(res => main.querySelector('#btn-next-node')?.addEventListener('click', res));
    }

    async _showFinalResult() {
        const engine = this._engine;
        const summary = engine.getMatchSummary();
        this._recordMatchResult(summary);

        if (summary.won) {
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

        const baseExp = summary.won ? GROWTH.MATCH_WIN_EXP : GROWTH.MATCH_LOSE_EXP;
        const detailedBonus = Math.round(baseExp * GROWTH.DETAILED_BATTLE_BONUS);
        addTrainingExp(baseExp + detailedBonus);

        const otherHTML = this._renderOtherResults();
        const timelineHTML = this._renderMatchTimeline(summary.nodeHistory);
        stopBGM();
        const main = this._main;

        if (summary.won) {
            sfxVictory(); setTimeout(() => sfxCheer(), 1200);
            main.innerHTML = `<div class="round-result round-result--victory">
                <div class="victory-banner"><h2>🏆 VICTORY</h2><p>${this._myTeam.name} 赢得比赛！</p></div>
                <div class="match-stats">
                    <div class="match-stat">击杀 ${summary.kills.my}:${summary.kills.enemy}</div>
                    <div class="match-stat">推塔 ${summary.towers.my}:${summary.towers.enemy}</div>
                    <div class="match-stat">经济 ${summary.gold.my}:${summary.gold.enemy}</div>
                    <div class="match-stat">MVP: ${summary.mvp?.name || summary.mvp?.id || '—'}</div>
                </div>
                ${timelineHTML}
                ${otherHTML}
                <button class="btn btn--gold btn--large" id="btn-finish">返回赛事日历</button>
            </div>`;
        } else {
            sfxDefeat();
            main.innerHTML = `<div class="round-result round-result--defeat">
                <div class="defeat-banner"><h2>DEFEAT</h2><p>${this._enemyTeam.name} 赢得比赛</p></div>
                <div class="match-stats">
                    <div class="match-stat">击杀 ${summary.kills.my}:${summary.kills.enemy}</div>
                    <div class="match-stat">推塔 ${summary.towers.my}:${summary.towers.enemy}</div>
                    <div class="match-stat">经济 ${summary.gold.my}:${summary.gold.enemy}</div>
                </div>
                ${timelineHTML}
                ${otherHTML}
                <button class="btn btn--outline btn--large" id="btn-finish">返回赛事日历</button>
            </div>`;
        }
        game.save();
        this._container.querySelector('#btn-finish')?.addEventListener('click', () => game.sceneManager.switchTo('matchCalendar'));
    }

    _renderMatchTimeline(history) {
        if (!history || !history.length) return '';
        return `<div class="match-timeline">
            <h4 class="match-timeline__title">📋 比赛回顾</h4>
            <div class="match-timeline__nodes">
                ${history.map(h => {
                    const counterCls = {
                        win: 'timeline-node--win',
                        lose: 'timeline-node--lose',
                        draw: 'timeline-node--draw',
                        neutral: 'timeline-node--neutral',
                    }[h.counterResult] || '';
                    return `<div class="timeline-node ${counterCls}">
                        <div class="timeline-node__phase">${h.phase.icon} ${h.phase.name}</div>
                        <div class="timeline-node__cards">
                            <span class="timeline-node__my">${h.myCard.icon} ${h.myCard.name}</span>
                            <span class="timeline-node__vs">vs</span>
                            <span class="timeline-node__enemy">${h.enemyCard.icon} ${h.enemyCard.name}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
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

    _recordMatchResult(summary) {
        let match = this._currentMatch || this._season.getPlayerMatch();
        if (match) {
            const matchRound = match.round;
            this._season.recordPlayerMatch(match, summary.won, summary.kills?.my || 0, summary.kills?.enemy || 0);
            this._otherResults = this._season.simulateOtherMatches(matchRound);
        } else {
            this._otherResults = this._season.simulateOtherMatches();
        }
        this._season.advanceRound();
        game.state.season = game.state.season || {};
        game.state.season.phase = this._season.currentPhase?.id || 'annual_finals';
        game.state.season.round = this._season.currentRound;
        game.state.seasonSystem = this._season.toSaveData();
    }
}
