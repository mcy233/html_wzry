/**
 * QuickBattleScene - 快速战斗（重构版）
 * 非阻塞 enter + 4 阶段视觉动画
 * Phase 0: 亮色背景入场 → blur/dim 过渡
 * Phase 1: VS 对阵展示（队伍滑入 + 战力条）
 * Phase 2: 比赛播报（逐行高亮）
 * Phase 3: 结果展示（胜/败面板 + 奖励）
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, getStartersByTeamId } from '../data/teams.js';
import { createElement, showToast } from '../ui/Components.js';
import { calcTeamPower, calcEnemyTeamPower, formatPower, powerCompareText } from '../systems/CombatPower.js';
import { quickBattle, applyQuickBattleRewards } from '../systems/QuickBattle.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { teamLogoHTML } from '../ui/ImageManager.js';
import { QUICK_BATTLE } from '../data/balance.js';
import { sfxBattleStart, sfxVictory, sfxDefeat, sfxCheer, sfxConfirm } from '../ui/SoundManager.js';

export class QuickBattleScene {

    async enter(container, params = {}) {
        this._container = container;
        this._alive = true;
        container.className = 'scene scene--quick-battle';

        this._myTeam = getTeamById(game.state.teamId);
        this._enemyTeam = getTeamById(params.enemyTeamId);
        // matchIndex 不再使用，统一由 SeasonSystem.getPlayerMatch() 查找

        if (!this._myTeam || !this._enemyTeam) {
            showToast('战队数据缺失');
            game.sceneManager.switchTo('matchCalendar');
            return;
        }

        const myPlayers = game.state.players?.length ? game.state.players : this._myTeam.players;
        const myStarterIds = game.state.starters?.length
            ? game.state.starters
            : getStartersByTeamId(this._myTeam.id).map(p => p.id);
        this._myStarters = myStarterIds.map(id => myPlayers.find(p => p.id === id)).filter(Boolean);
        this._enemyStarters = this._enemyTeam.players.slice(0, 5);

        this._myPower = calcTeamPower(myStarterIds, myPlayers);
        this._enemyPower = calcEnemyTeamPower(this._enemyTeam, this._enemyStarters);

        this._result = quickBattle(
            this._myPower.total, this._enemyPower.total,
            this._myStarters, this._enemyStarters
        );

        this._buildInitialDOM();

        // fire-and-forget: 不 await，让 SceneManager 立即完成转场
        this._runShow();
    }

    exit() {
        this._alive = false;
        this._container = null;
    }

    /* ══════════ 初始 DOM（enter 同步完成） ══════════ */

    _buildInitialDOM() {
        const c = this._container;
        const comp = powerCompareText(this._myPower.total, this._enemyPower.total);
        const maxP = Math.max(this._myPower.total, this._enemyPower.total);
        const myPct = (this._myPower.total / maxP * 100).toFixed(0);
        const enPct = (this._enemyPower.total / maxP * 100).toFixed(0);

        c.innerHTML = `
        <div class="qb-bg" id="qb-bg"></div>
        <div class="qb-overlay" id="qb-overlay"></div>
        <div class="qb" id="qb-main">
            <!-- Phase 1: VS -->
            <div class="qb__versus qb--hidden" id="qb-versus">
                <div class="qb__team qb__team--my qb-slide-left">
                    <div class="qb__logo">${teamLogoHTML(this._myTeam.id, this._myTeam, 72)}</div>
                    <div class="qb__name">${this._myTeam.shortName}</div>
                    <div class="qb__power">${formatPower(this._myPower.total)}</div>
                </div>
                <div class="qb__vs-center qb-scale-in">
                    <div class="qb__vs-text">VS</div>
                </div>
                <div class="qb__team qb__team--enemy qb-slide-right">
                    <div class="qb__logo">${teamLogoHTML(this._enemyTeam.id, this._enemyTeam, 72)}</div>
                    <div class="qb__name">${this._enemyTeam.shortName}</div>
                    <div class="qb__power">${formatPower(this._enemyPower.total)}</div>
                </div>
            </div>
            <div class="qb__power-bar qb--hidden" id="qb-powerbar">
                <div class="qb__bar qb__bar--my" id="qb-bar-my" style="width:0%"></div>
                <div class="qb__bar qb__bar--enemy" id="qb-bar-en" style="width:0%"></div>
            </div>
            <div class="qb__compare ${comp.cls} qb--hidden" id="qb-compare">${comp.text}</div>

            <!-- Phase 2: 播报 -->
            <div class="qb__broadcast qb--hidden" id="qb-broadcast">
                <h3>⚔️ 比赛进行中...</h3>
                <div class="qb__lines" id="qb-lines"></div>
            </div>

            <!-- Phase 3: 结果（动态插入） -->
            <div id="qb-result-area"></div>
        </div>`;
    }

    /* ══════════ 动画编排（非阻塞） ══════════ */

    async _runShow() {
        if (!this._alive) return;
        sfxBattleStart();

        await this._phase0();
        if (!this._alive) return;
        await this._phase1();
        if (!this._alive) return;
        await this._phase2();
        if (!this._alive) return;
        await this._phase3();
    }

    /* Phase 0: 背景亮 → blur/dim 过渡 */
    async _phase0() {
        await this._sleep(400);
        const bg = this._container?.querySelector('#qb-bg');
        const overlay = this._container?.querySelector('#qb-overlay');
        if (bg) bg.classList.add('qb-bg--dimmed');
        if (overlay) overlay.classList.add('qb-overlay--active');
        await this._sleep(1000);
    }

    /* Phase 1: VS 对阵（队伍滑入 + 战力条） */
    async _phase1() {
        const c = this._container;
        if (!c) return;

        this._show('#qb-versus');
        await this._sleep(600);

        this._show('#qb-powerbar');
        const myBar = c.querySelector('#qb-bar-my');
        const enBar = c.querySelector('#qb-bar-en');
        const maxP = Math.max(this._myPower.total, this._enemyPower.total);
        requestAnimationFrame(() => {
            if (myBar) myBar.style.width = (this._myPower.total / maxP * 100).toFixed(0) + '%';
            if (enBar) enBar.style.width = (this._enemyPower.total / maxP * 100).toFixed(0) + '%';
        });
        await this._sleep(800);

        this._show('#qb-compare');
        await this._sleep(QUICK_BATTLE.ANIMATION_PHASE1_MS - 1400);
    }

    /* Phase 2: 逐行播报 */
    async _phase2() {
        const c = this._container;
        if (!c) return;

        this._show('#qb-broadcast');
        const linesEl = c.querySelector('#qb-lines');
        if (!linesEl) return;

        const icons = ['📍', '⚔️', '🔥', '🏆'];
        for (let i = 0; i < this._result.highlights.length; i++) {
            if (!this._alive) return;
            const line = createElement('div', 'qb__line');
            line.textContent = `${icons[i % icons.length]} ${this._result.highlights[i]}`;
            linesEl.appendChild(line);
            await this._sleep(150);
            line.classList.add('qb__line--in');
            await this._sleep(600);
        }
        await this._sleep(400);
    }

    /* Phase 3: 结果 + 奖励 + 赛季记录 */
    async _phase3() {
        const c = this._container;
        if (!c) return;

        const result = this._result;
        const rewards = applyQuickBattleRewards(game, result);
        this._recordSeason(result);

        game.state.results = game.state.results || [];
        game.state.results.push({
            enemy: this._enemyTeam.id,
            won: result.won,
            score: result.score,
            kills: result.kills,
            phase: game.state.season?.phase,
            round: game.state.season?.round,
            quick: true,
        });
        game.save();

        if (result.won) { sfxVictory(); sfxCheer(); }
        else sfxDefeat();

        const wonClass = result.won ? 'qb__result--victory' : 'qb__result--defeat';
        const banner = result.won ? '🏆 VICTORY 🏆' : '💔 DEFEAT';

        const area = c.querySelector('#qb-result-area');
        if (!area) return;

        area.innerHTML = `
            <div class="qb__result ${wonClass}">
                <h2>${banner}</h2>
                <p class="qb__score">${this._myTeam.shortName} <strong>${result.score[0]}</strong> : <strong>${result.score[1]}</strong> ${this._enemyTeam.shortName}</p>
                <div class="qb__stats">
                    <span>击杀 ${result.kills.my}:${result.kills.enemy}</span>
                    <span>经济 ${result.gold.my}:${result.gold.enemy}</span>
                </div>
                ${result.mvp ? `<div class="qb__mvp">🌟 MVP: ${result.mvp.id} (${result.mvpKDA.kills}/${result.mvpKDA.deaths}/${result.mvpKDA.assists})</div>` : ''}
                <div class="qb__rewards">
                    <span>+${rewards.goldGain} 💰</span>
                    <span>+${rewards.expGain} 📦</span>
                </div>
                <div class="qb__btns">
                    <button class="btn btn--gold" id="btn-continue">继续</button>
                </div>
            </div>`;

        c.querySelector('#btn-continue')?.addEventListener('click', () => {
            sfxConfirm();
            game.sceneManager.switchTo('matchCalendar');
        });
    }

    /* ══════════ 赛季集成（修复版） ══════════ */

    _recordSeason(result) {
        try {
            if (!game.state.seasonSystem) return;
            const sys = SeasonSystem.fromSaveData(game.state.seasonSystem);

            const matchObj = sys.getPlayerMatch();
            if (matchObj) {
                const matchRound = matchObj.round;
                sys.recordPlayerMatch(matchObj, result.won, result.kills.my, result.kills.enemy);
                sys.simulateOtherMatches(matchRound);
            } else {
                console.warn('[QuickBattle] 未找到可记录的赛程比赛');
            }

            sys.advanceRound();

            game.state.season = game.state.season || {};
            game.state.season.phase = sys.currentPhase?.id || 'annual_finals';
            game.state.season.round = sys.currentRound;
            game.state.seasonSystem = sys.toSaveData();
        } catch (e) {
            console.warn('[QuickBattle] season record error:', e);
        }
    }

    /* ══════════ 工具 ══════════ */

    _show(selector) {
        this._container?.querySelector(selector)?.classList.remove('qb--hidden');
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}
