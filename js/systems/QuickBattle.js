/**
 * QuickBattle.js - 快速战斗系统
 * 基于战力对比计算胜负 + 生成播报文本 + 动画数据
 */
import { QUICK_BATTLE, ECONOMY, MORALE, PLAYER, GROWTH } from '../data/balance.js';

/* ===== 战斗播报文本库 ===== */
const HL = {
    opening: {
        advantage: [
            '{myJG}入侵敌方野区，成功抢下红buff！',
            '{myMID}中路压制对手，率先到达4级',
            '我方双游成功gank{enemyTOP}，一血到手！',
            '{myJG}精准预判对手动向，反蹲成功！',
        ],
        disadvantage: [
            '对手{enemyJG}反野成功，打乱我方节奏',
            '{enemySUP}精彩游走，帮助{enemyADC}拿到一血',
            '对手{enemyMID}越塔强杀，气势如虹',
        ],
        neutral: [
            '双方对线平稳，试探性交锋',
            '开局双方均采取稳健打法',
            '前期双方互换资源，局势焦灼',
        ],
    },
    midgame: {
        advantage: [
            '{myADC}经济领先1500，发育势头良好！',
            '我方拿下暴君，全队获得增益！',
            '{myTOP}单带成功，牵制对手双人前来',
            '我方中路团战4换2，优势扩大！',
        ],
        disadvantage: [
            '对手抱团推进，我方丢失外塔',
            '{enemyJG}带节奏太猛，我方中路塔被推',
            '对手拿下主宰，压力骤增',
        ],
        neutral: [
            '双方围绕暴君展开拉扯',
            '中期双方交换防御塔，经济持平',
        ],
    },
    lategame: {
        advantage: [
            '{myJG}天秀操作，关键团战切掉C位！',
            '{myMID}极限反杀，完成1v2！',
            '我方配合默契，团灭对手！',
            '{myADC}输出爆炸，团战收割三杀！',
        ],
        disadvantage: [
            '对手{enemyADC}后期装备成型，团战伤害爆炸',
            '对手指挥精准，我方被逐个击破',
            '我方关键团失误，对手成功翻盘',
        ],
        neutral: [
            '双方围绕主宰展开生死团战',
            '决胜团战一触即发，气氛紧张到极点',
        ],
    },
    finalPush: {
        win: [
            '我方一波推平基地，胜利！',
            '{myJG}偷家成功！绝杀！',
            '团灭对手后一波带走水晶！',
        ],
        lose: [
            '对手抓住机会一波结束比赛',
            '我方基地告破，遗憾落败',
            '对手强行开团拿下胜利',
        ],
    },
};

function fillTemplate(tpl, myStarters, enemyStarters) {
    const roleMap = { '对抗路': 'TOP', '打野': 'JG', '中路': 'MID', '发育路': 'ADC', '游走': 'SUP' };
    const myMap = {}, enemyMap = {};
    for (const p of (myStarters || [])) {
        const tag = roleMap[p.role] || p.role;
        myMap[tag] = p.id;
    }
    for (const p of (enemyStarters || [])) {
        const tag = roleMap[p.role] || p.role;
        enemyMap[tag] = p.id;
    }
    return tpl
        .replace(/\{my(TOP|JG|MID|ADC|SUP)\}/g, (_, r) => myMap[r] || '我方选手')
        .replace(/\{enemy(TOP|JG|MID|ADC|SUP)\}/g, (_, r) => enemyMap[r] || '对手选手');
}

function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateHighlights(won, powerDiff, myStarters, enemyStarters) {
    const advantage = powerDiff > 0;
    const lines = [];

    const openPool = advantage ? HL.opening.advantage : powerDiff < -0.05 ? HL.opening.disadvantage : HL.opening.neutral;
    lines.push(fillTemplate(pickOne(openPool), myStarters, enemyStarters));

    const midPool = advantage ? HL.midgame.advantage : powerDiff < -0.05 ? HL.midgame.disadvantage : HL.midgame.neutral;
    lines.push(fillTemplate(pickOne(midPool), myStarters, enemyStarters));

    const latePool = won ? HL.lategame.advantage : HL.lategame.disadvantage;
    lines.push(fillTemplate(pickOne(latePool), myStarters, enemyStarters));

    const finalPool = won ? HL.finalPush.win : HL.finalPush.lose;
    lines.push(fillTemplate(pickOne(finalPool), myStarters, enemyStarters));

    return lines;
}

/* ===== 核心：快速战斗 ===== */
export function quickBattle(myPower, enemyPower, myStarters, enemyStarters) {
    // sigmoid 映射：战力差距越大，胜率越接近 0 或 1
    const diff = (myPower - enemyPower) / Math.max(myPower, enemyPower, 1);
    const STEEPNESS = 10;
    const noise = (Math.random() - 0.5) * QUICK_BATTLE.BASE_NOISE;
    const raw = 1 / (1 + Math.exp(-(diff * STEEPNESS + noise)));
    const winProb = Math.max(QUICK_BATTLE.MIN_WIN_RATE, Math.min(QUICK_BATTLE.MAX_WIN_RATE, raw));
    const won = Math.random() < winProb;

    const winnerScore = 3;
    const absDiff = Math.abs(diff);
    const loserScore = absDiff > 0.2 ? 0 : absDiff > 0.1 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);

    const baseKills = 10 + Math.floor(Math.random() * 8);
    const diffKills = Math.floor(absDiff * 20);
    const myKills = won ? baseKills + diffKills : Math.max(2, baseKills - diffKills);
    const enemyKills = won ? Math.max(2, baseKills - diffKills) : baseKills + diffKills;

    const goldSwing = Math.floor(absDiff * 15000) + 2000;
    const myGold = 40000 + Math.floor(Math.random() * 10000) + (won ? goldSwing : -goldSwing / 2);
    const enemyGold = 40000 + Math.floor(Math.random() * 10000) + (won ? -goldSwing / 2 : goldSwing);

    const mvpPool = won ? (myStarters || []) : (enemyStarters || []);
    const mvp = mvpPool.length
        ? mvpPool.reduce((best, p) => (p.rating || 0) > (best.rating || 0) ? p : best, mvpPool[0])
        : null;
    const mvpKDA = mvp ? {
        kills: 3 + Math.floor(Math.random() * 8),
        deaths: Math.floor(Math.random() * 4),
        assists: 2 + Math.floor(Math.random() * 6),
    } : null;

    const powerDiff = (myPower - enemyPower) / Math.max(myPower, enemyPower);
    const highlights = generateHighlights(won, powerDiff, myStarters, enemyStarters);

    return {
        won,
        score: won ? [winnerScore, loserScore] : [loserScore, winnerScore],
        kills: { my: myKills, enemy: enemyKills },
        gold: { my: Math.round(myGold / 1000) + 'k', enemy: Math.round(enemyGold / 1000) + 'k' },
        mvp,
        mvpKDA,
        highlights,
        winProb: Math.round(winProb * 100),
    };
}

/* ===== 快速战斗后结算（经济/经验/赛季） ===== */
export function applyQuickBattleRewards(game, result) {
    const state = game.state;
    if (result.won) {
        state.team.gold += ECONOMY.MATCH_WIN_GOLD;
        state.team.fame += ECONOMY.MATCH_WIN_FAME;
        state.team.fans = (state.team.fans || 0) + ECONOMY.MATCH_WIN_FANS;
        state.team.morale = Math.min(MORALE.MAX, state.team.morale + MORALE.BOOST_PER_WIN);
    } else {
        state.team.gold += ECONOMY.MATCH_LOSE_GOLD;
        state.team.fame += ECONOMY.MATCH_LOSE_FAME;
        state.team.fans = (state.team.fans || 0) + ECONOMY.MATCH_LOSE_FANS;
        state.team.morale = Math.max(MORALE.MIN, state.team.morale - MORALE.DECAY_PER_LOSS);
    }

    (state.players || []).forEach(p => {
        p.condition = Math.max(PLAYER.MIN_CONDITION, (p.condition || PLAYER.START_CONDITION) - PLAYER.CONDITION_DECAY_PER_MATCH);
    });

    const expGain = result.won ? GROWTH.MATCH_WIN_EXP : GROWTH.MATCH_LOSE_EXP;
    state.trainingExp = (state.trainingExp || 0) + expGain;

    const ticketChance = result.won ? 0.4 : 0.1;
    if (Math.random() < ticketChance) {
        if (!state.tickets) state.tickets = { gold: 0, blue: 0 };
        state.tickets.gold = (state.tickets.gold || 0) + 1;
    }

    return { expGain, goldGain: result.won ? ECONOMY.MATCH_WIN_GOLD : ECONOMY.MATCH_LOSE_GOLD };
}
