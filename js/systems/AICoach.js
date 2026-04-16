/**
 * AICoach — BP阶段智能教练系统
 *
 * 提供具体英雄推荐、组合建议、阵容胜率评估。
 * 优先使用 LLM API；无 API 时使用本地规则引擎。
 */
import { HEROES, HERO_ROLES, getHero, getCounterInfo, getHeroesForPosition, KPL_META_HEROES, evaluateComp } from '../data/heroes.js';

const STORAGE_KEY = 'ai_coach_config';

function loadConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}
export function saveCoachConfig(cfg) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }
export function getCoachConfig() { return loadConfig(); }

// ==================== 英雄组合知识库 ====================
const HERO_COMBOS = [
    { heroes: ['老夫子', '大乔'], desc: '老夫子绑人+大乔传送支援，全图一打二', tags: ['对抗路', '游走'] },
    { heroes: ['张飞', '后羿'], desc: '张飞护盾+后羿输出，经典保射组合', tags: ['游走', '发育路'] },
    { heroes: ['东皇太一', '张良'], desc: '双控链锁，抓单能力极强', tags: ['游走', '中路'] },
    { heroes: ['瑶', '公孙离'], desc: '瑶附体+公孙离灵活走位，存活能力极强', tags: ['游走', '发育路'] },
    { heroes: ['牛魔', '孙尚香'], desc: '牛魔开团+孙尚香跟进AOE，团战收割', tags: ['游走', '发育路'] },
    { heroes: ['太乙真人', '马可波罗'], desc: '太乙复活+马可持续输出，后期无解', tags: ['游走', '发育路'] },
    { heroes: ['鬼谷子', '镜'], desc: '鬼谷子隐身突进+镜收割，突袭体系', tags: ['游走', '打野'] },
    { heroes: ['关羽', '张飞'], desc: '双蜀汉前排，冲锋阵容坦度高', tags: ['对抗路', '游走'] },
    { heroes: ['花木兰', '裴擒虎'], desc: '双战士突进，中期节奏极快', tags: ['对抗路', '打野'] },
    { heroes: ['苏烈', '嬴政'], desc: '苏烈推墙+嬴政穿透输出，体系完整', tags: ['游走', '中路'] },
    { heroes: ['孙膑', '马可波罗'], desc: '孙膑加速减速+马可追击，拉扯能力强', tags: ['游走', '发育路'] },
    { heroes: ['夏洛特', '澜'], desc: '双战刺体系，前中期压制力极强', tags: ['对抗路', '打野'] },
    { heroes: ['白起', '貂蝉'], desc: '白起聚人+貂蝉团战AOE，团战体系核心', tags: ['对抗路', '中路'] },
    { heroes: ['项羽', '上官婉儿'], desc: '项羽开团+婉儿跟进收割', tags: ['对抗路', '中路'] },
    { heroes: ['刘邦', '曜'], desc: '刘邦传送支援+曜单带牵制，分推体系', tags: ['对抗路', '打野'] },
];

// 位置对应的强势英雄推荐，按优先级排序（前面的更强）
const POSITION_TIER = {
    '对抗路': [
        { name: '关羽', tier: 'T0', desc: '版本霸主，一技能增强后对线和团战都顶级' },
        { name: '夏洛特', tier: 'T0', desc: '免伤机制逆天，操作上限极高' },
        { name: '马超', tier: 'T1', desc: '灵活拉扯，后期威胁极大' },
        { name: '花木兰', tier: 'T1', desc: '沉默机制克制大部分近战' },
        { name: '老夫子', tier: 'T1', desc: '单带能力强，搭配大乔效果翻倍' },
        { name: '吕布', tier: 'T1', desc: '真伤坦克杀手，团战搅屎棍' },
        { name: '铠', tier: 'T2', desc: '大招形态团战输出爆炸' },
        { name: '曜', tier: 'T1', desc: '灵活切入，技能衔接流畅' },
    ],
    '打野': [
        { name: '镜', tier: 'T0', desc: '操作上限极高，收割能力第一' },
        { name: '裴擒虎', tier: 'T0', desc: '前期入侵+中期切C一条龙' },
        { name: '澜', tier: 'T1', desc: '团战突进能力强，进场出场自如' },
        { name: '赵云', tier: 'T1', desc: '万金油打野，对新手友好' },
        { name: '李白', tier: 'T1', desc: '无法选中机制+AOE输出' },
        { name: '云中君', tier: 'T1', desc: '飞行切入，gank效率高' },
        { name: '韩信', tier: 'T2', desc: '节奏快，前期滚雪球' },
    ],
    '中路': [
        { name: '貂蝉', tier: 'T0', desc: '真伤持续输出，团战核心' },
        { name: '诸葛亮', tier: 'T0', desc: '多段位移+高爆发，收割之王' },
        { name: '上官婉儿', tier: 'T1', desc: '飞天入场，团战斩杀线极高' },
        { name: '嬴政', tier: 'T1', desc: '穿墙消耗+推线效率高' },
        { name: '干将莫邪', tier: 'T1', desc: '远程高爆发，视野控制强' },
        { name: '不知火舞', tier: 'T1', desc: '灵活刺客型法师，gank能力强' },
        { name: '西施', tier: 'T2', desc: '控制链长，辅助型中单' },
    ],
    '发育路': [
        { name: '公孙离', tier: 'T0', desc: '灵活位移+爆发，存活率高' },
        { name: '马可波罗', tier: 'T0', desc: '真伤+灵活走位，后期无解' },
        { name: '孙尚香', tier: 'T1', desc: '大招AOE+位移，团战输出稳定' },
        { name: '后羿', tier: 'T1', desc: '攻速+减速，DPS天花板' },
        { name: '伽罗', tier: 'T1', desc: '减速+真伤，防守体系核心' },
        { name: '百里守约', tier: 'T2', desc: '超远程消耗+视野优势' },
    ],
    '游走': [
        { name: '鬼谷子', tier: 'T0', desc: '隐身开团，进攻体系核心' },
        { name: '张飞', tier: 'T0', desc: '大招护盾+控制，万金油辅助' },
        { name: '太乙真人', tier: 'T1', desc: '复活+真伤，保射体系首选' },
        { name: '牛魔', tier: 'T1', desc: '大招开团+推人，控制链长' },
        { name: '大乔', tier: 'T1', desc: '全图支援，分推体系核心' },
        { name: '东皇太一', tier: 'T1', desc: '大招绑人，抓单无解' },
        { name: '瑶', tier: 'T2', desc: '附体保人，纯保护型辅助' },
    ],
};

// ==================== 胜率评估系统 ====================
export function estimateWinRate(myPicks, enemyPicks, myRoles, enemyRoles) {
    if (!myPicks.length && !enemyPicks.length) return { my: 50, enemy: 50 };

    let myScore = 50;

    // 1. 阵容完整度
    const myComp = evaluateComp(myPicks);
    const enemyComp = evaluateComp(enemyPicks);
    myScore += (myComp.synergy - enemyComp.synergy) * 1.5;

    // 2. 克制关系
    let counterDiff = 0;
    for (const mp of myPicks) {
        const ci = getCounterInfo(mp);
        for (const ep of enemyPicks) {
            if (ci.counters.includes(ep)) counterDiff += 3;
            if (ci.counteredBy.includes(ep)) counterDiff -= 3;
        }
    }
    myScore += counterDiff;

    // 3. T级权重
    for (const h of myPicks) {
        for (const pos of Object.values(POSITION_TIER)) {
            const t = pos.find(p => p.name === h);
            if (t) { myScore += t.tier === 'T0' ? 2 : t.tier === 'T1' ? 1 : 0; break; }
        }
    }
    for (const h of enemyPicks) {
        for (const pos of Object.values(POSITION_TIER)) {
            const t = pos.find(p => p.name === h);
            if (t) { myScore -= t.tier === 'T0' ? 2 : t.tier === 'T1' ? 1 : 0; break; }
        }
    }

    // 4. 组合加成
    for (const combo of HERO_COMBOS) {
        if (combo.heroes.every(h => myPicks.includes(h))) myScore += 4;
        if (combo.heroes.every(h => enemyPicks.includes(h))) myScore -= 4;
    }

    myScore = Math.max(15, Math.min(85, myScore));
    return { my: Math.round(myScore), enemy: Math.round(100 - myScore) };
}

// ==================== 教练分析入口 ====================
export async function getCoachAnalysis(ctx) {
    const config = loadConfig();
    if (config.apiKey && config.apiUrl) {
        try { return await _llmAnalysis(ctx, config); }
        catch (e) { console.warn('LLM fallback:', e); }
    }
    return _ruleBasedAnalysis(ctx);
}

// ==================== LLM 分析 ====================
async function _llmAnalysis(ctx, config) {
    const heroData = _buildHeroKnowledge(ctx);
    const systemPrompt = `你是王者荣耀KPL职业赛事的顶级AI教练。你正在实时指导玩家进行Ban/Pick。
你的风格：专业、果断、有具体操作建议，像真正的KPL教练在耳麦里指挥。

核心要求：
1. 必须推荐具体英雄名，并说明为什么选这个英雄
2. 如果能构成组合（如老夫子+大乔、张飞+后羿），要指出组合优势
3. 分析对方阵容弱点，告诉玩家如何针对
4. 给出优先推荐1-2个英雄，备选1-2个英雄
5. 用口语化的指挥风格，像"我建议先拿XX，理由是..."
6. 控制在4-6句话

以下是当前版本英雄数据供参考：
${heroData}`;

    const stateDesc = _buildStateDescription(ctx);
    const resp = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify({
            model: config.model || 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: stateDesc },
            ],
            max_tokens: 500,
            temperature: 0.7,
        }),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || _ruleBasedAnalysis(ctx);
}

function _buildHeroKnowledge(ctx) {
    const unavailable = new Set([...ctx.myBans, ...ctx.enemyBans, ...ctx.myPicks, ...ctx.enemyPicks]);
    const lines = [];
    for (const [pos, heroes] of Object.entries(POSITION_TIER)) {
        const available = heroes.filter(h => !unavailable.has(h.name));
        if (available.length) {
            lines.push(`${pos}强势: ${available.slice(0, 4).map(h => `${h.name}(${h.tier},${h.desc})`).join('、')}`);
        }
    }
    const combos = HERO_COMBOS.filter(c => c.heroes.some(h => !unavailable.has(h)));
    if (combos.length) {
        lines.push(`可用组合: ${combos.slice(0, 5).map(c => `${c.heroes.join('+')}(${c.desc})`).join('；')}`);
    }
    return lines.join('\n');
}

function _buildStateDescription(ctx) {
    const lines = [`当前：${ctx.phase === 'ban' ? '禁用' : '选人'}阶段 - ${ctx.stepLabel}`];
    lines.push(`我方${ctx.myTeamName} vs ${ctx.enemyTeamName}`);
    if (ctx.myBans.length) lines.push(`我方已禁：${ctx.myBans.join('、')}`);
    if (ctx.enemyBans.length) lines.push(`敌方已禁：${ctx.enemyBans.join('、')}`);
    if (ctx.myPicks.length) lines.push(`我方已选：${ctx.myPicks.map((h, i) => `${h}(${ctx.myPickRoles[i] || '?'})`).join('、')}`);
    if (ctx.enemyPicks.length) lines.push(`敌方已选：${ctx.enemyPicks.map((h, i) => `${h}(${ctx.enemyPickRoles[i] || '?'})`).join('、')}`);

    const wr = estimateWinRate(ctx.myPicks, ctx.enemyPicks, ctx.myPickRoles, ctx.enemyPickRoles);
    lines.push(`当前预估胜率：我方${wr.my}% vs 对方${wr.enemy}%`);

    const missing = _getMissingRoles(ctx.myPickRoles);
    if (missing.length && ctx.phase === 'pick') lines.push(`还需要选：${missing.join('、')}`);
    lines.push('请给出具体的英雄推荐和策略建议。');
    return lines.join('\n');
}

// ==================== 规则引擎分析 ====================
function _ruleBasedAnalysis(ctx) {
    const { phase, myBans, enemyBans, myPicks, enemyPicks, myPickRoles, enemyPickRoles, enemyStarters } = ctx;
    const unavailable = new Set([...myBans, ...enemyBans, ...myPicks, ...enemyPicks]);

    if (phase === 'ban') {
        return _banAnalysis(myBans, enemyBans, enemyPicks, enemyStarters, unavailable);
    }
    return _pickAnalysis(myPicks, enemyPicks, myPickRoles, enemyPickRoles, myBans, enemyBans, unavailable);
}

function _banAnalysis(myBans, enemyBans, enemyPicks, enemyStarters, unavailable) {
    const lines = [];
    const totalBans = myBans.length + enemyBans.length;

    if (totalBans === 0) {
        lines.push('📋 **首轮禁用**');
        const t0Heroes = [];
        for (const heroes of Object.values(POSITION_TIER)) {
            heroes.filter(h => h.tier === 'T0' && !unavailable.has(h.name)).forEach(h => t0Heroes.push(h));
        }
        if (t0Heroes.length) {
            lines.push(`💡 建议优先禁掉版本T0英雄：**${t0Heroes.slice(0, 3).map(h => h.name).join('、')}**`);
        }
        if (enemyStarters?.length) {
            const top = enemyStarters.reduce((a, b) => a.rating > b.rating ? a : b, enemyStarters[0]);
            lines.push(`⚠️ 对方核心选手 **${top.id}**(${top.role}位, 评分${top.rating})是重点针对目标。`);
        }
    } else if (totalBans <= 4) {
        lines.push('📋 **第一轮禁用进行中**');
        if (myBans.length) lines.push(`✅ 已禁 ${myBans.join('、')}`);
        if (enemyBans.length) {
            lines.push(`🔴 对方禁了 ${enemyBans.join('、')}，${_analyzeBanIntent(enemyBans)}`);
        }
        const remaining = [];
        for (const heroes of Object.values(POSITION_TIER)) {
            heroes.filter(h => h.tier === 'T0' && !unavailable.has(h.name)).forEach(h => remaining.push(h));
        }
        if (remaining.length) {
            lines.push(`💡 还可以考虑禁 **${remaining[0].name}**（${remaining[0].desc}）`);
        }
    } else {
        lines.push('📋 **第二轮禁用**');
        if (enemyPicks.length > 0) {
            lines.push(`对方已选 ${enemyPicks.join('、')}，需要针对性禁人：`);
            for (const ep of enemyPicks) {
                const ci = getCounterInfo(ep);
                const needBan = ci.counters.filter(c => !unavailable.has(c));
                if (needBan.length) {
                    lines.push(`💡 禁 **${needBan[0]}** 可以削弱${ep}的配合`);
                    break;
                }
            }
        }
    }

    return lines.join('\n');
}

function _pickAnalysis(myPicks, enemyPicks, myRoles, enemyRoles, myBans, enemyBans, unavailable) {
    const lines = [];
    const missing = _getMissingRoles(myRoles);

    if (myPicks.length === 0 && enemyPicks.length === 0) {
        lines.push('🎯 **首选推荐**');
        lines.push(_getFirstPickAdvice(unavailable));
    } else {
        lines.push('🎯 **选人建议**');

        if (myPicks.length > 0) {
            const wr = estimateWinRate(myPicks, enemyPicks, myRoles, enemyRoles);
            lines.push(`📊 当前预估胜率：**我方 ${wr.my}%** vs 对方 ${wr.enemy}%`);
        }

        if (missing.length > 0) {
            const nextRole = missing[0];
            lines.push('');
            lines.push(_getPickAdviceForRole(nextRole, myPicks, enemyPicks, myRoles, unavailable));

            if (missing.length > 1) {
                lines.push('');
                lines.push(`📌 之后还需要选 ${missing.slice(1).join('、')} 位`);
            }
        }

        if (enemyPicks.length > 0) {
            const threats = _detailedThreatAnalysis(enemyPicks, myPicks);
            if (threats) {
                lines.push('');
                lines.push(threats);
            }
        }
    }

    return lines.join('\n');
}

function _getFirstPickAdvice(unavailable) {
    const lines = [];
    const roles = ['打野', '中路', '对抗路'];
    for (const role of roles) {
        const tier = POSITION_TIER[role];
        if (!tier) continue;
        const available = tier.filter(h => !unavailable.has(h.name) && h.tier === 'T0');
        if (available.length) {
            lines.push(`💡 推荐先选 **${available[0].name}**（${role}，${available[0].desc}）`);
            if (available.length > 1) {
                lines.push(`   备选：**${available[1].name}**（${available[1].desc}）`);
            }
            break;
        }
    }
    lines.push('');
    lines.push('前期不宜暴露全部战术意图，可以选择一个多位置灵活英雄，保持阵容弹性。');

    const flexHeroes = ['曜', '赵云', '貂蝉'].filter(h => !unavailable.has(h));
    if (flexHeroes.length) {
        lines.push(`🔄 灵活选择：${flexHeroes.map(h => `**${h}**`).join('、')}可以打多个位置`);
    }
    return lines.join('\n');
}

function _getPickAdviceForRole(role, myPicks, enemyPicks, myRoles, unavailable) {
    const lines = [];
    const tier = POSITION_TIER[role];
    if (!tier) {
        lines.push(`💡 为 **${role}** 位选人：选择你最擅长的英雄即可`);
        return lines.join('\n');
    }

    const available = tier.filter(h => !unavailable.has(h.name));
    if (!available.length) {
        lines.push(`💡 **${role}**位强势英雄已被禁/选，可以从英雄池中灵活选择`);
        return lines.join('\n');
    }

    // 检查是否有能构成组合的英雄
    const comboMatches = [];
    for (const combo of HERO_COMBOS) {
        const inMyTeam = combo.heroes.filter(h => myPicks.includes(h));
        const needed = combo.heroes.filter(h => !myPicks.includes(h) && !unavailable.has(h));
        if (inMyTeam.length > 0 && needed.length === 1) {
            const neededHero = getHero(needed[0]);
            if (neededHero && combo.tags.includes(role)) {
                comboMatches.push({ hero: needed[0], partner: inMyTeam[0], desc: combo.desc });
            }
        }
    }

    // 检查能克制对方英雄的
    const counterPicks = [];
    for (const h of available) {
        const ci = getCounterInfo(h.name);
        const countered = enemyPicks.filter(ep => ci.counters.includes(ep));
        if (countered.length > 0) {
            counterPicks.push({ ...h, countered });
        }
    }

    lines.push(`📌 为 **${role}** 选人：`);

    if (comboMatches.length > 0) {
        const cm = comboMatches[0];
        lines.push(`🌟 首推 **${cm.hero}**！可以和已选的${cm.partner}组成「${cm.hero}+${cm.partner}」组合 —— ${cm.desc}`);
    }

    if (counterPicks.length > 0) {
        const cp = counterPicks[0];
        lines.push(`⚔️ 推荐 **${cp.name}**（${cp.tier}）—— 能克制对方的${cp.countered.join('、')}，${cp.desc}`);
    }

    const topPick = available[0];
    if (!comboMatches.length && !counterPicks.length) {
        lines.push(`💡 推荐 **${topPick.name}**（${topPick.tier}，${topPick.desc}）`);
    }

    if (available.length > 1) {
        const alts = available.slice(comboMatches.length || counterPicks.length ? 0 : 1, 3)
            .filter(h => h.name !== comboMatches[0]?.hero && h.name !== counterPicks[0]?.name);
        if (alts.length) {
            lines.push(`   备选：${alts.map(h => `**${h.name}**(${h.desc})`).join('、')}`);
        }
    }

    return lines.join('\n');
}

function _detailedThreatAnalysis(enemyPicks, myPicks) {
    const lines = [];
    const roles = enemyPicks.map(p => { const h = getHero(p); return h?.role; }).filter(Boolean);
    const assassinCount = roles.filter(r => r === 'assassin').length;
    const tankCount = roles.filter(r => r === 'tank').length;
    const mageCount = roles.filter(r => r === 'mage').length;

    if (assassinCount >= 2) {
        lines.push('⚠️ 对方多刺客阵容，建议选择 **张飞/牛魔** 等厚实辅助保护后排');
    }
    if (tankCount >= 2) {
        lines.push('⚠️ 对方双前排，建议选择 **马可波罗/貂蝉** 等真伤英雄来融坦');
    }
    if (mageCount >= 2) {
        lines.push('⚠️ 对方双法阵容，前排需要出魔女斗篷，可以选 **张飞** 大招吸收魔法伤害');
    }

    // 检查对方已有的组合
    for (const combo of HERO_COMBOS) {
        if (combo.heroes.every(h => enemyPicks.includes(h))) {
            lines.push(`🔴 对方已构成「${combo.heroes.join('+')}」组合（${combo.desc}），注意应对！`);
        }
    }

    return lines.length ? lines.join('\n') : '';
}

function _analyzeBanIntent(bans) {
    const roles = bans.map(b => { const h = getHero(b); return h ? HERO_ROLES[h.role]?.name : ''; }).filter(Boolean);
    const unique = [...new Set(roles)];
    if (unique.length === 1) return `对方在针对${unique[0]}位，我们需要准备替代方案`;
    return `注意对方的禁人思路`;
}

function _getMissingRoles(selectedRoles) {
    return ['对抗路', '打野', '中路', '发育路', '游走'].filter(r => !selectedRoles.includes(r));
}
