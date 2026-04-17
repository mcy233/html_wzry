/**
 * strategyCards.js — 5节点制策略卡数据定义
 * 每个节点有3~5张专属策略卡，含三角克制关系
 */

export const STRATEGY_TYPES = {
    aggression: { name: '进攻', color: '#e74c3c', gradient: 'linear-gradient(135deg,#c0392b,#e74c3c)', icon: '⚔️' },
    defense:    { name: '防御', color: '#3498db', gradient: 'linear-gradient(135deg,#2471a3,#3498db)', icon: '🛡️' },
    tactic:     { name: '战术', color: '#f0c040', gradient: 'linear-gradient(135deg,#d4ac0d,#f0c040)', icon: '⚡' },
    economy:    { name: '发育', color: '#2ecc71', gradient: 'linear-gradient(135deg,#1e8449,#2ecc71)', icon: '💰' },
    objective:  { name: '资源', color: '#9b59b6', gradient: 'linear-gradient(135deg,#7d3c98,#9b59b6)', icon: '🐉' },
};

export const LANE_TARGETS = {
    top: { name: '上路(对抗路)', short: '上路', icon: '⬆️' },
    mid: { name: '中路', short: '中路', icon: '⏺️' },
    bot: { name: '下路(发育路)', short: '下路', icon: '⬇️' },
};

/**
 * 5个比赛节点，每个含策略卡数组
 */
export const STRATEGY_PHASES = [
    /* ═══════════════════ 节点1：开局期 ═══════════════════ */
    {
        id: 'opening',
        name: '开局期',
        time: '0-1分钟',
        desc: '比赛开始，双方打野刷第一轮野怪，对线选手准备上线。入侵、埋伏还是稳健发育？',
        icon: '🏁',
        timerMinutes: 1,
        statWeights: { '操作': { '打野': 1.5 }, '意识': { '游走': 1.2 } },
        cards: [
            {
                id: 'open_invade',
                name: '抱团入侵',
                icon: '🔥',
                type: 'aggression',
                effect: { momentum: 5, goldSteal: 200 },
                cost: { devPenalty: 8 },
                counters: 'open_normal',
                counteredBy: 'open_ambush',
                desc: '全员抱团入侵敌方野区，抢夺开局经济和buff',
                detailDesc: '五人提前进入对方野区，争夺对方红/蓝buff和河蟹。成功可偷取大量经济并打乱对方节奏。',
                bonusWhenAhead: '入侵成功额外击杀+1',
                bonusWhenBehind: null,
            },
            {
                id: 'open_ambush',
                name: '集合埋伏',
                icon: '🪤',
                type: 'defense',
                effect: { momentum: 4, counterKill: 3 },
                cost: { devPenalty: 8 },
                counters: 'open_invade',
                counteredBy: 'open_normal',
                desc: '在关键路口设伏，若敌方入侵则反杀',
                detailDesc: '在己方野区关键路口集合埋伏，若敌方来入侵则进行反杀。高风险高回报的防守策略。',
                bonusWhenAhead: null,
                bonusWhenBehind: '反杀成功额外势能+2',
            },
            {
                id: 'open_normal',
                name: '正常上线',
                icon: '📈',
                type: 'economy',
                effect: { momentum: 2, gold: 300 },
                cost: {},
                counters: 'open_ambush',
                counteredBy: 'open_invade',
                desc: '各回各路稳健发育，积累经济优势',
                detailDesc: '所有选手按正常节奏上线补兵，打野按固定路线刷野。最稳妥的开局方式，保证前期发育。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
            },
        ],
    },

    /* ═══════════════════ 节点2：发育期 ═══════════════════ */
    {
        id: 'laning',
        name: '发育期',
        time: '1-4分钟',
        desc: '打野完成首轮刷野开始游走，对线博弈正式展开。选择Gank路线和策略成为关键。',
        icon: '🗡️',
        timerMinutes: 4,
        requireLaneChoice: true,
        statWeights: { '操作': { '打野': 1.2 }, '对线': { '_target': 1.5 } },
        cards: [
            {
                id: 'gank_direct',
                name: '直接Gank',
                icon: '🎯',
                type: 'aggression',
                effect: { momentum: 6, killChance: 0.7 },
                cost: { jgDevPause: true },
                counters: 'gank_lure',
                counteredBy: 'gank_counter',
                desc: '打野直奔目标路线Gank，击杀概率高',
                detailDesc: '打野直接前往选定路线发起Gank，配合线上队友进行夹击。成功率高但路线可能被预判。',
                bonusWhenAhead: '击杀后额外推塔',
                bonusWhenBehind: null,
            },
            {
                id: 'gank_counter',
                name: '反蹲抓线',
                icon: '🕸️',
                type: 'defense',
                effect: { momentum: 5, counterKill: 2 },
                cost: { jgDevPause: true },
                counters: 'gank_direct',
                counteredBy: 'gank_lure',
                desc: '在目标路线设伏，反杀来Gank的敌方',
                detailDesc: '预判敌方打野的Gank路线，提前在草丛中设伏等待，若敌方前来则进行反杀。',
                bonusWhenAhead: null,
                bonusWhenBehind: '反杀成功额外势能+2',
            },
            {
                id: 'gank_lure',
                name: '引诱抓线',
                icon: '🎭',
                type: 'tactic',
                effect: { momentum: 3, gold: 400 },
                cost: { jgDevPause: true },
                counters: 'gank_counter',
                counteredBy: 'gank_direct',
                desc: '线上选手故意前压引诱，打野包抄',
                detailDesc: '线上队友故意前压吸引注意力，打野从另一侧包抄。战术性极强的Gank方式。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
            },
            {
                id: 'gank_farm',
                name: '猥琐发育',
                icon: '🌱',
                type: 'economy',
                effect: { momentum: 1, gold: 350, devBonus: 0.08 },
                cost: {},
                counters: null,
                counteredBy: null,
                desc: '放弃Gank，全员安心补兵发育',
                detailDesc: '打野继续刷野不游走，线上选手专注补刀。放弃进攻压力换取经济发育，适合后期阵容。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
                noCounter: true,
            },
        ],
    },

    /* ═══════════════════ 节点3：小龙期 ═══════════════════ */
    {
        id: 'drake',
        name: '小龙期',
        time: '4-10分钟',
        desc: '暴君刷新，第一个关键团战资源点。集合速杀、埋伏守株还是趁机发育？',
        icon: '🐉',
        timerMinutes: 10,
        statWeights: { '配合': { '_all': 1.5 }, '意识': { '_all': 1.0 } },
        cards: [
            {
                id: 'drake_rush',
                name: '速杀暴君',
                icon: '⚡',
                type: 'objective',
                effect: { momentum: 7, buff: 'baron', damageBonus: 0.05 },
                cost: { devPause: true },
                counters: 'drake_flank',
                counteredBy: 'drake_ambush',
                desc: '集合队友快速击杀暴君获取buff',
                detailDesc: '全队集结在暴君处快速打掉暴君。获得暴君buff后全队伤害提升，在后续节点有额外加成。',
                bonusWhenAhead: '速杀更快，不被偷',
                bonusWhenBehind: null,
            },
            {
                id: 'drake_ambush',
                name: '蹲伏暴君',
                icon: '👁️',
                type: 'defense',
                effect: { momentum: 6, killChance: 0.8 },
                cost: { devPause: true },
                counters: 'drake_rush',
                counteredBy: 'drake_flank',
                desc: '在暴君附近埋伏，伏击打龙的敌方',
                detailDesc: '不打暴君，而是在暴君坑附近设伏。若敌方来打暴君，团灭他们并抢夺暴君。',
                bonusWhenAhead: null,
                bonusWhenBehind: '伏击团灭额外势能+3',
            },
            {
                id: 'drake_flank',
                name: '包抄暴君',
                icon: '🔄',
                type: 'tactic',
                effect: { momentum: 4, gold: 500 },
                cost: { drakeLost: true },
                counters: 'drake_ambush',
                counteredBy: 'drake_rush',
                desc: '佯攻暴君引出敌方，绕后包抄',
                detailDesc: '装作要打暴君吸引敌方注意，实际绕后包抄敌方脆皮。战术成功可获得大量经济。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
            },
            {
                id: 'drake_farm',
                name: '猥琐发育',
                icon: '🌱',
                type: 'economy',
                effect: { momentum: 2, gold: 400 },
                cost: { drakeLost: true },
                counters: null,
                counteredBy: null,
                desc: '放弃暴君争夺，专心清线发育',
                detailDesc: '放弃这波暴君，趁双方注意力在龙坑时安心清线发育。稳健但可能丢失暴君buff。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
                noCounter: true,
            },
        ],
    },

    /* ═══════════════════ 节点4：大龙期 ═══════════════════ */
    {
        id: 'baron',
        name: '大龙期',
        time: '10-20分钟',
        desc: '主宰刷新，比赛进入中后期关键转折点。争夺大龙、抱团推塔还是四一分推？',
        icon: '👑',
        timerMinutes: 20,
        statWeights: { '配合': { '_all': 1.5 }, '意识': { '_all': 1.0 }, '对线': { '对抗路': 1.2 } },
        cards: [
            {
                id: 'baron_rush',
                name: '速杀主宰',
                icon: '👑',
                type: 'objective',
                effect: { momentum: 10, buff: 'lord' },
                cost: { devPause: true },
                counters: 'baron_flank',
                counteredBy: 'baron_ambush',
                desc: '集合全队速推主宰，获得超级兵线',
                detailDesc: '全队集结强打主宰。获得主宰buff后兵线全线加强，给予对方巨大的守塔压力。',
                bonusWhenAhead: '主宰buff持续更久',
                bonusWhenBehind: null,
            },
            {
                id: 'baron_ambush',
                name: '蹲伏主宰',
                icon: '👁️',
                type: 'defense',
                effect: { momentum: 8, killChance: 0.8 },
                cost: { devPause: true },
                counters: 'baron_rush',
                counteredBy: 'baron_flank',
                desc: '在主宰附近埋伏，伏击打龙方',
                detailDesc: '在主宰坑周围铺视野并设伏，等敌方打主宰时血量下降后发起攻击，以少胜多。',
                bonusWhenAhead: null,
                bonusWhenBehind: '团灭后可反打主宰',
            },
            {
                id: 'baron_flank',
                name: '包抄主宰',
                icon: '🔄',
                type: 'tactic',
                effect: { momentum: 5, gold: 600 },
                cost: { baronLost: true },
                counters: 'baron_ambush',
                counteredBy: 'baron_rush',
                desc: '声东击西，趁乱包抄获取经济',
                detailDesc: '佯攻主宰区域引出敌方主力，实际派人去推塔或抢野区资源获取经济优势。',
                bonusWhenAhead: null,
                bonusWhenBehind: null,
            },
            {
                id: 'baron_push',
                name: '抱团推塔',
                icon: '🏰',
                type: 'aggression',
                effect: { momentum: 6, gold: 300 },
                cost: { baronGiven: true },
                counters: null,
                counteredBy: null,
                desc: '五人抱团推塔，直接破坏防御',
                detailDesc: '放弃主宰争夺，五人集结选择一路强行推塔。利用人数优势快速拆掉敌方防御塔。',
                bonusWhenAhead: '推塔速度更快',
                bonusWhenBehind: null,
                noCounter: true,
            },
            {
                id: 'baron_split',
                name: '四一分推',
                icon: '🏃',
                type: 'tactic',
                effect: { momentum: 5, splitBonus: 0.1 },
                cost: { baronGiven: true },
                counters: null,
                counteredBy: null,
                desc: '对抗路单带，四人牵制',
                detailDesc: '让对抗路选手单独去一路带线施压，其余四人抱团牵制。需要对抗路选手能力足够强。',
                unlockCondition: { role: '对抗路', minRating: 85 },
                bonusWhenAhead: '分推效率更高',
                bonusWhenBehind: null,
                noCounter: true,
            },
        ],
    },

    /* ═══════════════════ 节点5：决胜期 ═══════════════════ */
    {
        id: 'final',
        name: '决胜期',
        time: '20分钟+',
        desc: '比赛进入最终阶段。根据场上局势选择终结或翻盘策略。',
        icon: '🏆',
        timerMinutes: 25,
        statWeights: { '心态': { '_all': 1.5 }, '抗压': { '_all': 1.5 } },
        dynamic: true,
        cardSets: {
            ahead: {
                label: '顺风',
                threshold: 60,
                cards: [
                    {
                        id: 'final_end',
                        name: '终结比赛',
                        icon: '🏆',
                        type: 'aggression',
                        effect: { momentum: 12 },
                        cost: {},
                        desc: '五人推中，一波带走！',
                        detailDesc: '集合全队从中路直推水晶。顺风局的最快结束方式，但需要注意对方的防守反击。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_steady',
                        name: '稳步推进',
                        icon: '📐',
                        type: 'tactic',
                        effect: { momentum: 6, gold: 400 },
                        cost: {},
                        desc: '不急不躁，安全推进扩大优势',
                        detailDesc: '利用兵线优势一路一路地推进，每一步都稳扎稳打。虽然慢但极为安全。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_push',
                        name: '抱团推塔',
                        icon: '🏰',
                        type: 'aggression',
                        effect: { momentum: 8 },
                        cost: {},
                        desc: '五人选择一路强推',
                        detailDesc: '五人集结选择优势最大的一路推进，目标是推掉高地塔甚至水晶。',
                        counters: null, counteredBy: null,
                    },
                ],
            },
            even: {
                label: '均势',
                threshold: [40, 60],
                cards: [
                    {
                        id: 'final_teamfight',
                        name: '发起团战',
                        icon: '⚔️',
                        type: 'aggression',
                        effect: { momentum: 0, triggerTeamfight: true },
                        cost: {},
                        desc: '主动发起5v5团战，以实力定胜负！',
                        detailDesc: '在关键位置主动开团，团战结果取决于双方阵容、选手属性和策略选择。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_push_mid',
                        name: '抱团推中',
                        icon: '🏰',
                        type: 'aggression',
                        effect: { momentum: 7 },
                        cost: {},
                        desc: '五人抱团推中路',
                        detailDesc: '集中力量推中路，利用中路最短的距离优势快速逼近敌方基地。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_defend',
                        name: '防守反击',
                        icon: '🛡️',
                        type: 'defense',
                        effect: { momentum: 3, defenseBonus: 0.15 },
                        cost: {},
                        desc: '防守等待对方失误，寻找反击机会',
                        detailDesc: '收缩防守等待对方犯错。对方如果贪龙或分散阵型，抓住机会反打。',
                        counters: null, counteredBy: null,
                    },
                ],
            },
            behind: {
                label: '逆风',
                threshold: 40,
                cards: [
                    {
                        id: 'final_desperate',
                        name: '绝地反击',
                        icon: '🔥',
                        type: 'aggression',
                        effect: { momentum: 0, desperateWinRate: 0.35, damageBoost: 1.3 },
                        cost: { noRetreat: true },
                        desc: '破釜沉舟！背水一战，成败在此！',
                        detailDesc: '全员不计代价冲锋，伤害暴增130%但无法撤退。成功翻盘的概率约35%，失败则直接落败。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_backdoor',
                        name: '偷水晶',
                        icon: '💎',
                        type: 'tactic',
                        effect: { momentum: 0, backdoorWinRate: 0.25 },
                        cost: { highRisk: true },
                        desc: '派人偷袭水晶！成功直接获胜',
                        detailDesc: '利用对方推进时的疏忽，派高机动性英雄绕后偷袭水晶。成功率约25%但直接获胜。',
                        counters: null, counteredBy: null,
                    },
                    {
                        id: 'final_highground',
                        name: '防守高地',
                        icon: '🏔️',
                        type: 'defense',
                        effect: { momentum: 4, defenseBonus: 0.30 },
                        cost: {},
                        desc: '死守高地，利用塔下优势拖延',
                        detailDesc: '利用高地塔的攻击和地形优势坚守防线。拖延时间等待对方急躁犯错。',
                        counters: null, counteredBy: null,
                    },
                ],
            },
        },
    },
];

/**
 * 根据节点ID获取节点数据
 */
export function getPhase(phaseId) {
    return STRATEGY_PHASES.find(p => p.id === phaseId);
}

/**
 * 获取某节点下玩家可选的策略卡
 * 决胜期根据势能动态返回
 */
export function getAvailableCards(phaseId, momentum = 50, myStarters = []) {
    const phase = getPhase(phaseId);
    if (!phase) return [];

    if (phase.dynamic && phase.cardSets) {
        if (momentum >= phase.cardSets.ahead.threshold) {
            return phase.cardSets.ahead.cards;
        }
        const [lo, hi] = phase.cardSets.even.threshold;
        if (momentum > lo && momentum < hi) {
            return phase.cardSets.even.cards;
        }
        return phase.cardSets.behind.cards;
    }

    return phase.cards.filter(card => {
        if (!card.unlockCondition) return true;
        const { role, minRating } = card.unlockCondition;
        const player = myStarters.find(p => p.role === role);
        return player && (player.rating || 0) >= minRating;
    });
}

/**
 * 判定两张卡的克制关系
 * @returns 'win' | 'lose' | 'draw' | 'neutral'
 */
export function resolveCounter(myCard, enemyCard) {
    if (myCard.noCounter || enemyCard.noCounter) return 'neutral';
    if (!myCard.counters && !myCard.counteredBy) return 'neutral';
    if (myCard.counters === enemyCard.id) return 'win';
    if (myCard.counteredBy === enemyCard.id) return 'lose';
    if (myCard.id === enemyCard.id) return 'draw';
    return 'neutral';
}

/**
 * 获取策略卡的克制关系描述文本
 */
export function getCounterDescription(card, phase) {
    const cards = phase.cards || [];
    const countersCard = cards.find(c => c.id === card.counters);
    const counteredByCard = cards.find(c => c.id === card.counteredBy);
    return {
        counters: countersCard ? `克制「${countersCard.name}」` : null,
        counteredBy: counteredByCard ? `被「${counteredByCard.name}」克制` : null,
    };
}
