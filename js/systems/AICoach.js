/**
 * AICoach — BP阶段智能教练系统
 *
 * 优先使用 LLM API（DeepSeek等）生成专业分析；
 * 如未配置 API 则退回到本地规则引擎生成分析文本。
 */
import { HEROES, HERO_ROLES, getHero, getCounterInfo, evaluateComp } from '../data/heroes.js';

const STORAGE_KEY = 'ai_coach_config';

function loadConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}

export function saveCoachConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function getCoachConfig() {
    return loadConfig();
}

/**
 * 生成BP阶段的教练分析
 * @param {Object} ctx - BP 上下文
 * @param {string} ctx.phase - 'ban' | 'pick'
 * @param {string[]} ctx.myBans - 我方已禁
 * @param {string[]} ctx.enemyBans - 敌方已禁
 * @param {string[]} ctx.myPicks - 我方已选
 * @param {string[]} ctx.enemyPicks - 敌方已选
 * @param {string[]} ctx.myPickRoles - 我方已选位置
 * @param {string[]} ctx.enemyPickRoles - 敌方已选位置
 * @param {string} ctx.myTeamName - 我方队名
 * @param {string} ctx.enemyTeamName - 敌方队名
 * @param {Object[]} ctx.enemyStarters - 敌方首发选手
 * @param {string} ctx.stepLabel - 当前步骤描述
 * @returns {Promise<string>} 分析文本 (markdown-like)
 */
export async function getCoachAnalysis(ctx) {
    const config = loadConfig();
    if (config.apiKey && config.apiUrl) {
        try {
            return await _llmAnalysis(ctx, config);
        } catch (e) {
            console.warn('LLM analysis failed, falling back to rules:', e);
        }
    }
    return _ruleBasedAnalysis(ctx);
}

async function _llmAnalysis(ctx, config) {
    const systemPrompt = `你是王者荣耀KPL职业赛事的AI教练解说。你正在指导玩家进行Ban/Pick阶段。
请根据当前BP状态给出简短但专业的分析和建议。要求：
- 用第二人称"你"来称呼玩家
- 分析要具体到英雄名和位置
- 如果有克制关系要点出
- 语气专业但有电竞感，像真正的KPL教练
- 控制在3-5句话以内`;

    const stateDesc = _buildStateDescription(ctx);

    const resp = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model || 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: stateDesc },
            ],
            max_tokens: 300,
            temperature: 0.7,
        }),
    });

    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || _ruleBasedAnalysis(ctx);
}

function _buildStateDescription(ctx) {
    const lines = [`当前阶段：${ctx.phase === 'ban' ? '禁用' : '选人'}阶段`];
    lines.push(`步骤：${ctx.stepLabel}`);
    lines.push(`我方：${ctx.myTeamName}，对手：${ctx.enemyTeamName}`);
    if (ctx.myBans.length) lines.push(`我方已禁：${ctx.myBans.join('、')}`);
    if (ctx.enemyBans.length) lines.push(`敌方已禁：${ctx.enemyBans.join('、')}`);
    if (ctx.myPicks.length) lines.push(`我方已选：${ctx.myPicks.map((h, i) => `${h}(${ctx.myPickRoles[i] || '?'})`).join('、')}`);
    if (ctx.enemyPicks.length) lines.push(`敌方已选：${ctx.enemyPicks.map((h, i) => `${h}(${ctx.enemyPickRoles[i] || '?'})`).join('、')}`);
    lines.push('请给出当前局面分析和操作建议。');
    return lines.join('\n');
}

/**
 * 规则引擎：根据BP状态生成详细分析
 */
function _ruleBasedAnalysis(ctx) {
    const parts = [];
    const { phase, myBans, enemyBans, myPicks, enemyPicks, myPickRoles, enemyPickRoles, enemyStarters } = ctx;

    if (phase === 'ban') {
        parts.push(_banPhaseAnalysis(myBans, enemyBans, enemyPicks, enemyStarters));
    } else {
        parts.push(_pickPhaseAnalysis(myPicks, enemyPicks, myPickRoles, enemyPickRoles, myBans, enemyBans));
    }

    return parts.join('\n');
}

function _banPhaseAnalysis(myBans, enemyBans, enemyPicks, enemyStarters) {
    const lines = [];
    const totalBans = myBans.length + enemyBans.length;

    if (totalBans === 0) {
        lines.push('📋 **第一轮禁用开始**');
        lines.push('首轮禁用是BP的基石。建议优先禁掉当前版本的T0级英雄，或者针对对方核心选手的绝活英雄。');
        if (enemyStarters?.length) {
            const topPlayer = enemyStarters.reduce((a, b) => (a.rating > b.rating ? a : b), enemyStarters[0]);
            lines.push(`⚠️ 对方阵中 **${topPlayer.id}** 评分最高(${topPlayer.rating})，需要重点关注其英雄池。`);
        }
    } else if (totalBans <= 4) {
        lines.push('📋 **第一轮禁用进行中**');
        if (myBans.length > 0) {
            lines.push(`✅ 我方已禁 ${myBans.join('、')}，${_analyzeBanImpact(myBans)}`);
        }
        if (enemyBans.length > 0) {
            lines.push(`🔴 对方禁掉了 ${enemyBans.join('、')}，${_analyzeBanIntent(enemyBans)}`);
        }
    } else {
        lines.push('📋 **第二轮禁用**');
        lines.push('第二轮禁用需要根据双方已选阵容来针对。');
        if (enemyPicks.length > 0) {
            const counterSuggestions = _findCounterBans(enemyPicks);
            if (counterSuggestions.length) {
                lines.push(`💡 对方已选 ${enemyPicks.join('、')}，${counterSuggestions}`);
            }
        }
    }

    return lines.join('\n');
}

function _pickPhaseAnalysis(myPicks, enemyPicks, myRoles, enemyRoles, myBans, enemyBans) {
    const lines = [];
    const totalPicks = myPicks.length + enemyPicks.length;

    if (totalPicks === 0) {
        lines.push('🎯 **选人阶段开始**');
        lines.push('作为蓝方首选，可以优先抢下当前版本的强势英雄，或者选一个百搭的核心位。前期选人不宜过早暴露战术意图。');
    } else {
        lines.push('🎯 **阵容分析**');
        if (myPicks.length > 0) {
            const myComp = evaluateComp(myPicks);
            lines.push(`我方阵容：${myPicks.map((h, i) => `${h}(${myRoles[i] || '?'})`).join(' / ')}`);
            lines.push(`阵容评价：${myComp.desc}，配合度 ${myComp.synergy}/100`);
            const missingRoles = _getMissingRoles(myRoles);
            if (missingRoles.length) {
                lines.push(`⚡ 还需选择：${missingRoles.join('、')}`);
            }
        }
        if (enemyPicks.length > 0) {
            const enemyComp = evaluateComp(enemyPicks);
            lines.push(`对方阵容：${enemyPicks.map((h, i) => `${h}(${enemyRoles[i] || '?'})`).join(' / ')}`);
            lines.push(`对方风格：${enemyComp.desc}`);

            const threats = _analyzeThreats(enemyPicks);
            if (threats) lines.push(`⚠️ ${threats}`);
        }
        if (myPicks.length > 0 && enemyPicks.length > 0) {
            const matchup = _analyzeMatchup(myPicks, enemyPicks);
            if (matchup) lines.push(`📊 ${matchup}`);
        }
    }

    return lines.join('\n');
}

function _analyzeBanImpact(bans) {
    const roles = bans.map(b => { const h = getHero(b); return h ? HERO_ROLES[h.role]?.name : ''; }).filter(Boolean);
    const unique = [...new Set(roles)];
    if (unique.length === 1) return `集中禁了对方${unique[0]}英雄池。`;
    return `涉及${unique.join('、')}多个位置。`;
}

function _analyzeBanIntent(bans) {
    const roles = bans.map(b => { const h = getHero(b); return h ? HERO_ROLES[h.role]?.name : ''; }).filter(Boolean);
    const unique = [...new Set(roles)];
    if (unique.length === 1) return `看起来对方在针对我们的${unique[0]}位。注意调整战术。`;
    return `注意对方的禁人思路，可能有针对性战术。`;
}

function _findCounterBans(enemyPicks) {
    const suggestions = [];
    for (const pick of enemyPicks) {
        const ci = getCounterInfo(pick);
        if (ci.counteredBy.length > 0) {
            suggestions.push(`可以考虑禁掉能配合${pick}的英雄`);
            break;
        }
    }
    return suggestions.join('；');
}

function _getMissingRoles(selectedRoles) {
    const all = ['对抗路', '打野', '中路', '发育路', '游走'];
    return all.filter(r => !selectedRoles.includes(r));
}

function _analyzeThreats(enemyPicks) {
    const threats = [];
    const roles = enemyPicks.map(p => { const h = getHero(p); return h?.role; }).filter(Boolean);
    const assassinCount = roles.filter(r => r === 'assassin').length;
    const tankCount = roles.filter(r => r === 'tank').length;
    if (assassinCount >= 2) threats.push('对方选了多刺客体系，注意选择坦度较高的英雄来抗压');
    if (tankCount >= 2) threats.push('对方前排厚度较高，可以考虑选择持续输出型英雄');
    return threats.join('；');
}

function _analyzeMatchup(myPicks, enemyPicks) {
    let myCounter = 0, enemyCounter = 0;
    for (const mp of myPicks) {
        const ci = getCounterInfo(mp);
        for (const ep of enemyPicks) {
            if (ci.counters.includes(ep)) myCounter++;
            if (ci.counteredBy.includes(ep)) enemyCounter++;
        }
    }
    if (myCounter > enemyCounter) return `当前阵容克制关系对我方有利(${myCounter}:${enemyCounter})，保持优势！`;
    if (enemyCounter > myCounter) return `对方阵容在克制上有优势(${enemyCounter}:${myCounter})，后续选人需要注意补充反制手段。`;
    return `双方克制关系均衡，胜负取决于后续选人和操作。`;
}
