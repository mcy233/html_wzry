/**
 * BattleSystem - 比赛核心计算逻辑（v2 重构版）
 * 
 * 平衡改动：
 *   1. 对线期权重提升：totalAdvantage * 6（原4），让前期选择更有意义
 *   2. 野区博弈奖励提升，并提供成功率等信息
 *   3. R5终局shift大幅削弱，避免一把逆转
 *   4. 胜负判定：momentum >= 48（降低后期翻盘概率，前期积累更重要）
 *   5. 各回合对最终结果的贡献权重约为: R1(25%) R2(20%) R3(25%) R4(20%) R5(10%)
 */
import { HEROES, HERO_ROLES, getPlayerHeroes, getHero, getCounterInfo, getHeroesForPosition, evaluateComp, heroImgHTML } from '../data/heroes.js';

/* 团战策略定义 */
export const TF_STRATEGIES = {
    focus_carry:   { id: 'focus_carry',   name: '集火后排', icon: '🗡️→🎯', statKey: '操作', desc: '突入后排击杀核心输出' },
    protect_carry: { id: 'protect_carry', name: '保护C位', icon: '🛡️→⭐', statKey: '配合', desc: '保护我方核心稳定输出' },
    split_fight:   { id: 'split_fight',   name: '切割战场', icon: '✂️→👥', statKey: '意识', desc: '分割对方阵型各个击破' },
};

export const TF_COUNTER_MAP = {
    focus_carry:   'protect_carry',
    protect_carry: 'split_fight',
    split_fight:   'focus_carry',
};

export const MACRO_STRATEGIES = [
    { id: 'rush_baron',   name: '强开主宰', icon: '🐲', statKey: '意识', counters: 'vision_play',  reward: 12, avgReward: 4, desc: '趁对方不备强开主宰', riskText: '高风险高收益' },
    { id: 'split_push',   name: '四一分推', icon: '🏃', statKey: '对线', counters: 'group_push',   reward: 10, avgReward: 3, desc: '边路牵制四人施压',   riskText: '中等风险' },
    { id: 'group_push',   name: '五人抱团', icon: '👥', statKey: '配合', counters: 'flank_ambush', reward: 10, avgReward: 3, desc: '五人集结强行推进',   riskText: '中等风险' },
    { id: 'flank_ambush', name: '绕后偷袭', icon: '🗡️', statKey: '操作', counters: 'rush_baron',   reward: 12, avgReward: 4, desc: '绕后突袭打对方措手不及', riskText: '高风险高收益' },
    { id: 'vision_play',  name: '视野运营', icon: '👁️', statKey: '意识', counters: 'split_push',   reward: 8,  avgReward: 4, desc: '铺排视野慢慢蚕食优势', riskText: '低风险稳收益' },
];

export class BattleSystem {
    constructor(myTeam, enemyTeam, myStarters, enemyStarters, opts = {}) {
        const condMod = this._applyConditionModifier(myStarters, opts.playerConditions);
        this.moraleMod = this._calcMoraleMod(opts.morale);
        this.my = { team: myTeam, starters: condMod };
        this.enemy = { team: enemyTeam, starters: enemyStarters };
        this.momentum = 50;
        this.kills = { my: 0, enemy: 0 };
        this.towers = { my: 0, enemy: 0 };
        this.gold = { my: 0, enemy: 0 };
        this.round = 0;
        this.log = [];
        this.bpResult = null;
    }

    /* ======== BP系统 ======== */
    generateBPContext() {
        const context = { my: [], enemy: [] };
        const roles = ['对抗路', '打野', '中路', '发育路', '游走'];
        for (const side of ['my', 'enemy']) {
            const starters = this[side].starters;
            for (const role of roles) {
                const player = starters.find(p => p.role === role);
                if (!player) continue;
                const heroes = getPlayerHeroes(player.id, role);
                context[side].push({
                    player,
                    role,
                    heroes: heroes.map(h => ({ ...getHero(h), name: h })).filter(Boolean),
                });
            }
        }
        return context;
    }

    getAIAdvice(bannedHeroes, myPicks, enemyPicks) {
        const advice = [];
        const enemyRoles = enemyPicks.map(h => getHero(h)?.role).filter(Boolean);
        const myRoles = myPicks.map(h => getHero(h)?.role).filter(Boolean);

        if (enemyRoles.includes('marksman') && !myRoles.includes('assassin')) {
            advice.push({ type: 'suggest', text: '对方有射手，推荐选刺客型英雄进行针对', icon: '💡' });
        }
        if (enemyRoles.includes('assassin') && !myRoles.includes('support') && !myRoles.includes('tank')) {
            advice.push({ type: 'warn', text: '对方有刺客，注意选择保护型辅助或坦克', icon: '⚠️' });
        }
        if (enemyRoles.filter(t => t === 'tank').length >= 2) {
            advice.push({ type: 'suggest', text: '对方双坦阵容，推荐真伤型英雄（马可波罗、貂蝉等）', icon: '💡' });
        }
        if (myPicks.length === 0) {
            advice.push({ type: 'info', text: '优先选择核心C位或版本强势英雄', icon: '📋' });
        }

        for (const ep of enemyPicks) {
            const ci = getCounterInfo(ep);
            if (ci.counteredBy.length) {
                const available = ci.counteredBy.filter(h => !bannedHeroes.includes(h) && !myPicks.includes(h) && !enemyPicks.includes(h));
                if (available.length) {
                    advice.push({ type: 'counter', text: `克制对方${ep}：推荐 ${available.slice(0,2).join('、')}`, icon: '🎯' });
                }
            }
        }

        for (const mp of myPicks) {
            const ci = getCounterInfo(mp);
            const threats = ci.counteredBy.filter(h => enemyPicks.includes(h));
            if (threats.length) {
                advice.push({ type: 'warn', text: `注意：对方${threats.join('、')}克制我方${mp}`, icon: '⚠️' });
            }
        }

        const myComp = evaluateComp(myPicks);
        if (myPicks.length >= 3 && myComp.synergy < 5) {
            advice.push({ type: 'warn', text: '当前阵容缺乏协同配合，建议补充辅助或坦克', icon: '⚠️' });
        }

        return advice;
    }

    getRecommendedBan(enemyStarters) {
        const topThreats = [];
        for (const player of enemyStarters) {
            const heroes = getPlayerHeroes(player.id, player.role);
            if (heroes.length > 0) {
                const hero = getHero(heroes[0]);
                topThreats.push({ hero: heroes[0], heroData: hero, player: player.id, reason: `${player.id}的招牌英雄` });
            }
        }
        return topThreats.slice(0, 4);
    }

    getHeroRecommendation(position, bannedHeroes, myPicks, enemyPicks) {
        const poolHeroes = getHeroesForPosition(position);
        const unavailable = new Set([...bannedHeroes, ...myPicks, ...enemyPicks]);
        const available = poolHeroes.filter(h => !unavailable.has(h));
        const scored = available.map(name => {
            const hero = getHero(name);
            let score = 0;
            const ci = getCounterInfo(name);
            for (const ep of enemyPicks) {
                if (ci.counters.includes(ep)) score += 15;
                if (ci.counteredBy.includes(ep)) score -= 10;
            }
            const comp = evaluateComp([...myPicks, name]);
            score += comp.synergy;
            return { name, hero, score, reason: score > 10 ? '克制对手' : score > 5 ? '阵容契合' : '版本可用' };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 5);
    }

    resolveBP(myBans, myPicks, enemyBans, enemyPicks) {
        const myComp = evaluateComp(myPicks);
        const enemyComp = evaluateComp(enemyPicks);
        const bpAdvantage = (myComp.synergy - enemyComp.synergy) + this._countCounterAdvantage(myPicks, enemyPicks);
        const bpMomentum = Math.round(Math.max(-6, Math.min(6, bpAdvantage * 0.8)));
        this.momentum = this._clampMomentum(this.momentum + bpMomentum);
        this.bpResult = { myComp, enemyComp, bpAdvantage, bpMomentum, myPicks, enemyPicks, myBans, enemyBans };
        this.log.push({ round: 0, type: 'bp', bpMomentum });
        return this.bpResult;
    }

    _countCounterAdvantage(myPicks, enemyPicks) {
        let adv = 0;
        for (const h of myPicks) {
            const ci = getCounterInfo(h);
            for (const ep of enemyPicks) { if (ci.counters.includes(ep)) adv += 2; }
            for (const ep of enemyPicks) { if (ci.counteredBy.includes(ep)) adv -= 2; }
        }
        return adv;
    }

    /* ======== 回合1: 对线期（增强版） ======== */
    getLaningAnalysis() {
        const roleMap = { top: '对抗路', mid: '中路', bot: '发育路' };
        const analysis = {};
        for (const [lane, role] of Object.entries(roleMap)) {
            const myP = this.my.starters.find(p => p.role === role);
            const enP = this.enemy.starters.find(p => p.role === role);
            if (!myP || !enP) continue;
            const diff = myP.stats['对线'] - enP.stats['对线'];
            const myHeroes = getPlayerHeroes(myP.id, role);
            const enHeroes = getPlayerHeroes(enP.id, role);
            let hint;
            if (diff > 8) hint = '我方大优，无需过多关注';
            else if (diff > 3) hint = '我方小优，适度关注可扩大优势';
            else if (diff > -3) hint = '实力接近，关注度能决定胜负';
            else if (diff > -8) hint = '对方略强，建议重点关注';
            else hint = '对方强势，需要重点帮扶';
            analysis[lane] = {
                myPlayer: myP, enemyPlayer: enP, diff,
                myHeroes: myHeroes.slice(0, 2), enHeroes: enHeroes.slice(0, 2),
                hint, priority: diff < -3 ? 'high' : diff < 3 ? 'medium' : 'low',
            };
        }
        return analysis;
    }

    resolveLaningPhase(focusDistribution) {
        const lanes = ['top', 'mid', 'bot'];
        const roleMap = { top: '对抗路', mid: '中路', bot: '发育路' };
        const results = {};
        const enemyFocus = this._generateEnemyFocus();

        lanes.forEach(lane => {
            const myPlayer = this.my.starters.find(p => p.role === roleMap[lane]);
            const enemyPlayer = this.enemy.starters.find(p => p.role === roleMap[lane]);
            if (!myPlayer || !enemyPlayer) {
                results[lane] = { advantage: 0, desc: '未找到对应位置选手' };
                return;
            }
            const myPower = myPlayer.stats['对线'] + (focusDistribution[lane] || 0) * 6 + this.moraleMod * 3;
            const enemyPower = enemyPlayer.stats['对线'] + (enemyFocus[lane] || 0) * 5;
            const diff = myPower - enemyPower + (Math.random() - 0.5) * 8;
            let advantage, desc;
            if (diff > 8) { advantage = 2; desc = `${myPlayer.id} 压制 ${enemyPlayer.id}，大量经济优势！`; }
            else if (diff > 3) { advantage = 1; desc = `${myPlayer.id} 对线略占优势`; }
            else if (diff > -3) { advantage = 0; desc = `${myPlayer.id} 与 ${enemyPlayer.id} 对线僵持`; }
            else if (diff > -8) { advantage = -1; desc = `${enemyPlayer.id} 对线占优`; }
            else { advantage = -2; desc = `${enemyPlayer.id} 大幅压制 ${myPlayer.id}！`; }
            results[lane] = { advantage, desc, myPlayer: myPlayer.id, enemyPlayer: enemyPlayer.id };
        });

        const totalAdvantage = Object.values(results).reduce((s, r) => s + r.advantage, 0);
        this.momentum = this._clampMomentum(this.momentum + totalAdvantage * 6);
        this.gold.my += 1200 + totalAdvantage * 300;
        this.gold.enemy += 1200 - totalAdvantage * 300;
        if (totalAdvantage >= 2) { this.kills.my += 1; this.towers.my += 1; }
        if (totalAdvantage <= -2) { this.kills.enemy += 1; this.towers.enemy += 1; }
        this.round = 1;
        this.log.push({ round: 1, type: 'laning', results });
        return { results, momentum: this.momentum, enemyFocus };
    }

    /* ======== 回合2: 野区博弈（增强版） ======== */
    getJungleAnalysis() {
        const myJg = this.my.starters.find(p => p.role === '打野');
        const enJg = this.enemy.starters.find(p => p.role === '打野');
        const laneResults = this.log.find(l => l.round === 1)?.results || {};

        const myStr = myJg ? (myJg.stats['意识'] + myJg.stats['操作']) / 2 : 70;
        const enStr = enJg ? (enJg.stats['意识'] + enJg.stats['操作']) / 2 : 70;

        const weakLane = Object.entries(laneResults)
            .sort(([,a], [,b]) => (a.advantage || 0) - (b.advantage || 0))[0];
        const strongLane = Object.entries(laneResults)
            .sort(([,a], [,b]) => (b.advantage || 0) - (a.advantage || 0))[0];

        const choiceAnalysis = {
            invade: {
                successRate: Math.round(Math.max(15, Math.min(85, 50 + (myStr - enStr) * 0.8 - 15))),
                hint: myStr > enStr + 5 ? '打野实力领先，入侵成功率高' : myStr < enStr - 5 ? '对方打野更强，入侵风险大' : '打野实力相当，入侵有一定风险',
                reward: '高', risk: '高',
            },
            dragon: {
                successRate: Math.round(Math.max(30, Math.min(85, 60 + (myStr - enStr) * 0.5))),
                hint: '相对稳妥的选择',
                reward: '中', risk: '低',
            },
            gank_top: {
                successRate: Math.round(Math.max(20, Math.min(85, 50 + (myStr - enStr) * 0.5 + (laneResults.top?.advantage || 0) * 8))),
                hint: (laneResults.top?.advantage || 0) > 0 ? '上路占优，Gank容易滚雪球' : (laneResults.top?.advantage || 0) < 0 ? '上路劣势，Gank可挽回局面' : '上路僵持，Gank是打破僵局的手段',
                reward: '中高', risk: '中',
            },
            gank_mid: {
                successRate: Math.round(Math.max(20, Math.min(85, 50 + (myStr - enStr) * 0.5 + (laneResults.mid?.advantage || 0) * 8))),
                hint: (laneResults.mid?.advantage || 0) > 0 ? '中路占优，Gank收益最大' : '中路需要帮助',
                reward: '中高', risk: '中',
            },
            gank_bot: {
                successRate: Math.round(Math.max(20, Math.min(85, 50 + (myStr - enStr) * 0.5 + (laneResults.bot?.advantage || 0) * 8))),
                hint: (laneResults.bot?.advantage || 0) > 0 ? '下路射手发育好，保护发育' : '下路需要帮助抗压',
                reward: '中高', risk: '中',
            },
        };

        return {
            myJungler: myJg, enemyJungler: enJg,
            myStr: Math.round(myStr), enStr: Math.round(enStr),
            choiceAnalysis,
            aiSuggestion: weakLane && (weakLane[1].advantage || 0) < -1
                ? `建议帮扶${({top:'上',mid:'中',bot:'下'})[weakLane[0]]}路，挽回劣势`
                : strongLane && (strongLane[1].advantage || 0) > 1
                    ? `建议帮助${({top:'上',mid:'中',bot:'下'})[strongLane[0]]}路扩大优势`
                    : '建议抢暴君获取全局资源',
        };
    }

    resolveJunglePhase(choice) {
        const analysis = this.getJungleAnalysis();
        const rate = analysis.choiceAnalysis[choice]?.successRate || 50;
        const roll = Math.random() * 100;
        const success = roll < rate;

        const myJg = this.my.starters.find(p => p.role === '打野');
        const choiceData = {
            invade:   { reward: 14, fail: -12, name: '入侵对方野区' },
            dragon:   { reward: 10, fail: -5,  name: '抢暴君' },
            gank_top: { reward: 12, fail: -8,  name: '上路Gank' },
            gank_mid: { reward: 12, fail: -8,  name: '中路Gank' },
            gank_bot: { reward: 12, fail: -8,  name: '下路Gank' },
        };
        const data = choiceData[choice] || choiceData.dragon;
        let momentumShift;
        if (success) {
            momentumShift = data.reward;
            this.kills.my += (choice === 'dragon' ? 0 : 1);
            this.gold.my += 800;
        } else {
            momentumShift = data.fail;
            this.kills.enemy += 1;
            this.gold.enemy += 500;
        }
        this.momentum = this._clampMomentum(this.momentum + momentumShift);
        this.round = 2;
        const desc = success
            ? `${myJg?.id || '打野'}${data.name}成功！(成功率${rate}%)`
            : `${myJg?.id || '打野'}${data.name}失败！(成功率${rate}%)`;
        this.log.push({ round: 2, type: 'jungle', choice, success });
        return { success, desc, momentum: this.momentum, successRate: rate, jungler: myJg?.id };
    }

    /* ======== 回合3: 团战 ======== */
    resolveTeamfight(timingQuality, myStrategy) {
        const timingMult = { perfect: 1.3, good: 1.0, bad: 0.7 };
        const mult = timingMult[timingQuality] || 1.0;
        const enemyStrategy = this._pickEnemyTFStrategy();
        const counterResult = this._checkTFCounter(myStrategy, enemyStrategy);

        const myStatKey = TF_STRATEGIES[myStrategy]?.statKey || '操作';
        const enemyStatKey = TF_STRATEGIES[enemyStrategy]?.statKey || '操作';
        const myStat = this._calcTeamStat(this.my.starters, myStatKey) * mult;
        const enemyStat = this._calcTeamStat(this.enemy.starters, enemyStatKey);

        let momentumShift, outcome, desc;
        const WIN_REWARD = 14;
        const AVG_REWARD = 4;

        if (counterResult === 'my_win') {
            momentumShift = Math.max(8, Math.round(WIN_REWARD + (myStat - enemyStat) * 0.1));
            this.kills.my += 3; this.towers.my += 1;
            outcome = 'counter_win';
            desc = `策略克制！「${TF_STRATEGIES[myStrategy].name}」完克「${TF_STRATEGIES[enemyStrategy].name}」！团战大胜！`;
        } else if (counterResult === 'enemy_win') {
            momentumShift = -Math.max(8, Math.round(WIN_REWARD + (enemyStat - myStat) * 0.1));
            this.kills.enemy += 3; this.towers.enemy += 1;
            outcome = 'counter_lose';
            desc = `被克制！「${TF_STRATEGIES[enemyStrategy].name}」完克我方「${TF_STRATEGIES[myStrategy].name}」！`;
        } else {
            const diff = (myStat - enemyStat) * 0.15 + (Math.random() - 0.5) * 6;
            momentumShift = Math.round(AVG_REWARD * Math.sign(diff) + diff * 0.5);
            if (diff > 3) { this.kills.my += 1; outcome = 'neutral_win'; desc = '无克制，凭实力小胜'; }
            else if (diff < -3) { this.kills.enemy += 1; outcome = 'neutral_lose'; desc = '无克制，实力稍逊'; }
            else { outcome = 'neutral_draw'; desc = '双方势均力敌，团战平手'; }
        }

        this.momentum = this._clampMomentum(this.momentum + momentumShift);
        this.round = 3;
        this.log.push({ round: 3, type: 'teamfight', myStrategy, enemyStrategy, counterResult, momentumShift });
        return { outcome, desc, momentum: this.momentum, myStrategy, enemyStrategy, counterResult, momentumShift };
    }

    /* ======== 回合4: 宏观策略 ======== */
    resolveMacroStrategy(myCardId) {
        const myCard = MACRO_STRATEGIES.find(c => c.id === myCardId);
        const enemyPool = MACRO_STRATEGIES.filter(c => c.id !== myCardId);
        const enemyCard = enemyPool[Math.floor(Math.random() * enemyPool.length)];

        const iMyCounter = myCard.counters === enemyCard.id;
        const iEnemyCounter = enemyCard.counters === myCard.id;
        const myStatVal = this._calcTeamStat(this.my.starters, myCard.statKey);
        const enemyStatVal = this._calcTeamStat(this.enemy.starters, enemyCard.statKey);

        let counterResult, momentumShift, desc;
        if (iMyCounter) {
            counterResult = 'my_win';
            momentumShift = myCard.reward + Math.round((myStatVal - 75) * 0.1);
            this.kills.my += 2; this.gold.my += 800;
            desc = `「${myCard.name}」克制「${enemyCard.name}」！通吃全部收益！`;
        } else if (iEnemyCounter) {
            counterResult = 'enemy_win';
            momentumShift = -(enemyCard.reward + Math.round((enemyStatVal - 75) * 0.1));
            this.kills.enemy += 2; this.gold.enemy += 800;
            desc = `「${enemyCard.name}」克制「${myCard.name}」！对方通吃收益！`;
        } else {
            counterResult = 'neutral';
            const statDiff = (myStatVal - enemyStatVal) * 0.08;
            momentumShift = Math.round(statDiff + (Math.random() - 0.5) * 3);
            desc = '无克制关系，双方各获平均收益';
        }

        this.momentum = this._clampMomentum(this.momentum + momentumShift);
        this.round = 4;
        this.log.push({ round: 4, type: 'macro', myCard: myCard.id, enemyCard: enemyCard.id, counterResult, momentumShift });
        return { myCard, enemyCard, counterResult, momentumShift, momentum: this.momentum, desc };
    }

    /* ======== 回合5: 终局（削弱翻盘力度） ======== */
    resolveFinale(decisions = []) {
        let momentumShift = 0;
        if (this.momentum >= 60) {
            momentumShift = decisions[0] === 'push' ? 5 : 3;
        } else if (this.momentum >= 40) {
            decisions.forEach(d => { momentumShift += d === 'correct' ? 4 : -3; });
        } else {
            const correctCount = decisions.filter(d => d === 'correct').length;
            momentumShift = correctCount >= 2 ? 12 : correctCount === 1 ? 4 : -5;
        }
        this.momentum = this._clampMomentum(this.momentum + momentumShift);
        this.round = 5;
        const won = this.momentum >= 48;
        this.log.push({ round: 5, type: 'finale', won, finalMomentum: this.momentum });
        return { won, momentum: this.momentum, kills: this.kills, towers: this.towers, gold: this.gold, mvp: this._determineMVP(won) };
    }

    /* ======== 工具方法 ======== */
    _clampMomentum(v) { return Math.max(2, Math.min(98, v)); }

    _applyConditionModifier(starters, conditions) {
        if (!conditions) return starters;
        return starters.map(p => {
            const cond = conditions[p.id] ?? 80;
            if (cond >= 80) return p;
            const penalty = (80 - cond) * 0.15;
            const modified = { ...p, stats: { ...p.stats } };
            Object.keys(modified.stats).forEach(k => {
                modified.stats[k] = Math.max(40, Math.round(modified.stats[k] - penalty));
            });
            return modified;
        });
    }

    _calcMoraleMod(morale) {
        if (morale == null) return 0;
        if (morale >= 80) return 3;
        if (morale <= 40) return -4;
        return 0;
    }

    _generateEnemyFocus() {
        const arr = [0, 0, 0];
        for (let i = 0; i < 3; i++) arr[Math.floor(Math.random() * 3)]++;
        return { top: arr[0], mid: arr[1], bot: arr[2] };
    }

    _calcTeamStat(starters, statKey) {
        return starters.reduce((s, p) => s + (p.stats[statKey] || 70), 0) / starters.length;
    }

    _pickEnemyTFStrategy() {
        const keys = Object.keys(TF_STRATEGIES);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    _checkTFCounter(my, enemy) {
        if (TF_COUNTER_MAP[my] === enemy) return 'my_win';
        if (TF_COUNTER_MAP[enemy] === my) return 'enemy_win';
        return 'neutral';
    }

    _determineMVP(won) {
        const pool = won ? this.my.starters : this.enemy.starters;
        return pool.reduce((best, p) => (!best || p.rating > best.rating) ? p : best, null);
    }
}
