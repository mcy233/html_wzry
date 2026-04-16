/**
 * cityEvents.js - 城市探索随机交互事件库
 * 每个城市有专属的特色事件，增加游戏趣味性和沉浸感
 */

export const CITY_EVENTS = {
    '北京': [
        { id: 'bj_hutong', text: '在胡同里遇到老大爷下棋，你停下观摩，悟出了一个全新的运营思路', effect: { type: 'stat', stat: '意识', value: 3 }, icon: '♟️', flavor: '"这步棋妙啊——跟打野入侵一样！"' },
        { id: 'bj_subway', text: '在地铁上偶遇粉丝，被热情地要了签名，队员信心大增', effect: { type: 'morale', value: 12 }, icon: '🚇', flavor: '"哥们儿真是北京WB的吧？加油啊！"' },
        { id: 'bj_798', text: '在798艺术区看了一场电竞主题艺术展', effect: { type: 'fame', value: 120 }, icon: '🎨', flavor: '队员们的战斗照片被做成了艺术装置' },
        { id: 'bj_hotpot', text: '涮了一顿地道的北京铜锅涮肉，队员们聊了很多战术', effect: { type: 'stat', stat: '配合', value: 2 }, icon: '🥘', flavor: '"边涮边聊，这才叫团建！"' },
        { id: 'bj_rain', text: '突降暴雨困在故宫，意外收获了一段安静的反思时光', effect: { type: 'stat', stat: '心态', value: 3 }, icon: '🌧️', flavor: '雨中的紫禁城格外宁静，心也跟着静了' },
        { id: 'bj_derby', text: '在路上遇到了JDG的选手，双方互相致意，暗暗较劲', effect: { type: 'morale', value: 8 }, icon: '🤝', flavor: '"北京德比，下次赛场上见！"' },
        { id: 'bj_training', text: '路过国家体育馆，被邀请参加一场民间王者荣耀挑战赛', effect: { type: 'gold', value: 200 }, icon: '🏟️', choices: [{text:'接受挑战',effect:{type:'gold',value:200}},{text:'低调旁观',effect:{type:'stat',stat:'意识',value:1}}] },
        { id: 'bj_mall', text: '在西单大悦城遇到战队周边快闪店正在打折', effect: { type: 'fans', value: 400 }, icon: '🛍️', flavor: '粉丝排起了长队，拿着你的海报等签名' },
    ],
    '成都': [
        { id: 'cd_panda', text: '抱了一只大熊猫玩偶（真的不让抱...），全队心情爆表', effect: { type: 'morale', value: 15 }, icon: '🐼', flavor: '"虽然没抱到真的，但这个也好可爱！"' },
        { id: 'cd_mahjong', text: '在茶馆里跟本地人打了一下午麻将，锻炼了博弈思维', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '🀄', flavor: '成都人的牌桌智慧，不输电竞赛场' },
        { id: 'cd_spicy', text: '挑战了一家"死辣"火锅，选手体验了极限抗压', effect: { type: 'stat', stat: '抗压', value: 3 }, icon: '🌶️', flavor: '"这辣度比逆风翻盘还刺激！"', choices: [{text:'挑战变态辣',effect:{type:'stat',stat:'抗压',value:3}},{text:'微辣就好',effect:{type:'recovery',value:15}}] },
        { id: 'cd_teatime', text: '在人民公园喝了一下午盖碗茶，感受成都的慢生活', effect: { type: 'recovery', value: 25 }, icon: '🍵', flavor: '掏耳朵+盖碗茶，选手们全身心放松' },
        { id: 'cd_concert', text: '在成都偶遇一场live house演出，队员灵感涌现', effect: { type: 'stat', stat: '操作', value: 2 }, icon: '🎸', flavor: '音乐的节奏感和电竞的手速竟然有相通之处' },
        { id: 'cd_ag', text: '路过AG超玩会的训练基地，被邀请参观交流', effect: { type: 'stat', stat: '配合', value: 2 }, icon: '🏠', flavor: '一诺的训练强度确实恐怖...' },
    ],
    '重庆': [
        { id: 'cq_navigation', text: '在重庆导航失灵，在山城的8D立体交通中迷路了', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '🗺️', flavor: '"这里一楼出去是路，十楼出去还是路？"' },
        { id: 'cq_hotpot', text: '在洞子火锅里吃了一场传说中的"九宫格"', effect: { type: 'morale', value: 12 }, icon: '♨️', flavor: '麻辣味道让全队精神振奋' },
        { id: 'cq_night', text: '在朝天门码头看夜景，对着长江许下冲冠誓言', effect: { type: 'morale', value: 15 }, icon: '🌃', flavor: '"看这江水奔流不息，我们也不能停下脚步！"' },
        { id: 'cq_workout', text: '爬了重庆最陡的坡道，全队体能训练达标', effect: { type: 'stat', stat: '抗压', value: 3 }, icon: '🏋️', flavor: '"重庆人每天都在进行魔鬼体能训练..."' },
        { id: 'cq_wolf', text: '在解放碑偶遇狼队的粉丝团，双方友好交流', effect: { type: 'fans', value: 300 }, icon: '🐺', flavor: '即使是对手的粉丝，也对好队伍表示尊重' },
    ],
    '上海': [
        { id: 'sh_bund', text: '在外滩拍了一组很酷的战队宣传照', effect: { type: 'fame', value: 200 }, icon: '📷', flavor: '浦江两岸的背景，让照片质感拉满' },
        { id: 'sh_coffee', text: '在淮海路发现一家电竞主题咖啡馆', effect: { type: 'recovery', value: 15 }, icon: '☕', flavor: '拿铁上印着五杀LOGO' },
        { id: 'sh_kpl', text: '去KPL联盟主场参加了选手见面会', effect: { type: 'fans', value: 500 }, icon: '🎤', flavor: '粉丝们的热情让选手备受感动' },
        { id: 'sh_street', text: '在武康路骑行，顺便直播了一波', effect: { type: 'fame', value: 150 }, icon: '🚲', flavor: '弹幕刷满了"太帅了"' },
        { id: 'sh_coach', text: '在上海偶遇了一位退役教练，获得宝贵指导', effect: { type: 'stat', stat: '意识', value: 3 }, icon: '🧠', flavor: '"年轻人，比赛不是比手速，是比脑子"' },
    ],
    '武汉': [
        { id: 'wh_cherry', text: '在武大看了樱花，选手心态调整到最佳', effect: { type: 'stat', stat: '心态', value: 3 }, icon: '🌸', flavor: '短暂的绽放更要全力以赴' },
        { id: 'wh_yangtze', text: '横渡长江挑战！（坐轮渡）壮志凌云', effect: { type: 'morale', value: 15 }, icon: '🚢', flavor: '"连长江都过了，还有什么过不去的？"' },
        { id: 'wh_breakfast', text: '过早吃了热干面+豆皮+蛋酒，能量满满', effect: { type: 'recovery', value: 20 }, icon: '🍳', flavor: '武汉过早文化，一顿管到中午' },
        { id: 'wh_museum', text: '参观湖北省博物馆，被编钟演奏震撼', effect: { type: 'stat', stat: '配合', value: 2 }, icon: '🏛️', flavor: '"这配合度，比我们五人团战还齐..."' },
        { id: 'wh_challenge', text: '在光谷步行街被粉丝认出，即兴来了一局表演赛', effect: { type: 'fans', value: 400 }, icon: '🎮', choices: [{text:'认真打',effect:{type:'fans',value:400}},{text:'娱乐局',effect:{type:'morale',value:10}}] },
    ],
    '广州': [
        { id: 'gz_dimsum', text: '去了趟"点都德"体验正宗广式早茶', effect: { type: 'recovery', value: 18 }, icon: '🥟', flavor: '"虾饺、烧麦、叉烧包...每样都好吃！"' },
        { id: 'gz_tower', text: '登上广州塔小蛮腰，在高空中俯瞰整个广州', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '🗼', flavor: '站得高看得远，跟打比赛一个道理' },
        { id: 'gz_ttg', text: '参观了TTG的电竞主场，感受岭南电竞氛围', effect: { type: 'morale', value: 10 }, icon: '🏟️', flavor: '广东粉丝的热情，真的不一样' },
    ],
    '深圳': [
        { id: 'sz_tech', text: '在华强北淘到了一套顶级外设装备', effect: { type: 'stat', stat: '操作', value: 3 }, icon: '⌨️', flavor: '"这手感，直接提升操作上限！"' },
        { id: 'sz_bay', text: '在深圳湾公园慢跑，海风带走了比赛压力', effect: { type: 'recovery', value: 20 }, icon: '🌊', flavor: '身体好了，手速自然也快了' },
        { id: 'sz_startup', text: '被一家游戏公司邀请做演讲，讲述电竞之路', effect: { type: 'fame', value: 200 }, icon: '💼', flavor: '年轻人的眼里满是向往' },
    ],
    '杭州': [
        { id: 'hz_westlake', text: '泛舟西湖，在断桥边讨论战术', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '⛵', flavor: '"别人断桥看风景，我们断桥聊BP"' },
        { id: 'hz_tea', text: '在龙井村品了一杯明前龙井', effect: { type: 'stat', stat: '心态', value: 2 }, icon: '🍵', flavor: '茶香袅袅，心如止水' },
        { id: 'hz_alibaba', text: '路过阿里巴巴总部，感受互联网科技的力量', effect: { type: 'fame', value: 100 }, icon: '🏢', flavor: '"下次目标：让AI帮我们分析对手！"' },
    ],
    '西安': [
        { id: 'xa_wall', text: '骑自行车环绕古城墙一圈，体力和毅力双重考验', effect: { type: 'stat', stat: '抗压', value: 3 }, icon: '🚴', flavor: '"13公里的城墙，跟打一场BO5差不多累"' },
        { id: 'xa_noodle', text: '在回民街吃了碗biangbiang面，体验西安的豪爽', effect: { type: 'morale', value: 12 }, icon: '🍜', flavor: '一碗面管饱一天，简单直接' },
        { id: 'xa_terracotta', text: '参观兵马俑，感受千军万马的气势', effect: { type: 'stat', stat: '配合', value: 3 }, icon: '🗿', flavor: '"阵列如此整齐，这才叫完美的团队协作"' },
    ],
};

export const GENERIC_EVENTS = [
    { text: '偶遇退役选手，传授了独门经验', effect: { type: 'stat_random', value: 2 }, icon: '🎓', flavor: '"这些年的经验，全教给你们了"' },
    { text: '粉丝组织了一场线下应援活动', effect: { type: 'fans', value: 300 }, icon: '📸', flavor: '写满祝福的横幅让选手们红了眼眶' },
    { text: '发现了一家隐藏的电竞纪念品店', effect: { type: 'gold', value: 100 }, icon: '🎁', flavor: '淘到了绝版的冠军纪念品' },
    { text: '队员拍了城市vlog，播放量突破百万', effect: { type: 'fame', value: 120 }, icon: '📱', flavor: '评论区全是"下赛季冲冠"' },
    { text: '在当地举办了签名会，排队绕了两条街', effect: { type: 'fans', value: 400 }, icon: '✍️', flavor: '手都签酸了，但很开心' },
    { text: '遇到暴雨活动取消，窝在酒店看录像回顾', effect: { type: 'stat', stat: '意识', value: 1 }, icon: '🌧️', flavor: '反而发现了之前没注意的细节' },
    { text: '品尝了当地特色小吃，心情大好', effect: { type: 'morale', value: 10 }, icon: '😋', flavor: '吃饱了就有战斗力' },
    { text: '街头被电竞迷认出，来了一场即兴对局', effect: { type: 'gold', value: 150 }, icon: '🏆', choices: [{text:'接受挑战',effect:{type:'gold',value:150}},{text:'友好拒绝',effect:{type:'fans',value:100}}] },
    { text: '在河边散步时灵光一闪，想到了新战术', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '💡', flavor: '"等等，如果这样配合的话..."' },
    { text: '收到了赞助商寄来的新装备', effect: { type: 'stat', stat: '操作', value: 1 }, icon: '📦', flavor: '新键盘手感丝滑' },
    { text: '帮一位迷路的老人找到了家人', effect: { type: 'morale', value: 8 }, icon: '👴', flavor: '老人连声感谢："你们是好孩子！"' },
    { text: '在夜市发现了一个超好玩的套圈游戏', effect: { type: 'stat', stat: '操作', value: 1 }, icon: '🎯', flavor: '"电竞选手的手感就是不一样！"' },
    { text: '队员在网上发布了搞笑视频，意外走红', effect: { type: 'fans', value: 500 }, icon: '😂', flavor: '热搜#电竞选手的日常#' },
    { text: '在书店翻到一本《孙子兵法》，获得战术启发', effect: { type: 'stat', stat: '意识', value: 2 }, icon: '📚', flavor: '"不战而屈人之兵，善之善者也"' },
    { text: '在公园做了一小时冥想训练', effect: { type: 'stat', stat: '心态', value: 2 }, icon: '🧘', flavor: '心态稳了，比赛就稳了' },
];

export function getCityEvents(cityName) {
    return CITY_EVENTS[cityName] || [];
}

export function getRandomEvent(cityName) {
    const citySpecific = CITY_EVENTS[cityName] || [];
    const pool = [...citySpecific, ...citySpecific, ...GENERIC_EVENTS];
    return pool[Math.floor(Math.random() * pool.length)];
}
