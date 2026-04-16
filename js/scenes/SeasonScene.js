/**
 * SeasonScene - 赛季总览（重构版）
 * S/A/B分组显示、排名表、赛程时间线、全联赛战报
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, TEAMS } from '../data/teams.js';
import { createElement, showToast } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { teamLogoHTML } from '../ui/ImageManager.js';
import { SeasonSystem, PHASES, GROUP_NAMES } from '../systems/SeasonSystem.js';

export class SeasonScene {
    async enter(container) {
        this._container = container;
        this._teamId = game.getState('teamId');
        this._team = getTeamById(this._teamId);
        this._season = this._loadSeason();
        container.className = 'scene scene--season';
        this._render();
    }

    exit() { this._container = null; }

    _loadSeason() {
        if (game.state.seasonSystem) {
            return SeasonSystem.fromSaveData(game.state.seasonSystem);
        }
        const sys = new SeasonSystem(this._teamId);
        sys.initGroups();
        game.state.seasonSystem = sys.toSaveData();
        game.save();
        return sys;
    }

    _saveSeason() {
        game.state.seasonSystem = this._season.toSaveData();
        game.save();
    }

    _render() {
        const c = this._container;
        const phase = this._season.currentPhase;
        const myGroup = this._season.getTeamGroup(this._teamId);

        c.innerHTML = `
            <div class="season">
                <header class="season__header">
                    <button class="btn btn--outline btn--small" id="btn-back">← 返回基地</button>
                    <h2>📋 赛季总览</h2>
                    <div class="season__phase-info">
                        <span class="season__phase">${phase?.name || '赛季结束'}</span>
                        <span class="season__round">第 ${this._season.currentRound + 1} 轮</span>
                        <span class="season__my-group">我的分组: <strong>${GROUP_NAMES[myGroup] || '?'}</strong></span>
                    </div>
                </header>
                <div class="season__tabs">
                    <button class="season-tab season-tab--active" data-tab="groups">分组排名</button>
                    <button class="season-tab" data-tab="schedule">赛程</button>
                    <button class="season-tab" data-tab="history">我的战绩</button>
                    <button class="season-tab" data-tab="league">全联赛战报</button>
                </div>
                <div class="season__content" id="season-content"></div>
            </div>`;

        c.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('home'));
        c.querySelectorAll('.season-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                c.querySelectorAll('.season-tab').forEach(t => t.classList.remove('season-tab--active'));
                tab.classList.add('season-tab--active');
                this._renderTab(tab.dataset.tab);
            });
        });
        this._renderTab('groups');
    }

    _renderTab(tab) {
        const content = this._container.querySelector('#season-content');
        switch (tab) {
            case 'groups': this._renderGroups(content); break;
            case 'schedule': this._renderSchedule(content); break;
            case 'history': this._renderHistory(content); break;
            case 'league': this._renderLeague(content); break;
        }
    }

    /* ===== 分组排名 ===== */
    _renderGroups(content) {
        const groups = ['S', 'A', 'B'];
        const myGroup = this._season.getTeamGroup(this._teamId);

        content.innerHTML = `<div class="season-groups">
            ${groups.map(g => {
                const standings = this._season.getGroupStandings(g);
                const isMyGroup = g === myGroup;
                return `<div class="group-section ${isMyGroup ? 'group-section--mine' : ''}">
                    <h3 class="group-section__title">
                        <span class="group-badge group-badge--${g.toLowerCase()}">${GROUP_NAMES[g]}</span>
                        ${isMyGroup ? '<span class="group-mine-tag">我的分组</span>' : ''}
                    </h3>
                    <table class="standings-table standings-table--compact">
                        <thead><tr>
                            <th>#</th><th>战队</th><th>胜</th><th>负</th><th>积分</th><th>净胜</th><th>连胜</th>
                        </tr></thead>
                        <tbody>
                            ${standings.map((s, i) => {
                                const team = s.team;
                                if (!team) return '';
                                const isMe = s.id === this._teamId;
                                const streakText = s.streak > 0 ? `🔥${s.streak}连胜` : s.streak < 0 ? `${Math.abs(s.streak)}连败` : '-';
                                const rowClass = [
                                    isMe ? 'standings-row--me' : '',
                                    i < 2 ? 'standings-row--promo' : '',
                                    i >= standings.length - 2 ? 'standings-row--relegate' : '',
                                ].filter(Boolean).join(' ');
                                return `<tr class="${rowClass}">
                                    <td>${i + 1}</td>
                                    <td class="standings-team-cell">
                                        <span class="standings-logo">${teamLogoHTML(s.id, team, 24)}</span>
                                        <span>${team.shortName}</span>
                                        ${isMe ? ' <span class="star-me">★</span>' : ''}
                                    </td>
                                    <td>${s.wins}</td><td>${s.losses}</td>
                                    <td><strong>${s.points}</strong></td>
                                    <td>${s.diff > 0 ? '+' : ''}${s.diff}</td>
                                    <td class="streak-cell">${streakText}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="group-legend">
                        ${g !== 'S' ? '<span class="legend-promo">▲ 前2名升级</span>' : ''}
                        ${g !== 'B' ? '<span class="legend-relegate">▼ 后2名降级</span>' : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    /* ===== 赛程 ===== */
    _renderSchedule(content) {
        const phase = this._season.currentPhase;
        const schedule = this._season.schedule.filter(m => m.phase === phase?.id);
        const rounds = new Map();
        schedule.forEach(m => {
            const key = m.round;
            if (!rounds.has(key)) rounds.set(key, []);
            rounds.get(key).push(m);
        });

        content.innerHTML = `<div class="season-schedule">
            <div class="phase-timeline">
                ${PHASES.map((p, i) => {
                    const status = i < this._season.currentPhaseIdx ? 'done' : i === this._season.currentPhaseIdx ? 'active' : 'future';
                    return `<div class="phase-item phase-item--${status}">
                        <div class="phase-item__dot"></div>
                        <span class="phase-item__name">${p.name}</span>
                    </div>`;
                }).join('')}
            </div>
            <h3 class="schedule-section-title">${phase?.name || '赛季结束'} 赛程</h3>
            <div class="round-list">
                ${[...rounds.entries()].map(([roundNum, matches]) => {
                    const isCurrent = roundNum === this._season.currentRound;
                    return `<div class="round-group ${isCurrent ? 'round-group--current' : ''}">
                        <h4 class="round-group__title">
                            第 ${roundNum + 1} 轮
                            ${isCurrent ? '<span class="round-current-badge">当前</span>' : ''}
                        </h4>
                        <div class="match-list">
                            ${matches.map(m => this._renderMatchCard(m)).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    _renderMatchCard(match) {
        const home = getTeamById(match.homeTeam);
        const away = getTeamById(match.awayTeam);
        if (!home || !away) return '';

        const isMyMatch = match.homeTeam === this._teamId || match.awayTeam === this._teamId;
        const statusClass = match.played ? 'match-card--played' : 'match-card--pending';
        const groupLabel = match.group && GROUP_NAMES[match.group] ? GROUP_NAMES[match.group] : '';

        let resultHTML = '';
        if (match.played && match.result) {
            const r = match.result;
            resultHTML = `<div class="match-card__result">
                <span class="score">${r.score[0]} : ${r.score[1]}</span>
                <span class="kills">(${r.killsHome}↔${r.killsAway}击杀)</span>
            </div>`;
        } else {
            resultHTML = `<div class="match-card__result match-card__result--pending">待进行</div>`;
        }

        return `<div class="match-card ${statusClass} ${isMyMatch ? 'match-card--mine' : ''}">
            <div class="match-card__teams">
                <span class="match-card__team ${match.result?.winner === match.homeTeam ? 'match-card__team--winner' : ''}">
                    ${teamLogoHTML(match.homeTeam, home, 20)}
                    <span>${home.shortName}</span>
                </span>
                <span class="match-card__vs">vs</span>
                <span class="match-card__team ${match.result?.winner === match.awayTeam ? 'match-card__team--winner' : ''}">
                    <span>${away.shortName}</span>
                    ${teamLogoHTML(match.awayTeam, away, 20)}
                </span>
            </div>
            ${resultHTML}
            ${groupLabel ? `<span class="match-card__group">${groupLabel}</span>` : ''}
        </div>`;
    }

    /* ===== 我的战绩 ===== */
    _renderHistory(content) {
        const history = this._season.getPlayerHistory();
        if (!history.length) {
            content.innerHTML = '<div class="season-empty"><p>暂无比赛记录</p><p>开始比赛后，战绩将显示在这里</p></div>';
            return;
        }

        const wins = history.filter(m => m.result?.winner === this._teamId).length;
        const losses = history.length - wins;

        content.innerHTML = `<div class="my-history">
            <div class="history-summary">
                <div class="summary-stat"><span class="summary-val">${history.length}</span><span class="summary-label">总场次</span></div>
                <div class="summary-stat summary-stat--win"><span class="summary-val">${wins}</span><span class="summary-label">胜</span></div>
                <div class="summary-stat summary-stat--lose"><span class="summary-val">${losses}</span><span class="summary-label">负</span></div>
                <div class="summary-stat"><span class="summary-val">${history.length ? Math.round(wins / history.length * 100) : 0}%</span><span class="summary-label">胜率</span></div>
            </div>
            <div class="match-history-list">
                ${history.reverse().map(m => {
                    const isHome = m.homeTeam === this._teamId;
                    const opponent = getTeamById(isHome ? m.awayTeam : m.homeTeam);
                    const won = m.result?.winner === this._teamId;
                    const phaseName = PHASES.find(p => p.id === m.phase)?.name || '';
                    return `<div class="history-row history-row--${won ? 'win' : 'lose'}">
                        <span class="history-row__result">${won ? '胜' : '负'}</span>
                        <span class="history-row__vs">vs</span>
                        <span class="history-row__opponent">
                            ${opponent ? teamLogoHTML(opponent.id, opponent, 20) : ''}
                            ${opponent?.shortName || '?'}
                        </span>
                        <span class="history-row__score">${m.result?.score?.[0] || 0} : ${m.result?.score?.[1] || 0}</span>
                        <span class="history-row__kills">(${m.result?.killsHome || 0}↔${m.result?.killsAway || 0})</span>
                        <span class="history-row__phase">${phaseName}</span>
                        <span class="history-row__group">${GROUP_NAMES[m.group] || ''}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    /* ===== 全联赛战报 ===== */
    _renderLeague(content) {
        const recentLogs = this._season.matchLog.slice(-30).reverse();
        if (!recentLogs.length) {
            content.innerHTML = '<div class="season-empty"><p>暂无联赛战报</p></div>';
            return;
        }

        content.innerHTML = `<div class="league-report">
            <h3>最近联赛战报</h3>
            <div class="league-list">
                ${recentLogs.map(m => {
                    const home = getTeamById(m.homeTeam);
                    const away = getTeamById(m.awayTeam);
                    if (!home || !away) return '';
                    const isMyMatch = m.homeTeam === this._teamId || m.awayTeam === this._teamId;
                    return `<div class="league-item ${isMyMatch ? 'league-item--mine' : ''}">
                        <span class="league-item__group">${GROUP_NAMES[m.group] || ''}</span>
                        <span class="league-item__team ${m.result?.winner === m.homeTeam ? 'league-item__team--winner' : ''}">
                            ${teamLogoHTML(m.homeTeam, home, 18)} ${home.shortName}
                        </span>
                        <span class="league-item__score">${m.result?.score?.[0] || 0} : ${m.result?.score?.[1] || 0}</span>
                        <span class="league-item__team ${m.result?.winner === m.awayTeam ? 'league-item__team--winner' : ''}">
                            ${away.shortName} ${teamLogoHTML(m.awayTeam, away, 18)}
                        </span>
                        <span class="league-item__kills">(${m.result?.killsHome || 0}↔${m.result?.killsAway || 0})</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }
}
