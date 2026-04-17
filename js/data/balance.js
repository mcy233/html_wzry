/**
 * balance.js - 游戏数值平衡配置
 * 所有经济、成长、战斗相关数值集中管理
 */

/* ===== 经济系统 ===== */
export const ECONOMY = {
    START_GOLD: 800,
    MATCH_WIN_GOLD: 250,
    MATCH_LOSE_GOLD: 80,
    MATCH_WIN_FAME: 60,
    MATCH_LOSE_FAME: 10,
    MATCH_WIN_MORALE: 8,
    MATCH_LOSE_MORALE: -5,
    MATCH_WIN_FANS: 200,
    MATCH_LOSE_FANS: 20,
    TRAINING_COST: 50,
    FOOD_COST: 30,
    EXPLORE_REVISIT_BASE_COST: 40,
    EXPLORE_REVISIT_COST_PER_VISIT: 15,
    EXPLORE_REVISIT_MAX_COST: 300,
    EXPLORE_COOLDOWN_ROUNDS: 2,
};

/* ===== 训练系统 ===== */
export const TRAINING = {
    GRADE_S_BOOST: 2,
    GRADE_A_BOOST: 1,
    GRADE_B_BOOST: 1,
    GRADE_C_BOOST: 0,
    GRADE_S_THRESHOLD: 0.85,
    GRADE_A_THRESHOLD: 0.65,
    GRADE_B_THRESHOLD: 0.45,
    MAX_STAT: 99,
    BOOST_TARGET: 'starters',
};

/* ===== 选手状态 ===== */
export const PLAYER = {
    START_CONDITION: 80,
    MAX_CONDITION: 100,
    MIN_CONDITION: 20,
    CONDITION_DECAY_PER_MATCH: 8,
    CONDITION_RECOVERY_PER_REST: 15,
    CONDITION_AFFECT_PERFORMANCE: 0.15,
};

/* ===== 士气系统 ===== */
export const MORALE = {
    START: 70,
    MAX: 100,
    MIN: 10,
    PERFORMANCE_BONUS_THRESHOLD: 80,
    PERFORMANCE_BONUS: 0.05,
    PERFORMANCE_PENALTY_THRESHOLD: 40,
    PERFORMANCE_PENALTY: -0.08,
    DECAY_PER_LOSS: 5,
    BOOST_PER_WIN: 8,
};

/* ===== 城市声望系统 ===== */
export const REPUTATION = {
    LEVELS: [
        { stars: 1, required: 0,    label: '初来乍到', unlocks: '基础地标可探索' },
        { stars: 2, required: 100,  label: '常客', unlocks: 'NPC互动 + 新地标' },
        { stars: 3, required: 300,  label: '熟客', unlocks: '隐藏事件 + 折扣' },
        { stars: 4, required: 600,  label: '知音', unlocks: '城市专属道具' },
        { stars: 5, required: 1000, label: '荣誉市民', unlocks: '永久加成 + 称号' },
    ],
    GAIN_EXPLORE_LANDMARK: 20,
    GAIN_COMPLETE_ROUTE_NODE: 30,
    GAIN_COMPLETE_FULL_ROUTE: 100,
    GAIN_FOOD_TASTED: 15,
    GAIN_QUIZ_CORRECT: 10,
    GAIN_NPC_MET: 25,
};

/* ===== 选手养成系统 ===== */
export const GROWTH = {
    MAX_LEVEL: 60,
    MAX_STAT: 99,
    LEVEL_GOLD_MULT: 10,
    TRAINING_BASE_EXP: 50,
    TRAINING_ADVANCED_EXP: 80,
    EXP_GRADE_S: 2.0,
    EXP_GRADE_A: 1.5,
    EXP_GRADE_B: 1.0,
    EXP_GRADE_C: 0.5,
    MATCH_WIN_EXP: 200,
    MATCH_LOSE_EXP: 50,
    PLAYOFF_WIN_EXP: 400,
    FINALS_WIN_EXP: 800,
    DAILY_QUEST_EXP: 30,
    EXPLORE_EXP_MIN: 20,
    EXPLORE_EXP_MAX: 80,
    DETAILED_BATTLE_BONUS: 0.2,
    SKILL_POOL: {
        '对抗路': [
            { name: '不屈意志', desc: '逆风对线时抗压+8', effect: { '抗压': 8 } },
            { name: '线霸', desc: '对线期压制力+12%', effect: { '对线': 6 } },
        ],
        '打野': [
            { name: '丛林霸主', desc: '打野效率+15%，前期节奏更强', effect: { '意识': 5 } },
            { name: '团战指挥', desc: '团战阶段全队意识+3', effect: { '配合': 5 } },
        ],
        '中路': [
            { name: '中路统治', desc: '中路压制力+15%', effect: { '对线': 6 } },
            { name: '全图支援', desc: '支援效率+12%', effect: { '意识': 5 } },
        ],
        '发育路': [
            { name: '极限发育', desc: '经济领先+10%', effect: { '操作': 5 } },
            { name: '团战输出', desc: '后期团战伤害+12%', effect: { '操作': 6 } },
        ],
        '游走': [
            { name: '视野大师', desc: '视野控制+15%', effect: { '意识': 6 } },
            { name: '保护之盾', desc: '队友保护能力+12%', effect: { '配合': 6 } },
        ],
    },
};

/* ===== 签约抽卡系统 ===== */
export const RECRUIT = {
    SSR_RATE: 0.05,
    SR_RATE: 0.25,
    R_RATE: 0.70,
    GOLD_PITY: 30,
    TEN_PULL_SR_GUARANTEE: true,
    WISH_LIST_MAX: 3,
    WISH_SSR_RATE: 0.50,
    DUPE_FRAGMENT: { R: 2, SR: 5, SSR: 10 },
};

/* ===== 转会市场 ===== */
export const TRANSFER = {
    MARKET_SIZE: 10,
    PRICE: { R: [200, 500], SR: [800, 2000], SSR: [3000, 8000] },
    FRAGMENT_EXCHANGE: { R: 3, SR: 5, SSR: 10 },
};

/* ===== 快速战斗 ===== */
export const QUICK_BATTLE = {
    BASE_NOISE: 0.06,
    MIN_WIN_RATE: 0.05,
    MAX_WIN_RATE: 0.95,
    ANIMATION_PHASE1_MS: 2000,
    ANIMATION_PHASE2_MS: 4000,
    ANIMATION_PHASE3_MS: 2000,
};

/* ===== 比赛系统 ===== */
export const BATTLE = {
    MOMENTUM_START: 50,
    MOMENTUM_MIN: 2,
    MOMENTUM_MAX: 98,
    TF_COUNTER_WIN_REWARD: 15,
    TF_NEUTRAL_AVG_REWARD: 4,
    MACRO_COUNTER_BONUS: 0.1,
    QTE_PERFECT_MULT: 1.3,
    QTE_GOOD_MULT: 1.0,
    QTE_BAD_MULT: 0.7,
    LANING_FOCUS_BONUS: 5,
    MORALE_BATTLE_MODIFIER: true,
};
