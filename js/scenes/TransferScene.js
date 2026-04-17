/**
 * TransferScene - 转会市场（电竞经理风格：表格式选手列表）
 */
import { game } from '../core/GameEngine.js';
import { showToast } from '../ui/Components.js';
import { refreshMarket, buyPlayer, getMarket } from '../systems/TransferMarket.js';
import { dismissPlayer } from '../systems/PlayerGrowth.js';
import { calcPlayerPower, formatPower } from '../systems/CombatPower.js';
import { playerAvatarHTML } from '../ui/ImageManager.js';
import { sfxClick, sfxConfirm, sfxGold } from '../ui/SoundManager.js';
import { getTeamById } from '../data/teams.js';

const RARITY_COLOR = { R: '#4ea8de', SR: '#a855f7', SSR: '#f0c040' };
const ROLE_LABEL = { 对抗路: '对抗', 打野: '打野', 中路: '中路', 发育路: '射手', 游走: '辅助' };

export class TransferScene {
    async enter(container) {
        this._container = container;
        container.className = 'scene scene--transfer';
        refreshMarket();
        this._tab = 'market';
        this._sort = { key: 'rating', desc: true };
        this._render();
    }
    exit() { this._container = null; }

    _render() {
        const c = this._container;
        const refreshCost = 200;
        c.innerHTML = `
        <div class="tfr-bg"></div>
        <div class="tfr-layout">
            <header class="tfr-topbar">
                <div class="tfr-topbar__left">
                    <button class="btn btn--back" id="btn-back">← 返回基地</button>
                    <h2>转会市场</h2>
                </div>
                <div class="tfr-topbar__right">
                    <span class="tfr-topbar__timer">选手更新倒计时: <strong>1天 12:00:00</strong></span>
                    <span class="tfr-topbar__gold">💰 <strong>${game.state.team.gold}</strong></span>
                </div>
            </header>
            <div class="tfr-tabs">
                <button class="tfr-tab ${this._tab === 'market' ? 'tfr-tab--active' : ''}" data-tab="market">🏪 选手市场</button>
                <button class="tfr-tab ${this._tab === 'dismiss' ? 'tfr-tab--active' : ''}" data-tab="dismiss">📤 解约选手</button>
            </div>
            <div class="tfr-body" id="tfr-body"></div>
            ${this._tab === 'market' ? `<div class="tfr-refresh">
                <button class="btn btn--outline" id="btn-refresh">🔄 刷新市场 (${refreshCost}金币)</button>
            </div>` : ''}
        </div>`;

        c.querySelector('#btn-back')?.addEventListener('click', () => {
            sfxClick(); game.sceneManager.switchTo('home');
        });
        c.querySelectorAll('.tfr-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxClick(); this._tab = btn.dataset.tab; this._render();
            });
        });
        c.querySelector('#btn-refresh')?.addEventListener('click', () => {
            if (game.state.team.gold < refreshCost) { showToast('金币不足'); return; }
            sfxGold(); game.state.team.gold -= refreshCost;
            refreshMarket(true); game.save(); this._render();
        });

        if (this._tab === 'market') this._renderMarket();
        else this._renderDismiss();
    }

    _sorted(list) {
        const { key, desc } = this._sort;
        return [...list].sort((a, b) => {
            let va = a[key] ?? 0, vb = b[key] ?? 0;
            if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
            return desc ? vb - va : va - vb;
        });
    }

    _headerHTML(columns) {
        return `<div class="tfr-table__head">
            ${columns.map(col => `<span class="tfr-th ${col.cls || ''}" data-sort="${col.key || ''}"
                >${col.label}${this._sort.key === col.key ? (this._sort.desc ? '▼' : '▲') : ''}</span>`).join('')}
        </div>`;
    }

    _bindSort() {
        this._container.querySelectorAll('.tfr-th[data-sort]').forEach(th => {
            if (!th.dataset.sort) return;
            th.addEventListener('click', () => {
                sfxClick();
                const k = th.dataset.sort;
                if (this._sort.key === k) this._sort.desc = !this._sort.desc;
                else { this._sort.key = k; this._sort.desc = true; }
                if (this._tab === 'market') this._renderMarket();
                else this._renderDismiss();
            });
        });
    }

    _renderMarket() {
        const market = getMarket();
        const body = this._container.querySelector('#tfr-body');
        if (!body) return;

        if (!market.length) {
            body.innerHTML = '<div class="tfr-empty">本阶段市场已清空，下一赛季阶段将刷新</div>';
            return;
        }

        const sorted = this._sorted(market);
        const cols = [
            { label: '选手', cls: 'tfr-th--player' },
            { label: '品质', key: 'rarity', cls: 'tfr-th--rarity' },
            { label: '评价', key: 'rating', cls: 'tfr-th--rating' },
            { label: '位置', key: 'role', cls: 'tfr-th--role' },
            { label: '战队', cls: 'tfr-th--team' },
            { label: '战力', cls: 'tfr-th--power' },
            { label: '价格', key: 'price', cls: 'tfr-th--price' },
            { label: '操作', cls: 'tfr-th--action' },
        ];

        body.innerHTML = `
        <div class="tfr-table">
            ${this._headerHTML(cols)}
            <div class="tfr-table__body">
                ${sorted.map(p => {
                    const color = RARITY_COLOR[p.rarity] || '#aaa';
                    const power = calcPlayerPower(p);
                    const team = getTeamById(p.fromTeam);
                    const teamName = team ? team.shortName : (p.fromTeam || '?');
                    const teamColor = team?.color || '#888';
                    const canBuy = game.state.team.gold >= p.price;
                    return `<div class="tfr-row" style="--rc:${color}">
                        <div class="tfr-cell tfr-cell--player">
                            <div class="tfr-avatar">${playerAvatarHTML(p, teamColor, 40)}</div>
                            <div class="tfr-player-info">
                                <span class="tfr-player-name">${p.id}</span>
                                <span class="tfr-player-sub">${p.name || ''}</span>
                            </div>
                        </div>
                        <div class="tfr-cell tfr-cell--rarity">
                            <span class="tfr-badge" style="color:${color};border-color:${color}">${p.rarity}</span>
                        </div>
                        <div class="tfr-cell tfr-cell--rating"><strong>${p.rating}</strong></div>
                        <div class="tfr-cell tfr-cell--role">${ROLE_LABEL[p.role] || p.role}</div>
                        <div class="tfr-cell tfr-cell--team">${teamName}</div>
                        <div class="tfr-cell tfr-cell--power">${formatPower(power.total)}</div>
                        <div class="tfr-cell tfr-cell--price"><span class="tfr-price">💰${p.price}</span></div>
                        <div class="tfr-cell tfr-cell--action">
                            <button class="tfr-buy-btn ${canBuy ? '' : 'tfr-buy-btn--disabled'}" data-pid="${p.id}" ${canBuy ? '' : 'disabled'}>签约</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;

        this._bindSort();
        body.querySelectorAll('.tfr-buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxConfirm();
                const result = buyPlayer(btn.dataset.pid);
                if (result.success) {
                    sfxGold(); showToast(`签约 ${result.player.id} 成功！`);
                    game.save(); this._render();
                } else { showToast(result.reason); }
            });
        });
    }

    _renderDismiss() {
        const body = this._container.querySelector('#tfr-body');
        if (!body) return;
        const roster = game.state.rosterAll || game.state.players || [];
        const starterIds = new Set(game.state.starters || []);
        const dismissable = roster.filter(p => !starterIds.has(p.id));

        if (!dismissable.length) {
            body.innerHTML = '<div class="tfr-empty">没有可解约的替补选手</div>';
            return;
        }

        const sorted = this._sorted(dismissable);
        const cols = [
            { label: '选手', cls: 'tfr-th--player' },
            { label: '品质', key: 'rarity', cls: 'tfr-th--rarity' },
            { label: '评价', key: 'rating', cls: 'tfr-th--rating' },
            { label: '等级', key: 'level', cls: 'tfr-th--role' },
            { label: '位置', key: 'role', cls: 'tfr-th--team' },
            { label: '操作', cls: 'tfr-th--action' },
        ];

        body.innerHTML = `
        <div class="tfr-table">
            ${this._headerHTML(cols)}
            <div class="tfr-table__body">
                ${sorted.map(p => {
                    const color = RARITY_COLOR[p.rarity || 'R'] || '#aaa';
                    return `<div class="tfr-row" style="--rc:${color}">
                        <div class="tfr-cell tfr-cell--player">
                            <div class="tfr-avatar">${playerAvatarHTML(p, '#888', 40)}</div>
                            <div class="tfr-player-info">
                                <span class="tfr-player-name">${p.id}</span>
                            </div>
                        </div>
                        <div class="tfr-cell tfr-cell--rarity">
                            <span class="tfr-badge" style="color:${color};border-color:${color}">${p.rarity || 'R'}</span>
                        </div>
                        <div class="tfr-cell tfr-cell--rating"><strong>${p.rating}</strong></div>
                        <div class="tfr-cell tfr-cell--role">Lv.${p.level || 1}</div>
                        <div class="tfr-cell tfr-cell--team">${ROLE_LABEL[p.role] || p.role}</div>
                        <div class="tfr-cell tfr-cell--action">
                            <button class="tfr-dismiss-btn" data-pid="${p.id}">解约</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;

        this._bindSort();
        body.querySelectorAll('.tfr-dismiss-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.dataset.pid;
                const player = roster.find(p => p.id === pid);
                if (!player) return;
                sfxClick();
                const result = dismissPlayer(player);
                game.state.rosterAll = (game.state.rosterAll || []).filter(p => p.id !== pid);
                game.state.players = (game.state.players || []).filter(p => p.id !== pid);
                showToast(`解约 ${pid}：获得 ${result.fragReturn} 碎片 + ${result.goldReturn} 金币`);
                game.save(); this._render();
            });
        });
    }
}
