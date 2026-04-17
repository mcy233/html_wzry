/**
 * HomeScene - 战队基地主界面（电竞经理风格）
 * 左上角战队信息卡 + 左侧团队形象 + 右侧菱形卡牌入口 + 底部导航
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId } from '../data/teams.js';
import { showToast } from '../ui/Components.js';
import { teamLogoHTML } from '../ui/ImageManager.js';
import { calcTeamPower, formatPower } from '../systems/CombatPower.js';
import { migratePlayerData } from '../systems/PlayerGrowth.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { sfxConfirm } from '../ui/SoundManager.js';

export class HomeScene {
    async enter(container) {
        this._container = container;
        const teamId = game.getState('teamId');
        this._team = getTeamById(teamId);
        if (!this._team) { game.sceneManager.switchTo('title'); return; }

        if (game.state.players?.length) {
            game.state.players = migratePlayerData(game.state.players);
        }

        this._seasonSys = null;
        if (game.state.seasonSystem) {
            try { this._seasonSys = SeasonSystem.fromSaveData(game.state.seasonSystem); } catch {}
        }

        container.className = 'scene scene--home';
        this._build();
        this._bind();
    }

    exit() { this._container = null; }

    _build() {
        const team = this._team;
        const state = game.state.team;
        const teamPower = calcTeamPower(game.state.starters, game.state.players);
        const phase = this._getPhaseText(game.getState('season.phase'));
        const round = (game.getState('season.round') || 0) + 1;

        const standing = this._getStanding();
        const winsLosses = standing
            ? `${standing.wins}胜 ${standing.losses}负`
            : '暂无战绩';
        const ranking = standing ? `第${standing.rank}名` : '';

        this._container.innerHTML = `
        <div class="home-bg" style="--team-color:${team.color}"></div>
        <div class="home-layout">
            <!-- 悬浮顶栏 -->
            <header class="home-topbar">
                <div class="home-topbar__res">
                    <span class="res-item"><span class="res-icon">💰</span><span class="res-val">${state.gold}</span></span>
                    <span class="res-item"><span class="res-icon">⭐</span><span class="res-val">${state.fame}</span></span>
                    <span class="res-item"><span class="res-icon">🔥</span><span class="res-val">${state.morale}</span></span>
                    <span class="res-item res-item--accent"><span class="res-icon">⚔️</span><span class="res-val">${formatPower(teamPower.total)}</span></span>
                    <span class="res-item"><span class="res-icon">🎫</span><span class="res-val">${game.state.tickets?.gold || 0}</span></span>
                </div>
            </header>

            <!-- 左上角战队信息卡 -->
            <div class="home-team-card">
                <div class="home-team-card__logo">
                    ${teamLogoHTML(team.id, team, 56)}
                </div>
                <div class="home-team-card__info">
                    <div class="home-team-card__name">${team.shortName}</div>
                    <div class="home-team-card__power">⚔ 战力 <strong>${formatPower(teamPower.total)}</strong></div>
                    <div class="home-team-card__season">${phase} · R${round}</div>
                    <div class="home-team-card__record">${winsLosses}${ranking ? ' · ' + ranking : ''}</div>
                </div>
                <div class="home-team-card__badge">${game.getState('season.phase')?.includes('spring') ? '2025年' : '2025年'}</div>
            </div>

            <div class="home-body">
                <img class="home-team-art" src="resources/players/showcase/team_show.webp"
                     alt="战队形象" draggable="false"/>

                <div class="home-cards">
                    <div class="home-cards__grid">
                        <button class="hcard" data-scene="matchCalendar">
                            <span class="hcard__icon">🏆</span>
                            <span class="hcard__title">赛事</span>
                        </button>
                        <button class="hcard" data-scene="recruit">
                            <span class="hcard__icon">✍️</span>
                            <span class="hcard__title">签约</span>
                        </button>
                        <button class="hcard" data-scene="collection">
                            <span class="hcard__icon">🏆</span>
                            <span class="hcard__title">荣誉</span>
                        </button>
                        <button class="hcard" data-scene="explore">
                            <span class="hcard__icon">🏙️</span>
                            <span class="hcard__title">探索</span>
                        </button>
                        <button class="hcard" data-scene="settings">
                            <span class="hcard__icon">⚙️</span>
                            <span class="hcard__title">设置</span>
                        </button>
                        <button class="hcard hcard--save" id="btn-save">
                            <span class="hcard__icon">💾</span>
                            <span class="hcard__title">存档</span>
                        </button>
                    </div>
                </div>
            </div>

            <nav class="home-bottombar">
                <button class="home-nav-btn" data-scene="roster">
                    <span class="home-nav-btn__icon">👥</span>
                    <span class="home-nav-btn__label">选手管理</span>
                </button>
                <button class="home-nav-btn" data-scene="training">
                    <span class="home-nav-btn__icon">🏋️</span>
                    <span class="home-nav-btn__label">训练基地</span>
                </button>
                <button class="home-nav-btn" data-scene="strategyGuide">
                    <span class="home-nav-btn__icon">📖</span>
                    <span class="home-nav-btn__label">战术手册</span>
                </button>
                <button class="home-nav-btn" data-scene="transfer">
                    <span class="home-nav-btn__icon">🔄</span>
                    <span class="home-nav-btn__label">转会市场</span>
                </button>
            </nav>
        </div>`;
    }

    _bind() {
        const c = this._container;

        c.querySelectorAll('.hcard[data-scene], .home-nav-btn[data-scene]').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxConfirm();
                const scene = btn.dataset.scene;
                const params = {};
                if (scene === 'explore') params.city = this._team.city;
                game.sceneManager.switchTo(scene, params);
            });
        });

        c.querySelector('#btn-save')?.addEventListener('click', () => {
            sfxConfirm();
            game.save();
            showToast('存档成功！');
        });
    }

    _getStanding() {
        if (!this._seasonSys) return null;
        const teamId = this._team.id;
        const st = this._seasonSys.standings?.[teamId];
        if (!st) return null;

        const allTeams = Object.keys(this._seasonSys.standings);
        const sorted = allTeams.sort((a, b) => {
            const sa = this._seasonSys.standings[a];
            const sb = this._seasonSys.standings[b];
            return (sb.points - sa.points) || (sb.diff - sa.diff) || (sb.wins - sa.wins);
        });
        const rank = sorted.indexOf(teamId) + 1;
        return { ...st, rank };
    }

    _getPhaseText(phase) {
        const map = {
            'spring_regular': '春季常规赛',
            'spring_playoff': '春季季后赛',
            'summer_regular': '夏季常规赛',
            'summer_playoff': '夏季季后赛',
            'annual_finals': '年度总决赛',
        };
        return map[phase] || '春季赛';
    }
}
