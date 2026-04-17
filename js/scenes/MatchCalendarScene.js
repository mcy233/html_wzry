/**
 * MatchCalendarScene — 赛事日历（联赛日历+比赛入口）
 * 参考《英雄联盟电竞经理》的赛事日历界面
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId, TEAMS } from '../data/teams.js';
import { SeasonSystem, PHASES, GROUP_NAMES } from '../systems/SeasonSystem.js';
import { teamLogoHTML, playerAvatarHTML } from '../ui/ImageManager.js';
import { sfxSelect, sfxConfirm } from '../ui/SoundManager.js';
import { calcTeamPower, calcEnemyTeamPower, formatPower, powerCompareText } from '../systems/CombatPower.js';

const RULES_TEXT = {
    regular: {
        title: '常规赛赛制',
        rules: [
            '所有战队按实力分为 S / A / B 三个小组，每组6支队伍',
            '组内进行循环赛，每支队伍与同组其他队伍各交手一次',
            '比赛采用 Bo5 赛制（五局三胜）',
            '胜方获得 3 积分，败方不得分',
            '每轮结束后，组内前2名升组，后2名降组',
            '常规赛结束后，S/A 组前4名晋级季后赛',
        ],
    },
    playoff: {
        title: '季后赛赛制',
        rules: [
            'S组和A组常规赛前4名共8支队伍参加',
            '采用单败淘汰制（Bo5）',
            '最终4强争夺总决赛席位',
        ],
    },
    finals: {
        title: '年度总决赛赛制',
        rules: [
            '春季赛+夏季赛综合排名前4支队伍参赛',
            '采用双败淘汰制（Bo7）',
            '冠军获得年度总冠军荣誉',
        ],
    },
};

export class MatchCalendarScene {
    async enter(container) {
        this._container = container;
        this._teamId = game.getState('teamId');
        this._team = getTeamById(this._teamId);
        if (!this._team) { game.sceneManager.switchTo('home'); return; }

        this._season = this._loadSeason();
        container.className = 'scene scene--match-calendar';

        this._playerMatches = this._getPlayerSchedule();
        this._currentIdx = this._playerMatches.findIndex(m => !m.played);
        this._selectedIdx = this._currentIdx;

        this._buildDOM();
        this._bind();
        this._scrollToActive();
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

    _getPlayerSchedule() {
        const phase = this._season.currentPhase;
        if (!phase) return [];
        return this._season.schedule.filter(
            m => m.phase === phase.id &&
                (m.homeTeam === this._teamId || m.awayTeam === this._teamId)
        ).sort((a, b) => a.round - b.round);
    }

    _getSeasonIcon(phase) {
        if (!phase) return '🏆';
        if (phase.id.includes('spring')) return '🌸';
        if (phase.id.includes('summer')) return '☀️';
        return '🏆';
    }

    _getOpponent(match) {
        const oppId = match.homeTeam === this._teamId ? match.awayTeam : match.homeTeam;
        return getTeamById(oppId);
    }

    _getMatchLabel(match) {
        const phase = this._season.currentPhase;
        if (phase?.type === 'regular') return '常规赛';
        if (phase?.type === 'playoff') return '季后赛';
        if (phase?.type === 'finals') return '总决赛';
        return '联赛';
    }

    /* ====== DOM 构建 ====== */

    _buildDOM() {
        const phase = this._season.currentPhase;
        const myGroup = this._season.getTeamGroup(this._teamId);
        const matches = this._playerMatches;
        const playedCount = matches.filter(m => m.played).length;
        const total = matches.length;

        this._container.innerHTML = `
        <div class="mcal">
            <div class="mcal__bg"></div>

            <!-- 顶部栏 -->
            <div class="mcal__header">
                <button class="btn btn--back" id="mcal-home">← 返回基地</button>
                <div class="mcal__header-center">
                    <span class="mcal__h-icon">${this._getSeasonIcon(phase)}</span>
                    <span class="mcal__h-title">${phase?.name || '赛季结束'}</span>
                    <span class="mcal__h-tag">${GROUP_NAMES[myGroup] || ''} · ${this._team.shortName}</span>
                </div>
                <div class="mcal__header-right">
                    <span class="mcal__h-progress">进度 ${playedCount}/${total}</span>
                    <button class="mcal__btn-icon" id="mcal-rules" title="赛制说明">❓</button>
                    <button class="mcal__btn-icon" id="mcal-ranking" title="排名/战绩">📊</button>
                </div>
            </div>

            <!-- 赛季阶段时间线 -->
            <div class="mcal__timeline">
                ${PHASES.map((p, i) => {
                    const s = i < this._season.currentPhaseIdx ? 'done' : i === this._season.currentPhaseIdx ? 'now' : 'later';
                    return `<div class="mcal__tl-item mcal__tl-item--${s}">
                        <div class="mcal__tl-dot"></div>
                        <div class="mcal__tl-name">${p.name}</div>
                    </div>`;
                }).join('<div class="mcal__tl-line"></div>')}
            </div>

            <!-- 比赛卡槽 -->
            <div class="mcal__slots-wrap">
                <div class="mcal__slots" id="mcal-slots">
                    ${matches.map((m, i) => this._slotHTML(m, i)).join('')}
                </div>
            </div>

            <!-- 底部详情 -->
            <div class="mcal__detail" id="mcal-detail">
                ${this._detailHTML(this._selectedIdx)}
            </div>

            <!-- 赛制说明弹窗 -->
            <div class="mcal__modal" id="mcal-modal" hidden>
                <div class="mcal__modal-bg" id="mcal-modal-close"></div>
                <div class="mcal__modal-box">
                    ${this._rulesHTML(phase)}
                </div>
            </div>
        </div>`;
    }

    _slotHTML(match, idx) {
        const opp = this._getOpponent(match);
        if (!opp) return '';
        const played = match.played;
        const current = idx === this._currentIdx;
        const future = idx > this._currentIdx && this._currentIdx >= 0;
        const won = played && match.result?.winner === this._teamId;
        const selected = idx === this._selectedIdx;

        let cls = 'mcal-s';
        if (played) cls += won ? ' mcal-s--won' : ' mcal-s--lost';
        else if (current) cls += ' mcal-s--current';
        else if (future) cls += ' mcal-s--locked';
        if (selected) cls += ' mcal-s--sel';

        return `<div class="${cls}" data-idx="${idx}">
            ${current ? '<span class="mcal-s__badge">当前</span>' : ''}
            <span class="mcal-s__num">第${idx + 1}场</span>
            <span class="mcal-s__type">${this._getMatchLabel(match)}</span>
            <div class="mcal-s__logo">${teamLogoHTML(opp.id, opp, 50)}</div>
            <span class="mcal-s__name">${opp.shortName}</span>
            ${played ? `<span class="mcal-s__res mcal-s__res--${won ? 'w' : 'l'}">${won ? '胜利' : '失败'}<br><small>${match.result.score[0]}:${match.result.score[1]}</small></span>` : ''}
            ${future ? '<span class="mcal-s__lock">🔒</span>' : ''}
        </div>`;
    }

    _detailHTML(idx) {
        if (idx < 0 || idx >= this._playerMatches.length) return this._seasonCompleteHTML();
        const match = this._playerMatches[idx];
        const opp = this._getOpponent(match);
        if (!opp) return '';

        const mySt = this._season.standings[this._teamId] || { wins: 0, losses: 0 };
        const oppSt = this._season.standings[opp.id] || { wins: 0, losses: 0 };
        const played = match.played;
        const won = played && match.result?.winner === this._teamId;
        const isCurrent = idx === this._currentIdx;
        const enemyStarters = getStartersByTeamId(opp.id);
        const myGroup = this._season.getTeamGroup(this._teamId);

        const myPlayers = game.state.players?.length ? game.state.players : this._team.players;
        const myStarterIds = game.state.starters?.length
            ? game.state.starters
            : getStartersByTeamId(this._teamId).map(p => p.id);
        const myStarters = myStarterIds.map(id =>
            typeof id === 'string' ? myPlayers.find(p => p.id === id) : id
        ).filter(Boolean);

        const myPower = calcTeamPower(myStarterIds, myPlayers);
        const enemyPower = calcEnemyTeamPower(opp, enemyStarters);
        const comp = powerCompareText(myPower.total, enemyPower.total);

        let vsHTML;
        if (played) {
            vsHTML = `
                <div class="mcal-v__label">第${idx + 1}场 · ${this._getMatchLabel(match)}</div>
                <div class="mcal-v__score">${match.result.score[0]} : ${match.result.score[1]}</div>
                <div class="mcal-v__tag mcal-v__tag--${won ? 'w' : 'l'}">${won ? '胜利' : '失败'}</div>
                <div class="mcal-v__sub">击杀 ${match.result.killsHome || 0}:${match.result.killsAway || 0}</div>`;
        } else {
            vsHTML = `
                <div class="mcal-v__label">第${idx + 1}场 · ${this._getMatchLabel(match)}</div>
                <div class="mcal-v__vs">VS</div>
                <div class="mcal-v__group">${GROUP_NAMES[myGroup] || ''}</div>`;
        }

        const rosterRowHTML = (myP, enemyP) => {
            const left = myP ? `
                <div class="mcal-roster__p mcal-roster__p--my">
                    <span class="mcal-roster__rating">${myP.rating}</span>
                    <span class="mcal-roster__name">${myP.id}</span>
                    <span class="mcal-roster__role">${myP.role}</span>
                    <div class="mcal-roster__avatar">${playerAvatarHTML(myP, this._team.color, 32)}</div>
                </div>` : '<div class="mcal-roster__p mcal-roster__p--empty">-</div>';
            const right = enemyP ? `
                <div class="mcal-roster__p mcal-roster__p--opp">
                    <div class="mcal-roster__avatar">${playerAvatarHTML(enemyP, opp.color, 32)}</div>
                    <span class="mcal-roster__role">${enemyP.role}</span>
                    <span class="mcal-roster__name">${enemyP.id}</span>
                    <span class="mcal-roster__rating">${enemyP.rating}</span>
                </div>` : '<div class="mcal-roster__p mcal-roster__p--empty">-</div>';
            return `<div class="mcal-roster__row">${left}<div class="mcal-roster__vs-dot">⚔</div>${right}</div>`;
        };

        const maxLen = Math.max(myStarters.length, enemyStarters.length);
        let rosterRows = '';
        for (let i = 0; i < maxLen; i++) {
            rosterRows += rosterRowHTML(myStarters[i], enemyStarters[i]);
        }

        return `<div class="mcal-detail-card">
            <div class="mcal-detail__matchup">
                <div class="mcal-detail__team">
                    <div class="mcal-detail__logo mcal-detail__logo--my">${teamLogoHTML(this._team.id, this._team, 52)}</div>
                    <div class="mcal-detail__tname">${this._team.shortName}</div>
                    <div class="mcal-detail__trec">${mySt.wins}胜 ${mySt.losses}负</div>
                </div>
                <div class="mcal-detail__vs">${vsHTML}</div>
                <div class="mcal-detail__team">
                    <div class="mcal-detail__logo mcal-detail__logo--opp">${teamLogoHTML(opp.id, opp, 52)}</div>
                    <div class="mcal-detail__tname">${opp.shortName}</div>
                    <div class="mcal-detail__trec">${oppSt.wins}胜 ${oppSt.losses}负</div>
                </div>
            </div>

            <div class="mcal-detail__power">
                <span class="mcal-power__side mcal-power__side--my">
                    <strong>${formatPower(myPower.total)}</strong>
                    <small>我方战力</small>
                </span>
                <span class="mcal-power__comp ${comp.cls}">${comp.text}</span>
                <span class="mcal-power__side mcal-power__side--opp">
                    <strong>${formatPower(enemyPower.total)}</strong>
                    <small>对手战力</small>
                </span>
            </div>

            <div class="mcal-detail__rosters">
                <div class="mcal-roster__header">
                    <span class="mcal-roster__hd-left">🛡️ 我方首发 — ${this._team.shortName}</span>
                    <span class="mcal-roster__hd-right">${opp.shortName} — 对手首发 🗡️</span>
                </div>
                ${rosterRows}
            </div>

            ${isCurrent ? `<div class="mcal-detail__act">
                <button class="btn btn--gold btn--large" id="mcal-start">⚔️ 详细比赛</button>
                <button class="btn btn--outline btn--large" id="mcal-quick">⚡ 快速战斗</button>
            </div>` : ''}
        </div>`;
    }

    _seasonCompleteHTML() {
        return `<div class="mcal-detail-card mcal-detail-card--done">
            <div class="mcal-detail__done-icon">🏆</div>
            <div class="mcal-detail__done-text">当前阶段赛程已全部完成！</div>
            <button class="btn btn--gold btn--large" id="mcal-advance">进入下一阶段 →</button>
        </div>`;
    }

    _rulesHTML(phase) {
        const t = phase?.type || 'regular';
        const d = RULES_TEXT[t] || RULES_TEXT.regular;
        return `
            <div class="mcal-rules__hd">
                <h3>📜 ${d.title}</h3>
                <button class="mcal-rules__x" id="mcal-rules-x">✕</button>
            </div>
            <ul class="mcal-rules__ul">${d.rules.map(r => `<li>${r}</li>`).join('')}</ul>
            <div class="mcal-rules__flow-section">
                <h4>赛季总流程</h4>
                <div class="mcal-rules__flow">
                    ${PHASES.map((p, i) => `<span class="mcal-rules__fi ${i === this._season.currentPhaseIdx ? 'mcal-rules__fi--on' : ''}">${p.name}</span>`).join('<span class="mcal-rules__arrow">→</span>')}
                </div>
            </div>`;
    }

    /* ====== 事件绑定 ====== */

    _bind() {
        const c = this._container;

        c.querySelector('#mcal-home')?.addEventListener('click', () => game.sceneManager.switchTo('home'));
        c.querySelector('#mcal-ranking')?.addEventListener('click', () => { sfxSelect(); game.sceneManager.switchTo('season'); });

        c.querySelector('#mcal-rules')?.addEventListener('click', () => { sfxSelect(); this._showModal(true); });
        c.querySelector('#mcal-modal-close')?.addEventListener('click', () => this._showModal(false));
        c.querySelector('#mcal-rules-x')?.addEventListener('click', () => this._showModal(false));

        c.querySelector('#mcal-start')?.addEventListener('click', () => {
            sfxConfirm(); game.sceneManager.switchTo('bp', { teamId: this._team.id });
        });
        c.querySelector('#mcal-quick')?.addEventListener('click', () => {
            sfxConfirm();
            const m = this._playerMatches[this._currentIdx];
            if (!m) return;
            const enemyId = m.homeTeam === this._team.id ? m.awayTeam : m.homeTeam;
            game.sceneManager.switchTo('quickBattle', { enemyTeamId: enemyId, matchIndex: this._currentIdx });
        });
        c.querySelector('#mcal-advance')?.addEventListener('click', () => {
            sfxConfirm();
            this._season.advancePhase();
            game.state.seasonSystem = this._season.toSaveData();
            game.state.season = game.state.season || {};
            game.state.season.phase = this._season.currentPhase?.id || 'annual_finals';
            game.state.season.round = this._season.currentRound;
            game.save();
            this._playerMatches = this._getPlayerSchedule();
            this._currentIdx = this._playerMatches.findIndex(m => !m.played);
            this._selectedIdx = this._currentIdx;
            this._buildDOM(); this._bind(); this._scrollToActive();
        });

        c.querySelectorAll('.mcal-s').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.idx);
                if (isNaN(idx)) return;
                const future = idx > this._currentIdx && this._currentIdx >= 0;
                if (future) return;
                sfxSelect();
                this._selectSlot(idx);
            });
        });
    }

    _selectSlot(idx) {
        this._selectedIdx = idx;
        this._container.querySelectorAll('.mcal-s').forEach(s => s.classList.remove('mcal-s--sel'));
        const target = this._container.querySelector(`.mcal-s[data-idx="${idx}"]`);
        if (target) target.classList.add('mcal-s--sel');

        const detailEl = this._container.querySelector('#mcal-detail');
        if (detailEl) {
            detailEl.innerHTML = this._detailHTML(idx);
            this._bindDetailActions(detailEl);
        }
    }

    _bindDetailActions(el) {
        el.querySelector('#mcal-start')?.addEventListener('click', () => {
            sfxConfirm(); game.sceneManager.switchTo('bp', { teamId: this._team.id });
        });
        el.querySelector('#mcal-quick')?.addEventListener('click', () => {
            sfxConfirm();
            const m = this._playerMatches[this._currentIdx];
            if (!m) return;
            const enemyId = m.homeTeam === this._team.id ? m.awayTeam : m.homeTeam;
            game.sceneManager.switchTo('quickBattle', { enemyTeamId: enemyId, matchIndex: this._currentIdx });
        });
    }

    _showModal(show) {
        const m = this._container.querySelector('#mcal-modal');
        if (m) m.hidden = !show;
    }

    _scrollToActive() {
        requestAnimationFrame(() => {
            const el = this._container.querySelector('.mcal-s--current') || this._container.querySelector('.mcal-s--sel');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    }
}
