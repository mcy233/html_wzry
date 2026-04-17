/**
 * RosterScene - 选手管理（卡牌式 + 分栏导航）
 * 标签页：选手管理 / 选手碎片 / 选手解约 / 选手图鉴
 */
import { game } from '../core/GameEngine.js';
import { getTeamById, TEAMS, POSITIONS } from '../data/teams.js';
import { showToast } from '../ui/Components.js';
import { playerAvatarHTML } from '../ui/ImageManager.js';
import {
    initPlayerCard, migratePlayerData, canLevelUp, levelUp,
    canStarUp, starUp, canQualityUp, qualityUp,
    getFragments, getTrainingExp, starLabel, dismissPlayer,
    getUniversalFragments, RARITY
} from '../systems/PlayerGrowth.js';
import { calcPlayerPower, calcTeamPower, formatPower } from '../systems/CombatPower.js';
import { sfxClick, sfxConfirm, sfxGold } from '../ui/SoundManager.js';

const ROLE_ORDER = [POSITIONS.TOP, POSITIONS.JG, POSITIONS.MID, POSITIONS.ADC, POSITIONS.SUP];
const RARITY_COLOR = { R: '#4ea8de', SR: '#a855f7', SSR: '#f0c040' };

const TABS = [
    { id: 'manage', label: '选手管理', icon: '●' },
    { id: 'fragments', label: '选手碎片', icon: '' },
    { id: 'dismiss', label: '选手解约', icon: '' },
    { id: 'collection', label: '选手图鉴', icon: '' },
];

const COL_REWARDS = [
    { threshold: 10, label: '500金币 + 2金券', gold: 500, goldTickets: 2 },
    { threshold: 25, label: '1000金币 + 全属性+1', gold: 1000, statBoost: 1 },
    { threshold: 50, label: '2000金币 + 5金券', gold: 2000, goldTickets: 5 },
    { threshold: 80, label: '5000金币 + 全属性+2', gold: 5000, statBoost: 2 },
];

export class RosterScene {
    async enter(container) {
        this._container = container;
        const teamId = game.getState('teamId');
        this._team = getTeamById(teamId);
        if (!this._team) { game.sceneManager.switchTo('title'); return; }
        if (!game.state.team) {
            game.state.team = { gold: 500, fame: 0, fans: 1000, morale: 70, synergy: 50 };
        }
        this._ensurePlayerData();
        this._starters = game.state.starters?.length
            ? [...game.state.starters]
            : this._getDefaultStarters();
        this._tab = 'manage';
        this._sort = 'rating';
        container.className = 'scene scene--roster';
        this._render();
    }

    exit() { this._container = null; }

    _ensurePlayerData() {
        if (!game.state.players?.length) {
            game.state.players = (this._team.players || []).map(p => initPlayerCard({ ...p }));
        } else {
            game.state.players = migratePlayerData(game.state.players);
        }
        this._players = game.state.players || [];
    }

    _getDefaultStarters() {
        const used = new Set();
        const result = [];
        for (const role of ROLE_ORDER) {
            const cands = this._players.filter(p => p.role === role && !used.has(p.id));
            if (cands.length) {
                const best = cands.reduce((a, b) => (a.rating || 0) > (b.rating || 0) ? a : b);
                result.push(best.id); used.add(best.id);
            }
        }
        return result;
    }

    _isStarter(pid) { return this._starters.includes(pid); }

    _render() {
        const c = this._container;
        const totalPlayers = this._players.length;
        const gold = game.state.team?.gold ?? 0;

        c.innerHTML = `
        <div class="roster-bg"></div>
        <div class="roster-layout">
            <header class="roster-topbar">
                <div class="roster-topbar__left">
                    <button class="btn btn--back" id="btn-back">← 选手管理</button>
                </div>
                <div class="roster-topbar__center">已拥有: <strong>${totalPlayers}/600</strong></div>
                <div class="roster-topbar__right">
                    <span class="roster-topbar__res">💰 ${gold}</span>
                    <button class="btn btn--gold btn--small" id="btn-save-roster">💾 保存</button>
                </div>
            </header>
            <div class="roster-body">
                <nav class="roster-sidebar">
                    ${TABS.map(t => `
                        <button class="roster-nav ${this._tab === t.id ? 'roster-nav--active' : ''}" data-tab="${t.id}">
                            ${t.label}
                        </button>
                    `).join('')}
                </nav>
                <div class="roster-content" id="roster-content"></div>
            </div>
        </div>`;

        c.querySelector('#btn-back')?.addEventListener('click', () => {
            sfxClick(); game.sceneManager.switchTo('home');
        });
        c.querySelector('#btn-save-roster')?.addEventListener('click', () => this._saveRoster());
        c.querySelectorAll('.roster-nav[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxClick(); this._tab = btn.dataset.tab;
                c.querySelectorAll('.roster-nav').forEach(n => n.classList.toggle('roster-nav--active', n.dataset.tab === this._tab));
                this._renderTab();
            });
        });
        this._renderTab();
    }

    _renderTab() {
        const el = this._container.querySelector('#roster-content');
        if (!el) return;
        switch (this._tab) {
            case 'manage': this._renderManage(el); break;
            case 'fragments': this._renderFragments(el); break;
            case 'dismiss': this._renderDismiss(el); break;
            case 'collection': this._renderCollection(el); break;
        }
    }

    /* ══════════ 选手管理 Tab ══════════ */
    _renderManage(el) {
        const sorted = this._getSorted();
        const teamPower = calcTeamPower(this._starters, this._players);

        el.innerHTML = `
            <div class="roster-toolbar">
                <span style="font-size:13px;color:rgba(255,255,255,0.5)">⚔️ 团队战力: <strong style="color:var(--color-accent)">${formatPower(teamPower.total)}</strong></span>
                <button class="roster-toolbar__sort ${this._sort === 'rating' ? 'roster-toolbar__sort--active' : ''}" data-sort="rating">按评价</button>
                <button class="roster-toolbar__sort ${this._sort === 'rarity' ? 'roster-toolbar__sort--active' : ''}" data-sort="rarity">按品质</button>
                <button class="roster-toolbar__sort ${this._sort === 'level' ? 'roster-toolbar__sort--active' : ''}" data-sort="level">按等级</button>
            </div>
            <div class="roster-card-grid" id="card-grid"></div>`;

        el.querySelectorAll('.roster-toolbar__sort').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxClick(); this._sort = btn.dataset.sort; this._renderManage(el);
            });
        });

        const grid = el.querySelector('#card-grid');
        sorted.forEach(p => grid.appendChild(this._createCard(p)));
    }

    _getSorted() {
        const list = [...this._players];
        const starterSet = new Set(this._starters);
        list.sort((a, b) => {
            const sa = starterSet.has(a.id) ? 1 : 0;
            const sb = starterSet.has(b.id) ? 1 : 0;
            if (sb !== sa) return sb - sa;
            if (this._sort === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (this._sort === 'level') return (b.level || 1) - (a.level || 1);
            if (this._sort === 'rarity') {
                const ro = { SSR: 3, SR: 2, R: 1 };
                return (ro[b.rarity] || 0) - (ro[a.rarity] || 0);
            }
            return 0;
        });
        return list;
    }

    _createCard(player) {
        const div = document.createElement('div');
        const rarity = player.rarity || 'R';
        const rc = rarity.toLowerCase();
        const isStarter = this._isStarter(player.id);

        div.className = `roster-card roster-card--${rc}`;
        div.innerHTML = `
            <div class="roster-card__frame"></div>
            ${isStarter ? '<div class="roster-card__starter">主力</div>' : ''}
            <div class="roster-card__avatar">${playerAvatarHTML(player, this._team.color, 160)}</div>
            <div class="roster-card__info">
                <div class="roster-card__rating">${player.rating || '?'}</div>
                <div class="roster-card__meta">
                    <span class="star-icon">⭐</span>${starLabel(player.star || 1)}
                    <span>Lv.${player.level || 1}</span>
                </div>
                <div class="roster-card__name">${player.id}</div>
                <div class="roster-card__sub">${player.role} · ${this._team.shortName}</div>
            </div>`;

        div.addEventListener('click', () => { sfxClick(); this._showDetail(player); });
        return div;
    }

    _showDetail(player) {
        const existing = this._container.querySelector('.roster-detail-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'roster-detail-overlay';
        const rarity = player.rarity || 'R';
        const rc = RARITY_COLOR[rarity] || '#aaa';
        const power = calcPlayerPower(player);
        const stats = player.stats || {};
        const lvInfo = canLevelUp(player);
        const stInfo = canStarUp(player);
        const qInfo = canQualityUp(player);
        const frags = getFragments(player.id);
        const isStarter = this._isStarter(player.id);

        overlay.innerHTML = `
        <div class="roster-detail-panel">
            <div class="rd-header">
                <div class="rd-header__avatar">${playerAvatarHTML(player, this._team.color, 64)}</div>
                <div class="rd-header__info">
                    <div class="rd-header__name">${player.id}</div>
                    <div class="rd-header__sub">${player.name || ''} · ${player.role}</div>
                    <div class="rd-header__tags">
                        <span class="rd-tag" style="color:${rc};border-color:${rc}">${rarity}</span>
                        <span class="rd-tag" style="color:var(--color-gold);border-color:var(--color-gold)">Lv.${player.level || 1}</span>
                        <span class="rd-tag" style="color:var(--color-accent);border-color:var(--color-accent)">${starLabel(player.star || 1)}</span>
                    </div>
                </div>
            </div>
            <div class="rd-power">
                <div class="rd-power__item"><span>总战力</span><span style="color:var(--color-accent)">${formatPower(power.total)}</span></div>
                <div class="rd-power__item"><span>基础</span><span>${power.base}</span></div>
                <div class="rd-power__item"><span>等级加成</span><span>+${power.levelPower}</span></div>
                <div class="rd-power__item"><span>星级加成</span><span>+${power.starPower}</span></div>
                <div class="rd-power__item"><span>品质加成</span><span>+${power.rarityPower}</span></div>
                <div class="rd-power__item"><span>碎片</span><span>${frags}</span></div>
            </div>
            <div class="rd-stats">
                ${Object.entries(stats).map(([k, v]) => `
                    <div class="rd-stat-row">
                        <span class="rd-stat-row__label">${k}</span>
                        <div class="rd-stat-row__bar"><div class="rd-stat-row__fill" style="width:${v}%;background:${v >= 85 ? 'var(--color-success)' : v >= 70 ? 'var(--color-accent)' : 'var(--color-danger)'}"></div></div>
                        <span class="rd-stat-row__val">${v}</span>
                    </div>`).join('')}
            </div>
            ${player.skills?.length ? `<div class="rd-skills"><h4>技能</h4>${player.skills.map(s => `<div class="rd-skill-tag"><strong>${s.name}</strong>: ${s.desc}</div>`).join('')}</div>` : ''}
            <div class="rd-actions">
                <button class="btn btn--gold btn--small" id="rd-levelup" ${lvInfo.canLevel ? '' : 'disabled'}>升级 (${lvInfo.expNeeded}经验+${lvInfo.goldCost}金)</button>
                <button class="btn btn--small" id="rd-starup" style="background:${rc};color:#000" ${stInfo.can ? '' : 'disabled'}>升星 (${stInfo.fragCost || '?'}碎+${stInfo.goldCost || '?'}金)</button>
                ${qInfo.nextRarity ? `<button class="btn btn--small" id="rd-qualityup" style="background:${RARITY_COLOR[qInfo.nextRarity]};color:#000" ${qInfo.can ? '' : 'disabled'}>升品→${qInfo.nextRarity}</button>` : ''}
                <button class="btn btn--small ${isStarter ? 'btn--danger' : 'btn--gold'}" id="rd-swap">${isStarter ? '下放替补' : '设为首发'}</button>
                <button class="btn btn--outline btn--small" id="rd-close">关闭</button>
            </div>
        </div>`;

        this._container.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('roster-detail-overlay--show'));

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { overlay.classList.remove('roster-detail-overlay--show'); setTimeout(() => overlay.remove(), 250); }
        });
        overlay.querySelector('#rd-close')?.addEventListener('click', () => {
            overlay.classList.remove('roster-detail-overlay--show'); setTimeout(() => overlay.remove(), 250);
        });
        overlay.querySelector('#rd-swap')?.addEventListener('click', () => {
            sfxConfirm(); this._toggleStarter(player);
            overlay.remove(); this._renderTab();
        });
        overlay.querySelector('#rd-levelup')?.addEventListener('click', () => {
            const result = levelUp(player);
            if (result) {
                sfxConfirm(); showToast(`${player.id} 升级到 Lv.${player.level}！`);
                game.silentSave(); overlay.remove(); this._showDetail(player); this._renderTab();
            }
        });
        overlay.querySelector('#rd-starup')?.addEventListener('click', () => {
            if (starUp(player)) {
                sfxConfirm(); showToast(`${player.id} 升星到 ${starLabel(player.star)}！`);
                game.silentSave(); overlay.remove(); this._showDetail(player); this._renderTab();
            }
        });
        overlay.querySelector('#rd-qualityup')?.addEventListener('click', () => {
            if (qualityUp(player)) {
                sfxConfirm(); showToast(`${player.id} 升品为 ${player.rarity}！`);
                game.silentSave(); overlay.remove(); this._showDetail(player); this._renderTab();
            }
        });
    }

    _toggleStarter(player) {
        if (this._isStarter(player.id)) {
            this._starters = this._starters.filter(id => id !== player.id);
        } else {
            const sameRole = this._players.filter(p => p.role === player.role && this._isStarter(p.id));
            if (sameRole.length > 0) this._starters = this._starters.filter(id => id !== sameRole[0].id);
            if (this._starters.length >= 5) { showToast('首发已满5人'); return; }
            this._starters.push(player.id);
        }
    }

    _saveRoster() {
        if (this._starters.length < 5) { showToast('首发不足5人！'); return; }
        game.state.players = this._players;
        game.state.starters = this._starters;
        game.save();
    }

    /* ══════════ 选手碎片 Tab ══════════ */
    _renderFragments(el) {
        const uniFrags = getUniversalFragments();
        const roster = game.state.rosterAll || game.state.players || [];
        const fragList = roster.map(p => ({ id: p.id, rarity: p.rarity || 'R', count: getFragments(p.id) }))
            .filter(f => f.count > 0)
            .sort((a, b) => b.count - a.count);

        el.innerHTML = `
            <div style="margin-bottom:14px;font-size:13px;color:rgba(255,255,255,0.6)">
                通用碎片: <strong style="color:var(--color-gold)">${uniFrags}</strong>
            </div>
            ${fragList.length ? `<div class="roster-frag-grid">${fragList.map(f => {
                const color = RARITY_COLOR[f.rarity] || '#aaa';
                return `<div class="roster-frag-item" style="--rc:${color}">
                    <span class="roster-frag-item__name">${f.id}</span>
                    <span class="roster-frag-item__count">×${f.count}</span>
                </div>`;
            }).join('')}</div>` : '<div class="roster-empty">暂无碎片</div>'}`;
    }

    /* ══════════ 选手解约 Tab ══════════ */
    _renderDismiss(el) {
        const roster = game.state.rosterAll || game.state.players || [];
        const starterIds = new Set(game.state.starters || []);
        const dismissable = roster.filter(p => !starterIds.has(p.id));

        if (!dismissable.length) {
            el.innerHTML = '<div class="roster-empty">没有可解约的替补选手</div>';
            return;
        }

        el.innerHTML = `<div class="roster-dismiss-grid">${dismissable.map(p => {
            const color = RARITY_COLOR[p.rarity || 'R'] || '#aaa';
            return `<div class="roster-dismiss-row">
                <div style="width:36px;height:36px;border-radius:6px;overflow:hidden;flex-shrink:0">${playerAvatarHTML(p, '#888', 36)}</div>
                <div class="roster-dismiss-row__info">
                    <div class="roster-dismiss-row__name" style="color:${color}">${p.id}</div>
                    <div class="roster-dismiss-row__meta">${p.rarity || 'R'} · ${p.role} · Lv.${p.level || 1}</div>
                </div>
                <button class="btn btn--small" style="background:#e74c3c;color:#fff" data-pid="${p.id}">解约</button>
            </div>`;
        }).join('')}</div>`;

        el.querySelectorAll('[data-pid]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.dataset.pid;
                const player = roster.find(p => p.id === pid);
                if (!player) return;
                sfxGold();
                const result = dismissPlayer(player);
                game.state.rosterAll = (game.state.rosterAll || []).filter(p => p.id !== pid);
                game.state.players = (game.state.players || []).filter(p => p.id !== pid);
                this._players = game.state.players;
                showToast(`解约 ${pid}：+${result.fragReturn}碎片 +${result.goldReturn}金币`);
                game.silentSave();
                this._renderDismiss(el);
            });
        });
    }

    /* ══════════ 选手图鉴 Tab ══════════ */
    _renderCollection(el) {
        if (!game.state.collectionData) {
            game.state.collectionData = { unlocked: [], totalValue: 0, claimedRewards: [] };
        }
        const col = game.state.collectionData;
        const all = this._getAllKPLPlayers();
        const unlocked = new Set(col.unlocked || []);
        const totalCount = all.length;
        const unlockedCount = unlocked.size;
        const pct = totalCount > 0 ? (unlockedCount / totalCount * 100).toFixed(1) : 0;

        el.innerHTML = `
            <div style="font-size:14px;margin-bottom:10px;color:rgba(255,255,255,0.7)">
                图鉴进度: <strong style="color:var(--color-accent)">${unlockedCount}/${totalCount}</strong> (${pct}%)
            </div>
            <div class="roster-col-progress">
                <div class="roster-col-progress__bar">
                    <div class="roster-col-progress__fill" style="width:${pct}%"></div>
                </div>
            </div>
            <div class="roster-col-rewards" id="col-rewards"></div>
            <div class="roster-col-grid" id="col-grid"></div>`;

        this._renderColRewards(el, unlockedCount);
        this._renderColGrid(el, all, unlocked);
    }

    _getAllKPLPlayers() {
        const all = [];
        for (const team of TEAMS) {
            for (const p of team.players) all.push({ ...p, teamId: team.id, teamName: team.shortName });
        }
        return all;
    }

    _renderColRewards(el, count) {
        const rwd = el.querySelector('#col-rewards');
        if (!rwd) return;
        const claimed = new Set(game.state.collectionData.claimedRewards || []);
        rwd.innerHTML = COL_REWARDS.map(r => {
            const reached = count >= r.threshold;
            const isClaimed = claimed.has(r.threshold);
            return `<div class="roster-col-rwd ${reached ? 'roster-col-rwd--reached' : ''} ${isClaimed ? 'roster-col-rwd--claimed' : ''}">
                <span class="roster-col-rwd__t">${r.threshold}人</span>
                <span>${r.label}</span>
                ${reached && !isClaimed ? `<button class="btn btn--gold btn--small" data-t="${r.threshold}">领取</button>` : ''}
                ${isClaimed ? '<span class="roster-col-rwd__done">✓</span>' : ''}
            </div>`;
        }).join('');
        rwd.querySelectorAll('[data-t]').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxGold();
                const t = parseInt(btn.dataset.t);
                const reward = COL_REWARDS.find(r => r.threshold === t);
                if (!reward) return;
                if (reward.gold) game.state.team.gold += reward.gold;
                if (reward.goldTickets) {
                    if (!game.state.tickets) game.state.tickets = { gold: 0, blue: 0 };
                    game.state.tickets.gold += reward.goldTickets;
                }
                if (!game.state.collectionData.claimedRewards) game.state.collectionData.claimedRewards = [];
                game.state.collectionData.claimedRewards.push(t);
                game.silentSave();
                showToast('奖励已领取！');
                this._renderCollection(this._container.querySelector('#roster-content'));
            });
        });
    }

    _renderColGrid(el, all, unlocked) {
        const grid = el.querySelector('#col-grid');
        if (!grid) return;
        const owned = game.state.rosterAll || [];
        grid.innerHTML = all.map(p => {
            const isUnlocked = unlocked.has(p.id);
            const ownedPlayer = owned.find(o => o.id === p.id);
            const rarity = ownedPlayer?.rarity || (p.rating >= 86 ? 'SSR' : p.rating >= 76 ? 'SR' : 'R');
            const color = RARITY_COLOR[rarity];
            return `<div class="roster-col-item ${isUnlocked ? 'roster-col-item--on' : 'roster-col-item--off'}" style="--rc:${isUnlocked ? color : '#333'}">
                <div class="roster-col-item__rarity" style="color:${isUnlocked ? color : '#444'}">${isUnlocked ? rarity : '?'}</div>
                <div class="roster-col-item__name">${isUnlocked ? p.id : '???'}</div>
                <div class="roster-col-item__team">${p.teamName}</div>
            </div>`;
        }).join('');
    }
}
