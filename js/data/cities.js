/**
 * cities.js - 城市数据：地标、美食、文化元素
 */
export const CITIES = {
    '北京': {
        name: '北京',
        subtitle: '千年古都 · 电竞之巅',
        color: '#c8102e',
        landmarks: [
            { id: 'gugong', name: '故宫', desc: '穿越紫禁城，在太和殿前感悟"王者"真意', reward: { type: 'buff', name: '王者之气', value: '全队心态+2' }, unlockCost: 0 },
            { id: 'changcheng', name: '长城', desc: '攀登长城耐力挑战', reward: { type: 'stat', stat: '抗压', value: 3 }, unlockCost: 200 },
            { id: 'niaochao', name: '鸟巢', desc: '回顾2025年度总决赛盛况', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 500, requireFame: 200 },
            { id: 'sanlitun', name: '三里屯', desc: '战队线下粉丝活动', reward: { type: 'fans', value: 500 }, unlockCost: 100 },
            { id: 'houhai', name: '后海', desc: '队员休闲放松', reward: { type: 'recovery', value: 20 }, unlockCost: 0 },
            { id: 'nanluoguxiang', name: '南锣鼓巷', desc: '发现隐藏的电竞主题胡同', reward: { type: 'item', name: '京味儿加油棒' }, unlockCost: 300 },
        ],
        foods: [
            { id: 'kaoya', name: '北京烤鸭', desc: '全聚德团建', effect: '团队默契+3', icon: '🦆' },
            { id: 'zhajiangmian', name: '炸酱面', desc: '老北京胡同小馆', effect: '随机1名选手状态恢复满', icon: '🍜' },
            { id: 'bingtanghulu', name: '冰糖葫芦', desc: '街边偶遇', effect: '随机小幅属性提升', icon: '🍡' },
        ],
    },
    '成都': {
        name: '成都',
        subtitle: '天府之国 · 冠军之城',
        color: '#00b4d8',
        landmarks: [
            { id: 'wuhouci', name: '武侯祠', desc: '感悟诸葛亮的战略智慧', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 0 },
            { id: 'panda', name: '大熊猫基地', desc: '选手休闲放松日', reward: { type: 'recovery', value: 30 }, unlockCost: 0 },
            { id: 'taikoo', name: '太古里', desc: '潮流文化碰撞电竞IP', reward: { type: 'fame', value: 200 }, unlockCost: 200 },
            { id: 'kuanzhai', name: '宽窄巷子', desc: '体验成都慢生活', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 100 },
        ],
        foods: [
            { id: 'huoguo', name: '火锅', desc: '团队聚餐', effect: '士气+15，默契+3', icon: '🍲' },
            { id: 'chuanchuan', name: '串串香', desc: '路边撸串', effect: '随机2名选手状态+15', icon: '🍢' },
        ],
    },
    '重庆': {
        name: '重庆',
        subtitle: '山城意志 · 狼群之巢',
        color: '#1d3557',
        landmarks: [
            { id: 'hongyadong', name: '洪崖洞', desc: '山城夜景中的誓师大会', reward: { type: 'morale', value: 20 }, unlockCost: 0 },
            { id: 'jiefangbei', name: '解放碑', desc: '城市中心粉丝快闪活动', reward: { type: 'fans', value: 800 }, unlockCost: 100 },
            { id: 'suodao', name: '长江索道', desc: '跨越长江的勇气考验', reward: { type: 'stat', stat: '抗压', value: 2 }, unlockCost: 200 },
            { id: 'ciqikou', name: '磁器口', desc: '古镇中发现隐藏NPC老教练', reward: { type: 'tactic', name: '磁器口秘术' }, unlockCost: 500 },
        ],
        foods: [
            { id: 'xiaomian', name: '重庆小面', desc: '晨间早餐', effect: '当日全队状态+10', icon: '🍜' },
            { id: 'suanlafen', name: '酸辣粉', desc: '赛后宵夜', effect: '疲劳恢复+15', icon: '🌶️' },
        ],
    },
    '上海': {
        name: '上海',
        subtitle: '魔都风云 · 双雄争霸',
        color: '#ffd700',
        landmarks: [
            { id: 'waitan', name: '外滩', desc: '浦江两岸的电竞灯光秀', reward: { type: 'fame', value: 300 }, unlockCost: 0 },
            { id: 'dongfangmingzhu', name: '东方明珠', desc: '登顶俯瞰电竞之都', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 200 },
            { id: 'kplcenter', name: 'KPL电竞中心', desc: 'KPL联盟主场探访', reward: { type: 'morale', value: 15 }, unlockCost: 300 },
        ],
        foods: [
            { id: 'xiaolongbao', name: '小笼包', desc: '南翔小笼', effect: '全队状态+10', icon: '🥟' },
            { id: 'shengjian', name: '生煎', desc: '弄堂美食', effect: '随机属性+1', icon: '🥘' },
        ],
    },
    '武汉': {
        name: '武汉',
        subtitle: '英雄之城 · 星火不灭',
        color: '#0077b6',
        landmarks: [
            { id: 'huanghelou', name: '黄鹤楼', desc: '"昔人已乘黄鹤去，传奇还在续写"', reward: { type: 'stat', stat: '心态', value: 3 }, unlockCost: 0 },
            { id: 'wuda', name: '武汉大学', desc: '樱花树下的电竞青春', reward: { type: 'recovery', value: 25 }, unlockCost: 100 },
            { id: 'hubuxiang', name: '户部巷', desc: '过早文化体验', reward: { type: 'morale', value: 10 }, unlockCost: 0 },
        ],
        foods: [
            { id: 'reganmian', name: '热干面', desc: '武汉过早', effect: '当日全队状态+8', icon: '🍜' },
            { id: 'yabo', name: '鸭脖', desc: '精武路宵夜', effect: '士气+10', icon: '🍗' },
        ],
    },
    '广州': { name: '广州', subtitle: '岭南锐气 · 敢为天下先', color: '#e85d04', landmarks: [
        { id: 'guangzhoutower', name: '广州塔', desc: '小蛮腰上的电竞灯光', reward: { type: 'fame', value: 200 }, unlockCost: 0 },
    ], foods: [{ id: 'changfen', name: '肠粉', desc: '早茶必点', effect: '全队状态+8', icon: '🥡' }] },
    '深圳': { name: '深圳', subtitle: '创新之城 · 科技先锋', color: '#7209b7', landmarks: [
        { id: 'huaqiangbei', name: '华强北', desc: '科技装备升级', reward: { type: 'stat', stat: '操作', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'chaoshaniu', name: '潮汕牛肉', desc: '鲜切牛肉火锅', effect: '全队状态+10', icon: '🥩' }] },
    '杭州': { name: '杭州', subtitle: '诗画江南 · 电竞新城', color: '#d90429', landmarks: [
        { id: 'xihu', name: '西湖', desc: '断桥边的坚守与等待', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'dongpomeat', name: '东坡肉', desc: '楼外楼名菜', effect: '士气+10', icon: '🍖' }] },
    '西安': { name: '西安', subtitle: '十三朝古都 · 大器晚成', color: '#9b2335', landmarks: [
        { id: 'bingmayong', name: '兵马俑', desc: '千军万马的气势', reward: { type: 'stat', stat: '配合', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'roujiamo', name: '肉夹馍', desc: '回民街美味', effect: '全队状态+8', icon: '🥙' }] },
    '南通': { name: '南通', subtitle: '江海门户 · 英雄摇篮', color: '#2a9d8f', landmarks: [
        { id: 'langshan', name: '狼山', desc: '登高望远，心怀天下', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'nantongcake', name: '西亭脆饼', desc: '南通特产', effect: '随机属性+1', icon: '🍪' }] },
    '济南': { name: '济南', subtitle: '泉城侠义 · 以弱胜强', color: '#dc2f02', landmarks: [
        { id: 'baotoquan', name: '趵突泉', desc: '天下第一泉的灵动', reward: { type: 'stat', stat: '操作', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'jinanbabing', name: '把子肉', desc: '济南名吃', effect: '士气+8', icon: '🍖' }] },
    '长沙': { name: '长沙', subtitle: '娱乐之都 · 青春风暴', color: '#e63946', landmarks: [
        { id: 'yuelu', name: '岳麓山', desc: '指点江山，激扬文字', reward: { type: 'morale', value: 15 }, unlockCost: 0 },
    ], foods: [{ id: 'chouduofu', name: '臭豆腐', desc: '坡子街小吃', effect: '随机1名选手状态+20', icon: '🧈' }] },
    '佛山': { name: '佛山', subtitle: '武术之城 · 龙之逆鳞', color: '#6a040f', landmarks: [
        { id: 'zumiao', name: '祖庙', desc: '感悟武术精髓', reward: { type: 'stat', stat: '抗压', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'fosshanfen', name: '佛山扎蹄', desc: '传统美食', effect: '全队状态+8', icon: '🍖' }] },
    '苏州': { name: '苏州', subtitle: '园林之城 · 精巧策略', color: '#ff6b00', landmarks: [
        { id: 'zhuozheng', name: '拙政园', desc: '园林中悟策略之道', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'songshugui', name: '松鼠桂鱼', desc: '苏帮名菜', effect: '默契+2', icon: '🐟' }] },
    '桐乡': { name: '桐乡', subtitle: '乌镇智慧 · 黑马传奇', color: '#457b9d', landmarks: [
        { id: 'wuzhen', name: '乌镇', desc: '水乡中寻找灵感', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 0 },
    ], foods: [{ id: 'yanrou', name: '三珍斋酱鸡', desc: '桐乡特产', effect: '全队状态+6', icon: '🍗' }] },
    '无锡': { name: '无锡', subtitle: '太湖明珠 · 破茧成蝶', color: '#023e8a', landmarks: [
        { id: 'yuantouzhu', name: '鼋头渚', desc: '太湖之畔的宁静', reward: { type: 'recovery', value: 20 }, unlockCost: 0 },
    ], foods: [{ id: 'paigu', name: '无锡排骨', desc: '甜糯软烂', effect: '全队状态+6', icon: '🍖' }] },
};
