/**
 * RecruitSystem.js - 签约（抽卡）系统
 * 包含保底、心愿单、碎片转换
 */
import { game } from '../core/GameEngine.js';
import { eventBus } from '../core/EventBus.js';
import { TEAMS } from '../data/teams.js';
import { RECRUIT } from '../data/balance.js';
import { initPlayerCard, addFragments, RARITY } from './PlayerGrowth.js';

function ensureRecruit() {
    if (!game.state.recruit) {
        game.state.recruit = { goldPity: 0, bluePity: 0, wishList: [], history: [] };
    }
    if (!game.state.tickets) {
        game.state.tickets = { gold: 5, blue: 20 };
    }
}

/* ===== 全选手池 ===== */
let _allPlayersCache = null;

function getAllPlayersPool() {
    if (_allPlayersCache) return _allPlayersCache;
    _allPlayersCache = [];
    for (const team of TEAMS) {
        for (const p of team.players) {
            _allPlayersCache.push({ ...p, fromTeam: team.id });
        }
    }
    return _allPlayersCache;
}

/* ===== 单次抽卡 ===== */
function rollOnce(ticketType, guaranteeSR = false) {
    ensureRecruit();
    const state = game.state.recruit;
    const pool = getAllPlayersPool();

    state.goldPity = (state.goldPity || 0) + 1;

    let rarity;
    if (ticketType === 'gold' && state.goldPity >= RECRUIT.GOLD_PITY) {
        rarity = 'SSR';
        state.goldPity = 0;
    } else if (guaranteeSR) {
        const roll = Math.random();
        rarity = roll < RECRUIT.SSR_RATE ? 'SSR' : 'SR';
        if (rarity === 'SSR') state.goldPity = 0;
    } else {
        const roll = Math.random();
        if (roll < RECRUIT.SSR_RATE) {
            rarity = 'SSR';
            state.goldPity = 0;
        } else if (roll < RECRUIT.SSR_RATE + RECRUIT.SR_RATE) {
            rarity = 'SR';
        } else {
            rarity = 'R';
        }
    }

    let candidates = pool.filter(p => {
        const pr = p.rating >= 86 ? 'SSR' : p.rating >= 76 ? 'SR' : 'R';
        return pr === rarity;
    });
    if (!candidates.length) candidates = pool;

    let chosen;
    if (rarity === 'SSR' && state.wishList?.length) {
        if (Math.random() < RECRUIT.WISH_SSR_RATE) {
            const wishCandidates = candidates.filter(p => state.wishList.includes(p.id));
            if (wishCandidates.length) {
                chosen = wishCandidates[Math.floor(Math.random() * wishCandidates.length)];
            }
        }
    }
    if (!chosen) {
        chosen = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const result = processRecruitResult(chosen, rarity);
    state.history = [result, ...(state.history || [])].slice(0, 50);
    return result;
}

function processRecruitResult(rawPlayer, rarity) {
    const existing = (game.state.rosterAll || []).find(p => p.id === rawPlayer.id);
    if (existing) {
        const fragCount = RECRUIT.DUPE_FRAGMENT[rarity] || 2;
        addFragments(rawPlayer.id, fragCount);
        return { player: rawPlayer, rarity, isDupe: true, fragments: fragCount };
    } else {
        const card = initPlayerCard({ ...rawPlayer }, rarity);
        if (!game.state.rosterAll) game.state.rosterAll = [];
        game.state.rosterAll.push(card);

        if (!game.state.collectionData) game.state.collectionData = { unlocked: [], totalValue: 0, claimedRewards: [] };
        if (!game.state.collectionData.unlocked.includes(card.id)) {
            game.state.collectionData.unlocked.push(card.id);
            game.state.collectionData.totalValue++;
        }

        return { player: card, rarity, isDupe: false, fragments: 0 };
    }
}

/* ===== 公开API ===== */
export function singlePull(ticketType = 'gold') {
    ensureRecruit();
    const tickets = game.state.tickets;
    if ((tickets[ticketType] || 0) < 1) return null;
    tickets[ticketType]--;
    const result = rollOnce(ticketType);
    eventBus.emit('recruit:pull', { results: [result] });
    return [result];
}

export function tenPull(ticketType = 'gold') {
    ensureRecruit();
    const tickets = game.state.tickets;
    if ((tickets[ticketType] || 0) < 10) return null;
    tickets[ticketType] -= 10;
    const results = [];
    let hasSR = false;
    for (let i = 0; i < 10; i++) {
        const guaranteeSR = (i === 9 && !hasSR && RECRUIT.TEN_PULL_SR_GUARANTEE);
        const r = rollOnce(ticketType, guaranteeSR);
        results.push(r);
        if (r.rarity === 'SR' || r.rarity === 'SSR') hasSR = true;
    }
    eventBus.emit('recruit:pull', { results });
    return results;
}

export function getGoldPity() {
    ensureRecruit();
    return game.state.recruit.goldPity || 0;
}

export function setWishList(playerIds) {
    ensureRecruit();
    game.state.recruit.wishList = playerIds.slice(0, RECRUIT.WISH_LIST_MAX);
}

export function getWishList() {
    ensureRecruit();
    return game.state.recruit.wishList || [];
}

export function getTickets() {
    ensureRecruit();
    return game.state.tickets;
}

export function addTickets(type, count) {
    ensureRecruit();
    game.state.tickets[type] = (game.state.tickets[type] || 0) + count;
}

export function getRecruitHistory() {
    ensureRecruit();
    return game.state.recruit.history || [];
}
