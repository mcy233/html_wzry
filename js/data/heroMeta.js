/**
 * heroMeta.js - 英雄版本强度元数据
 * 基于S42赛季巅峰千强数据（模拟）
 * tier: T0/T1/T2/T3 梯度
 * winRate: 巅峰千强胜率%
 * pickRate: 出场率%
 * banRate: 禁用率%
 * hotLanes: 常用分路 ['对抗路','打野','中路','发育路','游走']
 * tags: 标签（强势/冷门/万金油等）
 */

export const HERO_META = {
    // ========== 对抗路 ==========
    '关羽':   { tier: 'T0', winRate: 53.1, pickRate: 22.5, banRate: 48.2, hotLanes: ['对抗路'], tags: ['强势','高禁率'] },
    '马超':   { tier: 'T0', winRate: 52.8, pickRate: 20.1, banRate: 42.5, hotLanes: ['对抗路'], tags: ['强势','高操作'] },
    '花木兰': { tier: 'T1', winRate: 51.4, pickRate: 18.3, banRate: 25.6, hotLanes: ['对抗路'], tags: ['高操作'] },
    '吕布':   { tier: 'T1', winRate: 51.0, pickRate: 14.5, banRate: 12.3, hotLanes: ['对抗路'], tags: ['万金油'] },
    '夏侯惇': { tier: 'T2', winRate: 50.2, pickRate: 11.0, banRate: 5.1, hotLanes: ['对抗路'], tags: ['稳定'] },
    '项羽':   { tier: 'T2', winRate: 49.8, pickRate: 8.2, banRate: 3.5, hotLanes: ['对抗路'], tags: ['开团'] },
    '老夫子': { tier: 'T1', winRate: 52.5, pickRate: 13.7, banRate: 18.9, hotLanes: ['对抗路'], tags: ['对线强'] },
    '孙策':   { tier: 'T2', winRate: 50.5, pickRate: 7.8, banRate: 4.2, hotLanes: ['对抗路'], tags: ['开团'] },
    '曜':     { tier: 'T1', winRate: 51.6, pickRate: 16.2, banRate: 15.0, hotLanes: ['对抗路','打野'], tags: ['灵活','高操作'] },
    '夏洛特': { tier: 'T0', winRate: 53.5, pickRate: 19.8, banRate: 50.1, hotLanes: ['对抗路'], tags: ['强势','高禁率'] },
    '狂铁':   { tier: 'T1', winRate: 51.3, pickRate: 12.1, banRate: 8.7, hotLanes: ['对抗路'], tags: ['对线强'] },
    '白起':   { tier: 'T2', winRate: 49.5, pickRate: 7.5, banRate: 2.8, hotLanes: ['对抗路'], tags: ['开团'] },
    '铠':     { tier: 'T2', winRate: 50.0, pickRate: 6.3, banRate: 2.1, hotLanes: ['对抗路'], tags: ['后期'] },
    '芈月':   { tier: 'T2', winRate: 50.8, pickRate: 9.0, banRate: 6.5, hotLanes: ['对抗路','中路'], tags: ['万金油'] },
    '猪八戒': { tier: 'T2', winRate: 49.2, pickRate: 5.8, banRate: 1.5, hotLanes: ['对抗路'], tags: ['开团','肉盾'] },
    '哪吒':   { tier: 'T2', winRate: 50.1, pickRate: 6.0, banRate: 3.0, hotLanes: ['对抗路'], tags: ['支援'] },
    '亚连':   { tier: 'T1', winRate: 51.8, pickRate: 14.0, banRate: 12.5, hotLanes: ['对抗路'], tags: ['新英雄','强势'] },
    '蒙恬':   { tier: 'T2', winRate: 49.0, pickRate: 5.5, banRate: 1.8, hotLanes: ['对抗路'], tags: ['团战'] },
    '云缨':   { tier: 'T1', winRate: 51.5, pickRate: 15.0, banRate: 20.3, hotLanes: ['对抗路','打野'], tags: ['灵活'] },
    '刘邦':   { tier: 'T2', winRate: 49.5, pickRate: 4.5, banRate: 1.2, hotLanes: ['对抗路'], tags: ['支援'] },
    '达摩':   { tier: 'T2', winRate: 49.3, pickRate: 5.0, banRate: 1.0, hotLanes: ['对抗路'], tags: ['开团'] },
    '盘古':   { tier: 'T3', winRate: 48.0, pickRate: 3.0, banRate: 0.5, hotLanes: ['对抗路'], tags: ['冷门'] },
    '李信':   { tier: 'T2', winRate: 50.3, pickRate: 8.5, banRate: 5.5, hotLanes: ['对抗路'], tags: ['后期'] },
    '杨戬':   { tier: 'T2', winRate: 49.7, pickRate: 6.0, banRate: 2.0, hotLanes: ['对抗路'], tags: ['灵活'] },
    '司空震': { tier: 'T2', winRate: 50.2, pickRate: 7.0, banRate: 3.5, hotLanes: ['对抗路'], tags: ['消耗'] },
    '赵怀真': { tier: 'T2', winRate: 49.8, pickRate: 5.5, banRate: 2.0, hotLanes: ['对抗路'], tags: ['控制'] },
    '海诺':   { tier: 'T1', winRate: 51.2, pickRate: 11.5, banRate: 10.0, hotLanes: ['对抗路'], tags: ['灵活'] },
    '蚩奼':   { tier: 'T2', winRate: 50.5, pickRate: 8.0, banRate: 5.0, hotLanes: ['对抗路'], tags: ['对线强'] },
    '姬小满': { tier: 'T1', winRate: 51.0, pickRate: 10.0, banRate: 8.0, hotLanes: ['对抗路'], tags: ['灵活'] },
    '曹操':   { tier: 'T3', winRate: 48.5, pickRate: 3.5, banRate: 0.5, hotLanes: ['对抗路'], tags: ['冷门'] },
    '典韦':   { tier: 'T3', winRate: 48.8, pickRate: 4.0, banRate: 0.8, hotLanes: ['对抗路'], tags: ['后期'] },
    '程咬金': { tier: 'T3', winRate: 47.5, pickRate: 2.5, banRate: 0.3, hotLanes: ['对抗路'], tags: ['冷门'] },
    '廉颇':   { tier: 'T2', winRate: 49.0, pickRate: 4.0, banRate: 1.0, hotLanes: ['对抗路'], tags: ['开团'] },
    '刘备':   { tier: 'T3', winRate: 47.8, pickRate: 2.0, banRate: 0.2, hotLanes: ['对抗路'], tags: ['冷门'] },
    '宫本武藏': { tier: 'T2', winRate: 50.0, pickRate: 6.5, banRate: 3.0, hotLanes: ['对抗路','打野'], tags: ['突进'] },
    '影':     { tier: 'T2', winRate: 50.2, pickRate: 7.0, banRate: 4.0, hotLanes: ['对抗路'], tags: ['新英雄'] },
    '大司命': { tier: 'T2', winRate: 50.0, pickRate: 6.0, banRate: 3.0, hotLanes: ['对抗路'], tags: ['灵活'] },

    // ========== 打野 ==========
    '镜':     { tier: 'T0', winRate: 53.8, pickRate: 24.0, banRate: 55.0, hotLanes: ['打野'], tags: ['强势','高禁率','高操作'] },
    '裴擒虎': { tier: 'T1', winRate: 51.5, pickRate: 16.0, banRate: 15.5, hotLanes: ['打野'], tags: ['万金油'] },
    '澜':     { tier: 'T0', winRate: 52.5, pickRate: 21.0, banRate: 38.0, hotLanes: ['打野'], tags: ['强势','高操作'] },
    '李白':   { tier: 'T1', winRate: 51.0, pickRate: 15.5, banRate: 20.0, hotLanes: ['打野'], tags: ['高操作'] },
    '云中君': { tier: 'T1', winRate: 51.2, pickRate: 14.0, banRate: 12.0, hotLanes: ['打野'], tags: ['灵活'] },
    '娜可露露': { tier: 'T2', winRate: 50.5, pickRate: 8.5, banRate: 5.0, hotLanes: ['打野'], tags: ['突进'] },
    '赵云':   { tier: 'T1', winRate: 51.3, pickRate: 13.0, banRate: 10.0, hotLanes: ['打野'], tags: ['万金油'] },
    '韩信':   { tier: 'T1', winRate: 51.8, pickRate: 17.0, banRate: 18.0, hotLanes: ['打野'], tags: ['开团','高操作'] },
    '橘右京': { tier: 'T2', winRate: 49.8, pickRate: 7.0, banRate: 3.0, hotLanes: ['打野'], tags: ['突进'] },
    '露娜':   { tier: 'T1', winRate: 51.5, pickRate: 12.0, banRate: 15.0, hotLanes: ['打野'], tags: ['高操作'] },
    '兰陵王': { tier: 'T2', winRate: 50.0, pickRate: 9.0, banRate: 8.0, hotLanes: ['打野'], tags: ['潜行'] },
    '阿轲':   { tier: 'T2', winRate: 50.2, pickRate: 7.5, banRate: 4.5, hotLanes: ['打野'], tags: ['潜行'] },
    '孙悟空': { tier: 'T2', winRate: 49.5, pickRate: 6.0, banRate: 2.5, hotLanes: ['打野'], tags: ['开团'] },
    '百里玄策': { tier: 'T1', winRate: 51.0, pickRate: 10.5, banRate: 8.5, hotLanes: ['打野'], tags: ['突进'] },
    '司马懿': { tier: 'T1', winRate: 51.3, pickRate: 11.0, banRate: 10.0, hotLanes: ['打野','中路'], tags: ['灵活'] },
    '元歌':   { tier: 'T1', winRate: 52.0, pickRate: 8.0, banRate: 12.0, hotLanes: ['打野'], tags: ['高操作','独特'] },
    '暃':     { tier: 'T2', winRate: 50.0, pickRate: 7.0, banRate: 3.5, hotLanes: ['打野'], tags: ['突进'] },
    '雅典娜': { tier: 'T2', winRate: 49.5, pickRate: 5.0, banRate: 1.5, hotLanes: ['打野'], tags: ['分推'] },

    // ========== 中路 ==========
    '貂蝉':   { tier: 'T0', winRate: 53.0, pickRate: 20.0, banRate: 35.0, hotLanes: ['中路'], tags: ['强势','高操作'] },
    '诸葛亮': { tier: 'T1', winRate: 51.5, pickRate: 17.0, banRate: 18.0, hotLanes: ['中路'], tags: ['爆发'] },
    '上官婉儿': { tier: 'T1', winRate: 51.2, pickRate: 14.5, banRate: 16.0, hotLanes: ['中路'], tags: ['高操作'] },
    '嬴政':   { tier: 'T2', winRate: 50.5, pickRate: 10.0, banRate: 6.0, hotLanes: ['中路'], tags: ['消耗'] },
    '干将莫邪': { tier: 'T1', winRate: 51.0, pickRate: 12.0, banRate: 10.0, hotLanes: ['中路'], tags: ['远程消耗'] },
    '不知火舞': { tier: 'T1', winRate: 51.3, pickRate: 13.0, banRate: 12.5, hotLanes: ['中路'], tags: ['灵活'] },
    '墨子':   { tier: 'T2', winRate: 50.0, pickRate: 6.5, banRate: 3.0, hotLanes: ['中路'], tags: ['控制'] },
    '嫦娥':   { tier: 'T2', winRate: 50.2, pickRate: 7.0, banRate: 4.0, hotLanes: ['中路'], tags: ['肉法'] },
    '西施':   { tier: 'T1', winRate: 52.0, pickRate: 15.0, banRate: 22.0, hotLanes: ['中路'], tags: ['控制','强势'] },
    '武则天': { tier: 'T2', winRate: 49.5, pickRate: 5.5, banRate: 2.0, hotLanes: ['中路'], tags: ['全图'] },
    '女娲':   { tier: 'T2', winRate: 50.8, pickRate: 8.0, banRate: 5.5, hotLanes: ['中路'], tags: ['远程控制'] },
    '王昭君': { tier: 'T2', winRate: 50.0, pickRate: 7.0, banRate: 3.0, hotLanes: ['中路'], tags: ['AOE'] },
    '杨玉环': { tier: 'T2', winRate: 50.3, pickRate: 6.5, banRate: 2.5, hotLanes: ['中路'], tags: ['回复'] },
    '安琪拉': { tier: 'T3', winRate: 49.0, pickRate: 4.0, banRate: 0.8, hotLanes: ['中路'], tags: ['爆发'] },
    '沈梦溪': { tier: 'T2', winRate: 49.8, pickRate: 5.5, banRate: 2.0, hotLanes: ['中路'], tags: ['消耗'] },
    '妲己':   { tier: 'T3', winRate: 48.5, pickRate: 3.0, banRate: 0.3, hotLanes: ['中路'], tags: ['控制'] },
    '海月':   { tier: 'T1', winRate: 51.8, pickRate: 11.0, banRate: 13.0, hotLanes: ['中路'], tags: ['灵活','新英雄'] },
    '弈星':   { tier: 'T3', winRate: 48.0, pickRate: 2.5, banRate: 0.2, hotLanes: ['中路'], tags: ['冷门'] },
    '米莱狄': { tier: 'T2', winRate: 49.5, pickRate: 4.5, banRate: 1.0, hotLanes: ['中路'], tags: ['分推'] },
    '小乔':   { tier: 'T3', winRate: 48.2, pickRate: 3.5, banRate: 0.5, hotLanes: ['中路'], tags: ['控制'] },
    '扁鹊':   { tier: 'T2', winRate: 50.5, pickRate: 6.0, banRate: 3.5, hotLanes: ['中路'], tags: ['持续伤害'] },
    '周瑜':   { tier: 'T2', winRate: 49.5, pickRate: 4.0, banRate: 1.0, hotLanes: ['中路'], tags: ['AOE'] },
    '甄姬':   { tier: 'T3', winRate: 47.5, pickRate: 2.0, banRate: 0.2, hotLanes: ['中路'], tags: ['冷门'] },
    '高渐离': { tier: 'T3', winRate: 48.0, pickRate: 2.5, banRate: 0.3, hotLanes: ['中路'], tags: ['冷门'] },
    '张良':   { tier: 'T2', winRate: 50.0, pickRate: 5.5, banRate: 3.0, hotLanes: ['中路','游走'], tags: ['控制'] },
    '姜子牙': { tier: 'T3', winRate: 47.0, pickRate: 1.5, banRate: 0.1, hotLanes: ['中路'], tags: ['辅助型法师'] },
    '金蝉':   { tier: 'T2', winRate: 50.5, pickRate: 7.5, banRate: 5.0, hotLanes: ['中路'], tags: ['消耗'] },

    // ========== 发育路 ==========
    '公孙离': { tier: 'T0', winRate: 53.2, pickRate: 23.0, banRate: 40.0, hotLanes: ['发育路'], tags: ['强势','高操作'] },
    '马可波罗': { tier: 'T1', winRate: 52.0, pickRate: 18.0, banRate: 22.0, hotLanes: ['发育路'], tags: ['灵活'] },
    '孙尚香': { tier: 'T1', winRate: 51.5, pickRate: 14.0, banRate: 8.0, hotLanes: ['发育路'], tags: ['万金油'] },
    '百里守约': { tier: 'T2', winRate: 50.0, pickRate: 8.0, banRate: 5.0, hotLanes: ['发育路'], tags: ['远程'] },
    '后羿':   { tier: 'T2', winRate: 49.8, pickRate: 10.0, banRate: 4.0, hotLanes: ['发育路'], tags: ['后期'] },
    '鲁班七号': { tier: 'T2', winRate: 49.5, pickRate: 9.0, banRate: 3.0, hotLanes: ['发育路'], tags: ['后期'] },
    '虞姬':   { tier: 'T1', winRate: 51.0, pickRate: 12.0, banRate: 10.0, hotLanes: ['发育路'], tags: ['自保'] },
    '黄忠':   { tier: 'T2', winRate: 49.0, pickRate: 5.0, banRate: 1.5, hotLanes: ['发育路'], tags: ['站桩'] },
    '伽罗':   { tier: 'T2', winRate: 49.5, pickRate: 7.0, banRate: 3.0, hotLanes: ['发育路'], tags: ['后期'] },
    '蒙犽':   { tier: 'T2', winRate: 50.2, pickRate: 6.5, banRate: 2.5, hotLanes: ['发育路'], tags: ['灵活'] },
    '狄仁杰': { tier: 'T1', winRate: 51.5, pickRate: 11.0, banRate: 7.0, hotLanes: ['发育路'], tags: ['稳定','解控'] },
    '李元芳': { tier: 'T2', winRate: 49.8, pickRate: 6.0, banRate: 2.0, hotLanes: ['发育路'], tags: ['视野'] },
    '艾琳':   { tier: 'T1', winRate: 51.2, pickRate: 9.5, banRate: 6.0, hotLanes: ['发育路'], tags: ['消耗'] },
    '戈娅':   { tier: 'T1', winRate: 52.0, pickRate: 13.0, banRate: 15.0, hotLanes: ['发育路'], tags: ['强势','新英雄'] },
    '莱西奥': { tier: 'T2', winRate: 50.0, pickRate: 7.0, banRate: 3.5, hotLanes: ['发育路'], tags: ['灵活'] },
    '敖隐':   { tier: 'T0', winRate: 53.5, pickRate: 22.0, banRate: 45.0, hotLanes: ['发育路'], tags: ['强势','高禁率'] },
    '阿古朵': { tier: 'T2', winRate: 50.5, pickRate: 5.5, banRate: 2.0, hotLanes: ['发育路'], tags: ['独特'] },
    '苍':     { tier: 'T2', winRate: 49.0, pickRate: 4.0, banRate: 1.0, hotLanes: ['发育路'], tags: ['消耗'] },
    '孙权':   { tier: 'T1', winRate: 51.8, pickRate: 12.0, banRate: 10.5, hotLanes: ['发育路'], tags: ['突进','灵活'] },

    // ========== 游走 ==========
    '鬼谷子': { tier: 'T0', winRate: 52.8, pickRate: 20.0, banRate: 35.0, hotLanes: ['游走'], tags: ['强势','团控'] },
    '张飞':   { tier: 'T1', winRate: 51.5, pickRate: 16.0, banRate: 12.0, hotLanes: ['游走'], tags: ['万金油'] },
    '太乙真人': { tier: 'T1', winRate: 51.0, pickRate: 13.0, banRate: 8.0, hotLanes: ['游走'], tags: ['回复','大招'] },
    '牛魔':   { tier: 'T1', winRate: 51.2, pickRate: 12.0, banRate: 7.5, hotLanes: ['游走'], tags: ['团控'] },
    '大乔':   { tier: 'T1', winRate: 52.0, pickRate: 14.0, banRate: 18.0, hotLanes: ['游走'], tags: ['支援','独特'] },
    '蔡文姬': { tier: 'T2', winRate: 50.5, pickRate: 9.0, banRate: 5.0, hotLanes: ['游走'], tags: ['回复'] },
    '东皇太一': { tier: 'T0', winRate: 52.5, pickRate: 18.0, banRate: 30.0, hotLanes: ['游走'], tags: ['强势','反刺'] },
    '孙膑':   { tier: 'T2', winRate: 50.0, pickRate: 7.0, banRate: 3.0, hotLanes: ['游走'], tags: ['辅助'] },
    '瑶':     { tier: 'T1', winRate: 51.5, pickRate: 15.0, banRate: 12.0, hotLanes: ['游走'], tags: ['挂件','保护'] },
    '盾山':   { tier: 'T2', winRate: 49.5, pickRate: 6.0, banRate: 3.0, hotLanes: ['游走'], tags: ['格挡'] },
    '鲁班大师': { tier: 'T2', winRate: 50.2, pickRate: 7.5, banRate: 4.0, hotLanes: ['游走'], tags: ['灵活'] },
    '明世隐': { tier: 'T2', winRate: 50.8, pickRate: 8.0, banRate: 5.5, hotLanes: ['游走'], tags: ['增益'] },
    '刘禅':   { tier: 'T3', winRate: 48.5, pickRate: 3.0, banRate: 0.5, hotLanes: ['游走'], tags: ['拆塔'] },
    '庄周':   { tier: 'T2', winRate: 50.5, pickRate: 8.5, banRate: 4.5, hotLanes: ['游走'], tags: ['解控'] },
    '钟馗':   { tier: 'T2', winRate: 50.0, pickRate: 6.0, banRate: 3.5, hotLanes: ['游走'], tags: ['抓人'] },
    '苏烈':   { tier: 'T2', winRate: 49.8, pickRate: 5.0, banRate: 2.0, hotLanes: ['游走'], tags: ['开团'] },
    '桑启':   { tier: 'T2', winRate: 50.5, pickRate: 7.0, banRate: 4.0, hotLanes: ['游走'], tags: ['灵活'] },
    '朵莉亚': { tier: 'T2', winRate: 50.2, pickRate: 6.5, banRate: 3.5, hotLanes: ['游走'], tags: ['控制'] },
    '大禹':   { tier: 'T1', winRate: 51.8, pickRate: 11.0, banRate: 10.0, hotLanes: ['游走'], tags: ['新英雄','强势'] },
    '少司缘': { tier: 'T1', winRate: 51.0, pickRate: 10.0, banRate: 8.0, hotLanes: ['游走'], tags: ['灵活'] },
    '空空儿': { tier: 'T2', winRate: 49.5, pickRate: 5.0, banRate: 2.0, hotLanes: ['游走'], tags: ['潜行'] },

    // ========== 多位置/特殊 ==========
    '元流之子(坦克)': { tier: 'T2', winRate: 50.0, pickRate: 5.0, banRate: 2.0, hotLanes: ['对抗路'], tags: ['变身'] },
    '元流之子(法师)': { tier: 'T0', winRate: 53.0, pickRate: 21.0, banRate: 42.0, hotLanes: ['中路'], tags: ['强势','变身'] },
    '元流之子(刺客)': { tier: 'T1', winRate: 51.5, pickRate: 12.0, banRate: 10.0, hotLanes: ['打野'], tags: ['变身'] },
    '元流之子(射手)': { tier: 'T1', winRate: 51.0, pickRate: 10.0, banRate: 8.0, hotLanes: ['发育路'], tags: ['变身'] },
    '元流之子(辅助)': { tier: 'T2', winRate: 50.0, pickRate: 6.0, banRate: 3.0, hotLanes: ['游走'], tags: ['变身'] },
    '钟无艳': { tier: 'T3', winRate: 47.5, pickRate: 2.0, banRate: 0.2, hotLanes: ['对抗路'], tags: ['冷门'] },
    '亚瑟':   { tier: 'T3', winRate: 48.0, pickRate: 3.0, banRate: 0.3, hotLanes: ['对抗路'], tags: ['入门'] },
    '梦奇':   { tier: 'T3', winRate: 47.0, pickRate: 1.5, banRate: 0.1, hotLanes: ['对抗路'], tags: ['冷门'] },
};

export const TIER_COLORS = {
    T0: '#ff4757', T1: '#ffa502', T2: '#7bed9f', T3: '#a4b0be'
};
export const TIER_LABELS = {
    T0: 'T0 版本之子', T1: 'T1 强势', T2: 'T2 常规', T3: 'T3 冷门'
};

/**
 * 获取英雄的版本元数据
 */
export function getHeroMeta(heroName) {
    return HERO_META[heroName] || { tier: 'T3', winRate: 48.0, pickRate: 3.0, banRate: 0.5, hotLanes: [], tags: [] };
}

/**
 * 获取指定分路的T0/T1强势英雄（按胜率降序）
 */
export function getLaneTopHeroes(lane, maxTier = 'T1') {
    const tierOrder = { T0: 0, T1: 1, T2: 2, T3: 3 };
    const maxVal = tierOrder[maxTier] ?? 1;
    return Object.entries(HERO_META)
        .filter(([, m]) => m.hotLanes.includes(lane) && (tierOrder[m.tier] ?? 3) <= maxVal)
        .sort((a, b) => b[1].winRate - a[1].winRate)
        .map(([name]) => name);
}

/**
 * 判断英雄是否为当前版本强势英雄
 */
export function isMetaHero(heroName) {
    const m = HERO_META[heroName];
    return m && (m.tier === 'T0' || m.tier === 'T1');
}
