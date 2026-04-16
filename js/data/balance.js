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
