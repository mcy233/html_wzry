/**
 * CardBattleSystem — 卡牌对战核心逻辑
 *
 * 管理：牌库/手牌/行动力/地图状态/回合结算/大事件/团战子博弈
 */
import { ALL_CARDS, buildDeck, buildEnemyDeck, getTeamStyle } from '../data/cards.js';
/* heroes.js imports reserved for future comp evaluation */

const TOTAL_ROUNDS = 9;
const MAX_HAND = 6;
const BASE_AP = 5;
const DRAW_PER_TURN = 2;

const INIT_LANE = 50;
const TOWER_HP = 30;

export class CardBattleSystem {
    constructor(myTeam, enemyTeam, myStarters, enemyStarters, bpResult, opts = {}) {
        this.my = { team: myTeam, starters: myStarters };
        this.enemy = { team: enemyTeam, starters: enemyStarters };
        this.bpResult = bpResult;
        this.morale = opts.morale || 70;

        // 势能 0~100, 50=均势
        this.momentum = 50 + (bpResult?.bpMomentum || 0);

        // 三路推进度 0=我方深入敌方, 100=敌方深入我方
        this.lanes = {
            top: { progress: INIT_LANE, myTowers: 2, enemyTowers: 2 },
            mid: { progress: INIT_LANE, myTowers: 2, enemyTowers: 2 },
            bot: { progress: INIT_LANE, myTowers: 2, enemyTowers: 2 },
        };

        this.gold = { my: 0, enemy: 0 };
        this.kills = { my: 0, enemy: 0 };
        this.towers = { my: 0, enemy: 0 };

        this.round = 0;
        this.phase = 'early'; // early / mid / late
        this.log = [];

        // 牌库与手牌
        const style = getTeamStyle(enemyTeam.id);
        this.myDeck = buildDeck(bpResult, myStarters, enemyStarters);
        this.enemyDeck = buildEnemyDeck(style, enemyStarters);
        this.myHand = [];
        this.enemyHand = [];

        this.bonusDraw = 0;
        this.revealedEnemyCards = [];
        this.usedPause = false;
        this.winStreak = 0;

        // 大事件状态
        this.baronAlive = false;   // 第3轮后出现
        this.lordAlive = false;    // 第7轮后出现
        this.baronBuff = { my: false, enemy: false };
        this.lordBuff = { my: false, enemy: false };

        this.gameOver = false;
        this.winner = null;
    }

    get totalRounds() { return TOTAL_ROUNDS; }

    getPhaseLabel() {
        if (this.round <= 3) return '前期';
        if (this.round <= 6) return '中期';
        return '后期';
    }

    // ===================== 回合开始 =====================
    startRound() {
        this.round++;
        this.phase = this.round <= 3 ? 'early' : this.round <= 6 ? 'mid' : 'late';

        // 每轮基础经济
        this.gold.my += 500;
        this.gold.enemy += 500;

        // 暴君在第3轮出现，主宰在第7轮出现
        if (this.round === 3) this.baronAlive = true;
        if (this.round === 7) this.lordAlive = true;

        // 抽牌
        const drawCount = DRAW_PER_TURN + this.bonusDraw;
        this.bonusDraw = 0;
        this._drawCards('my', drawCount);
        this._drawCards('enemy', DRAW_PER_TURN);

        // 行动力
        this.currentAP = BASE_AP;
        this.enemyAP = BASE_AP;

        // 生成随机事件
        this.roundEvent = this._generateEvent();

        return {
            round: this.round,
            phase: this.phase,
            phaseLabel: this.getPhaseLabel(),
            myHand: this.myHand,
            ap: this.currentAP,
            event: this.roundEvent,
            revealedEnemyCards: this.revealedEnemyCards,
            baronAlive: this.baronAlive,
            lordAlive: this.lordAlive,
        };
    }

    _drawCards(side, count) {
        const hand = side === 'my' ? this.myHand : this.enemyHand;
        const deck = side === 'my' ? this.myDeck : this.enemyDeck;

        for (let i = 0; i < count && hand.length < MAX_HAND; i++) {
            if (deck.length === 0) {
                deck.push(...this._recycleDiscard(side));
            }
            if (deck.length > 0) hand.push(deck.pop());
        }
    }

    _recycleDiscard(side) {
        const baseDeck = side === 'my'
            ? buildDeck(this.bpResult, this.my.starters, this.enemy.starters)
            : buildEnemyDeck(getTeamStyle(this.enemy.team.id), this.enemy.starters);
        return baseDeck;
    }

    // ===================== 玩家出牌 =====================
    canPlayCard(card) {
        if (card.cost > this.currentAP) return { ok: false, reason: '行动力不足' };
        if (card.condition === 'losing' && this.momentum > 40) return { ok: false, reason: '仅逆风时可用' };
        if (card.condition === 'winning_streak' && this.winStreak < 2) return { ok: false, reason: '需连续赢2轮' };
        if (card.condition === 'late_game' && this.round < 7) return { ok: false, reason: '仅后期可用' };
        if (card.condition === 'once_per_game' && this.usedPause) return { ok: false, reason: '每场限用1次' };
        if (card.requiresTower && card.resolvedLane) {
            const lane = this.lanes[card.resolvedLane];
            if (lane && lane.myTowers <= 0) return { ok: false, reason: '该路无塔' };
        }
        if (card.objectiveType === 'baron' && !this.baronAlive) return { ok: false, reason: '暴君未刷新' };
        if (card.objectiveType === 'lord' && !this.lordAlive) return { ok: false, reason: '主宰未刷新' };
        return { ok: true };
    }

    // 玩家选择出牌（可出多张）
    // playedCards: [{ card, targetLane? }]
    resolveRound(playedCards) {
        const myActions = this._resolvePlayerCards(playedCards);
        const enemyActions = this._aiPlayCards();
        const result = this._settleRound(myActions, enemyActions);

        this.revealedEnemyCards = [];

        // 检查胜负
        this._checkGameEnd();

        return {
            round: this.round,
            myActions,
            enemyActions,
            settlements: result.settlements,
            laneChanges: result.laneChanges,
            event: this.roundEvent,
            momentum: this.momentum,
            gold: { ...this.gold },
            kills: { ...this.kills },
            towers: { ...this.towers },
            lanes: JSON.parse(JSON.stringify(this.lanes)),
            gameOver: this.gameOver,
            winner: this.winner,
        };
    }

    _resolvePlayerCards(playedCards) {
        const actions = [];
        for (const { card, targetLane } of playedCards) {
            if (card.cost > this.currentAP) continue;
            this.currentAP -= card.cost;

            const resolvedLane = card.target === 'choose' ? targetLane : card.target;
            const action = { ...card, resolvedLane, side: 'my' };

            // 特殊即时效果
            if (card.bonusAP) this.currentAP += card.bonusAP;
            if (card.bonusDraw) this.bonusDraw += card.bonusDraw;
            if (card.revealCards) this._revealEnemyCards(card.revealCards);
            if (card.revealAll) { this._revealEnemyCards(99); this.usedPause = true; }
            if (card.condition === 'once_per_game') this.usedPause = true;

            actions.push(action);
            this._removeFromHand('my', card);
        }
        return actions;
    }

    _revealEnemyCards(count) {
        this.revealedEnemyCards = this.enemyHand.slice(0, Math.min(count, this.enemyHand.length));
    }

    _removeFromHand(side, card) {
        const hand = side === 'my' ? this.myHand : this.enemyHand;
        const idx = hand.findIndex(c => c.uid === card.uid);
        if (idx >= 0) hand.splice(idx, 1);
    }

    // ===================== AI出牌 =====================
    _aiPlayCards() {
        const actions = [];
        const style = getTeamStyle(this.enemy.team.id);
        let ap = this.enemyAP;
        const hand = [...this.enemyHand];

        // AI策略：根据风格和局势选牌
        const sorted = this._aiPrioritize(hand, style);

        for (const card of sorted) {
            if (ap < card.cost) continue;
            if (card.condition === 'once_per_game') continue;
            if (card.condition === 'losing' && this.momentum < 60) continue;
            if (card.condition === 'late_game' && this.round < 7) continue;
            if (card.objectiveType === 'baron' && !this.baronAlive) continue;
            if (card.objectiveType === 'lord' && !this.lordAlive) continue;

            ap -= card.cost;
            const targetLane = this._aiChooseLane(card);
            actions.push({ ...card, resolvedLane: targetLane, side: 'enemy' });
            this._removeFromHand('enemy', card);

            if (ap <= 0) break;
            if (actions.length >= 3) break;
        }

        return actions;
    }

    _aiPrioritize(hand, style) {
        return hand.map(card => {
            let priority = 0;
            if (style === 'aggressive' && card.type === 'attack') priority += 3;
            if (style === 'defensive' && card.type === 'defend') priority += 3;
            if (style === 'operational' && (card.id === 'tac_farm' || card.id === 'tac_vision')) priority += 3;
            if (style === 'teamfight' && card.id === 'tac_teamfight') priority += 4;

            // 局势判断
            if (this.momentum > 55 && card.type === 'attack') priority += 2;
            if (this.momentum < 45 && card.type === 'defend') priority += 2;

            // 目标争夺
            if (card.objectiveType === 'baron' && this.baronAlive) priority += 3;
            if (card.objectiveType === 'lord' && this.lordAlive) priority += 4;

            // 后期偏好
            if (this.round >= 7 && card.type === 'attack') priority += 1;

            return { ...card, _priority: priority };
        }).sort((a, b) => b._priority - a._priority);
    }

    _aiChooseLane(card) {
        if (card.target !== 'choose') return card.target;
        // 选择最有优势/劣势的路
        const entries = Object.entries(this.lanes);
        if (card.type === 'attack') {
            const weakest = entries.sort((a, b) => a[1].progress - b[1].progress)[0];
            return weakest[0];
        }
        const threatened = entries.sort((a, b) => b[1].progress - a[1].progress)[0];
        return threatened[0];
    }

    // ===================== 回合结算 =====================
    _settleRound(myActions, enemyActions) {
        const settlements = [];
        const laneChanges = { top: 0, mid: 0, bot: 0 };

        // 按路线分组
        const laneKeys = ['top', 'mid', 'bot'];
        for (const lane of laneKeys) {
            const myLane = myActions.filter(a => a.resolvedLane === lane || a.resolvedLane === 'all');
            const enLane = enemyActions.filter(a => a.resolvedLane === lane || a.resolvedLane === 'all');
            const result = this._resolveLane(lane, myLane, enLane);
            settlements.push(...result.events);
            laneChanges[lane] = result.delta;
        }

        // 野区/全局效果
        const myJungle = myActions.filter(a => a.resolvedLane === 'jungle');
        const enJungle = enemyActions.filter(a => a.resolvedLane === 'jungle');
        const jungleResult = this._resolveJungle(myJungle, enJungle);
        settlements.push(...jungleResult.events);

        // 团战
        const myTF = myActions.find(a => a.triggerTeamfight);
        const enTF = enemyActions.find(a => a.triggerTeamfight);
        if (myTF || enTF) {
            const tfResult = this._resolveTeamfight(myTF ? 'my' : 'enemy');
            settlements.push(...tfResult.events);
        }

        // 经济差转化
        const goldDiff = this.gold.my - this.gold.enemy;
        const econBonus = Math.floor(goldDiff / 2000);
        if (econBonus !== 0) {
            this.momentum = this._clamp(this.momentum + econBonus);
            settlements.push({ type: 'econ', desc: `经济${goldDiff > 0 ? '领先' : '落后'}${Math.abs(goldDiff)}，势能${econBonus > 0 ? '+' : ''}${econBonus}`, icon: '💰' });
        }

        // 特殊卡牌效果
        for (const a of myActions) {
            if (a.goldReward) { this.gold.my += a.goldReward; settlements.push({ type: 'gold', desc: `经济+${a.goldReward}`, icon: '💰', side: 'my' }); }
            if (a.momentumBoost) { this.momentum = this._clamp(this.momentum + a.momentumBoost); settlements.push({ type: 'boost', desc: `绝境翻盘！势能+${a.momentumBoost}`, icon: '🔥', side: 'my' }); }
        }
        for (const a of enemyActions) {
            if (a.goldReward) { this.gold.enemy += a.goldReward; }
        }

        // buff衰减
        if (this.baronBuff.my) { for (const l in laneChanges) laneChanges[l] -= 1; this.baronBuff.my = false; }
        if (this.baronBuff.enemy) { for (const l in laneChanges) laneChanges[l] += 1; this.baronBuff.enemy = false; }

        // 应用推进变化
        for (const lane of laneKeys) {
            this.lanes[lane].progress = Math.max(0, Math.min(100, this.lanes[lane].progress + laneChanges[lane]));
            this._checkTowers(lane, settlements);
        }

        // 势能从推进度总和推算
        const avgProgress = (this.lanes.top.progress + this.lanes.mid.progress + this.lanes.bot.progress) / 3;
        const targetMomentum = 100 - avgProgress;
        this.momentum = this._clamp(this.momentum * 0.7 + targetMomentum * 0.3);

        // 判断本轮胜负（用于连胜）
        const netDelta = Object.values(laneChanges).reduce((s, v) => s + v, 0);
        if (netDelta < 0) this.winStreak = Math.max(0, this.winStreak + 1);
        else if (netDelta > 0) this.winStreak = 0;

        this.log.push({ round: this.round, myActions: myActions.map(a => a.name), enemyActions: enemyActions.map(a => a.name), momentum: this.momentum });

        return { settlements, laneChanges };
    }

    _resolveLane(lane, myCards, enemyCards) {
        const events = [];
        let delta = 0; // 负=我方推进(进度减少), 正=敌方推进

        const myAtk = myCards.filter(c => c.type === 'attack');
        const myDef = myCards.filter(c => c.type === 'defend');
        const enAtk = enemyCards.filter(c => c.type === 'attack');
        const enDef = enemyCards.filter(c => c.type === 'defend');

        const laneLabel = { top: '上路', mid: '中路', bot: '下路' }[lane];
        const myStatBonus = this._getLaneStatBonus(lane, 'my');
        const enStatBonus = this._getLaneStatBonus(lane, 'enemy');

        // 我方进攻 vs 敌方防御
        let myAtkPower = myAtk.reduce((s, c) => s + (c.resolvedLane === 'all' ? Math.floor(c.power / 3) : c.power), 0);
        myAtkPower = Math.round(myAtkPower * (1 + myStatBonus * 0.02));

        let enDefPower = enDef.reduce((s, c) => s + (c.resolvedLane === 'all' ? Math.floor(c.power / 3) : c.power), 0);

        // 反蹲判定
        const myAmbush = myDef.find(c => c.id === 'def_ambush');
        const enAmbush = enDef.find(c => c.id === 'def_ambush');

        if (enAmbush && myAtkPower > 0) {
            delta += enAmbush.counterBonus || 12;
            this.kills.enemy += 1;
            events.push({ type: 'ambush', desc: `${laneLabel} 对方反蹲成功！我方被击杀`, icon: '💀', lane, side: 'enemy' });
        } else if (myAtkPower > enDefPower) {
            const net = myAtkPower - enDefPower;
            delta -= net;
            if (net >= 10) { this.kills.my += 1; events.push({ type: 'kill', desc: `${laneLabel} 进攻得手！击杀+推进`, icon: '⚔️', lane, side: 'my' }); }
            else events.push({ type: 'push', desc: `${laneLabel} 我方推进成功(+${net})`, icon: '→', lane, side: 'my' });
        } else if (myAtkPower > 0) {
            events.push({ type: 'blocked', desc: `${laneLabel} 进攻被防住`, icon: '🛡️', lane });
        }

        // 敌方进攻 vs 我方防御
        let enAtkPower = enAtk.reduce((s, c) => s + (c.resolvedLane === 'all' ? Math.floor(c.power / 3) : c.power), 0);
        enAtkPower = Math.round(enAtkPower * (1 + enStatBonus * 0.02));

        let myDefPower = myDef.filter(c => c.id !== 'def_ambush').reduce((s, c) => s + (c.resolvedLane === 'all' ? Math.floor(c.power / 3) : c.power), 0);

        if (myAmbush && enAtkPower > 0) {
            delta -= myAmbush.counterBonus || 12;
            this.kills.my += 1;
            events.push({ type: 'ambush', desc: `${laneLabel} 我方反蹲成功！击杀对方`, icon: '🎯', lane, side: 'my' });
        } else if (enAtkPower > myDefPower) {
            const net = enAtkPower - myDefPower;
            delta += net;
            if (net >= 10) { this.kills.enemy += 1; events.push({ type: 'kill', desc: `${laneLabel} 对方进攻得手`, icon: '💀', lane, side: 'enemy' }); }
            else events.push({ type: 'push', desc: `${laneLabel} 对方推进(+${net})`, icon: '←', lane, side: 'enemy' });
        } else if (enAtkPower > 0) {
            events.push({ type: 'blocked', desc: `${laneLabel} 对方进攻被挡`, icon: '🛡️', lane });
        }

        // 分路带线效果
        for (const c of [...myCards, ...enemyCards]) {
            if (c.splitPush && c.side === 'my') delta -= c.splitPush.power;
            if (c.splitPush && c.side === 'enemy') delta += c.splitPush.power;
        }

        // 越塔风险牌
        for (const c of myAtk) {
            if (c.riskRate && Math.random() > c.riskRate) {
                delta += 8;
                this.kills.enemy += 1;
                events.push({ type: 'risk_fail', desc: `${laneLabel} 越塔失败！反被击杀`, icon: '💀', lane, side: 'enemy' });
            }
        }

        // 四人集结的惩罚（其余路-4已体现在其他路计算里）
        for (const c of [...myCards, ...enemyCards]) {
            if (c.penalty?.otherLanes && c.resolvedLane === lane) {
                // penalty已在power中体现，此处无需额外处理
            }
        }

        return { events, delta };
    }

    _getLaneStatBonus(lane, side) {
        const roleMap = { top: '对抗路', mid: '中路', bot: '发育路' };
        const role = roleMap[lane];
        const starters = side === 'my' ? this.my.starters : this.enemy.starters;
        const player = starters.find(p => p.role === role);
        if (!player) return 0;
        return (player.rating || 70) - 70;
    }

    _resolveJungle(myCards, enemyCards) {
        const events = [];

        // 暴君/主宰争夺
        const myBaron = myCards.find(c => c.objectiveType === 'baron');
        const enBaron = enemyCards.find(c => c.objectiveType === 'baron');
        const myLord = myCards.find(c => c.objectiveType === 'lord');
        const enLord = enemyCards.find(c => c.objectiveType === 'lord');

        if (myBaron && this.baronAlive) {
            if (enBaron) {
                // 争抢
                const myPow = this._getJunglerPower('my');
                const enPow = this._getJunglerPower('enemy');
                if (myPow + Math.random() * 10 > enPow + Math.random() * 10) {
                    this._applyObjectiveBuff('baron', 'my');
                    events.push({ type: 'objective', desc: '暴君争夺成功！获得全队buff', icon: '🐉', side: 'my' });
                } else {
                    this._applyObjectiveBuff('baron', 'enemy');
                    events.push({ type: 'objective', desc: '暴君被对方抢走！', icon: '🐉', side: 'enemy' });
                }
            } else {
                this._applyObjectiveBuff('baron', 'my');
                events.push({ type: 'objective', desc: '成功击杀暴君！全队buff', icon: '🐉', side: 'my' });
            }
            this.baronAlive = false;
        } else if (enBaron && this.baronAlive) {
            this._applyObjectiveBuff('baron', 'enemy');
            events.push({ type: 'objective', desc: '对方击杀暴君', icon: '🐉', side: 'enemy' });
            this.baronAlive = false;
        }

        if (myLord && this.lordAlive) {
            if (enLord) {
                const myPow = this._getJunglerPower('my');
                const enPow = this._getJunglerPower('enemy');
                if (myPow + Math.random() * 10 > enPow + Math.random() * 10) {
                    this._applyObjectiveBuff('lord', 'my');
                    events.push({ type: 'objective', desc: '主宰争夺成功！超级兵线降临', icon: '👑', side: 'my' });
                } else {
                    this._applyObjectiveBuff('lord', 'enemy');
                    events.push({ type: 'objective', desc: '主宰被对方抢走！', icon: '👑', side: 'enemy' });
                }
            } else {
                this._applyObjectiveBuff('lord', 'my');
                events.push({ type: 'objective', desc: '成功击杀主宰！', icon: '👑', side: 'my' });
            }
            this.lordAlive = false;
        } else if (enLord && this.lordAlive) {
            this._applyObjectiveBuff('lord', 'enemy');
            events.push({ type: 'objective', desc: '对方击杀主宰', icon: '👑', side: 'enemy' });
            this.lordAlive = false;
        }

        return { events };
    }

    _getJunglerPower(side) {
        const starters = side === 'my' ? this.my.starters : this.enemy.starters;
        const jungler = starters.find(p => p.role === '打野');
        return (jungler?.rating || 70) + (jungler?.stats?.['操作'] || 60);
    }

    _applyObjectiveBuff(type, side) {
        if (type === 'baron') {
            this.baronBuff[side] = true;
            this.gold[side] += 800;
            for (const l in this.lanes) {
                const delta = side === 'my' ? -4 : 4;
                this.lanes[l].progress = Math.max(0, Math.min(100, this.lanes[l].progress + delta));
            }
        } else if (type === 'lord') {
            this.lordBuff[side] = true;
            for (const l in this.lanes) {
                const delta = side === 'my' ? -8 : 8;
                this.lanes[l].progress = Math.max(0, Math.min(100, this.lanes[l].progress + delta));
            }
        }
    }

    _resolveTeamfight(initiator) {
        const events = [];
        const myPower = this.my.starters.reduce((s, p) => s + (p.rating || 70), 0);
        const enPower = this.enemy.starters.reduce((s, p) => s + (p.rating || 70), 0);
        const momentumBonus = (this.momentum - 50) * 0.3;
        const roll = Math.random() * 20 - 10;

        const myTotal = myPower + momentumBonus + roll;
        const enTotal = enPower - momentumBonus + (Math.random() * 20 - 10);

        if (myTotal > enTotal) {
            const killCount = Math.min(5, Math.floor((myTotal - enTotal) / 20) + 1);
            this.kills.my += killCount;
            this.momentum = this._clamp(this.momentum + 6);
            const pushLane = Object.entries(this.lanes).sort((a, b) => a[1].progress - b[1].progress)[0][0];
            this.lanes[pushLane].progress = Math.max(0, this.lanes[pushLane].progress - 12);
            events.push({ type: 'teamfight_win', desc: `团战胜利！击杀${killCount}人，${LANES_LABEL[pushLane]}推进`, icon: '🎉', side: 'my' });
        } else {
            const killCount = Math.min(5, Math.floor((enTotal - myTotal) / 20) + 1);
            this.kills.enemy += killCount;
            this.momentum = this._clamp(this.momentum - 6);
            const pushLane = Object.entries(this.lanes).sort((a, b) => b[1].progress - a[1].progress)[0][0];
            this.lanes[pushLane].progress = Math.min(100, this.lanes[pushLane].progress + 12);
            events.push({ type: 'teamfight_lose', desc: `团战失利！对方击杀${killCount}人`, icon: '💀', side: 'enemy' });
        }

        return { events };
    }

    _checkTowers(lane, settlements) {
        const l = this.lanes[lane];
        const laneLabel = LANES_LABEL[lane];
        if (l.progress <= 15 && l.enemyTowers > 0) {
            l.enemyTowers--;
            this.towers.my++;
            this.gold.my += 500;
            l.progress = 25;
            settlements.push({ type: 'tower', desc: `推掉${laneLabel}敌方防御塔！(剩余${l.enemyTowers})`, icon: '🏰', side: 'my', lane });
        }
        if (l.progress >= 85 && l.myTowers > 0) {
            l.myTowers--;
            this.towers.enemy++;
            this.gold.enemy += 500;
            l.progress = 75;
            settlements.push({ type: 'tower', desc: `${laneLabel}我方防御塔被推！(剩余${l.myTowers})`, icon: '🏚️', side: 'enemy', lane });
        }
    }

    _checkGameEnd() {
        const myHighGone = Object.values(this.lanes).every(l => l.myTowers === 0);
        const enHighGone = Object.values(this.lanes).every(l => l.enemyTowers === 0);
        if (enHighGone) { this.gameOver = true; this.winner = 'my'; }
        if (myHighGone) { this.gameOver = true; this.winner = 'enemy'; }
        if (this.momentum >= 80) { this.gameOver = true; this.winner = 'my'; }
        if (this.momentum <= 20) { this.gameOver = true; this.winner = 'enemy'; }
    }

    // ===================== 决胜轮 =====================
    resolveFinale(choice) {
        if (this.momentum >= 60) {
            if (choice === 'push') {
                const success = Math.random() < 0.7;
                if (success) { this.winner = 'my'; } else { this.momentum = this._clamp(this.momentum - 10); this.winner = this.momentum > 50 ? 'my' : 'enemy'; }
            } else {
                this.winner = Math.random() < 0.85 ? 'my' : 'enemy';
            }
        } else if (this.momentum > 40) {
            // 均势团战决胜
            const tf = this._resolveTeamfight('my');
            this.winner = this.momentum >= 50 ? 'my' : 'enemy';
        } else {
            this.winner = Math.random() < 0.35 ? 'my' : 'enemy';
        }

        this.gameOver = true;
        const won = this.winner === 'my';

        return {
            won,
            momentum: this.momentum,
            kills: { ...this.kills },
            towers: { ...this.towers },
            gold: { ...this.gold },
            mvp: won ? this._pickMVP() : null,
        };
    }

    _pickMVP() {
        if (!this.my.starters.length) return null;
        return this.my.starters.reduce((best, p) => (p.rating || 0) > (best.rating || 0) ? p : best, this.my.starters[0]);
    }

    // ===================== 大事件 =====================
    _generateEvent() {
        if (this.round === 2) return { type: 'river_fight', name: '河道之争', desc: '争夺河道视野和资源', icon: '🌊' };
        if (this.round === 5 && this.baronAlive) return { type: 'baron_fight', name: '暴君争夺', desc: '暴君即将刷新，准备争夺！', icon: '🐉' };
        if (this.round === 8 && this.lordAlive) return { type: 'lord_fight', name: '主宰之战', desc: '主宰争夺决定走向！', icon: '👑' };

        // 逆风救济
        if (this.momentum < 35) {
            this._injectUltimateCard('ult_comeback');
            return { type: 'comeback_card', name: '逆风救济', desc: '获得「绝境翻盘」卡！', icon: '🔥' };
        }
        if (this.winStreak >= 2 && !this.myHand.find(c => c.id === 'ult_ace')) {
            this._injectUltimateCard('ult_ace');
            return { type: 'ace_card', name: '连胜奖励', desc: '获得「团灭对手」卡！', icon: '🌟' };
        }

        // 随机事件 10%
        if (Math.random() < 0.1) {
            const random = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
            this._applyRandomEvent(random);
            return random;
        }
        return null;
    }

    _injectUltimateCard(id) {
        const template = ALL_CARDS[id];
        if (template && this.myHand.length < MAX_HAND) {
            this.myHand.push({ ...template, uid: `${id}_${Date.now()}` });
        }
    }

    _applyRandomEvent(event) {
        if (!event) return;
        if (event.effect === 'gold_surge') { this.gold.my += 800; this.gold.enemy += 800; }
        if (event.effect === 'lane_collapse') {
            const lane = ['top', 'mid', 'bot'][Math.floor(Math.random() * 3)];
            this.lanes[lane].progress += (Math.random() > 0.5 ? 10 : -10);
            this.lanes[lane].progress = Math.max(0, Math.min(100, this.lanes[lane].progress));
        }
    }

    // ===================== AI教练建议 =====================
    getCoachAdvice() {
        const tips = [];
        const dominated = Object.entries(this.lanes).filter(([, l]) => l.progress <= 30);
        const threatened = Object.entries(this.lanes).filter(([, l]) => l.progress >= 70);

        if (dominated.length) {
            tips.push(`💡 ${dominated.map(([l]) => LANES_LABEL[l]).join('、')}优势明显，可以考虑继续进攻或抢目标`);
        }
        if (threatened.length) {
            tips.push(`⚠️ ${threatened.map(([l]) => LANES_LABEL[l]).join('、')}吃紧，建议出防御牌守住`);
        }
        if (this.baronAlive) tips.push('🐉 暴君已刷新，出「抢暴君」牌可获得全队buff');
        if (this.lordAlive) tips.push('👑 主宰已刷新，击杀主宰可获得超级兵线');
        if (this.momentum < 40) tips.push('🔥 形势不利，注意防守等待机会翻盘');
        if (this.momentum > 60) tips.push('✅ 形势大好，可以果断进攻扩大优势');

        // 推荐出牌
        const bestCard = this._recommendCard();
        if (bestCard) tips.push(`📋 推荐出牌：「${bestCard.name}」— ${bestCard.desc}`);

        return tips;
    }

    _recommendCard() {
        if (!this.myHand.length) return null;
        return this.myHand.reduce((best, card) => {
            let score = 0;
            if (this.momentum > 55 && card.type === 'attack') score += 3;
            if (this.momentum < 45 && card.type === 'defend') score += 3;
            if (card.objectiveType === 'baron' && this.baronAlive) score += 4;
            if (card.objectiveType === 'lord' && this.lordAlive) score += 5;
            if (card.type === 'ultimate') score += 2;
            return score > (best._score || 0) ? { ...card, _score: score } : best;
        }, { ...this.myHand[0], _score: 0 });
    }

    // ===================== 工具 =====================
    _clamp(v) { return Math.max(5, Math.min(95, v)); }

    discard(card) {
        this._removeFromHand('my', card);
    }

    getLaneStatus() {
        return JSON.parse(JSON.stringify(this.lanes));
    }
}

const LANES_LABEL = { top: '上路', mid: '中路', bot: '下路', jungle: '野区' };

const RANDOM_EVENTS = [
    { type: 'random', name: '选手超神', desc: '我方一名选手状态火热，本轮效果增强！', icon: '🔥', effect: 'boost_player' },
    { type: 'random', name: '经济暴涨', desc: '双方经济各+800', icon: '💰', effect: 'gold_surge' },
    { type: 'random', name: '兵线异动', desc: '某路兵线突然变化', icon: '🌊', effect: 'lane_collapse' },
];
