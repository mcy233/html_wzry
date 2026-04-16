/**
 * cards.js — 战术卡牌数据定义
 * 卡牌分为4大类：攻击(attack)、防御(defend)、战术(tactic)、绝技(ultimate)
 */

export const CARD_TYPES = {
    attack:   { name: '进攻', color: '#e74c3c', gradient: 'linear-gradient(135deg,#c0392b,#e74c3c)', icon: '⚔️' },
    defend:   { name: '防御', color: '#3498db', gradient: 'linear-gradient(135deg,#2471a3,#3498db)', icon: '🛡️' },
    tactic:   { name: '战术', color: '#f0c040', gradient: 'linear-gradient(135deg,#d4ac0d,#f0c040)', icon: '⚡' },
    ultimate: { name: '绝技', color: '#9b59b6', gradient: 'linear-gradient(135deg,#7d3c98,#9b59b6)', icon: '🌟' },
};

export const LANES = {
    top: { name: '上路', icon: '⬆️', color: '#e67e22' },
    mid: { name: '中路', icon: '⏺️', color: '#9b59b6' },
    bot: { name: '下路', icon: '⬇️', color: '#27ae60' },
    jungle: { name: '野区', icon: '🌿', color: '#2ecc71' },
    all: { name: '全局', icon: '🌐', color: '#3498db' },
};

/**
 * 全部卡牌定义
 * cost: 行动力消耗
 * type: attack/defend/tactic/ultimate
 * target: top/mid/bot/jungle/all/choose (choose=玩家自选路线)
 * power: 基础效果值
 * effect: 特殊效果描述函数
 * condition: 出牌条件（可选）
 * statKey: 关联的选手属性
 */
export const ALL_CARDS = {
    atk_top: {
        id: 'atk_top', name: '上路强攻', type: 'attack', cost: 2,
        target: 'top', power: 8, statKey: '对线',
        desc: '对抗路发力，上路推进+8',
        flavor: '边路一刀斩，敌塔化为尘',
    },
    atk_mid: {
        id: 'atk_mid', name: '中路游走', type: 'attack', cost: 2,
        target: 'mid', power: 6, statKey: '意识',
        desc: '中路游走支援，中路+6，随机另一路+4',
        bonus: { randomLane: 4 },
        flavor: '一人游走，三路受益',
    },
    atk_bot: {
        id: 'atk_bot', name: '下路压制', type: 'attack', cost: 2,
        target: 'bot', power: 8, statKey: '配合',
        desc: '下路双人组联动压制+8',
        flavor: 'AD+辅助，天衣无缝',
    },
    atk_all: {
        id: 'atk_all', name: '全线施压', type: 'attack', cost: 3,
        target: 'all', power: 3, statKey: '意识',
        desc: '三路同时施压，各路推进+3',
        flavor: '三路花开，处处烽火',
    },
    atk_gank: {
        id: 'atk_gank', name: 'Gank突袭', type: 'attack', cost: 2,
        target: 'choose', power: 10, statKey: '操作',
        desc: '打野选择一路Gank，推进+10，但其余路-2',
        penalty: { otherLanes: -2 },
        flavor: '暗影突袭，一击必杀',
    },
    atk_dive: {
        id: 'atk_dive', name: '越塔强杀', type: 'attack', cost: 3,
        target: 'choose', power: 14, statKey: '操作',
        desc: '越塔强杀！推进+14，但失败反被杀 (成功率60%)',
        riskRate: 0.6,
        flavor: '置之死地而后生',
    },
    atk_invade: {
        id: 'atk_invade', name: '入侵野区', type: 'attack', cost: 1,
        target: 'jungle', power: 0, statKey: '操作',
        desc: '入侵对方野区，经济+600',
        goldReward: 600,
        flavor: '我的野区？不，是你的也是我的',
    },
    atk_group: {
        id: 'atk_group', name: '四人集结', type: 'attack', cost: 3,
        target: 'choose', power: 16, statKey: '配合',
        desc: '四人抱团推进一路+16，其余路-4',
        penalty: { otherLanes: -4 },
        flavor: '五指成拳，重击一点',
    },

    def_steady: {
        id: 'def_steady', name: '稳固防线', type: 'defend', cost: 1,
        target: 'all', power: 4, statKey: '意识',
        desc: '全路防御+4，低费稳妥',
        flavor: '稳如泰山，固若金汤',
    },
    def_focus: {
        id: 'def_focus', name: '集中防守', type: 'defend', cost: 2,
        target: 'choose', power: 12, statKey: '配合',
        desc: '集中防守一路+12',
        flavor: '众志成城，固守一方',
    },
    def_ambush: {
        id: 'def_ambush', name: '反蹲守株', type: 'defend', cost: 2,
        target: 'choose', power: 8, statKey: '操作',
        desc: '在一路设伏，对方进攻此路则反杀+推进',
        counterBonus: 12,
        flavor: '欲擒故纵，守株待兔',
    },
    def_retreat: {
        id: 'def_retreat', name: '全员回防', type: 'defend', cost: 2,
        target: 'all', power: 7, statKey: '意识',
        desc: '全路防御+7，回复少量状态',
        heal: true,
        flavor: '退一步海阔天空',
    },
    def_tower: {
        id: 'def_tower', name: '塔下坚守', type: 'defend', cost: 1,
        target: 'choose', power: 10, statKey: '意识',
        desc: '利用塔优势防守一路+10，仅在该路有塔时有效',
        requiresTower: true,
        flavor: '塔在人在，塔亡人亡',
    },

    tac_baron: {
        id: 'tac_baron', name: '抢暴君', type: 'tactic', cost: 3,
        target: 'jungle', power: 0, statKey: '配合',
        desc: '争夺暴君buff：全队推进+4，经济+800',
        objectiveType: 'baron',
        goldReward: 800, laneBuff: 4,
        flavor: '掌控暴君，掌控节奏',
    },
    tac_lord: {
        id: 'tac_lord', name: '抢主宰', type: 'tactic', cost: 4,
        target: 'jungle', power: 0, statKey: '配合',
        desc: '击杀主宰：全队推进+8，超级兵线',
        objectiveType: 'lord',
        laneBuff: 8,
        flavor: '主宰降临，万物臣服',
    },
    tac_teamfight: {
        id: 'tac_teamfight', name: '开团指令', type: 'tactic', cost: 2,
        target: 'all', power: 0, statKey: '操作',
        desc: '发起团战！结果取决于双方阵容和策略',
        triggerTeamfight: true,
        flavor: '集合！这波团战定胜负',
    },
    tac_farm: {
        id: 'tac_farm', name: '运营发育', type: 'tactic', cost: 1,
        target: 'all', power: 0, statKey: '意识',
        desc: '放弃进攻稳健发育：经济+600，下轮抽牌+1',
        goldReward: 600, bonusDraw: 1,
        flavor: '猥琐发育，别浪',
    },
    tac_vision: {
        id: 'tac_vision', name: '视野布控', type: 'tactic', cost: 1,
        target: 'all', power: 0, statKey: '意识',
        desc: '窥视对手下轮1张手牌',
        revealCards: 1,
        flavor: '知己知彼，百战不殆',
    },
    tac_tempo: {
        id: 'tac_tempo', name: '节奏加速', type: 'tactic', cost: 2,
        target: 'all', power: 0, statKey: '操作',
        desc: '本轮行动力+2，打出连续攻势',
        bonusAP: 2,
        flavor: '加速！加速！不给对面喘息',
    },
    tac_split: {
        id: 'tac_split', name: '分路带线', type: 'tactic', cost: 2,
        target: 'all', power: 0, statKey: '对线',
        desc: '两路各推进+5，牵扯对手防守',
        splitPush: { power: 5, count: 2 },
        flavor: '两路开花，你防哪路？',
    },

    ult_comeback: {
        id: 'ult_comeback', name: '绝境翻盘', type: 'ultimate', cost: 0,
        target: 'all', power: 0, statKey: '操作',
        desc: '势能+15，全队爆发！仅在逆风时出现',
        momentumBoost: 15,
        condition: 'losing',
        flavor: '逆风不投！绝地反击！',
    },
    ult_ace: {
        id: 'ult_ace', name: '团灭对手', type: 'ultimate', cost: 3,
        target: 'all', power: 0, statKey: '操作',
        desc: '团灭对方！一路推进+20，击杀+5',
        acePush: 20, aceKills: 5,
        condition: 'winning_streak',
        flavor: 'ACE！五杀！',
    },
    ult_backdoor: {
        id: 'ult_backdoor', name: '偷水晶', type: 'ultimate', cost: 4,
        target: 'all', power: 0, statKey: '操作',
        desc: '偷袭水晶！成功直接获胜（基于兵线优势，成功率30~50%）',
        backdoor: true,
        condition: 'late_game',
        flavor: '胜负在此一举！偷家！',
    },
    ult_pause: {
        id: 'ult_pause', name: '教练暂停', type: 'ultimate', cost: 0,
        target: 'all', power: 0, statKey: '意识',
        desc: '暂停！窥视对手全部手牌 + 行动力+1',
        revealAll: true, bonusAP: 1,
        condition: 'once_per_game',
        flavor: '暂停！重新部署战术！',
    },
};

/**
 * 根据BP结果和选手数据生成牌库
 * @param {Object} bpResult - BP阶段结果
 * @param {Object[]} myStarters - 我方首发
 * @param {Object[]} enemyStarters - 对方首发
 * @returns {Object[]} 牌库（洗牌后的卡牌实例数组）
 */
export function buildDeck(bpResult, myStarters, enemyStarters) {
    const deck = [];

    const add = (id, count = 1) => {
        for (let i = 0; i < count; i++) {
            const template = ALL_CARDS[id];
            if (template) deck.push({ ...template, uid: `${id}_${deck.length}` });
        }
    };

    // 基础牌：每种攻击/防御各2张
    add('atk_top', 2); add('atk_mid', 2); add('atk_bot', 2);
    add('atk_gank', 2); add('atk_invade', 1);
    add('def_steady', 3); add('def_focus', 2); add('def_ambush', 1);
    add('def_retreat', 2); add('def_tower', 2);

    // 战术牌
    add('tac_farm', 2); add('tac_vision', 2);
    add('tac_teamfight', 2); add('tac_tempo', 1);
    add('tac_split', 2);

    // 高费战术
    add('atk_all', 1); add('atk_group', 1); add('atk_dive', 1);

    // 根据BP阵容调整
    if (bpResult) {
        const synergy = bpResult.myComp?.synergy || 0;
        if (synergy >= 8) { add('tac_teamfight', 1); add('tac_tempo', 1); }
        if (bpResult.bpMomentum > 0) { add('atk_gank', 1); }
        if (bpResult.bpMomentum < 0) { add('def_ambush', 1); add('def_retreat', 1); }
    }

    // 根据选手评分调整
    if (myStarters) {
        const jungler = myStarters.find(p => p.role === '打野');
        if (jungler?.rating >= 80) { add('atk_invade', 1); add('atk_gank', 1); }

        const top = myStarters.find(p => p.role === '对抗路');
        if (top?.rating >= 80) { add('atk_top', 1); }

        const mid = myStarters.find(p => p.role === '中路');
        if (mid?.rating >= 80) { add('atk_mid', 1); }

        const avgRating = myStarters.reduce((s, p) => s + (p.rating || 70), 0) / myStarters.length;
        if (avgRating >= 78) { add('tac_tempo', 1); }
    }

    // 暴君/主宰牌（固定）
    add('tac_baron', 2);
    add('tac_lord', 1);

    // 绝技牌（教练暂停固定，其余条件触发）
    add('ult_pause', 1);

    return shuffle(deck);
}

/**
 * 生成AI对手的牌库（基于战队风格）
 */
export function buildEnemyDeck(teamStyle, enemyStarters) {
    const deck = [];
    const add = (id, count = 1) => {
        for (let i = 0; i < count; i++) {
            const template = ALL_CARDS[id];
            if (template) deck.push({ ...template, uid: `e_${id}_${deck.length}` });
        }
    };

    // 基础牌
    add('atk_top', 2); add('atk_mid', 2); add('atk_bot', 2);
    add('atk_gank', 2); add('atk_invade', 1); add('atk_all', 1);
    add('def_steady', 3); add('def_focus', 2); add('def_retreat', 2);
    add('def_ambush', 1); add('def_tower', 2);
    add('tac_farm', 2); add('tac_vision', 1); add('tac_teamfight', 2);
    add('tac_split', 2); add('tac_tempo', 1);
    add('tac_baron', 2); add('tac_lord', 1);
    add('atk_group', 1);

    // 根据风格调整
    const style = teamStyle || 'balanced';
    if (style === 'aggressive') {
        add('atk_gank', 2); add('atk_dive', 1); add('atk_group', 1);
    } else if (style === 'operational') {
        add('tac_farm', 2); add('tac_vision', 2); add('def_steady', 1);
    } else if (style === 'teamfight') {
        add('tac_teamfight', 2); add('atk_all', 1); add('atk_group', 1);
    } else if (style === 'defensive') {
        add('def_focus', 2); add('def_ambush', 2); add('def_retreat', 1);
    }

    return shuffle(deck);
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export const TEAM_STYLES = {
    ag: 'aggressive', hero: 'operational', ttg: 'teamfight',
    wb: 'balanced', we: 'defensive', edg: 'aggressive',
    dyg: 'teamfight', jdg: 'operational', lgd: 'balanced',
    rw: 'aggressive', vg: 'balanced', xys: 'balanced',
    estar: 'teamfight', nova: 'aggressive', gz: 'balanced',
    default: 'balanced',
};

export function getTeamStyle(teamId) {
    return TEAM_STYLES[teamId?.toLowerCase()] || TEAM_STYLES.default;
}
