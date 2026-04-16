/**
 * TeamSelectScene - 战队选择场景
 * 风格化中国地图 + 战队Logo展示
 */
import { game } from '../core/GameEngine.js';
import { eventBus } from '../core/EventBus.js';
import { TEAMS, getStartersByTeamId } from '../data/teams.js';
import { createElement, createButton, createStatRadar } from '../ui/Components.js';
import { slideUpTransition } from '../ui/Transitions.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';
import { createChinaMapSVG } from '../ui/ChinaMap.js';

export class TeamSelectScene {
    constructor() { this._selectedTeam = null; this._container = null; }

    async enter(container) {
        this._container = container;
        container.className = 'scene scene--team-select';
        container.innerHTML = `
            <div class="team-select">
                <header class="team-select__header">
                    <button class="btn btn--back" id="btn-back">← 返回</button>
                    <h2>选择你的战队</h2>
                    <p class="team-select__subtitle">点击地图上的城市光点，选择一支战队开启征程</p>
                </header>
                <div class="team-select__body">
                    <div class="map-container" id="map-container">
                        <div class="china-map" id="china-map">
                            ${createChinaMapSVG(600, 500)}
                        </div>
                    </div>
                    <div class="team-detail-panel" id="team-detail">
                        <div class="team-detail__placeholder">
                            <div class="team-detail__icon">🏆</div>
                            <p>点击地图上的城市选择战队</p>
                        </div>
                    </div>
                </div>
            </div>`;
        container.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('title'));
        this._renderMapPoints();
    }

    exit() { this._selectedTeam = null; this._container = null; }

    _renderMapPoints() {
        const mapEl = this._container.querySelector('#china-map');
        TEAMS.forEach(team => {
            const dot = createElement('button', 'map-dot');
            dot.style.left = team.mapPosition.x + '%';
            dot.style.top = team.mapPosition.y + '%';
            dot.style.setProperty('--team-color', team.color);
            dot.title = team.name;
            dot.innerHTML = `<span class="map-dot__pulse"></span><span class="map-dot__label">${team.shortName}</span>`;
            dot.addEventListener('click', () => {
                this._container.querySelectorAll('.map-dot--active').forEach(d => d.classList.remove('map-dot--active'));
                dot.classList.add('map-dot--active');
                this._showTeamDetail(team);
            });
            mapEl.appendChild(dot);
        });
    }

    _showTeamDetail(team) {
        this._selectedTeam = team;
        const panel = this._container.querySelector('#team-detail');
        const starters = getStartersByTeamId(team.id);
        const avgStats = this._calcAvgStats(starters);
        const diffStars = '★'.repeat(team.difficulty) + '☆'.repeat(5 - team.difficulty);
        panel.innerHTML = `
            <div class="team-detail__card">
                <div class="team-detail__banner" style="background:linear-gradient(135deg, ${team.color}dd, ${team.color}88)">
                    <div class="team-detail__logo">${teamLogoHTML(team.id, team, 80)}</div>
                    <div>
                        <div class="team-detail__team-name">${team.name}</div>
                        <div class="team-detail__city">${team.city}</div>
                        ${team.arena ? `<div class="team-detail__arena">🏟️ ${team.arena}</div>` : ''}
                    </div>
                </div>
                <div class="team-detail__info">
                    <div class="team-detail__row"><span class="label">风格</span><span class="value">${team.style}</span></div>
                    <div class="team-detail__row"><span class="label">难度</span><span class="value stars">${diffStars}</span></div>
                    <div class="team-detail__row"><span class="label">城市Buff</span><span class="value buff">「${team.buff.name}」${team.buff.desc}</span></div>
                    <div class="team-detail__row"><span class="label">特殊机制</span><span class="value special">「${team.special.name}」${team.special.desc}</span></div>
                    <p class="team-detail__desc">${team.description}</p>
                    <div class="team-detail__radar" id="radar-mount"></div>
                    <div class="team-detail__roster">
                        <h4>首发阵容</h4>
                        <div class="roster-list">
                            ${starters.map(p => `
                                <div class="roster-item">
                                    <div class="roster-item__avatar">${playerAvatarHTML(p, team.color, 36)}</div>
                                    <span class="roster-item__role">${p.role}</span>
                                    <span class="roster-item__name">${p.id}</span>
                                    <span class="roster-item__rating">⭐${p.rating}</span>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="team-detail__actions" id="detail-actions"></div>
            </div>`;
        panel.querySelector('#radar-mount').appendChild(createStatRadar(avgStats));
        panel.querySelector('#detail-actions').appendChild(
            createButton('选择此战队', () => this._confirmTeam(team), 'btn btn--gold btn--large btn--full')
        );
        slideUpTransition(panel.querySelector('.team-detail__card'));
    }

    _calcAvgStats(starters) {
        const keys = ['操作', '意识', '对线', '配合', '抗压', '心态'];
        const avg = {};
        keys.forEach(k => { avg[k] = Math.round(starters.reduce((s, p) => s + (p.stats[k] || 0), 0) / starters.length); });
        return avg;
    }

    _confirmTeam(team) {
        const overlay = createElement('div', 'modal-overlay');
        overlay.innerHTML = `
            <div class="modal modal--confirm">
                <div style="text-align:center;margin-bottom:12px">${teamLogoHTML(team.id, team, 64)}</div>
                <h3>确认选择</h3>
                <p>你选择了 <strong style="color:${team.color}">${team.name}</strong></p>
                <p>代表 <strong>${team.city}</strong> 出征2027赛季</p>
                <p class="modal__warn">选择后不可更改，确定吗？</p>
                <div class="modal__buttons">
                    <button class="btn btn--outline" id="modal-cancel">再想想</button>
                    <button class="btn btn--gold" id="modal-confirm">确定出征！</button>
                </div>
            </div>`;
        this._container.appendChild(overlay);
        overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#modal-confirm').addEventListener('click', () => { overlay.remove(); this._startGame(team); });
    }

    _startGame(team) {
        game.updateState('teamId', team.id);
        game.updateState('players', team.players.map(p => ({ ...p, condition: 80, growth: 0 })));
        game.save();
        eventBus.emit('team:selected', team.id);
        game.sceneManager.switchTo('home');
    }
}
