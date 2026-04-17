/**
 * TransferMarket.js - 转会市场
 * NPC刷新选手列表 + 碎片商店 + 选手解约
 */
import { game } from '../core/GameEngine.js';
import { TEAMS } from '../data/teams.js';
import { TRANSFER } from '../data/balance.js';
import { initPlayerCard } from './PlayerGrowth.js';

function ensureTransfer() {
    if (!game.state.transfer) {
        game.state.transfer = { market: [], lastRefreshPhase: '' };
    }
}

function getAllPlayers() {
    const all = [];
    for (const team of TEAMS) {
        for (const p of team.players) {
            all.push({ ...p, fromTeam: team.id });
        }
    }
    return all;
}

function calcPrice(player) {
    const rarity = player.rating >= 86 ? 'SSR' : player.rating >= 76 ? 'SR' : 'R';
    const range = TRANSFER.PRICE[rarity] || [200, 500];
    return range[0] + Math.floor(Math.random() * (range[1] - range[0]));
}

/* ===== 刷新市场 ===== */
export function refreshMarket(force = false) {
    ensureTransfer();
    const currentPhase = game.state.season?.phase || 'spring_regular';
    if (!force && game.state.transfer.lastRefreshPhase === currentPhase && game.state.transfer.market.length > 0) {
        return game.state.transfer.market;
    }

    const allPool = getAllPlayers();
    const owned = new Set((game.state.rosterAll || []).map(p => p.id));
    const available = allPool.filter(p => !owned.has(p.id));

    const shuffled = available.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, TRANSFER.MARKET_SIZE);

    game.state.transfer.market = picked.map(p => ({
        ...p,
        price: calcPrice(p),
        rarity: p.rating >= 86 ? 'SSR' : p.rating >= 76 ? 'SR' : 'R',
    }));
    game.state.transfer.lastRefreshPhase = currentPhase;

    return game.state.transfer.market;
}

/* ===== 购买选手 ===== */
export function buyPlayer(playerId) {
    ensureTransfer();
    const market = game.state.transfer.market;
    const idx = market.findIndex(p => p.id === playerId);
    if (idx === -1) return { success: false, reason: '选手不在市场中' };

    const entry = market[idx];
    if (game.state.team.gold < entry.price) return { success: false, reason: '金币不足' };

    game.state.team.gold -= entry.price;
    market.splice(idx, 1);

    const card = initPlayerCard({ ...entry });
    if (!game.state.rosterAll) game.state.rosterAll = [];
    game.state.rosterAll.push(card);

    if (!game.state.collectionData) game.state.collectionData = { unlocked: [], totalValue: 0, claimedRewards: [] };
    if (!game.state.collectionData.unlocked.includes(card.id)) {
        game.state.collectionData.unlocked.push(card.id);
        game.state.collectionData.totalValue++;
    }

    return { success: true, player: card };
}

/* ===== 获取当前市场 ===== */
export function getMarket() {
    ensureTransfer();
    return game.state.transfer.market || [];
}
