/**
 * PlayerGrowth.js - 选手养成核心系统
 * 负责：等级、星级、品质、经验、碎片、突破等所有养成逻辑
 */
import { game } from '../core/GameEngine.js';
import { eventBus } from '../core/EventBus.js';
import { GROWTH } from '../data/balance.js';

/* ===== 品质常量 ===== */
export const RARITY = { R: 'R', SR: 'SR', SSR: 'SSR' };
const RARITY_ORDER = ['R', 'SR', 'SSR'];

/* ===== 星级常量 ===== */
const STAR_POWER = [0, 80, 200, 360, 560, 800, 1060, 1340, 1640, 1880];
// index 0 = 1★(0), 1 = 2★(80) ... 4 = 5★(560), 5 = 红1★(800) ... 9 = 红5★(1880)

export function starLabel(star) {
    if (star <= 5) return '★'.repeat(star);
    return '红' + '★'.repeat(star - 5);
}

export function starIndex(star) {
    return Math.max(0, Math.min(STAR_POWER.length - 1, star - 1));
}

/* ===== 等级经验表 ===== */
function expForLevel(level) {
    if (level <= 10) return 80 + level * 12;
    if (level <= 20) return 200 + (level - 10) * 18;
    if (level <= 40) return 400 + (level - 20) * 20;
    return 800 + (level - 40) * 35;
}

/* ===== 初始化选手卡（将 teams.js 原始数据升格为完整养成数据） ===== */
export function initPlayerCard(raw, rarity) {
    if (raw._growth) return raw;
    const r = rarity || assignBaseRarity(raw.rating);
    return {
        ...raw,
        rarity: r,
        level: 1,
        star: 1,
        exp: 0,
        fragments: 0,
        skills: assignDefaultSkills(raw, r),
        condition: raw.condition || 80,
        _growth: true,
    };
}

function assignBaseRarity(rating) {
    if (rating >= 86) return 'SSR';
    if (rating >= 76) return 'SR';
    return 'R';
}

function assignDefaultSkills(player, rarity) {
    if (rarity === 'SSR') {
        return GROWTH.SKILL_POOL[player.role]?.slice(0, 2) || [];
    }
    if (rarity === 'SR') {
        return GROWTH.SKILL_POOL[player.role]?.slice(0, 1) || [];
    }
    return [];
}

/* ===== 迁移老存档选手数据 ===== */
export function migratePlayerData(players) {
    if (!players?.length) return players;
    return players.map(p => initPlayerCard(p));
}

/* ===== 升级 ===== */
export function canLevelUp(player) {
    const pool = game.state.trainingExp || 0;
    const needed = expForLevel(player.level);
    const goldCost = player.level * GROWTH.LEVEL_GOLD_MULT;
    return {
        canLevel: player.level < GROWTH.MAX_LEVEL && pool >= needed && game.state.team.gold >= goldCost,
        expNeeded: needed,
        goldCost,
        expPool: pool,
    };
}

export function levelUp(player) {
    const info = canLevelUp(player);
    if (!info.canLevel) return null;

    game.state.trainingExp -= info.expNeeded;
    game.state.team.gold -= info.goldCost;
    player.level++;
    player.exp = 0;

    const statKeys = Object.keys(player.stats);
    const boosted = statKeys[Math.floor(Math.random() * statKeys.length)];
    player.stats[boosted] = Math.min(GROWTH.MAX_STAT, player.stats[boosted] + 1);

    let breakthroughResult = null;
    if (player.level % 10 === 0) {
        breakthroughResult = applyBreakthrough(player);
    }

    recalcRating(player);
    eventBus.emit('player:levelUp', { player, breakthrough: breakthroughResult });
    return { boosted, breakthrough: breakthroughResult };
}

function applyBreakthrough(player) {
    const tier = player.level / 10;
    const allBoost = tier <= 2 ? 2 : tier <= 4 ? 3 : 4;
    const freePoints = tier === 2 ? 3 : tier === 4 ? 5 : 0;
    const result = { allBoost, freePoints, unlockSkill: false };

    for (const k of Object.keys(player.stats)) {
        player.stats[k] = Math.min(GROWTH.MAX_STAT, player.stats[k] + allBoost);
    }

    if (tier === 5 && player.rarity !== 'R' && player.skills.length < 2) {
        const pool = GROWTH.SKILL_POOL[player.role] || [];
        const existing = new Set(player.skills.map(s => s.name));
        const next = pool.find(s => !existing.has(s.name));
        if (next) { player.skills.push(next); result.unlockSkill = true; }
    }

    return result;
}

/* ===== 升星 ===== */
const STAR_COST = [
    null,
    { frag: 5,  gold: 200 },
    { frag: 10, gold: 500 },
    { frag: 20, gold: 1000 },
    { frag: 40, gold: 2000 },
    { frag: 60, gold: 3000 },
    { frag: 80, gold: 5000 },
    { frag: 80, gold: 5000 },
    { frag: 80, gold: 5000 },
    { frag: 80, gold: 5000 },
];

export function canStarUp(player) {
    if (player.star >= 10) return { can: false };
    const cost = STAR_COST[player.star];
    const frags = getFragments(player.id);
    return {
        can: frags >= cost.frag && game.state.team.gold >= cost.gold,
        fragCost: cost.frag,
        goldCost: cost.gold,
        fragOwned: frags,
    };
}

export function starUp(player) {
    const info = canStarUp(player);
    if (!info.can) return false;
    spendFragments(player.id, info.fragCost);
    game.state.team.gold -= info.goldCost;
    player.star++;

    const boost = player.star <= 5 ? (player.star) : 3;
    for (const k of Object.keys(player.stats)) {
        player.stats[k] = Math.min(GROWTH.MAX_STAT, player.stats[k] + boost);
    }

    recalcRating(player);
    eventBus.emit('player:starUp', { player });
    return true;
}

/* ===== 升品 ===== */
export function canQualityUp(player) {
    if (player.rarity === 'SSR') return { can: false };
    if (player.star < 5) return { can: false, reason: '需要5★才能升品' };
    const next = player.rarity === 'R' ? 'SR' : 'SSR';
    const fragCost = next === 'SR' ? 50 : 100;
    const goldCost = next === 'SR' ? 3000 : 8000;
    const frags = getFragments(player.id);
    return {
        can: frags >= fragCost && game.state.team.gold >= goldCost,
        nextRarity: next,
        fragCost,
        goldCost,
        fragOwned: frags,
    };
}

export function qualityUp(player) {
    const info = canQualityUp(player);
    if (!info.can) return false;
    spendFragments(player.id, info.fragCost);
    game.state.team.gold -= info.goldCost;
    player.rarity = info.nextRarity;
    player.star = 1;

    if (info.nextRarity === 'SR' && player.skills.length < 1) {
        const pool = GROWTH.SKILL_POOL[player.role] || [];
        if (pool.length) player.skills.push(pool[0]);
    }
    if (info.nextRarity === 'SSR' && player.skills.length < 2) {
        const pool = GROWTH.SKILL_POOL[player.role] || [];
        const existing = new Set(player.skills.map(s => s.name));
        const next = pool.find(s => !existing.has(s.name));
        if (next) player.skills.push(next);
    }

    recalcRating(player);
    eventBus.emit('player:qualityUp', { player });
    return true;
}

/* ===== 碎片管理 ===== */
function ensureFragments() {
    if (!game.state.fragments) game.state.fragments = { universal: 0 };
}

export function getFragments(playerId) {
    ensureFragments();
    return game.state.fragments[playerId] || 0;
}

export function addFragments(playerId, count) {
    ensureFragments();
    game.state.fragments[playerId] = (game.state.fragments[playerId] || 0) + count;
}

export function spendFragments(playerId, count) {
    ensureFragments();
    game.state.fragments[playerId] = Math.max(0, (game.state.fragments[playerId] || 0) - count);
}

export function getUniversalFragments() {
    ensureFragments();
    return game.state.fragments.universal || 0;
}

export function addUniversalFragments(count) {
    ensureFragments();
    game.state.fragments.universal = (game.state.fragments.universal || 0) + count;
}

/* ===== 解约 ===== */
export function dismissPlayer(player) {
    const fragReturn = player.rarity === 'SSR' ? 10 : player.rarity === 'SR' ? 5 : 2;
    const goldReturn = Math.floor(player.level * 5 + (player.star - 1) * 50);
    addUniversalFragments(fragReturn);
    game.state.team.gold += goldReturn;
    return { fragReturn, goldReturn };
}

/* ===== 重算 rating ===== */
export function recalcRating(player) {
    const s = player.stats;
    const avg = Object.values(s).reduce((a, b) => a + b, 0) / Object.keys(s).length;
    player.rating = Math.round(avg);
}

/* ===== 经验池操作 ===== */
export function addTrainingExp(amount) {
    if (!game.state.trainingExp) game.state.trainingExp = 0;
    game.state.trainingExp += amount;
}

export function getTrainingExp() {
    return game.state.trainingExp || 0;
}
