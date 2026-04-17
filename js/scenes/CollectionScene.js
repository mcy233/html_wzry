/**
 * CollectionScene → 荣誉体系（HonorScene）
 * 展示战队荣誉：赛季战绩、连胜记录、成就徽章
 */
import { game } from '../core/GameEngine.js';
import { getTeamById } from '../data/teams.js';
import { showToast } from '../ui/Components.js';
import { teamLogoHTML } from '../ui/ImageManager.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { sfxClick } from '../ui/SoundManager.js';

const ACHIEVEMENTS = [
    { id: 'first_win', label: '初出茅庐', desc: '赢得第一场比赛', icon: '🏅', check: s => s.totalWins >= 1 },
    { id: 'win_5', label: '势不可挡', desc: '累计赢得5场比赛', icon: '🎖️', check: s => s.totalWins >= 5 },
    { id: 'win_10', label: '常胜将军', desc: '累计赢得10场比赛', icon: '🏆', check: s => s.totalWins >= 10 },
    { id: 'win_20', label: '王朝霸业', desc: '累计赢得20场比赛', icon: '👑', check: s => s.totalWins >= 20 },
    { id: 'streak_3', label: '三连胜', desc: '达成3连胜', icon: '🔥', check: s => s.maxStreak >= 3 },
    { id: 'streak_5', label: '五连胜', desc: '达成5连胜', icon: '💎', check: s => s.maxStreak >= 5 },
    { id: 'streak_10', label: '不败传说', desc: '达成10连胜', icon: '⚡', check: s => s.maxStreak >= 10 },
    { id: 'no_loss', label: '完美赛季', desc: '单赛季0败', icon: '✨', check: s => s.perfectSeason },
    { id: 'top1', label: '联赛冠军', desc: '排名第一完成赛季', icon: '🥇', check: s => s.championships >= 1 },
    { id: 'top3', label: '强队之证', desc: '排名前三完成赛季', icon: '🥉', check: s => s.top3Count >= 1 },
];

export class CollectionScene {
    async enter(container) {
        this._container = container;
        container.className = 'scene scene--collection';
        const teamId = game.getState('teamId');
        this._team = getTeamById(teamId);
        this._seasonSys = null;
        if (game.state.seasonSystem) {
            try { this._seasonSys = SeasonSystem.fromSaveData(game.state.seasonSystem); } catch {}
        }
        this._stats = this._calcStats();
        this._render();
    }
    exit() { this._container = null; }

    _calcStats() {
        const stats = {
            totalWins: 0, totalLosses: 0,
            currentStreak: 0, maxStreak: 0,
            perfectSeason: false, championships: 0, top3Count: 0,
        };

        if (!this._seasonSys || !this._team) return stats;

        const teamId = this._team.id;
        const standing = this._seasonSys.standings?.[teamId];
        if (standing) {
            stats.totalWins = standing.wins || 0;
            stats.totalLosses = standing.losses || 0;
            stats.currentStreak = Math.max(0, standing.streak || 0);
            if (stats.totalWins > 0 && stats.totalLosses === 0) stats.perfectSeason = true;
        }

        const log = this._seasonSys.matchLog || [];
        let streak = 0;
        let maxStreak = 0;
        for (const m of log) {
            if (m.homeTeam === teamId || m.awayTeam === teamId) {
                const won = m.winner === teamId;
                if (won) { streak++; maxStreak = Math.max(maxStreak, streak); }
                else { streak = 0; }
            }
        }
        stats.maxStreak = Math.max(stats.maxStreak, maxStreak);

        const allTeams = Object.keys(this._seasonSys.standings || {});
        if (allTeams.length > 0) {
            const sorted = allTeams.sort((a, b) => {
                const sa = this._seasonSys.standings[a];
                const sb = this._seasonSys.standings[b];
                return (sb.points - sa.points) || (sb.diff - sa.diff) || (sb.wins - sa.wins);
            });
            const rank = sorted.indexOf(teamId) + 1;
            if (rank === 1) stats.championships++;
            if (rank <= 3) stats.top3Count++;
        }

        return stats;
    }

    _render() {
        const c = this._container;
        const s = this._stats;
        const team = this._team;
        const winRate = (s.totalWins + s.totalLosses) > 0
            ? ((s.totalWins / (s.totalWins + s.totalLosses)) * 100).toFixed(1)
            : '0.0';
        const phase = this._getPhaseText(game.getState('season.phase'));

        c.innerHTML = `
        <div class="col-bg"></div>
        <div class="col-layout">
            <header class="col-topbar">
                <button class="btn btn--back" id="btn-back">← 返回基地</button>
                <h2>🏆 荣誉体系</h2>
            </header>

            <div class="honor-hero">
                <div class="honor-hero__logo">${team ? teamLogoHTML(team.id, team, 72) : ''}</div>
                <div class="honor-hero__info">
                    <h3 class="honor-hero__name">${team?.name || '未知战队'}</h3>
                    <p class="honor-hero__phase">${phase}</p>
                </div>
            </div>

            <div class="honor-stats-grid">
                <div class="honor-stat">
                    <span class="honor-stat__val">${s.totalWins}</span>
                    <span class="honor-stat__label">胜场</span>
                </div>
                <div class="honor-stat">
                    <span class="honor-stat__val">${s.totalLosses}</span>
                    <span class="honor-stat__label">败场</span>
                </div>
                <div class="honor-stat">
                    <span class="honor-stat__val">${winRate}%</span>
                    <span class="honor-stat__label">胜率</span>
                </div>
                <div class="honor-stat">
                    <span class="honor-stat__val honor-stat__val--accent">${s.currentStreak}</span>
                    <span class="honor-stat__label">当前连胜</span>
                </div>
                <div class="honor-stat">
                    <span class="honor-stat__val honor-stat__val--gold">${s.maxStreak}</span>
                    <span class="honor-stat__label">最高连胜</span>
                </div>
                <div class="honor-stat">
                    <span class="honor-stat__val honor-stat__val--gold">${s.championships}</span>
                    <span class="honor-stat__label">冠军次数</span>
                </div>
            </div>

            <h3 class="honor-section-title">🎖️ 成就徽章</h3>
            <div class="honor-badges" id="honor-badges"></div>
        </div>`;

        c.querySelector('#btn-back')?.addEventListener('click', () => {
            sfxClick(); game.sceneManager.switchTo('home');
        });

        this._renderBadges();
    }

    _renderBadges() {
        const el = this._container.querySelector('#honor-badges');
        if (!el) return;
        el.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = a.check(this._stats);
            return `<div class="honor-badge ${unlocked ? 'honor-badge--unlocked' : ''}">
                <span class="honor-badge__icon">${a.icon}</span>
                <div class="honor-badge__info">
                    <span class="honor-badge__label">${a.label}</span>
                    <span class="honor-badge__desc">${a.desc}</span>
                </div>
                ${unlocked ? '<span class="honor-badge__check">✓</span>' : ''}
            </div>`;
        }).join('');
    }

    _getPhaseText(phase) {
        const map = {
            'spring_regular': '春季常规赛',
            'spring_playoff': '春季季后赛',
            'summer_regular': '夏季常规赛',
            'summer_playoff': '夏季季后赛',
            'annual_finals': '年度总决赛',
        };
        return map[phase] || '赛季';
    }
}
