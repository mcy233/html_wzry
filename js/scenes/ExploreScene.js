import { game } from '../core/GameEngine.js';
import { CITIES } from '../data/cities.js';
import { getTeamById } from '../data/teams.js';
import { createElement, showToast } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { getRandomEvent, getSeasonEvent } from '../data/cityEvents.js';
import { getQuizForLandmark } from '../data/cityQuizzes.js';
import { REPUTATION } from '../data/balance.js';
import { sfxExplore, sfxGold, sfxConfirm, sfxClick, sfxVictory, sfxCheer } from '../ui/SoundManager.js';

const ROUTE_THEME_LABELS = {
    culture: { label: '文化探源', icon: '🏛️', color: '#b07d42' },
    esports: { label: '电竞朝圣', icon: '🎮', color: '#4a90d9' },
    food:    { label: '美食地图', icon: '🍜', color: '#e07b39' },
    walk:    { label: '城市漫步', icon: '🌃', color: '#6ab04c' },
};

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
        this._initExploreState(cityName);
        this._data = game.state.explore[cityName];
        container.className = 'scene scene--explore';
        this._applyCityBg(container, cityName);
        this._view = 'main';
        this._render();
    }

    exit() { this._container = null; }

    _applyCityBg(container, cityName) {
        const CITY_BG_MAP = {
            '北京': 'beijing', '成都': 'chengdu', '重庆': 'chongqing',
            '上海': 'shanghai', '武汉': 'wuhan',
        };
        const key = CITY_BG_MAP[cityName] || 'city-default';
        container.style.background =
            `linear-gradient(to bottom, rgba(10,14,23,0.55), rgba(10,14,23,0.92)),`
            + ` url('resources/bg/cities/${key}.webp') center/cover no-repeat`;
    }

    _initExploreState(cityName) {
        if (!game.state.explore) game.state.explore = {};
        const d = game.state.explore[cityName];
        if (!d) {
            game.state.explore[cityName] = {
                visitCounts: {}, lastVisitRound: {}, foodBuffs: [],
                postcards: [], routeProgress: {}, reputation: 0,
                npcsMet: [], quizzesAnswered: {}, foodsTasted: [],
            };
        } else {
            if (!d.postcards) d.postcards = [];
            if (!d.routeProgress) d.routeProgress = {};
            if (!d.reputation) d.reputation = 0;
            if (!d.npcsMet) d.npcsMet = [];
            if (!d.quizzesAnswered) d.quizzesAnswered = {};
            if (!d.foodsTasted) d.foodsTasted = [];
        }
    }

    _getCurrentRound() { return game.state.season?.round || 0; }

    _getRepLevel() {
        const rep = this._data.reputation || 0;
        const levels = REPUTATION.LEVELS;
        let lv = levels[0];
        for (const l of levels) { if (rep >= l.required) lv = l; }
        return lv;
    }

    _getNextRepLevel() {
        const rep = this._data.reputation || 0;
        const levels = REPUTATION.LEVELS;
        for (const l of levels) { if (rep < l.required) return l; }
        return null;
    }

    _addReputation(amount) {
        const before = this._getRepLevel();
        this._data.reputation = (this._data.reputation || 0) + amount;
        const after = this._getRepLevel();
        if (after.stars > before.stars) {
            showToast(`🎉 ${this._cityName}声望升级！${after.label}（${'⭐'.repeat(after.stars)}）`);
        }
    }

    _addPostcard(landmark) {
        const existing = this._data.postcards.find(p => p.id === landmark.id);
        if (existing) return false;
        this._data.postcards.push({
            id: landmark.id, name: landmark.name, city: this._cityName,
            desc: landmark.desc, date: new Date().toLocaleDateString('zh-CN'),
            icon: '🏛️',
        });
        return true;
    }

    // ─── Main View ───
    _render() {
        const c = this._container;
        const city = this._city;
        const gold = game.state.team.gold || 0;
        const repLevel = this._getRepLevel();
        const nextLevel = this._getNextRepLevel();
        const repPct = nextLevel
            ? ((this._data.reputation - repLevel.required) / (nextLevel.required - repLevel.required) * 100).toFixed(0)
            : 100;

        c.innerHTML = `
<div class="explore">
    <header class="explore__header" style="--city-color:${city.color || '#333'}">
        <button class="btn btn--back" id="btn-back">← 返回</button>
        <div>
            <h2 class="explore__city-name">${city.name}</h2>
            <p class="explore__subtitle">${city.subtitle}</p>
        </div>
        <div class="explore__gold">💰 ${gold}</div>
    </header>

    <nav class="explore__tabs" id="explore-tabs">
        <button class="explore__tab explore__tab--active" data-tab="routes">🗺️ 路线</button>
        <button class="explore__tab" data-tab="landmarks">🏛️ 地标</button>
        <button class="explore__tab" data-tab="foods">🍜 美食</button>
        <button class="explore__tab" data-tab="npcs">👤 NPC</button>
        <button class="explore__tab" data-tab="postcards">🗂️ 图鉴</button>
    </nav>

    <div class="explore__rep-bar">
        <span class="explore__rep-label">${'⭐'.repeat(repLevel.stars)} ${repLevel.label}</span>
        <div class="explore__rep-track">
            <div class="explore__rep-fill" style="width:${repPct}%;background:${city.color}"></div>
        </div>
        <span class="explore__rep-val">${this._data.reputation}${nextLevel ? '/' + nextLevel.required : ''}</span>
    </div>

    <div class="explore__body" id="explore-body"></div>
</div>`;

        this._container.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('home'));
        this._bindTabs();
        this._showTab('routes');
    }

    _bindTabs() {
        const tabs = this._container.querySelectorAll('.explore__tab');
        tabs.forEach(t => t.addEventListener('click', () => {
            sfxClick();
            tabs.forEach(x => x.classList.remove('explore__tab--active'));
            t.classList.add('explore__tab--active');
            this._showTab(t.dataset.tab);
        }));
    }

    _showTab(tab) {
        const body = this._container.querySelector('#explore-body');
        if (!body) return;
        body.innerHTML = '';
        switch (tab) {
            case 'routes': this._renderRoutes(body); break;
            case 'landmarks': this._renderLandmarks(body); break;
            case 'foods': this._renderFoods(body); break;
            case 'npcs': this._renderNPCs(body); break;
            case 'postcards': this._renderPostcards(body); break;
        }
    }

    _getSeasonPhase() {
        const results = game.state.results || [];
        if (!results.length) return 'pre_match';
        const last = results[results.length - 1];
        return last.won ? 'post_win' : 'post_lose';
    }

    // ─── Routes Tab ───
    _renderRoutes(body) {
        const city = this._city;

        const seasonPhase = this._getSeasonPhase();
        const seasonEvt = getSeasonEvent(seasonPhase);
        if (seasonEvt) {
            const phaseLabels = { pre_match: '🏟️ 赛事特别探索', post_win: '🎉 庆功探索', post_lose: '🔄 复盘探索' };
            const banner = createElement('div', 'season-event-banner');
            banner.innerHTML = `
<div class="season-event-banner__header">${phaseLabels[seasonPhase] || '赛事探索'}</div>
<div class="season-event-banner__body">
    <span class="season-event-banner__icon">${seasonEvt.icon}</span>
    <div class="season-event-banner__text">
        <p>${seasonEvt.text}</p>
        ${seasonEvt.flavor ? `<p class="season-event-banner__flavor">"${seasonEvt.flavor}"</p>` : ''}
    </div>
    <button class="btn btn--gold season-event-banner__btn" id="season-event-btn">参与</button>
</div>`;
            body.appendChild(banner);
            banner.querySelector('#season-event-btn').addEventListener('click', () => {
                sfxConfirm();
                this._applyEffect(seasonEvt.effect);
                this._addReputation(REPUTATION.GAIN_EXPLORE_LANDMARK);
                banner.innerHTML = `<div class="season-event-banner__done">${seasonEvt.icon} ${seasonEvt.text} — 已完成！</div>`;
                game.save();
            });
        }

        if (!city.routes?.length) {
            body.innerHTML += '<p class="explore__empty">该城市暂无主题路线</p>';
            return;
        }
        const html = city.routes.map(route => {
            const themeInfo = ROUTE_THEME_LABELS[route.theme] || ROUTE_THEME_LABELS.walk;
            const progress = this._data.routeProgress[route.id] || [];
            const totalNodes = route.nodes.length;
            const doneNodes = progress.length;
            const isComplete = doneNodes >= totalNodes;
            const pct = totalNodes > 0 ? (doneNodes / totalNodes * 100).toFixed(0) : 0;
            const nextNodeId = route.nodes.find(n => !progress.includes(n));
            const nextLm = nextNodeId ? city.landmarks.find(l => l.id === nextNodeId) : null;

            return `
<div class="route-card ${isComplete ? 'route-card--done' : ''}" data-route="${route.id}">
    <div class="route-card__header" style="border-left:4px solid ${themeInfo.color}">
        <span class="route-card__icon">${route.icon || themeInfo.icon}</span>
        <div class="route-card__title">
            <strong>${route.name}</strong>
            <span class="route-card__theme" style="color:${themeInfo.color}">${themeInfo.label}</span>
        </div>
        ${isComplete ? '<span class="route-card__badge">✅ 已完成</span>' : ''}
    </div>
    <p class="route-card__desc">${route.desc}</p>
    <div class="route-card__progress">
        <div class="route-card__progress-track">
            <div class="route-card__progress-fill" style="width:${pct}%;background:${themeInfo.color}"></div>
        </div>
        <span class="route-card__progress-text">${doneNodes}/${totalNodes}</span>
    </div>
    <div class="route-card__nodes">${route.nodes.map(nid => {
        const lm = city.landmarks.find(l => l.id === nid);
        const done = progress.includes(nid);
        return `<span class="route-node ${done ? 'route-node--done' : ''} ${nid === nextNodeId ? 'route-node--next' : ''}">${done ? '✅' : '🔵'} ${lm?.name || nid}</span>`;
    }).join(' → ')}</div>
    ${!isComplete && nextLm ? `<button class="btn btn--gold route-card__go" data-route="${route.id}" data-node="${nextNodeId}">前往「${nextLm.name}」探索</button>` : ''}
    ${isComplete ? `<div class="route-card__reward">🏆 路线徽章: ${route.badge.icon} ${route.badge.name}</div>` : ''}
</div>`;
        }).join('');

        body.innerHTML = html;
        body.querySelectorAll('.route-card__go').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const routeId = btn.dataset.route;
                const nodeId = btn.dataset.node;
                this._exploreRouteNode(routeId, nodeId);
            });
        });
        staggerIn([...body.children], 60);
    }

    _exploreRouteNode(routeId, nodeId) {
        const city = this._city;
        const route = city.routes.find(r => r.id === routeId);
        const landmark = city.landmarks.find(l => l.id === nodeId);
        if (!route || !landmark) return;

        sfxExplore();
        this._data.visitCounts[nodeId] = (this._data.visitCounts[nodeId] || 0) + 1;
        this._data.lastVisitRound[nodeId] = this._getCurrentRound();

        if (!this._data.routeProgress[routeId]) this._data.routeProgress[routeId] = [];
        if (!this._data.routeProgress[routeId].includes(nodeId)) {
            this._data.routeProgress[routeId].push(nodeId);
            this._addReputation(REPUTATION.GAIN_COMPLETE_ROUTE_NODE);
        }
        this._addReputation(REPUTATION.GAIN_EXPLORE_LANDMARK);

        const isFirstVisit = this._data.visitCounts[nodeId] === 1;
        if (isFirstVisit) {
            const landmarks = game.state.collection.landmarks || [];
            if (!landmarks.includes(nodeId)) landmarks.push(nodeId);
            game.updateState('collection.landmarks', landmarks);
        }

        const isNewPostcard = this._addPostcard(landmark);
        const isRouteComplete = this._data.routeProgress[routeId].length >= route.nodes.length;

        if (isRouteComplete) {
            this._addReputation(REPUTATION.GAIN_COMPLETE_FULL_ROUTE);
        }

        this._showLandmarkInteraction(landmark, route, isFirstVisit, isNewPostcard, isRouteComplete);
    }

    _showLandmarkInteraction(landmark, route, isFirstVisit, isNewPostcard, isRouteComplete) {
        const overlay = createElement('div', 'modal-overlay');
        const city = this._city;
        const rewards = [];

        if (isFirstVisit && landmark.reward) {
            rewards.push(this._applyReward(landmark.reward));
        }

        const sceneTexts = [
            `你来到了「${landmark.name}」，${landmark.desc}`,
            `${city.name}的气息扑面而来，你感受到这座城市独特的魅力...`,
        ];

        let html = `
<div class="modal explore-modal explore-interaction">
    <div class="explore-modal__banner" style="background:linear-gradient(135deg, ${city.color}cc, ${city.color}66)">
        <h3>🏛️ ${landmark.name}</h3>
        <span class="explore-modal__count">第 ${this._data.visitCounts[landmark.id]} 次探索</span>
    </div>
    <div class="modal__body explore-interaction__body">
        <p class="explore-interaction__scene">${sceneTexts[0]}</p>
        <p class="explore-interaction__flavor">${sceneTexts[1]}</p>`;

        if (isNewPostcard) {
            html += `<div class="explore-interaction__postcard">🗂️ 获得新明信片「${landmark.name}」！</div>`;
        }

        if (rewards.length) {
            html += `<div class="explore-rewards">${rewards.map(r =>
                `<div class="explore-reward-item"><span class="explore-reward-item__icon">${r.icon}</span><span>${r.text}</span></div>`
            ).join('')}</div>`;
        }

        if (isRouteComplete) {
            html += `<div class="explore-interaction__route-complete">🏆 路线「${route.name}」完成！获得徽章 ${route.badge.icon} ${route.badge.name}</div>`;
        }

        html += `<div class="explore-interaction__actions" id="interaction-actions"></div>
    </div>
</div>`;

        overlay.innerHTML = html;
        this._container.appendChild(overlay);

        const actions = overlay.querySelector('#interaction-actions');
        this._buildInteractionActions(actions, overlay, landmark, route);
    }

    _buildInteractionActions(actionsEl, overlay, landmark, route) {
        const npc = this._tryGetNPC(landmark.id);
        const quiz = this._tryGetQuiz(landmark.id);
        const event = getRandomEvent(this._cityName);

        let buttons = [];

        if (npc) {
            buttons.push({ label: `👤 与${npc.name}交谈`, action: () => this._startNPCDialog(overlay, npc) });
        }
        if (quiz) {
            buttons.push({ label: '📝 文旅知识问答', action: () => this._startQuiz(overlay, quiz, landmark.id) });
        }
        if (event) {
            buttons.push({ label: `${event.icon} 随机探索`, action: () => this._triggerEvent(overlay, event, landmark) });
        }
        buttons.push({ label: '✅ 完成探索', action: () => { overlay.remove(); game.save(); this._render(); this._showTab('routes'); } });

        actionsEl.innerHTML = buttons.map((b, i) =>
            `<button class="btn ${i === buttons.length - 1 ? 'btn--outline' : 'btn--gold'} explore-action-btn" data-idx="${i}">${b.label}</button>`
        ).join('');

        buttons.forEach((b, i) => {
            actionsEl.querySelector(`[data-idx="${i}"]`).addEventListener('click', () => {
                sfxClick();
                b.action();
            });
        });
    }

    _tryGetNPC(landmarkId) {
        const npcs = this._city.npcs || [];
        const unmet = npcs.filter(n => !this._data.npcsMet.includes(n.id));
        const pool = unmet.length > 0 ? unmet : npcs;
        if (pool.length === 0) return null;
        if (Math.random() > 0.6) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _tryGetQuiz(landmarkId) {
        const answeredIds = Object.keys(this._data.quizzesAnswered || {});
        return getQuizForLandmark(this._cityName, landmarkId, answeredIds);
    }

    _startNPCDialog(overlay, npc) {
        const body = overlay.querySelector('.explore-interaction__body') || overlay.querySelector('.modal__body');
        if (!this._data.npcsMet.includes(npc.id)) {
            this._data.npcsMet.push(npc.id);
            this._addReputation(REPUTATION.GAIN_NPC_MET);
        }

        const dialog = npc.dialog[Math.floor(Math.random() * npc.dialog.length)];
        const rewardResult = npc.reward ? this._applyReward(npc.reward) : null;

        body.innerHTML = `
<div class="npc-dialog">
    <div class="npc-dialog__avatar">${npc.icon}</div>
    <div class="npc-dialog__info">
        <strong class="npc-dialog__name">${npc.name}</strong>
        <span class="npc-dialog__desc">${npc.desc}</span>
    </div>
    <div class="npc-dialog__bubble">
        <p>"${dialog}"</p>
    </div>
    ${rewardResult ? `<div class="explore-reward-item"><span class="explore-reward-item__icon">${rewardResult.icon}</span><span>${rewardResult.text}</span></div>` : ''}
    <button class="btn btn--primary npc-dialog__close">继续探索</button>
</div>`;

        body.querySelector('.npc-dialog__close').addEventListener('click', () => {
            overlay.remove(); game.save(); this._render(); this._showTab('routes');
        });
    }

    _startQuiz(overlay, quiz, landmarkId) {
        const body = overlay.querySelector('.explore-interaction__body') || overlay.querySelector('.modal__body');

        body.innerHTML = `
<div class="quiz-panel">
    <h4 class="quiz-panel__title">📝 文旅知识问答</h4>
    <p class="quiz-panel__question">${quiz.q}</p>
    <div class="quiz-panel__options">
        ${quiz.options.map((opt, i) => `<button class="btn btn--outline quiz-option" data-idx="${i}">${opt}</button>`).join('')}
    </div>
</div>`;

        body.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const correct = idx === quiz.answer;
                if (quiz.id) this._data.quizzesAnswered[quiz.id] = correct;

                if (correct) {
                    this._addReputation(REPUTATION.GAIN_QUIZ_CORRECT);
                    sfxConfirm();
                }

                body.innerHTML = `
<div class="quiz-result ${correct ? 'quiz-result--correct' : 'quiz-result--wrong'}">
    <div class="quiz-result__icon">${correct ? '🎉' : '📖'}</div>
    <h4>${correct ? '回答正确！' : '答错了，但学到了知识'}</h4>
    <p class="quiz-result__answer">正确答案: ${quiz.options[quiz.answer]}</p>
    <p class="quiz-result__knowledge">${quiz.knowledge}</p>
    ${correct ? `<p class="quiz-result__reward">声望 +${REPUTATION.GAIN_QUIZ_CORRECT}</p>` : ''}
    <button class="btn btn--primary quiz-result__close">继续探索</button>
</div>`;

                body.querySelector('.quiz-result__close').addEventListener('click', () => {
                    overlay.remove(); game.save(); this._render(); this._showTab('routes');
                });
            });
        });
    }

    _triggerEvent(overlay, event, landmark) {
        const body = overlay.querySelector('.explore-interaction__body') || overlay.querySelector('.modal__body');

        if (event.choices) {
            body.innerHTML = `
<div class="event-panel">
    <p class="event-text">${event.icon} ${event.text}</p>
    ${event.flavor ? `<p class="event-flavor">"${event.flavor}"</p>` : ''}
    <div class="event-choices">
        ${event.choices.map((c, i) => `<button class="btn ${i === 0 ? 'btn--gold' : 'btn--outline'} event-choice-btn" data-idx="${i}">${c.text}</button>`).join('')}
    </div>
</div>`;
            event.choices.forEach((c, i) => {
                body.querySelector(`[data-idx="${i}"]`).addEventListener('click', () => {
                    sfxConfirm();
                    this._applyEffect(c.effect);
                    body.innerHTML = `
<div class="event-result">
    <p>${event.icon} ${event.text} → ${c.text}</p>
    ${event.flavor ? `<p class="event-flavor">"${event.flavor}"</p>` : ''}
    <button class="btn btn--primary event-result__close">完成</button>
</div>`;
                    body.querySelector('.event-result__close').addEventListener('click', () => {
                        overlay.remove(); game.save(); this._render(); this._showTab('routes');
                    });
                });
            });
        } else {
            this._applyEffect(event.effect);
            body.innerHTML = `
<div class="event-result">
    <div class="event-result__icon">${event.icon}</div>
    <p class="event-text">${event.text}</p>
    ${event.flavor ? `<p class="event-flavor">"${event.flavor}"</p>` : ''}
    <button class="btn btn--primary event-result__close">完成</button>
</div>`;
            body.querySelector('.event-result__close').addEventListener('click', () => {
                overlay.remove(); game.save(); this._render(); this._showTab('routes');
            });
        }
    }

    // ─── Landmarks Tab ───
    _renderLandmarks(body) {
        const city = this._city;
        body.innerHTML = `<div class="explore__section">
            <h3 class="explore__section-title">🏛️ 城市地标 <span class="explore__hint">可重复探索，每次有不同体验</span></h3>
            <div class="explore__grid" id="landmarks-grid"></div>
        </div>`;

        const grid = body.querySelector('#landmarks-grid');
        city.landmarks.forEach(lm => {
            const visitCount = this._data.visitCounts[lm.id] || 0;
            const cooldownLeft = this._getCooldownLeft(lm.id);
            const isFirstVisit = visitCount === 0;
            const cost = isFirstVisit ? 0 : Math.min((lm.unlockCost || 0) + visitCount * 20, 500);
            const canAfford = (game.state.team.gold || 0) >= cost;
            const onCooldown = cooldownLeft > 0;

            const card = createElement('div', `explore-card ${onCooldown ? 'explore-card--cooldown' : ''}`);
            card.innerHTML = `
                <div class="explore-card__icon">${onCooldown ? '⏳' : '🏛️'}</div>
                <div class="explore-card__info">
                    <div class="explore-card__name">${lm.name} ${visitCount > 0 ? `<span class="visit-badge">已探索 ${visitCount}次</span>` : '<span class="visit-badge visit-badge--new">新</span>'}</div>
                    <div class="explore-card__desc">${lm.desc}</div>
                    <div class="explore-card__meta">
                        ${onCooldown ? `<span class="explore-card__cooldown">冷却中 (还需${cooldownLeft}轮)</span>` : ''}
                        ${!onCooldown && cost > 0 ? `<span class="explore-card__cost">💰 ${cost}</span>` : ''}
                        ${isFirstVisit ? '<span class="explore-card__free">首次免费 + 特殊奖励</span>' : ''}
                    </div>
                </div>`;

            if (!onCooldown) {
                card.classList.add('explore-card--clickable');
                card.addEventListener('click', () => {
                    if (!canAfford && cost > 0) { showToast('金币不足！'); return; }
                    if (cost > 0) game.state.team.gold -= cost;
                    this._visitStandaloneLandmark(lm, isFirstVisit);
                });
            }
            grid.appendChild(card);
        });
        staggerIn([...grid.children], 60);
    }

    _visitStandaloneLandmark(lm, isFirstVisit) {
        sfxExplore();
        this._data.visitCounts[lm.id] = (this._data.visitCounts[lm.id] || 0) + 1;
        this._data.lastVisitRound[lm.id] = this._getCurrentRound();
        this._addReputation(REPUTATION.GAIN_EXPLORE_LANDMARK);

        if (isFirstVisit) {
            const landmarks = game.state.collection.landmarks || [];
            if (!landmarks.includes(lm.id)) landmarks.push(lm.id);
            game.updateState('collection.landmarks', landmarks);
        }

        this._addPostcard(lm);

        const rewards = [];
        if (isFirstVisit && lm.reward) rewards.push(this._applyReward(lm.reward));

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

    _getCooldownLeft(id) {
        const lastRound = this._data.lastVisitRound[id];
        if (lastRound === undefined) return 0;
        return Math.max(0, 2 - (this._getCurrentRound() - lastRound));
    }

    // ─── Foods Tab (Mini-game) ───
    _renderFoods(body) {
        const city = this._city;
        const FOOD_COST = 30;
        body.innerHTML = `<div class="explore__section">
            <h3 class="explore__section-title">🍜 美食探索 <span class="explore__hint">完成配对小游戏获得更强增益！</span></h3>
            <div class="explore__grid" id="foods-grid"></div>
            ${this._renderActiveBuffs()}
        </div>`;

        const grid = body.querySelector('#foods-grid');
        city.foods.forEach(food => {
            const tasted = this._data.foodsTasted.includes(food.id);
            const card = createElement('div', 'explore-card explore-card--food explore-card--clickable');
            card.innerHTML = `
                <div class="explore-card__icon">${food.icon}</div>
                <div class="explore-card__info">
                    <div class="explore-card__name">${food.name} ${tasted ? '<span class="visit-badge">已品尝</span>' : '<span class="visit-badge visit-badge--new">新</span>'}</div>
                    <div class="explore-card__desc">${food.desc}</div>
                    <div class="explore-card__effect">增益: ${food.effect}</div>
                    <div class="explore-card__cost">💰 ${FOOD_COST}</div>
                </div>`;
            card.addEventListener('click', () => this._startFoodGame(food, FOOD_COST));
            grid.appendChild(card);
        });
    }

    _startFoodGame(food, cost) {
        if ((game.state.team.gold || 0) < cost) { showToast('金币不足！'); return; }

        const existingBuff = (this._data.foodBuffs || []).find(b => b.id === food.id);
        if (existingBuff) {
            showToast(`${food.icon} ${food.name} 增益已生效中`);
            return;
        }

        game.state.team.gold -= cost;
        sfxClick();

        const overlay = createElement('div', 'modal-overlay');
        const GRID_SIZE = 6;
        const pairs = GRID_SIZE / 2;
        const emojis = ['🥢', '🍳', '🧄', '🌶️', '🥩', '🍚', '🥬', '🫘', '🧅'].slice(0, pairs);
        const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

        let flipped = [], matched = 0, moves = 0, locked = false, timeLeft = 20;

        overlay.innerHTML = `
<div class="modal explore-modal food-game">
    <div class="explore-modal__banner" style="background:linear-gradient(135deg, ${this._city.color}cc, ${this._city.color}66)">
        <h3>${food.icon} 美食配对 — ${food.name}</h3>
    </div>
    <div class="modal__body">
        <div class="food-game__timer">
            <span id="fg-timer">⏱️ ${timeLeft}s</span>
            <span id="fg-moves">步数: 0</span>
        </div>
        <div class="food-game__grid" id="fg-grid">
            ${cards.map((emoji, i) => `<div class="food-game__card" data-idx="${i}" data-emoji="${emoji}"><span class="food-game__card-back">?</span><span class="food-game__card-front">${emoji}</span></div>`).join('')}
        </div>
    </div>
</div>`;

        this._container.appendChild(overlay);

        const timerEl = overlay.querySelector('#fg-timer');
        const movesEl = overlay.querySelector('#fg-moves');
        const gridEl = overlay.querySelector('#fg-grid');

        const endGame = () => {
            clearInterval(timer);
            const score = matched;
            let grade, mult;
            if (score >= pairs) { grade = 'S'; mult = 1.5; }
            else if (score >= pairs - 1) { grade = 'A'; mult = 1.2; }
            else if (score >= 1) { grade = 'B'; mult = 1.0; }
            else { grade = 'C'; mult = 0.6; }

            if (!this._data.foodsTasted.includes(food.id)) {
                this._data.foodsTasted.push(food.id);
                this._addReputation(REPUTATION.GAIN_FOOD_TASTED);
            }

            this._data.foodBuffs = this._data.foodBuffs || [];
            this._data.foodBuffs.push({ id: food.id, name: food.name, effect: food.effect, icon: food.icon, grade });
            this._applyFoodEffect(food, mult);

            if (grade === 'S') sfxVictory();
            else sfxConfirm();

            overlay.querySelector('.modal__body').innerHTML = `
<div class="food-game__result">
    <div class="food-game__grade food-game__grade--${grade.toLowerCase()}">${grade}</div>
    <p>配对: ${score}/${pairs} | 步数: ${moves}</p>
    <p>${food.icon} ${food.name}增益 ×${mult}</p>
    <p class="food-game__effect">${food.effect}</p>
    <button class="btn btn--primary food-game__done">太好了！</button>
</div>`;
            overlay.querySelector('.food-game__done').addEventListener('click', () => {
                overlay.remove(); game.save(); this._render(); this._showTab('foods');
            });
        };

        const timer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `⏱️ ${timeLeft}s`;
            if (timeLeft <= 5) timerEl.style.color = '#e63946';
            if (timeLeft <= 0) endGame();
        }, 1000);

        gridEl.addEventListener('click', e => {
            const card = e.target.closest('.food-game__card');
            if (!card || locked || card.classList.contains('food-game__card--flipped') || card.classList.contains('food-game__card--matched')) return;

            card.classList.add('food-game__card--flipped');
            flipped.push(card);

            if (flipped.length === 2) {
                moves++;
                movesEl.textContent = `步数: ${moves}`;
                locked = true;
                const [a, b] = flipped;
                if (a.dataset.emoji === b.dataset.emoji) {
                    a.classList.add('food-game__card--matched');
                    b.classList.add('food-game__card--matched');
                    matched++;
                    flipped = [];
                    locked = false;
                    if (matched >= pairs) endGame();
                } else {
                    setTimeout(() => {
                        a.classList.remove('food-game__card--flipped');
                        b.classList.remove('food-game__card--flipped');
                        flipped = [];
                        locked = false;
                    }, 600);
                }
            }
        });
    }

    _applyFoodEffect(food, multiplier = 1) {
        const effectStr = food.effect;
        const players = game.state.players || [];
        if (effectStr.includes('士气')) {
            const val = Math.round((parseInt(effectStr.match(/\d+/)?.[0]) || 10) * multiplier);
            game.state.team.morale = Math.min(100, (game.state.team.morale || 70) + val);
        }
        if (effectStr.includes('状态')) {
            const val = Math.round((parseInt(effectStr.match(/\d+/)?.[0]) || 10) * multiplier);
            players.forEach(p => { p.condition = Math.min(100, (p.condition || 80) + val); });
        }
        if (effectStr.includes('默契') || effectStr.includes('配合')) {
            const val = Math.round((parseInt(effectStr.match(/\d+/)?.[0]) || 2) * multiplier);
            players.forEach(p => { if (p.stats?.['配合'] !== undefined) p.stats['配合'] = Math.min(99, p.stats['配合'] + val); });
        }
        if (effectStr.includes('属性')) {
            const stats = ['操作', '意识', '对线', '配合', '抗压', '心态'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            const val = Math.round((parseInt(effectStr.match(/\d+/)?.[0]) || 1) * multiplier);
            players.forEach(p => { if (p.stats?.[stat] !== undefined) p.stats[stat] = Math.min(99, p.stats[stat] + val); });
        }
    }

    // ─── NPCs Tab ───
    _renderNPCs(body) {
        const city = this._city;
        const npcs = city.npcs || [];
        if (!npcs.length) {
            body.innerHTML = '<p class="explore__empty">该城市暂无NPC</p>';
            return;
        }

        body.innerHTML = npcs.map(npc => {
            const met = this._data.npcsMet.includes(npc.id);
            return `
<div class="npc-card ${met ? 'npc-card--met' : 'npc-card--locked'}">
    <div class="npc-card__avatar">${met ? npc.icon : '❓'}</div>
    <div class="npc-card__info">
        <strong>${met ? npc.name : '???'}</strong>
        <p>${met ? npc.desc : '在路线探索中偶遇以解锁'}</p>
        ${met ? `<div class="npc-card__dialogs">${npc.dialog.map(d => `<p class="npc-card__dialog">"${d}"</p>`).join('')}</div>` : ''}
    </div>
    ${met ? '<span class="npc-card__badge">✅ 已遇见</span>' : '<span class="npc-card__badge npc-card__badge--locked">🔒</span>'}
</div>`;
        }).join('');

        staggerIn([...body.children], 60);
    }

    // ─── Postcards Tab ───
    _renderPostcards(body) {
        const city = this._city;
        const collected = this._data.postcards || [];
        const total = city.landmarks.length;
        const pct = total > 0 ? (collected.length / total * 100).toFixed(0) : 0;
        const allCollected = collected.length >= total;

        body.innerHTML = `
<div class="postcards-section">
    <div class="postcards-header">
        <span>🗂️ ${this._cityName}明信片图鉴</span>
        <span>${collected.length}/${total} ${allCollected ? '🏆 集齐!' : ''}</span>
    </div>
    <div class="postcards-progress">
        <div class="postcards-progress__track">
            <div class="postcards-progress__fill" style="width:${pct}%;background:${city.color}"></div>
        </div>
    </div>
    <div class="postcards-grid">
        ${city.landmarks.map(lm => {
            const pc = collected.find(p => p.id === lm.id);
            if (pc) {
                return `
<div class="postcard-card postcard-card--collected" style="border-color:${city.color}">
    <div class="postcard-card__icon">🏛️</div>
    <div class="postcard-card__name">${lm.name}</div>
    <div class="postcard-card__date">${pc.date}</div>
</div>`;
            } else {
                return `
<div class="postcard-card postcard-card--locked">
    <div class="postcard-card__icon">❓</div>
    <div class="postcard-card__name">${lm.name}</div>
    <div class="postcard-card__date">未收集</div>
</div>`;
            }
        }).join('')}
    </div>
</div>`;
    }

    // ─── Shared Helpers ───
    _renderActiveBuffs() {
        const buffs = this._data.foodBuffs || [];
        if (!buffs.length) return '';
        return `<div class="explore__section" style="margin-top:16px">
            <h3 class="explore__section-title">✨ 当前美食增益</h3>
            <div class="active-buffs">
                ${buffs.map(b => `<span class="buff-tag">${b.icon} ${b.name}: ${b.effect} ${b.grade ? `(${b.grade})` : ''}</span>`).join('')}
            </div>
        </div>`;
    }

    _applyReward(reward) {
        switch (reward.type) {
            case 'stat': {
                (game.state.players || []).forEach(p => {
                    if (p.stats && p.stats[reward.stat] !== undefined)
                        p.stats[reward.stat] = Math.min(99, p.stats[reward.stat] + reward.value);
                });
                return { text: `全队「${reward.stat}」+${reward.value}`, icon: '📈' };
            }
            case 'buff': return { text: `获得Buff「${reward.name}」: ${reward.value}`, icon: '✨' };
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
            case 'item': return { text: `获得道具「${reward.name}」`, icon: '🎁' };
            default: return { text: '获得了一些奖励', icon: '🎉' };
        }
    }

    _applyEffect(effect) {
        if (!effect) return;
        switch (effect.type) {
            case 'stat_random': {
                const stats = ['操作', '意识', '对线', '配合', '抗压', '心态'];
                const stat = stats[Math.floor(Math.random() * stats.length)];
                (game.state.players || []).forEach(p => {
                    if (p.stats?.[stat] !== undefined) p.stats[stat] = Math.min(99, p.stats[stat] + effect.value);
                });
                break;
            }
            case 'stat':
                (game.state.players || []).forEach(p => {
                    if (p.stats?.[effect.stat] !== undefined) p.stats[effect.stat] = Math.min(99, p.stats[effect.stat] + effect.value);
                });
                break;
            case 'recovery':
                (game.state.players || []).forEach(p => { p.condition = Math.min(100, (p.condition || 80) + effect.value); });
                break;
            case 'fans': game.state.team.fans = (game.state.team.fans || 0) + effect.value; break;
            case 'gold': game.state.team.gold = (game.state.team.gold || 0) + effect.value; break;
            case 'fame': game.state.team.fame = (game.state.team.fame || 0) + effect.value; break;
            case 'morale': game.state.team.morale = Math.max(0, Math.min(100, (game.state.team.morale || 70) + effect.value)); break;
        }
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
            ${event.choices.map((c, i) => `<button class="btn ${i === 0 ? 'btn--gold' : 'btn--outline'} event-choice-btn" data-idx="${i}">${c.text}</button>`).join('')}
        </div>
    </div>
</div>`;
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
</div>`;
        overlay.querySelector('.modal__close').addEventListener('click', () => {
            overlay.remove(); game.save(); this._render();
        });
        this._container.appendChild(overlay);
    }
}
