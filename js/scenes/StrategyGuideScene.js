/**
 * StrategyGuideScene — 策略图鉴场景
 * 赛前研究工具：查看所有节点的策略卡效果和克制关系
 */
import { game } from '../core/GameEngine.js';
import { STRATEGY_PHASES, STRATEGY_TYPES, getCounterDescription } from '../data/strategyCards.js';
import { sfxSelect } from '../ui/SoundManager.js';

export class StrategyGuideScene {
    async enter(container) {
        this._container = container;
        this._activePhaseIdx = 0;
        this._activeCardId = null;
        container.className = 'scene scene--strategy-guide';
        this._render();
    }

    exit() { this._container = null; }

    _render() {
        const phase = STRATEGY_PHASES[this._activePhaseIdx];
        const cards = this._getPhaseCards(phase);
        const activeCard = cards.find(c => c.id === this._activeCardId) || null;

        this._container.innerHTML = `<div class="strategy-guide">
            <div class="sg__header">
                <div class="sg__title">📖 策略图鉴</div>
                <button class="sg__back" id="sg-back">← 返回</button>
            </div>
            <div class="sg__body">
                <div class="sg__nav" id="sg-nav">
                    ${STRATEGY_PHASES.map((p, i) => `
                        <button class="sg__nav-item ${i === this._activePhaseIdx ? 'sg__nav-item--active' : ''}" data-idx="${i}">
                            <span class="sg__nav-icon">${p.icon}</span>
                            <span class="sg__nav-label">${p.name}</span>
                            <span class="sg__nav-time">${p.time}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="sg__grid">
                    <div class="sg__grid-title">${phase.icon} ${phase.name}（${phase.time}）— ${phase.desc}</div>
                    <div class="sg__cards" id="sg-cards">
                        ${cards.map(c => this._renderCardThumb(c, c.id === this._activeCardId)).join('')}
                    </div>
                </div>
                <div class="sg__detail" id="sg-detail">
                    ${activeCard ? this._renderDetail(activeCard, phase) : '<div class="sg__detail-empty">← 点击策略卡查看详情</div>'}
                </div>
            </div>
        </div>`;

        this._bind();
    }

    _getPhaseCards(phase) {
        if (phase.dynamic && phase.cardSets) {
            return [
                ...phase.cardSets.ahead.cards.map(c => ({ ...c, _set: '顺风' })),
                ...phase.cardSets.even.cards.map(c => ({ ...c, _set: '均势' })),
                ...phase.cardSets.behind.cards.map(c => ({ ...c, _set: '逆风' })),
            ];
        }
        return phase.cards || [];
    }

    _renderCardThumb(card, isActive) {
        const typeInfo = STRATEGY_TYPES[card.type] || STRATEGY_TYPES.tactic;
        return `<div class="sg-card sg-card--${card.type} ${isActive ? 'sg-card--active' : ''}" data-card-id="${card.id}">
            <div class="sg-card__header">
                <span class="sg-card__icon">${card.icon}</span>
                <span class="sg-card__name">${card.name}</span>
            </div>
            <div class="sg-card__desc">${card.desc}</div>
            ${card._set ? `<div style="font-size:10px;color:var(--color-gold);margin-top:4px;">条件：${card._set}</div>` : ''}
        </div>`;
    }

    _renderDetail(card, phase) {
        const typeInfo = STRATEGY_TYPES[card.type] || STRATEGY_TYPES.tactic;
        const allCards = this._getPhaseCards(phase);
        const countersCard = allCards.find(c => c.id === card.counters);
        const counteredByCard = allCards.find(c => c.id === card.counteredBy);

        const effects = [];
        if (card.effect.momentum) effects.push({ text: `势能 +${card.effect.momentum}`, cls: 'gain' });
        if (card.effect.gold) effects.push({ text: `经济 +${card.effect.gold}`, cls: 'gain' });
        if (card.effect.goldSteal) effects.push({ text: `偷取经济 +${card.effect.goldSteal}`, cls: 'gain' });
        if (card.effect.buff === 'baron') effects.push({ text: '🐉 暴君buff', cls: 'buff' });
        if (card.effect.buff === 'lord') effects.push({ text: '👑 主宰buff', cls: 'buff' });
        if (card.effect.killChance) effects.push({ text: `击杀概率 ${Math.round(card.effect.killChance * 100)}%`, cls: 'gain' });
        if (card.effect.counterKill) effects.push({ text: `反杀势能 +${card.effect.counterKill}`, cls: 'gain' });
        if (card.effect.damageBonus) effects.push({ text: `伤害加成 +${Math.round(card.effect.damageBonus * 100)}%`, cls: 'gain' });
        if (card.effect.defenseBonus) effects.push({ text: `防御加成 +${Math.round(card.effect.defenseBonus * 100)}%`, cls: 'gain' });
        if (card.effect.desperateWinRate) effects.push({ text: `翻盘概率 ${Math.round(card.effect.desperateWinRate * 100)}%`, cls: 'gain' });
        if (card.effect.backdoorWinRate) effects.push({ text: `偷家概率 ${Math.round(card.effect.backdoorWinRate * 100)}%`, cls: 'gain' });
        if (card.effect.triggerTeamfight) effects.push({ text: '触发最终团战', cls: 'gain' });

        const costs = [];
        if (card.cost.devPenalty) costs.push({ text: `发育延迟 ${card.cost.devPenalty}s`, cls: 'cost' });
        if (card.cost.jgDevPause) costs.push({ text: '打野发育暂停', cls: 'cost' });
        if (card.cost.devPause) costs.push({ text: '经济发育暂停', cls: 'cost' });
        if (card.cost.drakeLost) costs.push({ text: '可能丢失暴君', cls: 'cost' });
        if (card.cost.baronLost) costs.push({ text: '可能丢失主宰', cls: 'cost' });
        if (card.cost.baronGiven) costs.push({ text: '放弃主宰争夺', cls: 'cost' });
        if (card.cost.noRetreat) costs.push({ text: '无法撤退', cls: 'cost' });
        if (card.cost.highRisk) costs.push({ text: '高风险', cls: 'cost' });

        const counterCycleCards = (phase.cards || []).filter(c => c.counters);
        let cycleHTML = '';
        if (counterCycleCards.length >= 3) {
            const visited = new Set();
            const cycle = [];
            let current = counterCycleCards[0];
            while (current && !visited.has(current.id)) {
                visited.add(current.id);
                cycle.push(current);
                current = counterCycleCards.find(c => c.id === current.counters);
            }
            if (cycle.length >= 3) {
                cycleHTML = `<div class="sg-detail__section">
                    <div class="sg-detail__label">克制循环</div>
                    <div class="sg-detail__cycle">
                        ${cycle.map((c, i) => `<span>${c.icon} ${c.name}</span>${i < cycle.length - 1 ? '<span class="sg-detail__cycle-arrow">→</span>' : '<span class="sg-detail__cycle-arrow">→</span><span>${cycle[0].icon}</span>'}`).join('')}
                    </div>
                </div>`;
            }
        }

        return `
            <div class="sg-detail__header">
                <div class="sg-detail__icon">${card.icon}</div>
                <div class="sg-detail__info">
                    <div class="sg-detail__name">${card.name}</div>
                    <div class="sg-detail__type" style="color:${typeInfo.color}">${typeInfo.icon} ${typeInfo.name}</div>
                </div>
            </div>
            <div class="sg-detail__section">
                <div class="sg-detail__label">策略描述</div>
                <div class="sg-detail__text">${card.detailDesc || card.desc}</div>
            </div>
            ${effects.length ? `<div class="sg-detail__section">
                <div class="sg-detail__label">效果收益</div>
                <div class="sg-detail__effects">
                    ${effects.map(e => `<div class="sg-detail__effect sg-detail__effect--${e.cls}">${e.text}</div>`).join('')}
                </div>
            </div>` : ''}
            ${costs.length ? `<div class="sg-detail__section">
                <div class="sg-detail__label">代价</div>
                <div class="sg-detail__effects">
                    ${costs.map(e => `<div class="sg-detail__effect sg-detail__effect--${e.cls}">${e.text}</div>`).join('')}
                </div>
            </div>` : ''}
            <div class="sg-detail__section">
                <div class="sg-detail__label">克制关系</div>
                <div class="sg-detail__counters">
                    ${countersCard ? `<div class="sg-detail__counter sg-detail__counter--win">✓ 克制「${countersCard.icon} ${countersCard.name}」</div>` : ''}
                    ${counteredByCard ? `<div class="sg-detail__counter sg-detail__counter--lose">✕ 被「${counteredByCard.icon} ${counteredByCard.name}」克制</div>` : ''}
                    ${card.noCounter ? `<div class="sg-detail__counter sg-detail__counter--safe">🛡️ 安全牌，无克制关系，收益稳定但偏低</div>` : ''}
                    ${!countersCard && !counteredByCard && !card.noCounter ? `<div class="sg-detail__counter sg-detail__counter--safe">决胜期策略无固定克制关系</div>` : ''}
                </div>
            </div>
            ${cycleHTML}
            ${card.bonusWhenAhead ? `<div class="sg-detail__section">
                <div class="sg-detail__label">顺风加成</div>
                <div class="sg-detail__bonus">🔥 ${card.bonusWhenAhead}</div>
            </div>` : ''}
            ${card.bonusWhenBehind ? `<div class="sg-detail__section">
                <div class="sg-detail__label">逆风加成</div>
                <div class="sg-detail__bonus">💪 ${card.bonusWhenBehind}</div>
            </div>` : ''}
            ${card.unlockCondition ? `<div class="sg-detail__section">
                <div class="sg-detail__label">解锁条件</div>
                <div class="sg-detail__bonus">🔒 ${card.unlockCondition.role}选手评分 ≥ ${card.unlockCondition.minRating}</div>
            </div>` : ''}
        `;
    }

    _bind() {
        this._container.querySelector('#sg-back')?.addEventListener('click', () => {
            game.sceneManager.switchTo('home');
        });

        this._container.querySelectorAll('.sg__nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxSelect();
                this._activePhaseIdx = parseInt(btn.dataset.idx);
                this._activeCardId = null;
                this._render();
            });
        });

        this._container.querySelectorAll('.sg-card').forEach(el => {
            el.addEventListener('click', () => {
                sfxSelect();
                this._activeCardId = el.dataset.cardId;
                this._render();
            });
        });
    }
}
