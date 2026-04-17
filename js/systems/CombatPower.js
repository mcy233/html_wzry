/**
 * CombatPower.js - 战力计算引擎
 * 个人战力 + 团队战力 + 对手AI虚拟养成
 */
import { game } from '../core/GameEngine.js';
import { GROWTH } from '../data/balance.js';
import { getBonds } from './BondSystem.js';

/* ===== 星级战力查表 ===== */
const STAR_POWER = [0, 0, 80, 200, 360, 560, 800, 1060, 1340, 1640, 1880];
// index = star (1~10)

const RARITY_POWER = { R: 0, SR: 200, SSR: 500 };

/* ===== 个人战力 ===== */
export function calcPlayerPower(player) {
    const s = player.stats || {};
    const statSum = Object.values(s).reduce((a, b) => a + b, 0);
    const base = statSum * 5;
    const levelPower = (player.level || 1) * 15;
    const starPower = STAR_POWER[player.star || 1] || 0;
    const rarityPower = RARITY_POWER[player.rarity] || 0;
    const skillPower = (player.skills?.length || 0) * 100;
    const condition = player.condition ?? 80;
    const condMod = (condition - 80) * 5;

    return {
        total: base + levelPower + starPower + rarityPower + skillPower + condMod,
        base, levelPower, starPower, rarityPower, skillPower, condMod,
    };
}

/* ===== 团队战力 ===== */
export function calcTeamPower(starters, allPlayers) {
    if (!starters?.length) return { total: 0, individuals: 0, bonuses: {}, bonusRate: 0 };

    const starterPlayers = starters.map(id =>
        (typeof id === 'string')
            ? (allPlayers || game.state.players || []).find(p => p.id === id)
            : id
    ).filter(Boolean);

    const individuals = starterPlayers.reduce((sum, p) => sum + calcPlayerPower(p).total, 0);

    const bonuses = {};
    let totalRate = 0;

    const bondResult = getBonds(starterPlayers);
    if (bondResult.teamBond) {
        bonuses['战队羁绊'] = bondResult.teamBond.powerRate;
        totalRate += bondResult.teamBond.powerRate;
    }
    for (const pb of (bondResult.playerBonds || [])) {
        bonuses[pb.name] = pb.powerRate;
        totalRate += pb.powerRate;
    }

    const collection = game.state.collection;
    if (collection?.totalValue >= 80) { bonuses['图鉴(Lv4)'] = 0.04; totalRate += 0.04; }
    else if (collection?.totalValue >= 50) { bonuses['图鉴(Lv3)'] = 0.03; totalRate += 0.03; }
    else if (collection?.totalValue >= 25) { bonuses['图鉴(Lv2)'] = 0.02; totalRate += 0.02; }
    else if (collection?.totalValue >= 10) { bonuses['图鉴(Lv1)'] = 0.01; totalRate += 0.01; }

    const morale = game.state.team?.morale ?? 70;
    if (morale > 80) { bonuses['高昂士气'] = 0.05; totalRate += 0.05; }
    else if (morale < 40) { bonuses['低迷士气'] = -0.08; totalRate -= 0.08; }

    bonuses['教练祝福'] = 0.03;
    totalRate += 0.03;

    const total = Math.round(individuals * (1 + totalRate));

    return { total, individuals, bonuses, bonusRate: totalRate, starterPlayers };
}

/* ===== 对手AI虚拟养成 ===== */
export function calcEnemyTeamPower(enemyTeam, enemyStarters) {
    const phase = game.state.season?.phase || 'spring_regular';
    const round = game.state.season?.round || 0;

    const { levelRange, starRange } = getAIGrowthByPhase(phase, round);

    const virtualPlayers = (enemyStarters || enemyTeam.players?.slice(0, 5) || []).map(p => {
        const lvl = randInRange(levelRange[0], levelRange[1]);
        const star = randInRange(starRange[0], starRange[1]);
        const rarity = p.rating >= 86 ? 'SSR' : p.rating >= 76 ? 'SR' : 'R';
        const levelBoostStats = {};
        for (const [k, v] of Object.entries(p.stats || {})) {
            const growth = Math.floor(lvl * 0.15) + (star - 1) * 2;
            levelBoostStats[k] = Math.min(99, v + growth);
        }
        return {
            ...p,
            level: lvl,
            star,
            rarity,
            skills: rarity === 'SSR' ? [{}, {}] : rarity === 'SR' ? [{}] : [],
            stats: levelBoostStats,
            condition: 75 + Math.floor(Math.random() * 15),
        };
    });

    const individuals = virtualPlayers.reduce((sum, p) => sum + calcPlayerPower(p).total, 0);

    const teamRating = enemyTeam.players
        ? enemyTeam.players.reduce((s, p) => s + (p.rating || 70), 0) / enemyTeam.players.length
        : 78;
    const difficultyMult = teamRating >= 88 ? 1.08 : teamRating >= 82 ? 1.03 : 0.95;
    const total = Math.round(individuals * difficultyMult);

    return { total, individuals, virtualPlayers, difficultyMult };
}

function getAIGrowthByPhase(phase, round) {
    const table = {
        spring_regular: { level: [3, 8], star: [1, 2] },
        spring_playoff: { level: [18, 30], star: [2, 3] },
        summer_regular: { level: [12, 22], star: [2, 3] },
        summer_playoff: { level: [30, 42], star: [3, 4] },
        annual_finals:  { level: [42, 55], star: [4, 5] },
    };
    const entry = table[phase] || table.spring_regular;
    const roundBonus = Math.min(round * 2, 8);
    return {
        levelRange: [entry.level[0] + roundBonus, entry.level[1] + roundBonus],
        starRange: entry.star,
    };
}

function randInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/* ===== 格式化展示 ===== */
export function formatPower(power) {
    if (power >= 10000) return (power / 10000).toFixed(1) + 'w';
    return power.toLocaleString();
}

export function powerCompareText(myPower, enemyPower) {
    const diff = myPower - enemyPower;
    const pct = Math.abs(diff) / Math.max(myPower, enemyPower) * 100;
    if (pct < 5) return { text: '势均力敌', cls: 'power--even' };
    if (diff > 0) return { text: `优势 +${Math.round(pct)}%`, cls: 'power--ahead' };
    return { text: `劣势 -${Math.round(pct)}%`, cls: 'power--behind' };
}
