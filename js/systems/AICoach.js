/**
 * AICoach — BP阶段智能教练系统
 *
 * 提供具体英雄推荐、组合建议、阵容胜率评估。
 * 优先使用 LLM API；无 API 时使用本地规则引擎。
 */
import { HEROES, HERO_ROLES, getHero, getCounterInfo, getHeroesForPosition, KPL_META_HEROES, evaluateComp, getPlayerHeroes } from '../data/heroes.js';

const STORAGE_KEY = 'ai_coach_config';

function _ensureChatUrl(url) {
    if (!url) return url;
    let u = url.replace(/\/+$/, '');
    if (!u.endsWith('/chat/completions')) u += '/chat/completions';
    return u;
}

function loadConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}
export function saveCoachConfig(cfg) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }
export function getCoachConfig() {
    const cfg = loadConfig();
    if (cfg.apiUrl) cfg.apiUrl = _ensureChatUrl(cfg.apiUrl);
    return cfg;
}

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

// ==================== 对手选手分析 ====================
function _analyzeEnemyPlayers(enemyStarters, unavailable) {
    if (!enemyStarters?.length) return { text: '', heroMap: {} };
    const lines = [];
    const heroMap = {};
    lines.push('📊 **对手选手分析**');
    for (const p of enemyStarters) {
        const heroes = getPlayerHeroes(p.id, p.role);
        heroMap[p.id] = heroes;
        const available = heroes.filter(h => !unavailable.has(h));
        const banned = heroes.filter(h => unavailable.has(h));
        if (heroes.length) {
            let line = `• **${p.id}**(${p.role}, ★${p.rating}) 擅长：${heroes.slice(0, 4).map(h => `**${h}**`).join('、')}`;
            if (banned.length) line += ` [已禁/选: ${banned.join('、')}]`;
            lines.push(line);
        }
    }
    const topPlayer = enemyStarters.reduce((a, b) => a.rating > b.rating ? a : b, enemyStarters[0]);
    lines.push(`🎯 核心威胁：**${topPlayer.id}**（${topPlayer.role}位 ★${topPlayer.rating}），优先针对其英雄池`);
    return { text: lines.join('\n'), heroMap };
}

// ==================== 结构化推荐（驱动UI标记 + 教练文字的唯一数据源） ====================
export function getStructuredRecommendations(ctx) {
    const { phase, myBans, enemyBans, myPicks, enemyPicks, myPickRoles, enemyStarters } = ctx;
    const unavailable = new Set([...myBans, ...enemyBans, ...myPicks, ...enemyPicks]);
    const recs = [];
    const has = (h) => recs.find(r => r.hero === h);

    if (phase === 'ban') {
        const totalBans = myBans.length + enemyBans.length;

        // 1) 对手核心选手的招牌英雄
        if (enemyStarters?.length) {
            const sorted = [...enemyStarters].sort((a, b) => b.rating - a.rating);
            for (const p of sorted) {
                const heroes = getPlayerHeroes(p.id, p.role);
                for (const h of heroes) {
                    if (!unavailable.has(h) && !has(h)) {
                        const isTop = p === sorted[0];
                        recs.push({ hero: h, type: 'ban', reason: isTop ? `${p.id}(★${p.rating})招牌英雄` : `${p.id}擅长` });
                    }
                }
            }
        }

        // 2) 强力组合的核心英雄（如大乔、鬼谷子等组合发动机）
        for (const combo of HERO_COMBOS) {
            for (const h of combo.heroes) {
                if (!unavailable.has(h) && !has(h)) {
                    recs.push({ hero: h, type: 'ban', reason: `${combo.heroes.join('+')}组合核心（${combo.desc}）` });
                }
            }
        }

        // 3) T0版本强势英雄
        for (const heroes of Object.values(POSITION_TIER)) {
            for (const h of heroes) {
                if (h.tier === 'T0' && !unavailable.has(h.name) && !has(h.name)) {
                    recs.push({ hero: h.name, type: 'ban', reason: `T0版本强势（${h.desc}）` });
                }
            }
        }

        // 4) 第二轮Ban：针对对方已选英雄的搭档
        if (totalBans >= 4 && enemyPicks.length > 0) {
            for (const ep of enemyPicks) {
                for (const combo of HERO_COMBOS) {
                    if (combo.heroes.includes(ep)) {
                        const partner = combo.heroes.find(h => h !== ep);
                        if (partner && !unavailable.has(partner) && !has(partner)) {
                            recs.push({ hero: partner, type: 'ban', reason: `拆散${combo.heroes.join('+')}组合` });
                        }
                    }
                }
                const ci = getCounterInfo(ep);
                const synergies = ci.counters?.filter(c => !unavailable.has(c) && !has(c)) || [];
                for (const s of synergies.slice(0, 1)) {
                    recs.push({ hero: s, type: 'ban', reason: `削弱${ep}的配合` });
                }
            }
        }
    } else {
        const missing = _getMissingRoles(myPickRoles);
        const nextRole = missing[0] || '打野';

        // 1) 组合补全
        for (const combo of HERO_COMBOS) {
            const inMyTeam = combo.heroes.filter(h => myPicks.includes(h));
            const needed = combo.heroes.filter(h => !myPicks.includes(h) && !unavailable.has(h));
            if (inMyTeam.length > 0 && needed.length === 1) {
                recs.push({ hero: needed[0], type: 'pick', reason: `与${inMyTeam[0]}组成「${combo.heroes.join('+')}」组合（${combo.desc}）` });
            }
        }

        // 2) 克制对方已选
        for (const ep of enemyPicks) {
            const allHeroes = Object.keys(HEROES);
            for (const h of allHeroes) {
                if (unavailable.has(h) || has(h)) continue;
                const ci = getCounterInfo(h);
                if (ci.counters.includes(ep)) {
                    recs.push({ hero: h, type: 'pick', reason: `克制对方${ep}` });
                    break;
                }
            }
        }

        // 3) 当前缺失位置的强势英雄
        for (const role of missing) {
            const tier = POSITION_TIER[role] || [];
            for (const h of tier) {
                if (!unavailable.has(h.name) && !has(h.name)) {
                    recs.push({ hero: h.name, type: 'pick', reason: `${role}位${h.tier}强势（${h.desc}）` });
                }
            }
        }
    }

    return recs.slice(0, 12);
}

// ==================== 教练分析入口 ====================
export async function getCoachAnalysis(ctx) {
    const config = loadConfig();
    if (config.apiKey && config.apiUrl && config.enableBP !== false) {
        try { return await _llmAnalysis(ctx, config); }
        catch (e) { console.warn('LLM fallback:', e); }
    }
    return _ruleBasedAnalysis(ctx);
}

// ==================== LLM 分析 ====================
async function _llmAnalysis(ctx, config) {
    const heroData = _buildHeroKnowledge(ctx);
    const recs = getStructuredRecommendations(ctx);
    const recsText = recs.length
        ? recs.map((r, i) => `${i + 1}. ${r.type === 'ban' ? '禁' : '选'} ${r.hero} — ${r.reason}`).join('\n')
        : '暂无';
    const systemPrompt = `你是王者荣耀KPL职业赛事的顶级AI教练。你正在实时指导玩家进行Ban/Pick。
你的风格：专业、果断、有具体操作建议，像真正的KPL教练在耳麦里指挥。

核心要求：
1. 必须推荐具体英雄名，并说明为什么选这个英雄
2. 如果能构成组合（如老夫子+大乔、张飞+后羿），要指出组合优势
3. 分析对方阵容弱点，告诉玩家如何针对
4. 你的推荐必须优先基于下面给出的"系统推荐列表"中的英雄，你可以调整优先级或补充，但不要与推荐列表产生冲突
5. 用口语化的指挥风格，像"我建议先拿XX，理由是..."
6. 控制在4-8句话

系统推荐列表（已标记在英雄卡片上，你的建议需要与之一致）：
${recsText}

以下是当前版本英雄数据供参考：
${heroData}`;

    const stateDesc = _buildStateDescription(ctx);
    const unavailable = new Set([...ctx.myBans, ...ctx.enemyBans, ...ctx.myPicks, ...ctx.enemyPicks]);
    const { text: enemyText } = _analyzeEnemyPlayers(ctx.enemyStarters, unavailable);
    const fullPrompt = stateDesc + (enemyText ? '\n\n对手选手英雄池信息：\n' + enemyText.replace(/\*/g, '') : '');
    const resp = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify({
            model: config.model || 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: fullPrompt },
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
    const lines = [];
    lines.push(`=== 当前BP状态 ===`);
    lines.push(`阶段：${ctx.phase === 'ban' ? '禁用' : '选人'}阶段 | ${ctx.stepLabel}`);
    if (ctx.banProgress) lines.push(`禁用进度：${ctx.banProgress}`);
    if (ctx.pickProgress) lines.push(`选人进度：${ctx.pickProgress}`);
    lines.push(`我方${ctx.myTeamName} vs ${ctx.enemyTeamName}`);
    lines.push(`--- 禁用情况 ---`);
    lines.push(`我方已禁(${ctx.myBans.length})：${ctx.myBans.length ? ctx.myBans.join('、') : '无'}`);
    lines.push(`敌方已禁(${ctx.enemyBans.length})：${ctx.enemyBans.length ? ctx.enemyBans.join('、') : '无'}`);
    lines.push(`--- 选人情况 ---`);
    lines.push(`我方已选(${ctx.myPicks.length}/5)：${ctx.myPicks.length ? ctx.myPicks.map((h, i) => `${h}(${ctx.myPickRoles[i] || '?'})`).join('、') : '无'}`);
    lines.push(`敌方已选(${ctx.enemyPicks.length}/5)：${ctx.enemyPicks.length ? ctx.enemyPicks.map((h, i) => `${h}(${ctx.enemyPickRoles[i] || '?'})`).join('、') : '无'}`);

    if (ctx.myPicks.length || ctx.enemyPicks.length) {
        const wr = estimateWinRate(ctx.myPicks, ctx.enemyPicks, ctx.myPickRoles, ctx.enemyPickRoles);
        lines.push(`当前预估胜率：我方${wr.my}% vs 对方${wr.enemy}%`);
    }

    const missing = _getMissingRoles(ctx.myPickRoles);
    if (missing.length && ctx.phase === 'pick') lines.push(`我方还需要选：${missing.join('、')}`);
    lines.push(`请根据以上信息，给出当前步骤最具针对性的英雄推荐和策略建议。`);
    return lines.join('\n');
}

// ==================== 规则引擎分析 ====================
function _ruleBasedAnalysis(ctx) {
    const { phase, myBans, enemyBans, myPicks, enemyPicks, myPickRoles, enemyPickRoles, enemyStarters, stepLabel, banProgress, pickProgress } = ctx;
    const unavailable = new Set([...myBans, ...enemyBans, ...myPicks, ...enemyPicks]);

    const statusLines = [];
    if (stepLabel) statusLines.push(`**${stepLabel}**`);
    if (phase === 'ban' && banProgress) statusLines.push(`${banProgress}`);
    if (phase === 'pick' && pickProgress) statusLines.push(`${pickProgress}`);
    const statusText = statusLines.length ? statusLines.join(' | ') + '\n\n' : '';

    const { text: enemyAnalysis } = _analyzeEnemyPlayers(enemyStarters, unavailable);

    const recs = getStructuredRecommendations(ctx);
    const analysis = _recsToText(recs, ctx);

    return statusText + enemyAnalysis + '\n\n' + analysis;
}

function _recsToText(recs, ctx) {
    const { phase, myBans, enemyBans, myPicks, enemyPicks, myPickRoles, enemyPickRoles } = ctx;
    const lines = [];

    if (phase === 'ban') {
        const totalBans = myBans.length + enemyBans.length;
        lines.push(totalBans < 4 ? '📋 **禁用建议**' : '📋 **第二轮禁用建议**');

        if (myBans.length) lines.push(`✅ 我方已禁：${myBans.join('、')}`);
        if (enemyBans.length) lines.push(`🔴 对方已禁：${enemyBans.join('、')}，${_analyzeBanIntent(enemyBans)}`);

        const banRecs = recs.filter(r => r.type === 'ban');
        if (banRecs.length) {
            const top = banRecs.slice(0, 3);
            lines.push(`🚫 推荐禁用：`);
            top.forEach((r, i) => {
                lines.push(`  ${i + 1}. **${r.hero}** — ${r.reason}`);
            });
            if (banRecs.length > 3) {
                lines.push(`💡 备选：${banRecs.slice(3, 6).map(r => `**${r.hero}**（${r.reason}）`).join('、')}`);
            }
        }
    } else {
        lines.push('🎯 **选人建议**');
        if (myPicks.length > 0) {
            const wr = estimateWinRate(myPicks, enemyPicks, myPickRoles, enemyPickRoles);
            lines.push(`📊 当前预估胜率：**我方 ${wr.my}%** vs 对方 ${wr.enemy}%`);
        }
        if (myPicks.length) lines.push(`✅ 已选：${myPicks.map((h, i) => `${h}(${myPickRoles[i] || '?'})`).join('、')}`);
        if (enemyPicks.length) lines.push(`🔴 对方已选：${enemyPicks.join('、')}`);

        const missing = _getMissingRoles(myPickRoles);
        if (missing.length) lines.push(`⚠️ 还需要选：${missing.join('、')}`);

        const pickRecs = recs.filter(r => r.type === 'pick');
        if (pickRecs.length) {
            const top = pickRecs.slice(0, 3);
            lines.push(`🎯 推荐选人：`);
            top.forEach((r, i) => {
                lines.push(`  ${i + 1}. **${r.hero}** — ${r.reason}`);
            });
            if (pickRecs.length > 3) {
                lines.push(`💡 备选：${pickRecs.slice(3, 6).map(r => `**${r.hero}**（${r.reason}）`).join('、')}`);
            }
        }

        if (enemyPicks.length >= 2) {
            for (const combo of HERO_COMBOS) {
                if (combo.heroes.every(h => enemyPicks.includes(h))) {
                    lines.push(`🔴 对方已构成「${combo.heroes.join('+')}」组合（${combo.desc}），注意应对！`);
                }
            }
        }
    }

    return lines.join('\n');
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
