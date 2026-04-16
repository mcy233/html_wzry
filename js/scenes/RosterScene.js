/**
 * RosterScene - 阵容管理
 * 首发 / 替补切换，查看选手详情
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, POSITIONS } from '../data/teams.js';
import { createElement, showToast, createStatRadar } from '../ui/Components.js';
import { playerAvatarHTML } from '../ui/ImageManager.js';

const ROLE_ORDER = [POSITIONS.TOP, POSITIONS.JG, POSITIONS.MID, POSITIONS.ADC, POSITIONS.SUP];

export class RosterScene {
    async enter(container) {
        this._container = container;
        const teamId = game.getState('teamId');
        this._team = getTeamById(teamId);
        this._players = game.state.players?.length ? [...game.state.players] : [...this._team.players];
        this._starters = this._getDefaultStarters();
        container.className = 'scene scene--roster';
        this._render();
    }

    exit() { this._container = null; }

    _getDefaultStarters() {
        const starterSet = new Set();
        const result = [];
        for (const role of ROLE_ORDER) {
            const candidates = this._players.filter(p => p.role === role && !starterSet.has(p.id));
            if (candidates.length) {
                const best = candidates.reduce((a, b) => a.rating > b.rating ? a : b);
                result.push(best.id);
                starterSet.add(best.id);
            }
        }
        return result;
    }

    _isStarter(pid) { return this._starters.includes(pid); }

    _render() {
        const c = this._container;
        c.innerHTML = `
            <div class="roster-scene">
                <header class="roster-scene__header">
                    <button class="btn btn--outline btn--small" id="btn-back">← 返回基地</button>
                    <h2>👥 阵容管理 — ${this._team.name}</h2>
                    <button class="btn btn--gold btn--small" id="btn-save">💾 保存阵容</button>
                </header>
                <div class="roster-scene__body">
                    <div class="roster-section">
                        <h3>🌟 首发阵容</h3>
                        <div class="roster-list" id="starters-list"></div>
                    </div>
                    <div class="roster-section">
                        <h3>📋 替补席</h3>
                        <div class="roster-list" id="bench-list"></div>
                    </div>
                </div>
                <div class="roster-detail" id="roster-detail"></div>
            </div>`;
        c.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('home'));
        c.querySelector('#btn-save').addEventListener('click', () => this._saveRoster());
        this._renderLists();
    }

    _renderLists() {
        const startersList = this._container.querySelector('#starters-list');
        const benchList = this._container.querySelector('#bench-list');
        startersList.innerHTML = '';
        benchList.innerHTML = '';

        const starters = this._players.filter(p => this._isStarter(p.id));
        const bench = this._players.filter(p => !this._isStarter(p.id));

        for (const p of starters) startersList.appendChild(this._createPlayerRow(p, true));
        for (const p of bench) benchList.appendChild(this._createPlayerRow(p, false));
    }

    _createPlayerRow(player, isStarter) {
        const row = createElement('div', `roster-row ${isStarter ? 'roster-row--starter' : 'roster-row--bench'}`);
        const cond = player.condition || 80;
        const condIcon = cond >= 80 ? '🟢' : cond >= 50 ? '🟡' : '🔴';
        row.innerHTML = `
            <div class="roster-row__avatar">${playerAvatarHTML(player, this._team.color, 40)}</div>
            <div class="roster-row__info">
                <span class="roster-row__name">${player.id}</span>
                <span class="roster-row__role">${player.role}</span>
                <span class="roster-row__rating">⭐ ${player.rating}</span>
                <span class="roster-row__cond">${condIcon} ${cond}</span>
            </div>
            <div class="roster-row__actions">
                <button class="btn btn--small btn--outline roster-row__detail-btn">详情</button>
                <button class="btn btn--small ${isStarter ? 'btn--danger' : 'btn--gold'} roster-row__swap-btn">
                    ${isStarter ? '下放替补' : '提为首发'}
                </button>
            </div>`;
        row.querySelector('.roster-row__detail-btn').addEventListener('click', () => this._showDetail(player));
        row.querySelector('.roster-row__swap-btn').addEventListener('click', () => this._toggleStarter(player));
        return row;
    }

    _toggleStarter(player) {
        if (this._isStarter(player.id)) {
            this._starters = this._starters.filter(id => id !== player.id);
        } else {
            const sameRole = this._players.filter(p => p.role === player.role && this._isStarter(p.id));
            if (sameRole.length > 0) {
                this._starters = this._starters.filter(id => id !== sameRole[0].id);
            }
            if (this._starters.length >= 5) {
                showToast('首发已满5人，请先下放一名选手');
                return;
            }
            this._starters.push(player.id);
        }
        this._renderLists();
    }

    _showDetail(player) {
        const detail = this._container.querySelector('#roster-detail');
        const stats = player.stats;
        const radar = createStatRadar(stats);
        detail.innerHTML = `
            <div class="player-detail">
                <div class="player-detail__header" style="border-left:4px solid ${this._team.color}">
                    <h3>${player.id} <span style="font-weight:400;font-size:13px;color:var(--color-text-dim)">${player.name || ''}</span></h3>
                    <span class="player-detail__role">${player.role}</span>
                    <span class="player-detail__rating">综合评分: ${player.rating}</span>
                </div>
                <div class="player-detail__radar" id="player-radar"></div>
                <div class="player-detail__stats">
                    ${Object.entries(stats).map(([k, v]) => `
                        <div class="pstat-row">
                            <span class="pstat-row__label">${k}</span>
                            <div class="pstat-row__bar"><div class="pstat-row__fill" style="width:${v}%;background:${v>=85?'var(--color-success)':v>=70?'var(--color-accent)':'var(--color-danger)'}"></div></div>
                            <span class="pstat-row__val">${v}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn--outline btn--small" id="btn-close-detail">关闭</button>
            </div>`;
        detail.querySelector('#player-radar').appendChild(radar);
        detail.querySelector('#btn-close-detail').addEventListener('click', () => { detail.innerHTML = ''; });
    }

    _saveRoster() {
        if (this._starters.length < 5) {
            showToast('首发不足5人，请调整阵容！');
            return;
        }
        const rolesCovered = new Set(this._starters.map(id => this._players.find(p => p.id === id)?.role));
        if (rolesCovered.size < 5) {
            showToast('每个位置需要一名首发！');
            return;
        }
        game.state.players = this._players;
        game.state.starters = this._starters;
        game.save();
        showToast('阵容已保存！');
    }
}
