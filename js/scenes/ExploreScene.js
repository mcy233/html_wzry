/**
 * ExploreScene - 城市探索场景（重构版）
 *
 * 设计理念：
 * - 地标可重复探索，每次获得不同随机事件和奖励
 * - 首次探索免费且有特殊奖励，后续需消耗体力/金币
 * - 美食提供临时buff（持续到下一场比赛结束）
 * - 地标有冷却时间（用已打比赛轮次衡量）
 * - 每次探索可能触发随机事件（遇到NPC、发现秘密等）
 */
import { game } from '../core/GameEngine.js';
import { CITIES } from '../data/cities.js';
import { getTeamById } from '../data/teams.js';
import { createElement, showToast } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { getRandomEvent } from '../data/cityEvents.js';
import { sfxExplore, sfxGold, sfxConfirm } from '../ui/SoundManager.js';

export class ExploreScene {
    async enter(container, params = {}) {
        this._container = container;
        const teamId = game.getState('teamId');
        const team = getTeamById(teamId);
        const cityName = params.city || team?.city || '北京';
        const city = CITIES[cityName];
        if (!city) { game.sceneManager.switchTo('home'); return; }
        this._city = city;
        this._cityName = cityName;

        if (!game.state.explore) game.state.explore = {};
        if (!game.state.explore[cityName]) {
            game.state.explore[cityName] = { visitCounts: {}, lastVisitRound: {}, foodBuffs: [] };
        }
        this._data = game.state.explore[cityName];

        container.className = 'scene scene--explore';
        this._render();
    }

    exit() { this._container = null; }

    _getCurrentRound() {
        return game.state.season?.round || 0;
    }

    _getVisitCount(id) {
        return this._data.visitCounts[id] || 0;
    }

    _getCooldownLeft(id) {
        const lastRound = this._data.lastVisitRound[id];
        if (lastRound === undefined) return 0;
        const cooldown = 2;
        return Math.max(0, cooldown - (this._getCurrentRound() - lastRound));
    }

    _render() {
        const city = this._city;
        const c = this._container;
        const gold = game.state.team.gold || 0;

        c.innerHTML = `
            <div class="explore">
                <header class="explore__header" style="--city-color:${city.color || '#333'}">
                    <button class="btn btn--back" id="btn-back">← 返回基地</button>
                    <div>
                        <h2 class="explore__city-name">${city.name}</h2>
                        <p class="explore__subtitle">${city.subtitle}</p>
                    </div>
                    <div class="explore__gold">💰 ${gold}</div>
                </header>
                <div class="explore__body">
                    <section class="explore__section">
                        <h3 class="explore__section-title">🏛️ 城市地标 <span class="explore__hint">可重复探索，每次有不同体验</span></h3>
                        <div class="explore__grid" id="landmarks-grid"></div>
                    </section>
                    <section class="explore__section">
                        <h3 class="explore__section-title">🍜 美食探索 <span class="explore__hint">提供临时增益（持续到下场比赛）</span></h3>
                        <div class="explore__grid" id="foods-grid"></div>
                    </section>
                    ${this._renderActiveBuffs()}
                </div>
            </div>
        `;

        c.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('home'));
        this._renderLandmarks();
        this._renderFoods();
    }

    _renderLandmarks() {
        const grid = this._container.querySelector('#landmarks-grid');
        const city = this._city;

        city.landmarks.forEach(lm => {
            const visitCount = this._getVisitCount(lm.id);
            const cooldownLeft = this._getCooldownLeft(lm.id);
            const isFirstVisit = visitCount === 0;
            const cost = isFirstVisit ? 0 : Math.min(lm.unlockCost + visitCount * 20, 500);
            const canAfford = (game.state.team.gold || 0) >= cost;
            const onCooldown = cooldownLeft > 0;

            const card = createElement('div', `explore-card ${onCooldown ? 'explore-card--cooldown' : ''}`);
            card.innerHTML = `
                <div class="explore-card__icon">${onCooldown ? '⏳' : '🏛️'}</div>
                <div class="explore-card__info">
                    <div class="explore-card__name">${lm.name} ${visitCount > 0 ? `<span class="visit-badge">已探索 ${visitCount}次</span>` : '<span class="visit-badge visit-badge--new">新</span>'}</div>
                    <div class="explore-card__desc">${lm.desc}</div>
                    <div class="explore-card__meta">
                        ${onCooldown ? `<span class="explore-card__cooldown">冷却中 (还需${cooldownLeft}轮比赛)</span>` : ''}
                        ${!onCooldown && cost > 0 ? `<span class="explore-card__cost">💰 ${cost}</span>` : ''}
                        ${isFirstVisit ? '<span class="explore-card__free">首次免费 + 特殊奖励</span>' : ''}
                    </div>
                </div>
            `;

            if (!onCooldown) {
                card.classList.add('explore-card--clickable');
                card.addEventListener('click', () => {
                    if (!canAfford && cost > 0) { showToast('金币不足！'); return; }
                    this._visitLandmark(lm, isFirstVisit, cost);
                });
            }
            grid.appendChild(card);
        });

        staggerIn([...grid.children], 60);
    }

    _renderFoods() {
        const grid = this._container.querySelector('#foods-grid');
        const city = this._city;
        const FOOD_COST = 30;

        city.foods.forEach(food => {
            const card = createElement('div', 'explore-card explore-card--food explore-card--clickable');
            card.innerHTML = `
                <div class="explore-card__icon">${food.icon}</div>
                <div class="explore-card__info">
                    <div class="explore-card__name">${food.name}</div>
                    <div class="explore-card__desc">${food.desc}</div>
                    <div class="explore-card__effect">增益: ${food.effect}</div>
                    <div class="explore-card__cost">💰 ${FOOD_COST}</div>
                </div>
            `;
            card.addEventListener('click', () => this._eatFood(food, FOOD_COST));
            grid.appendChild(card);
        });
    }

    _renderActiveBuffs() {
        const buffs = this._data.foodBuffs || [];
        if (!buffs.length) return '';
        return `<section class="explore__section">
            <h3 class="explore__section-title">✨ 当前美食增益</h3>
            <div class="active-buffs">
                ${buffs.map(b => `<span class="buff-tag">${b.icon} ${b.name}: ${b.effect}</span>`).join('')}
            </div>
        </section>`;
    }

    _visitLandmark(lm, isFirstVisit, cost) {
        if (cost > 0) game.state.team.gold -= cost;
        sfxExplore();

        this._data.visitCounts[lm.id] = (this._data.visitCounts[lm.id] || 0) + 1;
        this._data.lastVisitRound[lm.id] = this._getCurrentRound();

        if (isFirstVisit) {
            const landmarks = game.state.collection.landmarks || [];
            if (!landmarks.includes(lm.id)) landmarks.push(lm.id);
            game.updateState('collection.landmarks', landmarks);
        }

        const rewards = [];
        if (isFirstVisit && lm.reward) {
            rewards.push(this._applyReward(lm.reward));
        }

        const event = getRandomEvent(this._cityName);
        if (event.choices) {
            this._showEventWithChoices(lm, rewards, event);
            return;
        }

        rewards.push({ text: event.text, icon: event.icon, flavor: event.flavor });
        this._applyEffect(event.effect);

        if (Math.random() < 0.3) {
            const goldReward = 20 + Math.floor(Math.random() * 60);
            game.state.team.gold += goldReward;
            rewards.push({ text: `额外收获 ${goldReward} 金币`, icon: '💰' });
            sfxGold();
        }

        this._showExploreResult(lm, rewards);
    }

    _showEventWithChoices(lm, existingRewards, event) {
        const overlay = createElement('div', 'modal-overlay');
        overlay.innerHTML = `
            <div class="modal explore-modal">
                <div class="explore-modal__banner" style="background:linear-gradient(135deg, ${this._city.color}cc, ${this._city.color}66)">
                    <h3>${event.icon} 随机事件</h3>
                </div>
                <div class="modal__body">
                    <p class="event-text">${event.text}</p>
                    ${event.flavor ? `<p class="event-flavor">"${event.flavor}"</p>` : ''}
                    <div class="event-choices">
                        ${event.choices.map((c, i) => `<button class="btn ${i===0?'btn--gold':'btn--outline'} event-choice-btn" data-idx="${i}">${c.text}</button>`).join('')}
                    </div>
                </div>
            </div>
        `;
        event.choices.forEach((c, i) => {
            overlay.querySelector(`[data-idx="${i}"]`).addEventListener('click', () => {
                sfxConfirm();
                this._applyEffect(c.effect);
                existingRewards.push({ text: event.text + ' → ' + c.text, icon: event.icon, flavor: event.flavor });
                overlay.remove();
                this._showExploreResult(lm, existingRewards);
            });
        });
        this._container.appendChild(overlay);
    }

    _applyReward(reward) {
        switch (reward.type) {
            case 'stat': {
                const players = game.state.players || [];
                players.forEach(p => {
                    if (p.stats && p.stats[reward.stat] !== undefined) {
                        p.stats[reward.stat] = Math.min(99, p.stats[reward.stat] + reward.value);
                    }
                });
                return { text: `全队「${reward.stat}」+${reward.value}`, icon: '📈' };
            }
            case 'buff':
                return { text: `获得Buff「${reward.name}」: ${reward.value}`, icon: '✨' };
            case 'fans':
                game.state.team.fans = (game.state.team.fans || 0) + reward.value;
                return { text: `粉丝 +${reward.value}`, icon: '👥' };
            case 'fame':
                game.state.team.fame = (game.state.team.fame || 0) + reward.value;
                return { text: `声望 +${reward.value}`, icon: '⭐' };
            case 'morale':
                game.state.team.morale = Math.min(100, (game.state.team.morale || 70) + reward.value);
                return { text: `士气 +${reward.value}`, icon: '💪' };
            case 'recovery':
                (game.state.players || []).forEach(p => { p.condition = Math.min(100, (p.condition || 80) + reward.value); });
                return { text: `全队状态恢复 +${reward.value}`, icon: '💚' };
            case 'item':
                return { text: `获得道具「${reward.name}」`, icon: '🎁' };
            default:
                return { text: '获得了一些奖励', icon: '🎉' };
        }
    }

    _applyEffect(effect) {
        switch (effect.type) {
            case 'stat_random': {
                const stats = ['操作', '意识', '对线', '配合', '抗压', '心态'];
                const stat = stats[Math.floor(Math.random() * stats.length)];
                (game.state.players || []).forEach(p => {
                    if (p.stats?.[stat] !== undefined) p.stats[stat] = Math.min(99, p.stats[stat] + effect.value);
                });
                break;
            }
            case 'stat': {
                (game.state.players || []).forEach(p => {
                    if (p.stats?.[effect.stat] !== undefined) p.stats[effect.stat] = Math.min(99, p.stats[effect.stat] + effect.value);
                });
                break;
            }
            case 'recovery':
                (game.state.players || []).forEach(p => { p.condition = Math.min(100, (p.condition || 80) + effect.value); });
                break;
            case 'fans': game.state.team.fans = (game.state.team.fans || 0) + effect.value; break;
            case 'gold': game.state.team.gold = (game.state.team.gold || 0) + effect.value; break;
            case 'fame': game.state.team.fame = (game.state.team.fame || 0) + effect.value; break;
            case 'morale': game.state.team.morale = Math.max(0, Math.min(100, (game.state.team.morale || 70) + effect.value)); break;
        }
    }

    _eatFood(food, cost) {
        if ((game.state.team.gold || 0) < cost) { showToast('金币不足！'); return; }
        game.state.team.gold -= cost;

        this._data.foodBuffs = this._data.foodBuffs || [];
        const existing = this._data.foodBuffs.find(b => b.id === food.id);
        if (existing) {
            showToast(`${food.icon} ${food.name} 增益已生效中，无需重复购买`);
            game.state.team.gold += cost;
            return;
        }
        this._data.foodBuffs.push({ id: food.id, name: food.name, effect: food.effect, icon: food.icon });

        this._applyFoodEffect(food);
        showToast(`${food.icon} 品尝了 ${food.name}！${food.effect}`);
        game.save();
        this._render();
    }

    _applyFoodEffect(food) {
        const effectStr = food.effect;
        const players = game.state.players || [];
        if (effectStr.includes('士气')) {
            const val = parseInt(effectStr.match(/\d+/)?.[0]) || 10;
            game.state.team.morale = Math.min(100, (game.state.team.morale || 70) + val);
        }
        if (effectStr.includes('状态')) {
            const val = parseInt(effectStr.match(/\d+/)?.[0]) || 10;
            players.forEach(p => { p.condition = Math.min(100, (p.condition || 80) + val); });
        }
        if (effectStr.includes('默契') || effectStr.includes('配合')) {
            const val = parseInt(effectStr.match(/\d+/)?.[0]) || 2;
            players.forEach(p => { if (p.stats?.['配合'] !== undefined) p.stats['配合'] = Math.min(99, p.stats['配合'] + val); });
        }
    }

    _showExploreResult(lm, rewards) {
        const overlay = createElement('div', 'modal-overlay');
        overlay.innerHTML = `
            <div class="modal explore-modal">
                <div class="explore-modal__banner" style="background:linear-gradient(135deg, ${this._city.color}cc, ${this._city.color}66)">
                    <h3>🏛️ ${lm.name}</h3>
                    <span class="explore-modal__count">第 ${this._data.visitCounts[lm.id]} 次探索</span>
                </div>
                <div class="modal__body">
                    <p>${lm.desc}</p>
                    <div class="explore-rewards">
                        ${rewards.map(r => `<div class="explore-reward-item">
                            <span class="explore-reward-item__icon">${r.icon}</span>
                            <span class="explore-reward-item__text">${r.text}</span>
                            ${r.flavor ? `<span class="explore-reward-item__flavor">${r.flavor}</span>` : ''}
                        </div>`).join('')}
                    </div>
                </div>
                <button class="btn btn--primary modal__close">太好了！</button>
            </div>
        `;
        overlay.querySelector('.modal__close').addEventListener('click', () => {
            overlay.remove();
            game.save();
            this._render();
        });
        this._container.appendChild(overlay);
    }
}
