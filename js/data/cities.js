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
        routes: [
            { id: 'bj_culture', theme: 'culture', name: '紫禁轴线', desc: '从皇城根到胡同肌理，读懂北京的秩序感', icon: '🏯', nodes: ['gugong', 'changcheng', 'nanluoguxiang', 'houhai'], reward: { type: 'stat', stat: '心态', value: 2 }, badge: { name: '京华文脉', icon: '📜' } },
            { id: 'bj_esports', theme: 'esports', name: '鸟巢夜燃', desc: '主场灯光与粉丝声浪，把肾上腺素拉满', icon: '🎮', nodes: ['niaochao', 'sanlitun', 'houhai'], reward: { type: 'fame', value: 180 }, badge: { name: '帝都主场', icon: '🏟️' } },
            { id: 'bj_walk', theme: 'walk', name: '胡同慢闪', desc: '后海到南锣，用脚步换灵感与松弛', icon: '🚶', nodes: ['houhai', 'nanluoguxiang', 'sanlitun'], reward: { type: 'morale', value: 12 }, badge: { name: '巷陌漫游者', icon: '🧭' } },
        ],
        npcs: [
            { id: 'bj_guide_gugong', name: '故宫志愿讲解员', icon: '🎤', desc: '能把脊兽与战队站位类比成同一张战术图', dialog: ['中轴线就像中路，别轻易让对手“偷高地”。', '太和殿前的开阔地，最适合练“开团站位”。', '看完三大殿，记得喝水——续航比爆发更职业。'], reward: { type: 'fame', value: 120 } },
            { id: 'bj_runner_hutong', name: '胡同闪送骑手', icon: '🛵', desc: '熟悉每条近道，自称“人肉地图插件”', dialog: ['三里屯堵？跟我钻小巷，比换线还快。', '南锣游客多？心态稳住，别被“兵线”裹挟。', '后海夜骑小心别漂移——现实没复活甲。'], reward: { type: 'morale', value: 10 } },
            { id: 'bj_volunteer_nest', name: '鸟巢赛事志愿者', icon: '🦺', desc: '见过太多总决赛散场，最懂掌声背后的疲惫', dialog: ['灯光熄灭后，真正的复盘才开始。', '我在看台见过最稳的打法：先赢自己。', '别只追名场面，细节才决定能不能进决赛。'], reward: { type: 'fans', value: 260 } },
        ],
        quizzes: {
            gugong: [
                { id: 'q_gugong_1', q: '北京故宫（紫禁城）始建于哪个朝代？', options: ['元朝', '明朝', '清朝'], answer: 1, knowledge: '紫禁城始建于明永乐年间，是世界上现存规模最大、保存最完整的木质结构古建筑群之一。' },
                { id: 'q_gugong_2', q: '故宫占地大约多少万平方米？', options: ['约36万', '约72万', '约120万'], answer: 1, knowledge: '故宫占地面积约72万平方米，建筑面积约15万平方米，殿宇宫室九千余间。' },
            ],
            changcheng: [
                { id: 'q_changcheng_1', q: '中国万里长城于哪一年被列入《世界遗产名录》？', options: ['1984年', '1987年', '1992年'], answer: 1, knowledge: '长城于1987年被列入世界文化遗产，是人类历史上持续修筑时间最久的军事防御工程之一。' },
            ],
            niaochao: [
                { id: 'q_niaochao_1', q: '国家体育场“鸟巢”主要承担了哪一届夏季奥运会开闭幕式？', options: ['2000年悉尼', '2004年雅典', '2008年北京'], answer: 2, knowledge: '2008年北京奥运会开闭幕式及田径、足球决赛等在鸟巢举行，使其成为全球知名的奥运地标。' },
            ],
            sanlitun: [
                { id: 'q_sanlitun_1', q: '三里屯因什么历史渊源得名？', options: ['因三里长的人工河', '因距北京内城三里地的屯兵驻地', '因三里宽的旧市场'], answer: 1, knowledge: '三里屯地名与旧时距内城三里左右的屯兵、聚落有关，后发展为北京著名的商业与潮流街区。' },
            ],
        },
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
        routes: [
            { id: 'cd_culture', theme: 'culture', name: '蜀汉智谋线', desc: '武侯祠到宽窄巷子，把历史读成战术手册', icon: '🎋', nodes: ['wuhouci', 'kuanzhai', 'taikoo'], reward: { type: 'stat', stat: '意识', value: 2 }, badge: { name: '锦官城谋士', icon: '🧠' } },
            { id: 'cd_food', theme: 'food', name: '烟火串串线', desc: '宽窄到太古里，辣度与流量一起飙升', icon: '🌶️', nodes: ['kuanzhai', 'taikoo', 'panda'], reward: { type: 'morale', value: 14 }, badge: { name: '巴适吃货', icon: '🍢' } },
            { id: 'cd_walk', theme: 'walk', name: '熊猫治愈线', desc: '先看滚滚再逛巷子，节奏比换线还顺滑', icon: '🐼', nodes: ['panda', 'kuanzhai', 'wuhouci'], reward: { type: 'morale', value: 15 }, badge: { name: '天府慢游', icon: '🍃' } },
        ],
        npcs: [
            { id: 'cd_teahouse', name: '鹤鸣茶社老茶客', icon: '🍵', desc: '盖碗一掀，能把BO5讲成五局三胜的人生哲学', dialog: ['成都打法就一个：稳，不急，等对面失误送温暖。', '火锅要配茶，训练要配歇——续航才是版本答案。', '宽窄巷子别走太快，细节里藏着好节奏。'], reward: { type: 'morale', value: 12 } },
            { id: 'cd_panda_keeper', name: '熊猫基地科普员', icon: '🐼', desc: '专治焦虑，口头禅是“像滚滚一样先吃饱”', dialog: ['压力大？看看熊猫——该睡就睡，别硬扛。', '黑白配色不是随便选的，经典永不过时。', '排队别急，人生很多团都要等最好的时机开。'], reward: { type: 'recovery', value: 18 } },
            { id: 'cd_street_photo', name: '太古里街拍摄影师', icon: '📷', desc: '追光也追热点，认定“出片=出圈”', dialog: ['走位要帅，构图要稳，粉丝才愿意转发。', '潮流变得快，但自信是最百搭的皮肤。', '别躲镜头，职业选手本来就该站在光里。'], reward: { type: 'fame', value: 160 } },
        ],
        quizzes: {
            wuhouci: [
                { id: 'q_wuhouci_1', q: '成都武侯祠最初合祀的是哪两位历史人物？', options: ['刘备与关羽', '刘备与诸葛亮', '诸葛亮与赵云'], answer: 1, knowledge: '武侯祠主体为君臣合祀祠庙，纪念蜀汉昭烈皇帝刘备与忠武侯诸葛亮，是三国文化的重要圣地。' },
            ],
            panda: [
                { id: 'q_panda_1', q: '成都大熊猫繁育研究基地主要保护的是哪种动物？', options: ['小熊猫', '大熊猫', '金丝猴'], answer: 1, knowledge: '基地以大熊猫迁地保护、科研繁育、公众教育为主，是全球知名的大熊猫保护与展示窗口。' },
            ],
            kuanzhai: [
                { id: 'q_kuanzhai_1', q: '“宽窄巷子”由哪三条平行排列的老街组成？', options: ['宽巷子、窄巷子、井巷子', '宽巷子、窄巷子、长巷子', '东巷子、西巷子、井巷子'], answer: 0, knowledge: '宽窄巷子景区由宽巷子、窄巷子、井巷子组成，是成都保存较完整的清朝古街道片区之一。' },
            ],
        },
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
        routes: [
            { id: 'cq_esports', theme: 'esports', name: '两江夜战', desc: '洪崖洞到解放碑，把山城夜景打成主场皮肤', icon: '🌃', nodes: ['hongyadong', 'jiefangbei', 'suodao'], reward: { type: 'fans', value: 320 }, badge: { name: '雾都追光', icon: '✨' } },
            { id: 'cq_culture', theme: 'culture', name: '码头古镇线', desc: '磁器口到洪崖洞，听江风讲老重庆的故事', icon: '🏮', nodes: ['ciqikou', 'hongyadong', 'jiefangbei'], reward: { type: 'stat', stat: '抗压', value: 2 }, badge: { name: '巴渝旧梦', icon: '🧧' } },
            { id: 'cq_walk', theme: 'walk', name: '立体穿城', desc: '索道跨江再回碑中心，用爬升训练心态', icon: '🚠', nodes: ['suodao', 'jiefangbei', 'hongyadong', 'ciqikou'], reward: { type: 'morale', value: 16 }, badge: { name: '8D导航王', icon: '🗺️' } },
        ],
        npcs: [
            { id: 'cq_navigator', name: '山城立体导航员', icon: '🧭', desc: '熟记每一层出口，自称“人肉三维小地图”', dialog: ['在重庆别信直线距离，信楼梯与电梯。', '走错出口别慌，复盘路线比甩锅有用。', '洪崖洞夜景好看，但别挤丢队友——团队游戏。'], reward: { type: 'stat', stat: '意识', value: 1 } },
            { id: 'cq_ropeway', name: '长江索道调度老哥', icon: '🚠', desc: '见过太多恐高的人，最后都学会了深呼吸开团', dialog: ['过江就像换线，时机到了就上。', '缆车里别乱晃——稳，才能带飞。', '江风很硬，心态要比风更硬。'], reward: { type: 'morale', value: 11 } },
            { id: 'cq_hotpot', name: '磁器口火锅摊主', icon: '🍲', desc: '辣度分级比段位还严，劝人“微辣起手”', dialog: ['重庆没有微微辣，只有勇气够不够。', '毛肚七上八下，节奏比连招还重要。', '吃完别急着打团，先让胃赢一把。'], reward: { type: 'fame', value: 140 } },
        ],
        quizzes: {
            hongyadong: [
                { id: 'q_hongyadong_1', q: '洪崖洞民俗风貌区临江而立，毗邻哪条大江？', options: ['嘉陵江', '长江', '乌江'], answer: 1, knowledge: '洪崖洞位于重庆渝中半岛临江区域，长江与嘉陵江在重庆市区交汇，洪崖洞一带临江景观以长江沿岸山城风貌著称。' },
            ],
            suodao: [
                { id: 'q_suodao_1', q: '重庆长江索道最初主要用途是什么？', options: ['旅游观光缆车', '跨江公共交通', '货运索道'], answer: 1, knowledge: '长江索道于1987年投入运行，早期主要作为市民跨江通勤工具，后成为兼具交通与观光功能的城市名片。' },
            ],
            ciqikou: [
                { id: 'q_ciqikou_1', q: '磁器口古镇历史上因何产业兴盛而得名“磁器口”一带？', options: ['瓷器转运与商贸', '铁矿冶炼', '木材集散'], answer: 0, knowledge: '磁器口古称白岩场、龙隐镇等，明清以来因码头商贸繁盛，瓷器等货物转运集聚，逐渐形成今日所知的磁器口古镇风貌。' },
            ],
        },
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
        routes: [
            { id: 'sh_esports', theme: 'esports', name: '魔都主场线', desc: '从外滩灯光到KPL中心，把城市当成赛事舞台', icon: '🏙️', nodes: ['waitan', 'dongfangmingzhu', 'kplcenter'], reward: { type: 'fame', value: 220 }, badge: { name: '浦江争锋', icon: '⚡' } },
            { id: 'sh_culture', theme: 'culture', name: '万国建筑线', desc: '外滩天际线读懂上海百年开放史', icon: '🏛️', nodes: ['waitan', 'dongfangmingzhu', 'kplcenter'], reward: { type: 'stat', stat: '意识', value: 2 }, badge: { name: '海派观察者', icon: '🔭' } },
            { id: 'sh_walk', theme: 'walk', name: '滨江夜行', desc: '江风、塔影与主场心跳，一步一景换节奏', icon: '🌉', nodes: ['dongfangmingzhu', 'waitan', 'kplcenter'], reward: { type: 'morale', value: 13 }, badge: { name: '夜行者', icon: '🌙' } },
        ],
        npcs: [
            { id: 'sh_finance_fan', name: '外滩金融白领玩家', icon: '💼', desc: '午休排位晚上看KPL，把KDA当OKR复盘', dialog: ['节奏要快，但决策要慢——像做风控。', '东方明珠亮起来，说明城市进入“团战模式”。', '别迷信一波，稳健运营才能夺冠区。'], reward: { type: 'fame', value: 150 } },
            { id: 'sh_kpl_staff', name: 'KPL中心场务小姐姐', icon: '🎧', desc: '见过太多后台奔跑的身影，最信“准时就是尊重”', dialog: ['灯光音响就位，选手也该把状态就位。', '主场不是喊出来的，是一局局打出来的。', '粉丝的热情要接住，别让他们等太久。'], reward: { type: 'fans', value: 200 } },
        ],
        quizzes: {
            waitan: [
                { id: 'q_waitan_1', q: '上海外滩“万国建筑博览群”主要形成于哪一历史时期？', options: ['明清海禁时期', '近代开埠后租界建设时期', '改革开放初期'], answer: 1, knowledge: '外滩沿岸集中了近代开埠以来各国风格的金融与公共建筑，是上海作为通商口岸城市发展的缩影。' },
            ],
        },
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
        routes: [
            { id: 'wh_culture', theme: 'culture', name: '江城诗楼线', desc: '黄鹤楼到珞珈山，把诗句走成战队宣言', icon: '🏯', nodes: ['huanghelou', 'wuda', 'hubuxiang'], reward: { type: 'stat', stat: '心态', value: 2 }, badge: { name: '楚天辞客', icon: '📖' } },
            { id: 'wh_food', theme: 'food', name: '过早暴击线', desc: '户部巷烟火打底，再登高望远消化压力', icon: '🍜', nodes: ['hubuxiang', 'huanghelou', 'wuda'], reward: { type: 'morale', value: 15 }, badge: { name: '碳水战神', icon: '🥢' } },
            { id: 'wh_walk', theme: 'walk', name: '珞珈花径', desc: '武大校园慢走，给大脑一次温柔复位', icon: '🌸', nodes: ['wuda', 'hubuxiang', 'huanghelou'], reward: { type: 'morale', value: 16 }, badge: { name: '樱花补给站', icon: '🌿' } },
        ],
        npcs: [
            { id: 'wh_breakfast', name: '户部巷热干面摊主', icon: '🍜', desc: '芝麻酱香气里藏着武汉人的起床号', dialog: ['过早要快，但搅拌要匀——基础功别省。', '辣萝卜配面，就像辅助配射手，绝配。', '吃完再去拼，胃稳手才稳。'], reward: { type: 'morale', value: 12 } },
            { id: 'wh_student', name: '武大樱花季路人学长', icon: '🎓', desc: '每年都在老斋舍前劝人“别只顾拍照忘了看路”', dialog: ['珞珈山的坡，走多了就懂什么叫耐力。', '樱花花期短，窗口期要抓住。', '青春像排位，输了也能下一把再来。'], reward: { type: 'fame', value: 130 } },
            { id: 'wh_poet_fan', name: '黄鹤楼诗词发烧友', icon: '🪶', desc: '能把崔颢名句背成赛前加油稿', dialog: ['昔人已乘黄鹤去？不，传奇还在续写。', '登楼望远，是为了把地图装进心里。', '诗句是古人的复盘，我们是今人的团战。'], reward: { type: 'stat', stat: '心态', value: 1 } },
        ],
        quizzes: {
            huanghelou: [
                { id: 'q_huanghelou_1', q: '“黄鹤一去不复返，白云千载空悠悠”出自哪位唐代诗人笔下？', options: ['李白', '崔颢', '杜甫'], answer: 1, knowledge: '崔颢《黄鹤楼》被誉为唐人七律之首，黄鹤楼也因诗文名世，成为武汉最具代表性的文化地标之一。' },
            ],
            wuda: [
                { id: 'q_wuda_1', q: '武汉大学校史通常上溯至清末张之洞在武昌创办的哪所学堂？', options: ['自强学堂', '三江师范学堂', '京师大学堂'], answer: 0, knowledge: '武汉大学前身可追溯至1893年张之洞创办的自强学堂，后经方言学堂、国立武昌高等师范学校等沿革，1928年组建国立武汉大学。' },
            ],
            hubuxiang: [
                { id: 'q_hubuxiang_1', q: '武汉户部巷的名称主要与历史上的哪类机构相关？', options: ['藩署户部（财税户籍等事务官署）', '武昌造船厂', '江汉关税务司'], answer: 0, knowledge: '户部巷因邻近清代武昌藩署户部司坊一带的巷弄而得名，后发展为著名的汉味小吃聚集地。' },
            ],
        },
    },
    '广州': {
        name: '广州',
        subtitle: '岭南锐气 · 敢为天下先',
        color: '#e85d04',
        landmarks: [
            { id: 'guangzhoutower', name: '广州塔', desc: '小蛮腰上的电竞灯光', reward: { type: 'fame', value: 200 }, unlockCost: 0 },
        ],
        foods: [{ id: 'changfen', name: '肠粉', desc: '早茶必点', effect: '全队状态+8', icon: '🥡' }],
        routes: [
            { id: 'gz_esports', theme: 'esports', name: '小蛮腰夜光', desc: '登顶城市制高点，把珠江夜色打成主场灯牌', icon: '🗼', nodes: ['guangzhoutower'], reward: { type: 'fame', value: 170 }, badge: { name: '花城之光', icon: '✨' } },
            { id: 'gz_walk', theme: 'walk', name: '云端散步', desc: '围绕塔身观景动线，用高空视野换冷静决策', icon: '🚶', nodes: ['guangzhoutower'], reward: { type: 'morale', value: 10 }, badge: { name: '珠江漫步者', icon: '🌉' } },
        ],
        npcs: [
            { id: 'gz_cantonese_tea', name: '早茶阿叔', icon: '🫖', desc: '一盅两件不离手，劝年轻人“先喝茶再开团”', dialog: ['肠粉要趁热，节奏也要趁热，但别烫嘴。', '广州塔亮灯，就像水晶先锋刷新了。', '岭南天热，心态要更凉一点。'], reward: { type: 'morale', value: 9 } },
            { id: 'gz_tower_guide', name: '广州塔讲解员', icon: '🎤', desc: '能把钢结构抗风讲成“走位躲技能”', dialog: ['600米高空的横风，比对面打野还难预测。', '观景台一圈，等于把地图全点亮。', '别只顾拍照，记得感受城市的呼吸。'], reward: { type: 'fame', value: 110 } },
        ],
        quizzes: {
            guangzhoutower: [
                { id: 'q_guangzhoutower_1', q: '广州塔因造型被市民亲切地称作什么？', options: ['小蛮腰', '大蛮腰', '珠江柱'], answer: 0, knowledge: '广州塔塔身纤细扭转，夜景灯光璀璨，常被昵称为“小蛮腰”，是广州的城市地标与观光胜地。' },
            ],
        },
    },
    '深圳': {
        name: '深圳',
        subtitle: '创新之城 · 科技先锋',
        color: '#7209b7',
        landmarks: [
            { id: 'huaqiangbei', name: '华强北', desc: '科技装备升级', reward: { type: 'stat', stat: '操作', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'chaoshaniu', name: '潮汕牛肉', desc: '鲜切牛肉火锅', effect: '全队状态+10', icon: '🥩' }],
        routes: [
            { id: 'sz_esports', theme: 'esports', name: '硬件朝圣路', desc: '在华强北淘外设、换思路，手速跟着电流走', icon: '💻', nodes: ['huaqiangbei'], reward: { type: 'stat', stat: '操作', value: 2 }, badge: { name: '极客先锋', icon: '⚙️' } },
            { id: 'sz_walk', theme: 'walk', name: '赛博逛街', desc: '柜台与柜台之间，练的是观察与决策', icon: '🛍️', nodes: ['huaqiangbei'], reward: { type: 'fame', value: 90 }, badge: { name: '柜台猎手', icon: '🔌' } },
        ],
        npcs: [
            { id: 'sz_hw_vendor', name: '华强北档口老板', icon: '🧰', desc: '一眼看出你是来淘键盘还是来淘人生', dialog: ['参数别堆满，合适才是最强出装。', '深圳节奏快，但质检不能快。', '线材乱了可以理，心态乱了先重启。'], reward: { type: 'stat', stat: '操作', value: 1 } },
            { id: 'sz_startup', name: '科技园熬夜创业者', icon: '☕', desc: '把MVP理解成最小可行产品，也理解成赛场最佳', dialog: ['今晚迭代一版，明天对线更强。', '别和BUG过夜，也别和失误过夜。', '创新之城，最怕不敢试错。'], reward: { type: 'morale', value: 10 } },
        ],
        quizzes: {
            huaqiangbei: [
                { id: 'q_huaqiangbei_1', q: '华强北位于深圳哪个行政区？', options: ['南山区', '福田区', '罗湖区'], answer: 1, knowledge: '华强北位于深圳市福田区，是中国著名的电子信息产品与电子元器件集散商圈之一。' },
            ],
        },
    },
    '杭州': {
        name: '杭州',
        subtitle: '诗画江南 · 电竞新城',
        color: '#d90429',
        landmarks: [
            { id: 'xihu', name: '西湖', desc: '断桥边的坚守与等待', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'dongpomeat', name: '东坡肉', desc: '楼外楼名菜', effect: '士气+10', icon: '🍖' }],
        routes: [
            { id: 'hz_culture', theme: 'culture', name: '西子诗画线', desc: '一湖山色半城湖，把耐心练成运营节奏', icon: '🛶', nodes: ['xihu'], reward: { type: 'stat', stat: '心态', value: 2 }, badge: { name: '白堤听雨', icon: '🌧️' } },
            { id: 'hz_walk', theme: 'walk', name: '湖光慢走', desc: '苏白二堤走一走，给大脑清一波兵线', icon: '🚶', nodes: ['xihu'], reward: { type: 'morale', value: 11 }, badge: { name: '江南慢行', icon: '🍃' } },
        ],
        npcs: [
            { id: 'hz_boatman', name: '西湖摇橹船夫', icon: '⛵', desc: '会说白娘子段子，也会劝人“别急，船到桥头自然直”', dialog: ['西湖水深，心态要更深。', '断桥不断，走散的人也能再集合。', '雷峰塔远看就行，别把自己困塔里。'], reward: { type: 'recovery', value: 14 } },
            { id: 'hz_tea_farmer', name: '龙井村茶农', icon: '🍃', desc: '一杯明前茶，专治赛前手抖', dialog: ['炒茶要火候，打团也要火候。', '杭州的美在慢，慢里藏着狠。', '东坡肉配茶，油腻与清醒都刚刚好。'], reward: { type: 'morale', value: 9 } },
        ],
        quizzes: {
            xihu: [
                { id: 'q_xihu_1', q: '西湖世界文化遗产的核心景观要素“西湖十景”主要形成于哪些历史时期？', options: ['仅唐代', '南宋至清代等历代积淀', '仅明代'], answer: 1, knowledge: '“西湖十景”名号在南宋时期已趋成熟，后世屡有增补与题咏，体现中国风景园林审美与人文传统的长期积淀。' },
            ],
        },
    },
    '西安': {
        name: '西安',
        subtitle: '十三朝古都 · 大器晚成',
        color: '#9b2335',
        landmarks: [
            { id: 'bingmayong', name: '兵马俑', desc: '千军万马的气势', reward: { type: 'stat', stat: '配合', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'roujiamo', name: '肉夹馍', desc: '回民街美味', effect: '全队状态+8', icon: '🥙' }],
        routes: [
            { id: 'xa_culture', theme: 'culture', name: '秦俑军阵线', desc: '站在坑边读懂纪律：千人如一人', icon: '🏺', nodes: ['bingmayong'], reward: { type: 'stat', stat: '配合', value: 2 }, badge: { name: '秦陵守阵人', icon: '🛡️' } },
            { id: 'xa_walk', theme: 'walk', name: '帝陵沉思道', desc: '沿着博物馆动线慢走，把震撼沉淀成专注', icon: '🚶', nodes: ['bingmayong'], reward: { type: 'morale', value: 10 }, badge: { name: '长安行者', icon: '🏜️' } },
        ],
        npcs: [
            { id: 'xa_archaeologist', name: '兵马俑讲解员', icon: '🧑‍🏫', desc: '能把陶俑发型讲成“阵容克制关系”', dialog: ['秦军的强，不在嗓门，在阵列。', '千人千面，团队也需要角色分工。', '地下军团沉默，但气场震耳欲聋。'], reward: { type: 'fame', value: 100 } },
            { id: 'xa_roujiamo', name: '回民街肉夹馍师傅', icon: '🥙', desc: '白吉馍要烙到“虎背菊花心”，才肯夹肉', dialog: ['馍要脆，肉要烂，配合要刚刚好。', '十三朝古都的底气，一口下去就知道。', '别急，好肉值得等三秒收汁。'], reward: { type: 'morale', value: 11 } },
        ],
        quizzes: {
            bingmayong: [
                { id: 'q_bingmayong_1', q: '秦始皇陵兵马俑于哪一年被列入《世界遗产名录》？', options: ['1979年', '1987年', '1994年'], answer: 1, knowledge: '秦始皇陵及兵马俑坑于1987年被列入世界文化遗产，被誉为“世界第八大奇迹”之一。' },
            ],
        },
    },
    '南通': {
        name: '南通',
        subtitle: '江海门户 · 英雄摇篮',
        color: '#2a9d8f',
        landmarks: [
            { id: 'langshan', name: '狼山', desc: '登高望远，心怀天下', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'nantongcake', name: '西亭脆饼', desc: '南通特产', effect: '随机属性+1', icon: '🍪' }],
        routes: [
            { id: 'nt_walk', theme: 'walk', name: '江海一览', desc: '登狼山望远，把长江入海口的开阔装进指挥视野', icon: '⛰️', nodes: ['langshan'], reward: { type: 'stat', stat: '意识', value: 1 }, badge: { name: '江海望远', icon: '🌊' } },
        ],
        npcs: [
            { id: 'nt_hiker', name: '狼山香客老大爷', icon: '🧗', desc: '天天晨练爬坡，信“登高一步，心气一寸”', dialog: ['江风大，别硬顶，学会侧身走位。', '狼山不高，但能教你什么叫坚持。', '看江看海看心态，眼界开了就不慌。'], reward: { type: 'morale', value: 8 } },
        ],
        quizzes: {
            langshan: [
                { id: 'q_langshan_1', q: '南通狼山广教寺被视为佛教中哪尊菩萨的道场？', options: ['文殊菩萨', '大势至菩萨', '普贤菩萨'], answer: 1, knowledge: '狼山广教寺相传为大势至菩萨道场，狼山亦以“江海第一山”闻名，与长江入海口的壮阔景观相映。' },
            ],
        },
    },
    '济南': {
        name: '济南',
        subtitle: '泉城侠义 · 以弱胜强',
        color: '#dc2f02',
        landmarks: [
            { id: 'baotoquan', name: '趵突泉', desc: '天下第一泉的灵动', reward: { type: 'stat', stat: '操作', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'jinanbabing', name: '把子肉', desc: '济南名吃', effect: '士气+8', icon: '🍖' }],
        routes: [
            { id: 'jn_culture', theme: 'culture', name: '泉涌灵动', desc: '趵突腾空三股水，练的是眼到手到的节奏感', icon: '💧', nodes: ['baotoquan'], reward: { type: 'stat', stat: '操作', value: 1 }, badge: { name: '泉城听泉', icon: '🫧' } },
        ],
        npcs: [
            { id: 'jn_spring_guard', name: '趵突泉公园老济南', icon: '🫖', desc: '用泉水泡茶，顺便点评你走位“太硬不够润”', dialog: ['泉眼突突突，你的手也要活。', '济南的泉是冷的，心是热的。', '把子肉配茶，油腻清零，继续上分。'], reward: { type: 'recovery', value: 12 } },
        ],
        quizzes: {
            baotoquan: [
                { id: 'q_baotoquan_1', q: '趵突泉位于济南哪一处著名泉群景区的核心位置？', options: ['大明湖景区', '趵突泉公园', '千佛山景区'], answer: 1, knowledge: '趵突泉位于济南市历下区趵突泉公园内，是济南泉群最具代表性的景观之一，清代康熙南巡曾题“激湍”二字。' },
            ],
        },
    },
    '长沙': {
        name: '长沙',
        subtitle: '娱乐之都 · 青春风暴',
        color: '#e63946',
        landmarks: [
            { id: 'yuelu', name: '岳麓山', desc: '指点江山，激扬文字', reward: { type: 'morale', value: 15 }, unlockCost: 0 },
        ],
        foods: [{ id: 'chouduofu', name: '臭豆腐', desc: '坡子街小吃', effect: '随机1名选手状态+20', icon: '🧈' }],
        routes: [
            { id: 'cs_culture', theme: 'culture', name: '岳麓风云', desc: '爱晚亭前停一停，把“敢为人先”读进气场里', icon: '⛰️', nodes: ['yuelu'], reward: { type: 'morale', value: 12 }, badge: { name: '湘江北去', icon: '🌊' } },
        ],
        npcs: [
            { id: 'cs_streamer', name: '坡子街直播小哥', icon: '📱', desc: '一边吃辣一边解说，号称“嘴强王者”', dialog: ['长沙的夜，比排位赛还热闹。', '臭豆腐闻着冲，入口真香——像逆风翻盘。', '岳麓山爬完，才知道什么叫耐力直播。'], reward: { type: 'fame', value: 95 } },
        ],
        quizzes: {
            yuelu: [
                { id: 'q_yuelu_1', q: '岳麓书院坐落于哪座山下？', options: ['衡山', '岳麓山', '韶山'], answer: 1, knowledge: '岳麓书院位于湖南长沙湘江西岸岳麓山下，是中国古代著名书院之一，被誉为“千年学府”。' },
            ],
        },
    },
    '佛山': {
        name: '佛山',
        subtitle: '武术之城 · 龙之逆鳞',
        color: '#6a040f',
        landmarks: [
            { id: 'zumiao', name: '祖庙', desc: '感悟武术精髓', reward: { type: 'stat', stat: '抗压', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'fosshanfen', name: '佛山扎蹄', desc: '传统美食', effect: '全队状态+8', icon: '🍖' }],
        routes: [
            { id: 'fs_culture', theme: 'culture', name: '岭南武韵', desc: '祖庙黄飞鸿与醒狮精神，把刚猛练成收放', icon: '🦁', nodes: ['zumiao'], reward: { type: 'stat', stat: '抗压', value: 1 }, badge: { name: '醒狮少年', icon: '🥋' } },
        ],
        npcs: [
            { id: 'fs_martial', name: '祖庙醒狮学徒', icon: '🥁', desc: '梅花桩上练平衡，场下练的是团队鼓点', dialog: ['狮头狮尾要同频，打野辅助也要同频。', '祖庙的鼓点一响，全场节奏跟我走。', '佛山无影脚是传说，团队配合才是现实。'], reward: { type: 'morale', value: 10 } },
        ],
        quizzes: {
            zumiao: [
                { id: 'q_zumiao_1', q: '佛山祖庙（北帝庙）主要供奉哪位民间信仰神祇？', options: ['妈祖', '真武大帝（北帝）', '关帝'], answer: 1, knowledge: '佛山祖庙始建于北宋，主祀真武大帝（北帝），是岭南地区重要的民间庙宇与武术文化展示场所之一。' },
            ],
        },
    },
    '苏州': {
        name: '苏州',
        subtitle: '园林之城 · 精巧策略',
        color: '#ff6b00',
        landmarks: [
            { id: 'zhuozheng', name: '拙政园', desc: '园林中悟策略之道', reward: { type: 'stat', stat: '意识', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'songshugui', name: '松鼠桂鱼', desc: '苏帮名菜', effect: '默契+2', icon: '🐟' }],
        routes: [
            { id: 'suz_walk', theme: 'walk', name: '曲径通幽', desc: '借景框景步步为营，园林就是最好的地图教学', icon: '🏞️', nodes: ['zhuozheng'], reward: { type: 'stat', stat: '意识', value: 1 }, badge: { name: '园冶小师', icon: '🎋' } },
        ],
        npcs: [
            { id: 'suz_gardener', name: '拙政园老导游', icon: '🧢', desc: '能把一扇花窗讲成“视野控制与信息差”', dialog: ['园林讲究藏与露，打团也要藏与露。', '一步一景不是慢，是精密计算。', '苏州人的细腻，全在转角那一株树。'], reward: { type: 'fame', value: 85 } },
        ],
        quizzes: {
            zhuozheng: [
                { id: 'q_zhuozheng_1', q: '拙政园始建于哪个朝代？', options: ['唐朝', '明朝', '清朝'], answer: 1, knowledge: '拙政园始建于明代正德年间，以水景布局见长，是中国江南古典园林的代表作之一，被列入世界文化遗产。' },
            ],
        },
    },
    '桐乡': {
        name: '桐乡',
        subtitle: '乌镇智慧 · 黑马传奇',
        color: '#457b9d',
        landmarks: [
            { id: 'wuzhen', name: '乌镇', desc: '水乡中寻找灵感', reward: { type: 'stat', stat: '心态', value: 2 }, unlockCost: 0 },
        ],
        foods: [{ id: 'yanrou', name: '三珍斋酱鸡', desc: '桐乡特产', effect: '全队状态+6', icon: '🍗' }],
        routes: [
            { id: 'tx_culture', theme: 'culture', name: '水乡棋局', desc: '石桥水巷纵横，像棋盘一样训练耐心与预判', icon: '🛶', nodes: ['wuzhen'], reward: { type: 'stat', stat: '心态', value: 1 }, badge: { name: '乌镇棋士', icon: '♟️' } },
        ],
        npcs: [
            { id: 'tx_innkeeper', name: '乌镇民宿老板娘', icon: '🏮', desc: '凌晨听雨修屋顶，白天劝客“慢下来才看得清局势”', dialog: ['水乡路窄，心要宽。', '乌镇互联网大会讲连接，电竞也讲连接。', '酱鸡配粥，稳稳的幸福。'], reward: { type: 'recovery', value: 11 } },
        ],
        quizzes: {
            wuzhen: [
                { id: 'q_wuzhen_1', q: '乌镇景区常被划分为哪两个主要历史街区？', options: ['东栅与西栅', '南栅与北栅', '左栅与右栅'], answer: 0, knowledge: '乌镇旅游开发中以东栅、西栅等片区最为著名，完整保存了江南水乡街巷与水系格局。' },
            ],
        },
    },
    '无锡': {
        name: '无锡',
        subtitle: '太湖明珠 · 破茧成蝶',
        color: '#023e8a',
        landmarks: [
            { id: 'yuantouzhu', name: '鼋头渚', desc: '太湖之畔的宁静', reward: { type: 'recovery', value: 20 }, unlockCost: 0 },
        ],
        foods: [{ id: 'paigu', name: '无锡排骨', desc: '甜糯软烂', effect: '全队状态+6', icon: '🍖' }],
        routes: [
            { id: 'wx_walk', theme: 'walk', name: '太湖樱花季', desc: '长春桥畔走一走，把湖光花影当成赛后冥想', icon: '🌸', nodes: ['yuantouzhu'], reward: { type: 'morale', value: 12 }, badge: { name: '太湖听涛', icon: '🌊' } },
        ],
        npcs: [
            { id: 'wx_taihu', name: '鼋头渚老摄影师', icon: '📷', desc: '专拍长春桥樱花，口头禅是“等风也等光”', dialog: ['太湖大，局势更大，别急对焦。', '樱花一季短，窗口期要抢。', '甜都无锡，生活甜一点，失误少一点。'], reward: { type: 'morale', value: 9 } },
        ],
        quizzes: {
            yuantouzhu: [
                { id: 'q_yuantouzhu_1', q: '“鼋头渚”因何得名？', options: ['因岛上鼋形巨石突入湖中似鼋头', '因古代驯鼋表演', '因盛产鼋肉料理'], answer: 0, knowledge: '鼋头渚位于无锡太湖西北岸，半岛巨石突入湖中形如鼋首昂伸，因而得名，为太湖著名风景名胜区。' },
            ],
        },
    },
};
