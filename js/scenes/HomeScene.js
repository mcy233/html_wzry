/**
 * HomeScene - 战队基地主界面
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId } from '../data/teams.js';
import { CITIES } from '../data/cities.js';
import { createElement, showToast } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';

export class HomeScene {
    async enter(container) {
        this._container = container;
        const teamId = game.getState('teamId');
        const team = getTeamById(teamId);
        if (!team) { game.sceneManager.switchTo('title'); return; }
        const city = CITIES[team.city];
        const state = game.state.team;
        container.className = 'scene scene--home';
        container.innerHTML = `
            <div class="home">
                <header class="home__header" style="--team-color:${team.color}">
                    <div class="home__team-info">
                        <div class="home__team-badge">${teamLogoHTML(team.id, team, 48)}</div>
                        <div>
                            <h2 class="home__team-name">${team.name}</h2>
                            <div class="home__city">${team.city} · ${city?.subtitle || ''}</div>
                        </div>
                    </div>
                    <div class="home__stats">
                        <div class="home__stat"><span class="home__stat-label">金币</span><span class="home__stat-value" id="stat-gold">${state.gold}</span></div>
                        <div class="home__stat"><span class="home__stat-label">声望</span><span class="home__stat-value" id="stat-fame">${state.fame}</span></div>
                        <div class="home__stat"><span class="home__stat-label">士气</span><span class="home__stat-value" id="stat-morale">${state.morale}</span></div>
                        <div class="home__stat"><span class="home__stat-label">粉丝</span><span class="home__stat-value" id="stat-fans">${state.fans}</span></div>
                    </div>
                </header>
                <div class="home__season-bar">
                    <span>2027赛季 · ${this._getPhaseText(game.getState('season.phase'))}</span>
                    <span>第 ${(game.getState('season.round') || 0) + 1} 轮</span>
                </div>
                <nav class="home__menu" id="home-menu"></nav>
                <div class="home__roster" id="home-roster"></div>
            </div>`;
        this._renderMenu(team);
        this._renderRoster(team);
    }

    exit() { this._container = null; }

    _renderMenu(team) {
        const menuEl = this._container.querySelector('#home-menu');
        const items = [
            { icon: '⚔️', label: '开始比赛', desc: '进入下一场赛事', action: () => game.sceneManager.switchTo('battle', { teamId: team.id }) },
            { icon: '📋', label: '赛程总览', desc: '查看赛季排名与赛程', action: () => game.sceneManager.switchTo('season') },
            { icon: '🏋️', label: '训练基地', desc: '提升选手能力',   action: () => game.sceneManager.switchTo('training') },
            { icon: '🏙️', label: '城市探索', desc: `探索${team.city}的魅力`, action: () => game.sceneManager.switchTo('explore', { city: team.city }) },
            { icon: '🗂️', label: '文旅图鉴', desc: '收集城市明信片',  action: () => game.sceneManager.switchTo('postcards') },
            { icon: '👥', label: '阵容管理', desc: '调整首发与替补',  action: () => game.sceneManager.switchTo('roster') },
            { icon: '💾', label: '保存游戏', desc: '保存当前进度',    action: () => { game.save(); showToast('存档成功！'); } },
        ];
        items.forEach(item => {
            const card = createElement('button', 'menu-card');
            card.innerHTML = `
                <span class="menu-card__icon">${item.icon}</span>
                <div class="menu-card__text"><div class="menu-card__label">${item.label}</div><div class="menu-card__desc">${item.desc}</div></div>
                <span class="menu-card__arrow">›</span>`;
            card.addEventListener('click', item.action);
            menuEl.appendChild(card);
        });
        staggerIn([...menuEl.children], 80);
    }

    _renderRoster(team) {
        const rosterEl = this._container.querySelector('#home-roster');
        const players = game.state.players?.length ? game.state.players : team.players;
        const starters = game.state.starters || getStartersByTeamId(team.id).map(p => p.id);
        const starterIds = new Set(Array.isArray(starters) ? starters : starters.map(p => p.id));

        rosterEl.innerHTML = `
            <h3 class="roster-title">当前阵容</h3>
            <div class="roster-grid">
                ${players.map(p => {
                    const isStarter = starterIds.has(p.id);
                    const cond = p.condition || 80;
                    const condClass = cond >= 80 ? 'good' : cond >= 50 ? 'normal' : 'tired';
                    return `<div class="roster-card ${isStarter ? 'roster-card--starter' : 'roster-card--bench'}">
                        <div class="roster-card__role">${p.role}</div>
                        <div class="roster-card__avatar">${playerAvatarHTML(p, team.color, 40)}</div>
                        <div class="roster-card__name">${p.id}</div>
                        <div class="roster-card__rating">${p.rating}</div>
                        <div class="roster-card__condition roster-card__condition--${condClass}">${cond >= 80 ? '🟢' : cond >= 50 ? '🟡' : '🔴'} ${cond}</div>
                        ${isStarter ? '<div class="roster-card__badge">首发</div>' : ''}
                    </div>`;
                }).join('')}
            </div>`;
    }

    _getPhaseText(phase) {
        const map = {
            'spring_regular': '春季赛 · 常规赛', 'spring_playoff': '春季赛 · 季后赛',
            'summer_regular': '夏季赛 · 常规赛', 'summer_playoff': '夏季赛 · 季后赛',
            'annual_finals': '年度总决赛',
        };
        return map[phase] || '春季赛';
    }
}
