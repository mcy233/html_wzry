/**
 * BondSystem.js - 羁绊系统
 * 战队羁绊 + 选手双人/三人羁绊
 */
import { game } from '../core/GameEngine.js';

/* ===== 战队羁绊定义 ===== */
const TEAM_BONDS = {
    wb:   { name: '京城铁军', desc: '全员抗压+5，团战阶段伤害+8%', powerRate: 0.10, statBoost: { '抗压': 5 } },
    jdg:  { name: '无畏之心', desc: '全员意识+5，逆风翻盘率+10%', powerRate: 0.10, statBoost: { '意识': 5 } },
    ag:   { name: '超玩精神', desc: '全员配合+5，BP阶段额外优势', powerRate: 0.10, statBoost: { '配合': 5 } },
    hero: { name: '英雄之魂', desc: '全员心态+5，士气不衰减', powerRate: 0.09, statBoost: { '心态': 5 } },
    edg:  { name: '深圳速度', desc: '全员操作+4，前期节奏加成', powerRate: 0.09, statBoost: { '操作': 4 } },
    gz:   { name: '羊城雄风', desc: '全员对线+4，线上压制力+', powerRate: 0.09, statBoost: { '对线': 4 } },
    xys:  { name: '星火燎原', desc: '全员意识+4，团战决策力+', powerRate: 0.09, statBoost: { '意识': 4 } },
    wolves: { name: '山城狼魂', desc: '全员心态+5，落后时属性不衰减', powerRate: 0.10, statBoost: { '心态': 5 } },
    ttg:  { name: '不灭意志', desc: '全员抗压+4，逆风坚韧+', powerRate: 0.09, statBoost: { '抗压': 4 } },
    lg:   { name: '微光之力', desc: '全员配合+4，团战增益+', powerRate: 0.08, statBoost: { '配合': 4 } },
    fly:  { name: '蝇量之翼', desc: '全员操作+4，节奏加速', powerRate: 0.08, statBoost: { '操作': 4 } },
    gs:   { name: '佛山无影', desc: '全员意识+3，视野控制+', powerRate: 0.08, statBoost: { '意识': 3 } },
    wz:   { name: '乌江雄起', desc: '全员心态+3，士气+', powerRate: 0.08, statBoost: { '心态': 3 } },
    jr:   { name: '金戈铁马', desc: '全员抗压+3，防守加成', powerRate: 0.08, statBoost: { '抗压': 3 } },
    dx:   { name: '暗星之力', desc: '全员操作+3，机动性+', powerRate: 0.08, statBoost: { '操作': 3 } },
    rw:   { name: '侠之大者', desc: '全员对线+3，单挑强化', powerRate: 0.08, statBoost: { '对线': 3 } },
    nv:   { name: '星际远征', desc: '全员配合+3，协作增强', powerRate: 0.08, statBoost: { '配合': 3 } },
    ke:   { name: '快手之刃', desc: '全员操作+3，反应加速', powerRate: 0.08, statBoost: { '操作': 3 } },
};

/* ===== 选手羁绊定义 ===== */
const PLAYER_BONDS = [
    { name: '双子星', members: ['暖阳', '听悦'], desc: '打野+中路联动：意识各+3', powerRate: 0.03, statBoost: { '意识': 3 } },
    { name: '铁壁搭档', members: ['梓墨', '玖欣'], desc: '对抗路+游走联动：抗压各+4', powerRate: 0.03, statBoost: { '抗压': 4 } },
    { name: '发育保障', members: ['小麦', '玖欣'], desc: '发育路+游走联动：配合各+3', powerRate: 0.03, statBoost: { '配合': 3 } },
    { name: '无畏双星', members: ['清融', '无畏'], desc: '中路+游走联动：意识各+4', powerRate: 0.04, statBoost: { '意识': 4 } },
    { name: '超玩核心', members: ['一诺', '钟意'], desc: '射手+打野联动：操作各+3', powerRate: 0.03, statBoost: { '操作': 3 } },
    { name: '狼牙三叉', members: ['路西法', '暴风锐', '刘邦'], desc: '三人协作：全属性+2', powerRate: 0.04, statBoost: { '操作': 2, '意识': 2 } },
];

/**
 * 计算当前阵容的羁绊
 * @param {Array} starterPlayers - 首发选手对象数组
 * @returns {{ teamBond, playerBonds: Array }}
 */
export function getBonds(starterPlayers) {
    if (!starterPlayers?.length) return { teamBond: null, playerBonds: [] };

    const ids = new Set(starterPlayers.map(p => p.id));
    const teamId = game.state.teamId;

    let teamBond = null;
    if (teamId && TEAM_BONDS[teamId]) {
        const teamDef = TEAM_BONDS[teamId];
        const teamPlayers = game.state.players || [];
        const teamPlayerIds = new Set(teamPlayers.map(p => p.id));
        const allFromTeam = [...ids].every(id => teamPlayerIds.has(id));
        if (allFromTeam && ids.size >= 5) {
            teamBond = { ...teamDef };
        }
    }

    const playerBonds = PLAYER_BONDS.filter(bond =>
        bond.members.every(m => ids.has(m))
    ).slice(0, 3);

    return { teamBond, playerBonds };
}

export function getAllTeamBonds() { return TEAM_BONDS; }
export function getAllPlayerBonds() { return PLAYER_BONDS; }
