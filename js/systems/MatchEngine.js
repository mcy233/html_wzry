/**
 * MatchEngine — 5节点制比赛引擎
 * 替代旧的 CardBattleSystem，实现事件时间轴制比赛逻辑
 */
import { STRATEGY_PHASES, getAvailableCards, resolveCounter, getPhase } from '../data/strategyCards.js';
import { getCoachConfig } from './AICoach.js';

const MOMENTUM_INIT = 50;
const MOMENTUM_MAX = 95;
const MOMENTUM_MIN = 5;
const WIN_THRESHOLD = 75;
const LOSE_THRESHOLD = 25;

const AI_STYLE_WEIGHTS = {
    aggressive:  { aggression: 1.4, defense: 0.6, tactic: 0.8, economy: 0.5, objective: 1.2 },
    operational: { aggression: 0.6, defense: 0.8, tactic: 1.2, economy: 1.4, objective: 1.0 },
    teamfight:   { aggression: 1.2, defense: 0.8, tactic: 0.8, economy: 0.6, objective: 1.4 },
    defensive:   { aggression: 0.5, defense: 1.4, tactic: 1.0, economy: 1.2, objective: 0.8 },
    balanced:    { aggression: 1.0, defense: 1.0, tactic: 1.0, economy: 1.0, objective: 1.0 },
};

export class MatchEngine {
    constructor(myTeam, enemyTeam, myStarters, enemyStarters, bpResult, opts = {}) {
        this.my = { team: myTeam, starters: myStarters };
        this.enemy = { team: enemyTeam, starters: enemyStarters };
        this.bpResult = bpResult;
        this.enemyStyle = opts.enemyStyle || 'balanced';

        this.momentum = MOMENTUM_INIT + (bpResult?.bpMomentum || 0);
        this.momentum = this._clamp(this.momentum);

        this.gold = { my: 0, enemy: 0 };
        this.kills = { my: 0, enemy: 0 };
        this.towers = { my: 0, enemy: 0 };

        this.buffs = { baron: false, lord: false };

        this.phaseIndex = 0;
        this.nodeHistory = [];
        this.gameOver = false;
        this.winner = null;
    }

    get totalPhases() { return STRATEGY_PHASES.length; }
    get currentPhase() { return STRATEGY_PHASES[this.phaseIndex]; }
    get isFinished() { return this.gameOver || this.phaseIndex >= STRATEGY_PHASES.length; }

    /**
     * 获取当前节点可选策略卡
     */
    getPlayerCards() {
        const phase = this.currentPhase;
        if (!phase) return [];
        return getAvailableCards(phase.id, this.momentum, this.my.starters);
    }

    /**
     * 获取当前节点信息
     */
    getPhaseInfo() {
        const phase = this.currentPhase;
        if (!phase) return null;
        const cards = this.getPlayerCards();
        let stateLabel = '均势';
        if (this.momentum >= 60) stateLabel = '顺风';
        else if (this.momentum <= 40) stateLabel = '逆风';

        return {
            index: this.phaseIndex,
            total: this.totalPhases,
            phase,
            cards,
            momentum: this.momentum,
            gold: { ...this.gold },
            kills: { ...this.kills },
            towers: { ...this.towers },
            buffs: { ...this.buffs },
            stateLabel,
        };
    }

    /**
     * 玩家选择策略卡，传入 { cardId, lane? }
     * 返回本节点的完整结算结果
     */
    resolveNode(playerChoice) {
        const phase = this.currentPhase;
        if (!phase || this.gameOver) return null;

        const playerCards = this.getPlayerCards();
        const myCard = playerCards.find(c => c.id === playerChoice.cardId);
        if (!myCard) return null;

        const myLane = playerChoice.lane || null;
        const enemyChoice = this._aiChooseCard(phase);
        const enemyCard = enemyChoice.card;
        const enemyLane = enemyChoice.lane;

        const baseGold = 500;
        this.gold.my += baseGold;
        this.gold.enemy += baseGold;

        const counterResult = resolveCounter(myCard, enemyCard);

        const myPlayerBonus = this._calcPlayerBonus(phase, 'my', myLane);
        const enemyPlayerBonus = this._calcPlayerBonus(phase, 'enemy', enemyLane);

        let myMomentumGain = myCard.effect.momentum || 0;
        let enemyMomentumGain = enemyCard.effect.momentum || 0;
        let myGoldGain = myCard.effect.gold || myCard.effect.goldSteal || 0;
        let enemyGoldGain = enemyCard.effect.gold || enemyCard.effect.goldSteal || 0;
        let myKills = 0;
        let enemyKills = 0;

        const events = [];

        myMomentumGain = Math.round(myMomentumGain * (1 + myPlayerBonus));
        enemyMomentumGain = Math.round(enemyMomentumGain * (1 + enemyPlayerBonus));

        if (counterResult === 'win') {
            myMomentumGain += 4;
            myKills += 1;
            enemyMomentumGain = Math.round(enemyMomentumGain * 0.5);
            events.push({
                type: 'counter_win',
                icon: '🎯',
                desc: `「${myCard.name}」克制了「${enemyCard.name}」！我方获得额外优势`,
                side: 'my',
            });
            if (myCard.bonusWhenAhead && this.momentum >= 60) {
                myKills += 1;
                events.push({ type: 'bonus', icon: '🔥', desc: myCard.bonusWhenAhead, side: 'my' });
            }
        } else if (counterResult === 'lose') {
            enemyMomentumGain += 4;
            enemyKills += 1;
            myMomentumGain = Math.round(myMomentumGain * 0.5);
            events.push({
                type: 'counter_lose',
                icon: '💀',
                desc: `「${myCard.name}」被「${enemyCard.name}」克制！对方获得额外优势`,
                side: 'enemy',
            });
        } else if (counterResult === 'draw') {
            myMomentumGain = Math.round(myMomentumGain * 0.7);
            enemyMomentumGain = Math.round(enemyMomentumGain * 0.7);
            events.push({
                type: 'draw',
                icon: '🤝',
                desc: `双方都选择了「${myCard.name}」，效果互相抵消`,
                side: 'neutral',
            });
        } else {
            events.push({
                type: 'neutral',
                icon: '⚡',
                desc: `我方「${myCard.name}」vs 对方「${enemyCard.name}」`,
                side: 'neutral',
            });
        }

        if (myCard.effect.buff === 'baron') {
            this.buffs.baron = true;
            events.push({ type: 'buff', icon: '🐉', desc: '获得暴君buff！后续伤害+5%', side: 'my' });
        }
        if (myCard.effect.buff === 'lord') {
            this.buffs.lord = true;
            events.push({ type: 'buff', icon: '👑', desc: '获得主宰buff！全线兵线加强', side: 'my' });
        }
        if (enemyCard.effect.buff === 'baron' && counterResult !== 'win') {
            events.push({ type: 'buff', icon: '🐉', desc: '对方获得暴君buff', side: 'enemy' });
            enemyMomentumGain += 2;
        }
        if (enemyCard.effect.buff === 'lord' && counterResult !== 'win') {
            events.push({ type: 'buff', icon: '👑', desc: '对方获得主宰buff', side: 'enemy' });
            enemyMomentumGain += 3;
        }

        if (this.buffs.baron) {
            myMomentumGain += 1;
        }
        if (this.buffs.lord) {
            myMomentumGain += 2;
        }

        if (phase.requireLaneChoice && myLane && enemyLane) {
            if (myLane === enemyLane) {
                events.push({ type: 'lane_clash', icon: '💥', desc: `双方在${_laneLabel(myLane)}发生冲突！克制关系生效`, side: 'neutral' });
            } else {
                if (counterResult === 'win' || counterResult === 'lose') {
                    events.push({ type: 'lane_split', icon: '↔️', desc: `双方选择了不同路线，各自执行策略`, side: 'neutral' });
                }
            }
        }

        if (myCard.effect.killChance && Math.random() < myCard.effect.killChance) {
            myKills += 1;
            events.push({ type: 'kill', icon: '⚔️', desc: `我方成功击杀！`, side: 'my' });
        }
        if (enemyCard.effect.killChance && Math.random() < enemyCard.effect.killChance && counterResult !== 'win') {
            enemyKills += 1;
            events.push({ type: 'kill', icon: '💀', desc: `对方成功击杀`, side: 'enemy' });
        }

        this.gold.my += myGoldGain;
        this.gold.enemy += enemyGoldGain;
        this.kills.my += myKills;
        this.kills.enemy += enemyKills;

        const killMomentum = Math.floor(this.kills.my / 3) - Math.floor(this.kills.enemy / 3);
        const goldDiffMomentum = Math.floor((this.gold.my - this.gold.enemy) / 2000);

        const netMomentum = myMomentumGain - enemyMomentumGain + killMomentum * 0.5 + goldDiffMomentum * 0.5;
        this.momentum = this._clamp(this.momentum + netMomentum);

        const towerChange = this._calcTowerChange(myMomentumGain, enemyMomentumGain, counterResult);
        this.towers.my += towerChange.my;
        this.towers.enemy += towerChange.enemy;
        if (towerChange.my > 0) {
            this.gold.my += towerChange.my * 500;
            events.push({ type: 'tower', icon: '🏰', desc: `推掉对方${towerChange.my}座防御塔！`, side: 'my' });
        }
        if (towerChange.enemy > 0) {
            this.gold.enemy += towerChange.enemy * 500;
            events.push({ type: 'tower', icon: '🏚️', desc: `我方${towerChange.enemy}座防御塔被推`, side: 'enemy' });
        }

        if (phase.id === 'final') {
            this._resolveFinalPhase(myCard, enemyCard, events);
        }

        this._checkGameEnd();

        const nodeResult = {
            phaseIndex: this.phaseIndex,
            phase,
            myCard,
            myLane,
            enemyCard,
            enemyLane,
            counterResult,
            events,
            momentum: this.momentum,
            gold: { ...this.gold },
            kills: { ...this.kills },
            towers: { ...this.towers },
            buffs: { ...this.buffs },
            gameOver: this.gameOver,
            winner: this.winner,
        };

        this.nodeHistory.push(nodeResult);
        this.phaseIndex++;

        if (!this.gameOver && this.phaseIndex >= STRATEGY_PHASES.length) {
            this.gameOver = true;
            this.winner = this.momentum >= 50 ? 'my' : 'enemy';
        }

        return nodeResult;
    }

    /**
     * 决胜期特殊结算
     */
    _resolveFinalPhase(myCard, enemyCard, events) {
        if (myCard.effect.triggerTeamfight) {
            const myPower = this.my.starters.reduce((s, p) => s + (p.rating || 70), 0);
            const enPower = this.enemy.starters.reduce((s, p) => s + (p.rating || 70), 0);
            const momentumBonus = (this.momentum - 50) * 0.3;
            const roll = Math.random() * 20 - 10;
            if (myPower + momentumBonus + roll > enPower - momentumBonus + Math.random() * 20 - 10) {
                this.momentum = this._clamp(this.momentum + 10);
                this.kills.my += 3;
                events.push({ type: 'teamfight', icon: '🎉', desc: '团战大胜！击杀3人并推进', side: 'my' });
            } else {
                this.momentum = this._clamp(this.momentum - 8);
                this.kills.enemy += 3;
                events.push({ type: 'teamfight', icon: '💀', desc: '团战失利！对方击杀3人', side: 'enemy' });
            }
        }
        if (myCard.effect.desperateWinRate) {
            if (Math.random() < myCard.effect.desperateWinRate) {
                this.momentum = 80;
                this.kills.my += 5;
                events.push({ type: 'desperate_win', icon: '🔥', desc: '绝地反击成功！团灭对方！', side: 'my' });
            } else {
                this.momentum = 15;
                this.kills.enemy += 4;
                events.push({ type: 'desperate_fail', icon: '💀', desc: '绝地反击失败...全军覆没', side: 'enemy' });
            }
        }
        if (myCard.effect.backdoorWinRate) {
            if (Math.random() < myCard.effect.backdoorWinRate) {
                this.momentum = 90;
                events.push({ type: 'backdoor_win', icon: '💎', desc: '偷家成功！直接获胜！', side: 'my' });
            } else {
                this.momentum = this._clamp(this.momentum - 5);
                this.kills.enemy += 1;
                events.push({ type: 'backdoor_fail', icon: '💀', desc: '偷家失败，被对方发现并击杀', side: 'enemy' });
            }
        }
    }

    /**
     * AI选卡逻辑
     */
    _aiChooseCard(phase) {
        let cards;
        if (phase.dynamic && phase.cardSets) {
            const enemyMomentum = 100 - this.momentum;
            if (enemyMomentum >= 60) cards = phase.cardSets.ahead.cards;
            else if (enemyMomentum > 40) cards = phase.cardSets.even.cards;
            else cards = phase.cardSets.behind.cards;
        } else {
            cards = phase.cards.filter(c => {
                if (!c.unlockCondition) return true;
                const { role, minRating } = c.unlockCondition;
                const player = this.enemy.starters.find(p => p.role === role);
                return player && (player.rating || 0) >= minRating;
            });
        }

        if (!cards || cards.length === 0) cards = phase.cards || [];

        const weights = AI_STYLE_WEIGHTS[this.enemyStyle] || AI_STYLE_WEIGHTS.balanced;
        const scored = cards.map(card => {
            let score = 1.0;
            score *= (weights[card.type] || 1.0);

            const aiMomentum = 100 - this.momentum;
            if (aiMomentum > 60 && (card.type === 'aggression' || card.type === 'objective')) score *= 1.3;
            if (aiMomentum < 40 && (card.type === 'defense' || card.type === 'economy')) score *= 1.3;

            score *= (0.8 + Math.random() * 0.4);
            return { card, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const chosen = scored[0].card;

        let lane = null;
        if (phase.requireLaneChoice) {
            const lanes = ['top', 'mid', 'bot'];
            lane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        return { card: chosen, lane };
    }

    /**
     * 计算选手属性加成
     */
    _calcPlayerBonus(phase, side, targetLane) {
        const starters = side === 'my' ? this.my.starters : this.enemy.starters;
        if (!starters || !starters.length) return 0;

        const weights = phase.statWeights || {};
        let totalBonus = 0;

        for (const [statName, roleWeights] of Object.entries(weights)) {
            for (const [roleKey, weight] of Object.entries(roleWeights)) {
                let players;
                if (roleKey === '_all') {
                    players = starters;
                } else if (roleKey === '_target') {
                    const laneRoleMap = { top: '对抗路', mid: '中路', bot: '发育路' };
                    const role = laneRoleMap[targetLane];
                    players = role ? starters.filter(p => p.role === role) : [];
                } else {
                    players = starters.filter(p => p.role === roleKey);
                }

                if (players.length === 0) continue;

                const avgStat = players.reduce((sum, p) => {
                    const stats = p.stats || {};
                    return sum + (stats[statName] || p.rating || 70);
                }, 0) / players.length;

                totalBonus += (avgStat - 75) * weight * 0.003;
            }
        }

        return totalBonus;
    }

    /**
     * 根据势能变化计算推塔
     */
    _calcTowerChange(myGain, enemyGain, counterResult) {
        const result = { my: 0, enemy: 0 };
        if (counterResult === 'win' && myGain >= 6) {
            result.my = 1;
        }
        if (counterResult === 'lose' && enemyGain >= 6) {
            result.enemy = 1;
        }
        if (this.momentum >= 70 && myGain > 0) {
            result.my += Math.random() < 0.3 ? 1 : 0;
        }
        if (this.momentum <= 30 && enemyGain > 0) {
            result.enemy += Math.random() < 0.3 ? 1 : 0;
        }
        return result;
    }

    _checkGameEnd() {
        if (this.momentum >= WIN_THRESHOLD) {
            this.gameOver = true;
            this.winner = 'my';
        } else if (this.momentum <= LOSE_THRESHOLD) {
            this.gameOver = true;
            this.winner = 'enemy';
        }
    }

    _clamp(v) {
        return Math.max(MOMENTUM_MIN, Math.min(MOMENTUM_MAX, v));
    }

    /**
     * 获取比赛结果摘要
     */
    getMatchSummary() {
        const won = this.winner === 'my';
        return {
            won,
            momentum: this.momentum,
            kills: { ...this.kills },
            towers: { ...this.towers },
            gold: { ...this.gold },
            nodeHistory: this.nodeHistory,
            mvp: won ? this._pickMVP() : null,
        };
    }

    _pickMVP() {
        if (!this.my.starters || !this.my.starters.length) return null;
        return this.my.starters.reduce((best, p) =>
            (p.rating || 0) > (best.rating || 0) ? p : best,
            this.my.starters[0]
        );
    }

    /* ═══════════ 统一 AI 教练系统 ═══════════ */

    /**
     * 综合评分：基于势能/选手/敌方风格/克制关系为每张卡打分
     * 返回 { card, score, reasons[] } 按 score 降序
     */
    _scoreCards(cards) {
        if (!cards?.length) return [];
        const phase = this.currentPhase;
        const m = this.momentum;
        const stateLabel = m >= 60 ? '顺风' : m <= 40 ? '逆风' : '均势';
        const enemyWeights = AI_STYLE_WEIGHTS[this.enemyStyle] || AI_STYLE_WEIGHTS.balanced;

        const myByRole = {}, enemyByRole = {};
        for (const p of this.my.starters) myByRole[p.role] = p;
        for (const p of this.enemy.starters) enemyByRole[p.role] = p;
        const myAvgRating = this.my.starters.reduce((s, p) => s + (p.rating || 70), 0) / (this.my.starters.length || 1);
        const enemyAvgRating = this.enemy.starters.reduce((s, p) => s + (p.rating || 70), 0) / (this.enemy.starters.length || 1);

        const STYLE_LABELS = {
            aggressive: '进攻型', operational: '运营型', teamfight: '团战型',
            defensive: '防守型', balanced: '均衡型',
        };
        const styleLabel = STYLE_LABELS[this.enemyStyle] || '均衡型';

        // 预测敌方最可能选的卡类型（取权重最高的两种）
        const enemyTopTypes = Object.entries(enemyWeights)
            .sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);

        return cards.map(card => {
            let score = 0;
            const reasons = [];

            // 1. 基础势能收益
            score += (card.effect.momentum || 0) * 1.5;

            // 2. 局势适配
            if (m >= 60) {
                if (card.type === 'aggression') { score += 5; reasons.push('顺风局扩大优势'); }
                if (card.type === 'objective') { score += 4; reasons.push('有优势争夺资源更安全'); }
                if (card.type === 'economy') score -= 2;
            } else if (m <= 40) {
                if (card.type === 'defense') { score += 5; reasons.push('逆风局需要稳住阵脚'); }
                if (card.type === 'economy') { score += 3; reasons.push('逆风发育等待翻盘时机'); }
                if (card.type === 'aggression') score -= 2;
            } else {
                if (card.type === 'tactic') { score += 3; reasons.push('均势下战术选择灵活'); }
                if (card.type === 'economy') { score += 2; reasons.push('均势中发育积累优势'); }
            }

            // 3. 克制敌方风格 — 预测对手选什么，我选克制它的
            if (card.counters) {
                const countersCard = cards.find(c => c.id === card.counters) || {};
                const countersType = countersCard.type;
                if (countersType && enemyTopTypes.includes(countersType)) {
                    score += 6;
                    reasons.push(`克制对手${styleLabel}风格倾向的「${countersCard.name || countersType}」`);
                }
            }
            // 被克制风险
            if (card.counteredBy) {
                const byCard = cards.find(c => c.id === card.counteredBy) || {};
                const byType = byCard.type;
                if (byType && enemyTopTypes.includes(byType)) {
                    score -= 4;
                    reasons.push(`风险: 可能被对手的${styleLabel}打法克制`);
                }
            }

            // 4. 我方选手优势
            const jg = myByRole['打野'], enemyJg = enemyByRole['打野'];
            const mid = myByRole['中路'], adc = myByRole['发育路'];
            const sup = myByRole['游走'], top = myByRole['对抗路'];

            if (phase?.id === 'opening') {
                if (card.type === 'aggression' && jg && sup) {
                    const duo = ((jg.rating || 70) + (sup.rating || 70)) / 2;
                    if (duo >= 82) { score += 4; reasons.push(`打野${jg.id}(${jg.rating})与游走${sup.id}(${sup.rating})配合强势，入侵胜算高`); }
                }
                if (card.type === 'defense' && this.enemyStyle === 'aggressive') {
                    score += 3;
                    reasons.push(`对手风格${styleLabel}，开局大概率入侵，埋伏可反制`);
                }
            }
            if (phase?.id === 'laning') {
                if (card.id === 'gank_direct' || card.id === 'gank_lure') {
                    if (jg && (jg.rating || 70) >= 85) {
                        score += 4;
                        reasons.push(`打野${jg.id}(${jg.rating})实力出众，Gank成功率高`);
                    }
                    // 找敌方最弱路
                    const lanes = [['对抗路', top, enemyByRole['对抗路']], ['中路', mid, enemyByRole['中路']], ['发育路', adc, enemyByRole['发育路']]];
                    const weakest = lanes.filter(([, , e]) => e).sort((a, b) => (a[2].rating || 70) - (b[2].rating || 70))[0];
                    if (weakest && weakest[2] && (weakest[2].rating || 70) <= 78) {
                        score += 2;
                        reasons.push(`敌方${weakest[0]}${weakest[2].id}(${weakest[2].rating})较弱，可针对`);
                    }
                }
                if (card.id === 'gank_farm' && adc && (adc.rating || 70) >= 85) {
                    score += 3;
                    reasons.push(`发育路${adc.id}(${adc.rating})后期能力强，发育有价值`);
                }
            }
            if (phase?.id === 'drake' || phase?.id === 'baron') {
                if (card.type === 'objective' && myAvgRating > enemyAvgRating) {
                    score += 3;
                    reasons.push(`我方整体实力(${Math.round(myAvgRating)})高于对手(${Math.round(enemyAvgRating)})，团战争龙有利`);
                }
                if (card.type === 'defense' && myAvgRating < enemyAvgRating) {
                    score += 3;
                    reasons.push(`对手实力(${Math.round(enemyAvgRating)})较强，伏击比正面争夺更优`);
                }
            }

            // 5. buff 加成
            if (this.buffs.baron && (card.type === 'aggression' || card.type === 'objective')) {
                score += 2;
                reasons.push('暴君buff加持，进攻/争夺更有优势');
            }
            if (this.buffs.lord && card.type === 'aggression') {
                score += 2;
                reasons.push('主宰buff带兵线优势，进攻时机好');
            }

            // 6. 无克制卡小惩罚
            if (card.noCounter) score -= 1;

            return { card, score: Math.round(score * 10) / 10, reasons: reasons.filter(r => !r.startsWith('风险:')) ,
                     warnings: reasons.filter(r => r.startsWith('风险:')).map(r => r.replace('风险: ', '')) };
        }).sort((a, b) => b.score - a.score);
    }

    /**
     * 统一教练建议 — 结构化输出
     */
    getCoachAdvice() {
        const phase = this.currentPhase;
        if (!phase) return { situation: '', recommended: null, alternatives: [], warnings: [], playerInsight: '' };

        const cards = this.getPlayerCards();
        const m = this.momentum;
        const stateLabel = m >= 60 ? '顺风' : m <= 40 ? '逆风' : '均势';
        const scored = this._scoreCards(cards);

        // 局势描述
        const situationParts = [`当前局势：${stateLabel}（势能${Math.round(m)}）`];
        if (this.buffs.baron) situationParts.push('暴君buff生效中');
        if (this.buffs.lord) situationParts.push('主宰buff生效中');
        if (this.kills.my || this.kills.enemy) situationParts.push(`击杀 ${this.kills.my}:${this.kills.enemy}`);

        // 最佳推荐
        const best = scored[0] || null;
        const recommended = best ? {
            card: best.card,
            score: best.score,
            reasons: best.reasons,
            warnings: best.warnings,
        } : null;

        // 备选（第 2、3 名）
        const alternatives = scored.slice(1, 3).map(s => ({
            card: s.card,
            score: s.score,
            reasons: s.reasons.slice(0, 1),
        }));

        // 全局警告
        const warnings = [];
        if (best?.warnings?.length) warnings.push(...best.warnings);
        if (m <= 30) warnings.push('势能极低，谨慎选择高风险策略');

        // 选手洞察
        const insights = [];
        const STYLE_LABELS = { aggressive: '进攻型', operational: '运营型', teamfight: '团战型', defensive: '防守型', balanced: '均衡型' };
        insights.push(`对手${this.enemy.team.shortName || ''}风格: ${STYLE_LABELS[this.enemyStyle] || '均衡型'}`);
        const jg = this.my.starters.find(p => p.role === '打野');
        const mid = this.my.starters.find(p => p.role === '中路');
        if (jg && (jg.rating || 70) >= 83) insights.push(`打野${jg.id}(${jg.rating})是核心战力`);
        if (mid && (mid.rating || 70) >= 83) insights.push(`中路${mid.id}(${mid.rating})操作精湛`);

        return {
            situation: situationParts.join(' | '),
            recommended,
            alternatives,
            warnings,
            playerInsight: insights.join('；'),
        };
    }

    /** 兼容旧调用：返回推荐卡 */
    _recommendCard(cards) {
        const scored = this._scoreCards(cards);
        return scored[0]?.card || null;
    }

    /**
     * LLM 教练建议（异步），注入选手数据和规则引擎结论
     */
    async getCoachAdviceAsync() {
        const ruleAdvice = this.getCoachAdvice();
        const config = getCoachConfig();
        if (config.apiKey && config.apiUrl && config.enableBattle !== false) {
            try {
                const llmText = await this._llmAdvice(config, ruleAdvice);
                if (llmText) return { type: 'llm', content: llmText, ruleAdvice };
            } catch (e) {
                console.warn('[MatchEngine] LLM coach fallback:', e);
            }
        }
        return { type: 'rule', content: ruleAdvice, ruleAdvice };
    }

    async _llmAdvice(config, ruleAdvice) {
        const phase = this.currentPhase;
        const cards = this.getPlayerCards();

        const myRoster = this.my.starters.map(p => `${p.id}(${p.role},${p.rating || '?'}分)`).join('、');
        const enemyRoster = this.enemy.starters.map(p => `${p.id}(${p.role},${p.rating || '?'}分)`).join('、');

        const ruleRec = ruleAdvice?.recommended?.card;
        const ruleReasons = ruleAdvice?.recommended?.reasons?.join('；') || '';
        const ruleAlts = (ruleAdvice?.alternatives || []).map(a => `「${a.card.name}」`).join('、');

        const stateDesc = [
            `当前节点：${phase.name}（${phase.time}）— ${phase.desc}`,
            `势能：${Math.round(this.momentum)}/100（${this.momentum >= 60 ? '顺风' : this.momentum <= 40 ? '逆风' : '均势'}）`,
            `击杀 ${this.kills.my}:${this.kills.enemy} | 推塔 ${this.towers.my}:${this.towers.enemy} | 经济 ${this.gold.my}:${this.gold.enemy}`,
            this.buffs.baron ? '我方持有暴君buff' : '',
            this.buffs.lord ? '我方持有主宰buff' : '',
            `我方首发: ${myRoster}`,
            `敌方首发: ${enemyRoster}`,
            `对手风格：${this.enemyStyle}`,
            `可选策略：${cards.map(c => `「${c.name}」(${c.type}: ${c.desc})`).join('、')}`,
            ruleRec ? `规则引擎推荐「${ruleRec.name}」，理由: ${ruleReasons}` : '',
            ruleAlts ? `备选: ${ruleAlts}` : '',
        ].filter(Boolean).join('\n');

        const resp = await fetch(config.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
            body: JSON.stringify({
                model: config.model || 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是王者荣耀KPL赛事AI教练。比赛使用5节点事件轴（开局/发育/小龙/大龙/决胜），每节点选择一个策略卡，卡牌之间有三角克制关系。规则引擎已经基于选手数据和对手风格给出了推荐，你需要对其进行补充分析。你的建议应与规则引擎推荐保持一致，仅在有充分理由时才提出不同意见并说明原因。结合双方选手特点分析，3-5句话，不用markdown。' },
                    { role: 'user', content: stateDesc },
                ],
                max_tokens: 300,
                temperature: 0.6,
            }),
        });
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || null;
    }
}

function _laneLabel(lane) {
    return { top: '上路', mid: '中路', bot: '下路' }[lane] || lane;
}
