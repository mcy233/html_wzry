/**
 * heroes.js - 王者荣耀全英雄数据（自动生成）
 * 共 130 位英雄
 * 数据源: 王者荣耀官方API
 * 英雄头像CDN: https://game.gtimg.cn/images/yxzj/img201606/heroimg/{id}/{id}.jpg
 */

export const HERO_ROLES = {
    warrior:  { name: '战士', icon: '⚔️', color: '#e76f51' },
    mage:     { name: '法师', icon: '🔮', color: '#7209b7' },
    tank:     { name: '坦克', icon: '🛡️', color: '#2a9d8f' },
    assassin: { name: '刺客', icon: '🗡️', color: '#9b2335' },
    marksman: { name: '射手', icon: '🏹', color: '#f4a261' },
    support:  { name: '辅助', icon: '💚', color: '#2ecc71' },
};

export const HERO_IMG_CDN = 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/';

export function heroImgUrl(heroId) {
    return `${HERO_IMG_CDN}${heroId}/${heroId}.jpg`;
}

export function heroImgHTML(heroId, name, size = 48) {
    const url = heroImgUrl(heroId);
    const fallback = name ? name[0] : '?';
    return `<span class="hero-avatar" style="width:${size}px;height:${size}px">
        <img src="${url}" alt="${name}" width="${size}" height="${size}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
             style="border-radius:6px;object-fit:cover"/>
        <span class="hero-avatar-fallback" style="display:none;width:${size}px;height:${size}px">${fallback}</span>
    </span>`;
}

export const HEROES = {
    '廉颇': { id: 105, name: '廉颇', role: 'tank', roles: ['tank'] },
    '小乔': { id: 106, name: '小乔', role: 'mage', roles: ['mage'] },
    '赵云': { id: 107, name: '赵云', role: 'warrior', roles: ['warrior', 'assassin'] },
    '墨子': { id: 108, name: '墨子', role: 'mage', roles: ['mage', 'warrior'] },
    '妲己': { id: 109, name: '妲己', role: 'mage', roles: ['mage'] },
    '嬴政': { id: 110, name: '嬴政', role: 'mage', roles: ['mage'] },
    '孙尚香': { id: 111, name: '孙尚香', role: 'marksman', roles: ['marksman'] },
    '鲁班七号': { id: 112, name: '鲁班七号', role: 'marksman', roles: ['marksman'] },
    '庄周': { id: 113, name: '庄周', role: 'support', roles: ['support', 'tank'] },
    '刘禅': { id: 114, name: '刘禅', role: 'support', roles: ['support', 'tank'] },
    '高渐离': { id: 115, name: '高渐离', role: 'mage', roles: ['mage'] },
    '阿轲': { id: 116, name: '阿轲', role: 'assassin', roles: ['assassin'] },
    '钟无艳': { id: 117, name: '钟无艳', role: 'warrior', roles: ['warrior', 'tank'] },
    '孙膑': { id: 118, name: '孙膑', role: 'support', roles: ['support', 'mage'] },
    '扁鹊': { id: 119, name: '扁鹊', role: 'mage', roles: ['mage', 'warrior'] },
    '白起': { id: 120, name: '白起', role: 'tank', roles: ['tank'] },
    '芈月': { id: 121, name: '芈月', role: 'mage', roles: ['mage', 'warrior'] },
    '吕布': { id: 123, name: '吕布', role: 'warrior', roles: ['warrior', 'tank'] },
    '周瑜': { id: 124, name: '周瑜', role: 'mage', roles: ['mage', 'warrior'] },
    '元歌': { id: 125, name: '元歌', role: 'assassin', roles: ['assassin'] },
    '夏侯惇': { id: 126, name: '夏侯惇', role: 'tank', roles: ['tank', 'warrior'] },
    '甄姬': { id: 127, name: '甄姬', role: 'mage', roles: ['mage'] },
    '曹操': { id: 128, name: '曹操', role: 'warrior', roles: ['warrior'] },
    '典韦': { id: 129, name: '典韦', role: 'warrior', roles: ['warrior'] },
    '宫本武藏': { id: 130, name: '宫本武藏', role: 'warrior', roles: ['warrior', 'assassin'] },
    '李白': { id: 131, name: '李白', role: 'assassin', roles: ['assassin'] },
    '马可波罗': { id: 132, name: '马可波罗', role: 'marksman', roles: ['marksman'] },
    '狄仁杰': { id: 133, name: '狄仁杰', role: 'marksman', roles: ['marksman'] },
    '达摩': { id: 134, name: '达摩', role: 'warrior', roles: ['warrior', 'tank'] },
    '项羽': { id: 135, name: '项羽', role: 'tank', roles: ['tank', 'warrior'] },
    '武则天': { id: 136, name: '武则天', role: 'mage', roles: ['mage'] },
    '司马懿': { id: 137, name: '司马懿', role: 'assassin', roles: ['assassin', 'mage'] },
    '老夫子': { id: 139, name: '老夫子', role: 'warrior', roles: ['warrior'] },
    '关羽': { id: 140, name: '关羽', role: 'warrior', roles: ['warrior', 'tank'] },
    '貂蝉': { id: 141, name: '貂蝉', role: 'mage', roles: ['mage'] },
    '安琪拉': { id: 142, name: '安琪拉', role: 'mage', roles: ['mage'] },
    '程咬金': { id: 144, name: '程咬金', role: 'tank', roles: ['tank'] },
    '露娜': { id: 146, name: '露娜', role: 'assassin', roles: ['assassin', 'mage'] },
    '姜子牙': { id: 148, name: '姜子牙', role: 'mage', roles: ['mage'] },
    '刘邦': { id: 149, name: '刘邦', role: 'tank', roles: ['tank', 'mage'] },
    '韩信': { id: 150, name: '韩信', role: 'assassin', roles: ['assassin'] },
    '孙权': { id: 151, name: '孙权', role: 'marksman', roles: ['marksman'] },
    '王昭君': { id: 152, name: '王昭君', role: 'mage', roles: ['mage'] },
    '兰陵王': { id: 153, name: '兰陵王', role: 'assassin', roles: ['assassin'] },
    '花木兰': { id: 154, name: '花木兰', role: 'warrior', roles: ['warrior'] },
    '艾琳': { id: 155, name: '艾琳', role: 'marksman', roles: ['marksman'] },
    '张良': { id: 156, name: '张良', role: 'mage', roles: ['mage'] },
    '不知火舞': { id: 157, name: '不知火舞', role: 'assassin', roles: ['assassin', 'mage'] },
    '朵莉亚': { id: 159, name: '朵莉亚', role: 'support', roles: ['support', 'mage'] },
    '娜可露露': { id: 162, name: '娜可露露', role: 'assassin', roles: ['assassin'] },
    '橘右京': { id: 163, name: '橘右京', role: 'assassin', roles: ['assassin', 'warrior'] },
    '亚瑟': { id: 166, name: '亚瑟', role: 'warrior', roles: ['warrior', 'tank'] },
    '孙悟空': { id: 167, name: '孙悟空', role: 'assassin', roles: ['assassin'] },
    '牛魔': { id: 168, name: '牛魔', role: 'support', roles: ['support', 'tank'] },
    '后羿': { id: 169, name: '后羿', role: 'marksman', roles: ['marksman'] },
    '刘备': { id: 170, name: '刘备', role: 'warrior', roles: ['warrior'] },
    '张飞': { id: 171, name: '张飞', role: 'tank', roles: ['tank', 'support'] },
    '蚩奼': { id: 172, name: '蚩奼', role: 'warrior', roles: ['warrior'] },
    '李元芳': { id: 173, name: '李元芳', role: 'marksman', roles: ['marksman'] },
    '虞姬': { id: 174, name: '虞姬', role: 'marksman', roles: ['marksman'] },
    '钟馗': { id: 175, name: '钟馗', role: 'support', roles: ['support', 'tank'] },
    '杨玉环': { id: 176, name: '杨玉环', role: 'mage', roles: ['mage'] },
    '苍': { id: 177, name: '苍', role: 'marksman', roles: ['marksman'] },
    '杨戬': { id: 178, name: '杨戬', role: 'warrior', roles: ['warrior'] },
    '女娲': { id: 179, name: '女娲', role: 'mage', roles: ['mage'] },
    '哪吒': { id: 180, name: '哪吒', role: 'warrior', roles: ['warrior', 'tank'] },
    '干将莫邪': { id: 182, name: '干将莫邪', role: 'mage', roles: ['mage'] },
    '雅典娜': { id: 183, name: '雅典娜', role: 'warrior', roles: ['warrior', 'assassin'] },
    '蔡文姬': { id: 184, name: '蔡文姬', role: 'support', roles: ['support', 'mage'] },
    '太乙真人': { id: 186, name: '太乙真人', role: 'support', roles: ['support', 'tank'] },
    '东皇太一': { id: 187, name: '东皇太一', role: 'support', roles: ['support', 'mage'] },
    '大禹': { id: 188, name: '大禹', role: 'support', roles: ['support', 'tank'] },
    '鬼谷子': { id: 189, name: '鬼谷子', role: 'support', roles: ['support', 'mage'] },
    '诸葛亮': { id: 190, name: '诸葛亮', role: 'mage', roles: ['mage'] },
    '大乔': { id: 191, name: '大乔', role: 'support', roles: ['support', 'mage'] },
    '黄忠': { id: 192, name: '黄忠', role: 'marksman', roles: ['marksman'] },
    '铠': { id: 193, name: '铠', role: 'warrior', roles: ['warrior', 'tank'] },
    '苏烈': { id: 194, name: '苏烈', role: 'support', roles: ['support', 'tank'] },
    '百里玄策': { id: 195, name: '百里玄策', role: 'assassin', roles: ['assassin'] },
    '百里守约': { id: 196, name: '百里守约', role: 'marksman', roles: ['marksman', 'assassin'] },
    '弈星': { id: 197, name: '弈星', role: 'mage', roles: ['mage'] },
    '梦奇': { id: 198, name: '梦奇', role: 'tank', roles: ['tank', 'mage'] },
    '公孙离': { id: 199, name: '公孙离', role: 'marksman', roles: ['marksman'] },
    '沈梦溪': { id: 312, name: '沈梦溪', role: 'mage', roles: ['mage'] },
    '明世隐': { id: 501, name: '明世隐', role: 'support', roles: ['support'] },
    '裴擒虎': { id: 502, name: '裴擒虎', role: 'assassin', roles: ['assassin'] },
    '狂铁': { id: 503, name: '狂铁', role: 'warrior', roles: ['warrior', 'tank'] },
    '米莱狄': { id: 504, name: '米莱狄', role: 'mage', roles: ['mage'] },
    '瑶': { id: 505, name: '瑶', role: 'support', roles: ['support', 'mage'] },
    '云中君': { id: 506, name: '云中君', role: 'assassin', roles: ['assassin'] },
    '李信': { id: 507, name: '李信', role: 'warrior', roles: ['warrior'] },
    '伽罗': { id: 508, name: '伽罗', role: 'marksman', roles: ['marksman'] },
    '盾山': { id: 509, name: '盾山', role: 'support', roles: ['support', 'tank'] },
    '孙策': { id: 510, name: '孙策', role: 'tank', roles: ['tank', 'warrior'] },
    '猪八戒': { id: 511, name: '猪八戒', role: 'tank', roles: ['tank'] },
    '上官婉儿': { id: 513, name: '上官婉儿', role: 'mage', roles: ['mage'] },
    '亚连': { id: 514, name: '亚连', role: 'warrior', roles: ['warrior', 'tank'] },
    '嫦娥': { id: 515, name: '嫦娥', role: 'mage', roles: ['mage', 'warrior'] },
    '大司命': { id: 517, name: '大司命', role: 'warrior', roles: ['warrior'] },
    '马超': { id: 518, name: '马超', role: 'warrior', roles: ['warrior'] },
    '敖隐': { id: 519, name: '敖隐', role: 'marksman', roles: ['marksman'] },
    '海月': { id: 521, name: '海月', role: 'mage', roles: ['mage'] },
    '曜': { id: 522, name: '曜', role: 'warrior', roles: ['warrior', 'assassin'] },
    '西施': { id: 523, name: '西施', role: 'mage', roles: ['mage'] },
    '蒙犽': { id: 524, name: '蒙犽', role: 'marksman', roles: ['marksman'] },
    '鲁班大师': { id: 525, name: '鲁班大师', role: 'support', roles: ['support', 'tank'] },
    '蒙恬': { id: 527, name: '蒙恬', role: 'tank', roles: ['tank'] },
    '澜': { id: 528, name: '澜', role: 'assassin', roles: ['assassin', 'warrior'] },
    '盘古': { id: 529, name: '盘古', role: 'warrior', roles: ['warrior'] },
    '镜': { id: 531, name: '镜', role: 'assassin', roles: ['assassin'] },
    '阿古朵': { id: 533, name: '阿古朵', role: 'marksman', roles: ['marksman'] },
    '桑启': { id: 534, name: '桑启', role: 'support', roles: ['support', 'mage'] },
    '夏洛特': { id: 536, name: '夏洛特', role: 'warrior', roles: ['warrior'] },
    '司空震': { id: 537, name: '司空震', role: 'warrior', roles: ['warrior', 'mage'] },
    '云缨': { id: 538, name: '云缨', role: 'warrior', roles: ['warrior', 'assassin'] },
    '金蝉': { id: 540, name: '金蝉', role: 'mage', roles: ['mage'] },
    '暃': { id: 542, name: '暃', role: 'assassin', roles: ['assassin'] },
    '赵怀真': { id: 544, name: '赵怀真', role: 'warrior', roles: ['warrior'] },
    '莱西奥': { id: 545, name: '莱西奥', role: 'marksman', roles: ['marksman'] },
    '戈娅': { id: 548, name: '戈娅', role: 'marksman', roles: ['marksman'] },
    '空空儿': { id: 550, name: '空空儿', role: 'support', roles: ['support'] },
    '影': { id: 558, name: '影', role: 'warrior', roles: ['warrior'] },
    '海诺': { id: 563, name: '海诺', role: 'warrior', roles: ['warrior', 'mage'] },
    '姬小满': { id: 564, name: '姬小满', role: 'warrior', roles: ['warrior'] },
    '少司缘': { id: 577, name: '少司缘', role: 'support', roles: ['support'] },
    '元流之子(坦克)': { id: 581, name: '元流之子(坦克)', role: 'tank', roles: ['tank'] },
    '元流之子(法师)': { id: 582, name: '元流之子(法师)', role: 'mage', roles: ['mage'] },
    '元流之子(刺客)': { id: 583, name: '元流之子(刺客)', role: 'support', roles: ['support'] },
    '元流之子(射手)': { id: 584, name: '元流之子(射手)', role: 'marksman', roles: ['marksman'] },
    '元流之子(辅助)': { id: 585, name: '元流之子(辅助)', role: 'support', roles: ['support'] },
};

export const KPL_META_HEROES = {
    '对抗路': [
        '关羽','马超','花木兰','吕布','夏侯惇','项羽','老夫子','孙策','曜','夏洛特',
        '狂铁','白起','铠','猪八戒','哪吒','亚连','蒙恬','云缨','刘邦','达摩',
        '盘古','李信','杨戬','司空震','赵怀真','海诺','蚩奼','姬小满','廉颇','钟无艳',
        '程咬金','亚瑟','典韦','曹操','刘备','大司命','影',
        // 跨路英雄（也可以打对抗路）
        '芈月','嫦娥','露娜','橘右京','墨子','扁鹊',
    ],
    '打野': [
        '镜','裴擒虎','澜','李白','云中君','娜可露露','赵云','韩信','橘右京',
        '露娜','兰陵王','阿轲','孙悟空','百里玄策','司马懿','元歌','暃','雅典娜',
        '宫本武藏','大司命','影',
        // 跨路英雄（也可以打野）
        '曜','花木兰','马超','云缨','夏洛特','不知火舞',
    ],
    '中路': [
        '貂蝉','诸葛亮','上官婉儿','嬴政','干将莫邪','不知火舞','墨子','嫦娥',
        '西施','武则天','女娲','王昭君','杨玉环','安琪拉','沈梦溪','妲己','海月',
        '弈星','米莱狄','扁鹊','金蝉','周瑜','甄姬','高渐离','张良','姜子牙',
        '小乔','元流之子(法师)',
        // 跨路英雄（也可以走中路）
        '芈月','貂蝉','司马懿','露娜',
    ],
    '发育路': [
        '公孙离','马可波罗','孙尚香','百里守约','后羿','鲁班七号','虞姬','黄忠',
        '伽罗','蒙犽','狄仁杰','李元芳','艾琳','戈娅','莱西奥','敖隐','阿古朵',
        '苍','孙权','元流之子(射手)',
    ],
    '游走': [
        '鬼谷子','张飞','太乙真人','牛魔','大乔','蔡文姬','东皇太一','孙膑','瑶',
        '盾山','鲁班大师','明世隐','刘禅','庄周','钟馗','苏烈','桑启','朵莉亚',
        '大禹','少司缘','空空儿','元流之子(辅助)',
        // 跨路英雄（也可以游走）
        '张良','刘邦','白起','项羽','夏侯惇',
    ],
};

export const COUNTER_DATA = {
    // ========== 对抗路 ==========
    '关羽':   { counters: ['项羽','白起','达摩'], counteredBy: ['夏侯惇','花木兰','老夫子'], bestWith: ['大乔','太乙真人','蔡文姬'] },
    '马超':   { counters: ['花木兰','铠','杨戬'], counteredBy: ['吕布','狂铁','东皇太一'], bestWith: ['鬼谷子','大乔','太乙真人'] },
    '花木兰': { counters: ['关羽','马超','曹操'], counteredBy: ['吕布','老夫子','狂铁'], bestWith: ['牛魔','鬼谷子','张飞'] },
    '吕布':   { counters: ['马超','花木兰','夏洛特'], counteredBy: ['后羿','虞姬','马可波罗'], bestWith: ['张飞','太乙真人','瑶'] },
    '夏侯惇': { counters: ['关羽','曹操','典韦'], counteredBy: ['马超','花木兰','老夫子'], bestWith: ['瑶','蔡文姬','大乔'] },
    '项羽':   { counters: ['后羿','鲁班七号','黄忠'], counteredBy: ['关羽','马超','吕布'], bestWith: ['诸葛亮','干将莫邪','嬴政'] },
    '老夫子': { counters: ['关羽','花木兰','夏洛特'], counteredBy: ['马超','吕布','曜'], bestWith: ['大乔','蔡文姬','太乙真人'] },
    '夏洛特': { counters: ['狂铁','白起','铠'], counteredBy: ['老夫子','吕布','花木兰'], bestWith: ['太乙真人','鬼谷子','瑶'] },
    '曜':     { counters: ['铠','白起','典韦'], counteredBy: ['老夫子','花木兰','吕布'], bestWith: ['鬼谷子','太乙真人','大乔'] },
    '狂铁':   { counters: ['马超','花木兰','关羽'], counteredBy: ['后羿','公孙离','虞姬'], bestWith: ['蔡文姬','瑶','张飞'] },
    '亚连':   { counters: ['白起','项羽','铠'], counteredBy: ['马超','老夫子','花木兰'], bestWith: ['太乙真人','大乔','鬼谷子'] },
    '云缨':   { counters: ['铠','典韦','白起'], counteredBy: ['东皇太一','张良','花木兰'], bestWith: ['牛魔','张飞','鬼谷子'] },
    '海诺':   { counters: ['白起','铠','猪八戒'], counteredBy: ['马超','花木兰','老夫子'], bestWith: ['大乔','瑶','蔡文姬'] },
    '蚩奼':   { counters: ['铠','白起','曹操'], counteredBy: ['花木兰','老夫子','吕布'], bestWith: ['张飞','太乙真人','牛魔'] },
    '姬小满': { counters: ['铠','白起','典韦'], counteredBy: ['老夫子','马超','东皇太一'], bestWith: ['瑶','蔡文姬','大乔'] },
    '白起':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['关羽','马超','花木兰'], bestWith: ['诸葛亮','嬴政','干将莫邪'] },
    '廉颇':   { counters: ['张良','王昭君','后羿'], counteredBy: ['后羿','貂蝉','马超'], bestWith: ['干将莫邪','嬴政','诸葛亮'] },
    '铠':     { counters: ['后羿','鲁班七号','黄忠'], counteredBy: ['马超','夏洛特','花木兰'], bestWith: ['蔡文姬','瑶','太乙真人'] },

    // ========== 打野 ==========
    '镜':     { counters: ['后羿','鲁班七号','干将莫邪'], counteredBy: ['东皇太一','张飞','张良'], bestWith: ['蔡文姬','瑶','大乔'] },
    '裴擒虎': { counters: ['嬴政','干将莫邪','安琪拉'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['牛魔','张飞','鬼谷子'] },
    '澜':     { counters: ['公孙离','马可波罗','后羿'], counteredBy: ['张飞','太乙真人','东皇太一'], bestWith: ['鬼谷子','牛魔','大乔'] },
    '李白':   { counters: ['干将莫邪','嬴政','安琪拉'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['太乙真人','鬼谷子','蔡文姬'] },
    '云中君': { counters: ['后羿','鲁班七号','嬴政'], counteredBy: ['东皇太一','钟馗','张飞'], bestWith: ['鬼谷子','牛魔','张飞'] },
    '赵云':   { counters: ['后羿','鲁班七号','嬴政'], counteredBy: ['东皇太一','张良','花木兰'], bestWith: ['张飞','太乙真人','牛魔'] },
    '韩信':   { counters: ['后羿','干将莫邪','嬴政'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['张飞','鬼谷子','牛魔'] },
    '露娜':   { counters: ['后羿','鲁班七号','嬴政'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['蔡文姬','太乙真人','张飞'] },
    '百里玄策': { counters: ['嬴政','干将莫邪','安琪拉'], counteredBy: ['东皇太一','张飞','张良'], bestWith: ['鬼谷子','牛魔','太乙真人'] },
    '司马懿': { counters: ['干将莫邪','嬴政','诸葛亮'], counteredBy: ['东皇太一','张良','花木兰'], bestWith: ['鬼谷子','太乙真人','张飞'] },
    '元歌':   { counters: ['后羿','鲁班七号','嬴政'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['太乙真人','蔡文姬','鬼谷子'] },
    '娜可露露': { counters: ['后羿','鲁班七号','安琪拉'], counteredBy: ['东皇太一','张飞','张良'], bestWith: ['鬼谷子','牛魔','太乙真人'] },
    '阿轲':   { counters: ['后羿','鲁班七号','安琪拉'], counteredBy: ['张飞','东皇太一','牛魔'], bestWith: ['鬼谷子','明世隐','太乙真人'] },
    '兰陵王': { counters: ['诸葛亮','嬴政','干将莫邪'], counteredBy: ['东皇太一','张飞','鬼谷子'], bestWith: ['牛魔','太乙真人','张飞'] },

    // ========== 中路 ==========
    '貂蝉':   { counters: ['廉颇','项羽','白起'], counteredBy: ['诸葛亮','嬴政','干将莫邪'], bestWith: ['太乙真人','蔡文姬','牛魔'] },
    '诸葛亮': { counters: ['貂蝉','露娜','不知火舞'], counteredBy: ['兰陵王','司马懿','澜'], bestWith: ['张飞','太乙真人','鬼谷子'] },
    '上官婉儿': { counters: ['嬴政','干将莫邪','后羿'], counteredBy: ['东皇太一','钟馗','张良'], bestWith: ['太乙真人','蔡文姬','鬼谷子'] },
    '西施':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['诸葛亮','司马懿','兰陵王'], bestWith: ['张飞','牛魔','太乙真人'] },
    '干将莫邪': { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','司马懿'], bestWith: ['项羽','张飞','太乙真人'] },
    '不知火舞': { counters: ['嬴政','干将莫邪','安琪拉'], counteredBy: ['东皇太一','张良','钟馗'], bestWith: ['太乙真人','蔡文姬','鬼谷子'] },
    '嬴政':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','李白'], bestWith: ['张飞','太乙真人','牛魔'] },
    '海月':   { counters: ['后羿','嬴政','干将莫邪'], counteredBy: ['诸葛亮','司马懿','兰陵王'], bestWith: ['太乙真人','张飞','鬼谷子'] },
    '女娲':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','太乙真人','牛魔'] },
    '王昭君': { counters: ['廉颇','项羽','白起'], counteredBy: ['镜','澜','司马懿'], bestWith: ['张飞','牛魔','太乙真人'] },
    '嫦娥':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['马超','花木兰','关羽'], bestWith: ['蔡文姬','太乙真人','瑶'] },
    '张良':   { counters: ['镜','李白','韩信'], counteredBy: ['诸葛亮','司马懿','兰陵王'], bestWith: ['张飞','牛魔','太乙真人'] },
    '金蝉':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','司马懿'], bestWith: ['张飞','太乙真人','牛魔'] },

    // ========== 发育路 ==========
    '公孙离': { counters: ['伽罗','后羿','鲁班七号'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','太乙真人','瑶'] },
    '马可波罗': { counters: ['鲁班七号','后羿','伽罗'], counteredBy: ['澜','镜','兰陵王'], bestWith: ['鬼谷子','太乙真人','张飞'] },
    '孙尚香': { counters: ['伽罗','后羿','黄忠'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','太乙真人','蔡文姬'] },
    '后羿':   { counters: ['吕布','廉颇','白起'], counteredBy: ['镜','赵云','澜'], bestWith: ['张飞','太乙真人','蔡文姬'] },
    '虞姬':   { counters: ['吕布','铠','关羽'], counteredBy: ['镜','澜','诸葛亮'], bestWith: ['张飞','太乙真人','蔡文姬'] },
    '敖隐':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','东皇太一'], bestWith: ['太乙真人','张飞','瑶'] },
    '戈娅':   { counters: ['伽罗','后羿','黄忠'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','太乙真人','瑶'] },
    '狄仁杰': { counters: ['东皇太一','张良','钟馗'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','太乙真人','蔡文姬'] },
    '孙权':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['东皇太一','张良','镜'], bestWith: ['太乙真人','张飞','鬼谷子'] },
    '艾琳':   { counters: ['后羿','鲁班七号','伽罗'], counteredBy: ['镜','澜','兰陵王'], bestWith: ['张飞','蔡文姬','瑶'] },

    // ========== 游走 ==========
    '鬼谷子': { counters: ['蔡文姬','孙膑','明世隐'], counteredBy: ['明世隐','东皇太一','庄周'], bestWith: ['澜','镜','马超'] },
    '张飞':   { counters: ['镜','澜','李白'], counteredBy: ['鬼谷子','牛魔','东皇太一'], bestWith: ['后羿','鲁班七号','干将莫邪'] },
    '太乙真人': { counters: ['澜','镜','李白'], counteredBy: ['干将莫邪','嬴政','马可波罗'], bestWith: ['关羽','花木兰','马超'] },
    '牛魔':   { counters: ['镜','澜','李白'], counteredBy: ['鬼谷子','东皇太一','庄周'], bestWith: ['诸葛亮','嬴政','干将莫邪'] },
    '大乔':   { counters: ['东皇太一','钟馗','张良'], counteredBy: ['澜','镜','兰陵王'], bestWith: ['关羽','马超','老夫子'] },
    '东皇太一': { counters: ['镜','李白','韩信'], counteredBy: ['孙膑','大乔','庄周'], bestWith: ['诸葛亮','嬴政','干将莫邪'] },
    '瑶':     { counters: ['镜','澜','李白'], counteredBy: ['鬼谷子','东皇太一','钟馗'], bestWith: ['公孙离','马可波罗','马超'] },
    '蔡文姬': { counters: ['澜','镜','李白'], counteredBy: ['鬼谷子','牛魔','东皇太一'], bestWith: ['关羽','花木兰','吕布'] },
    '庄周':   { counters: ['东皇太一','张良','钟馗'], counteredBy: ['干将莫邪','嬴政','诸葛亮'], bestWith: ['关羽','花木兰','马超'] },
};

export const PLAYER_HERO_POOLS = {
    // ======== 北京WB ========
    '梓墨': ['关羽', '马超', '花木兰', '孙策', '夏洛特', '吕布'],          // TOP
    '雨寂': ['夏侯惇', '项羽', '老夫子', '白起'],                          // TOP(替补)
    '暖阳': ['镜', '裴擒虎', '澜', '曜', '赵云', '云中君'],                // JG
    '丞丞': ['赵云', '云中君', '娜可露露', '韩信'],                         // JG(替补)
    '听悦': ['貂蝉', '诸葛亮', '上官婉儿', '司马懿', '西施'],               // MID
    '果冻': ['嬴政', '墨子', '不知火舞', '王昭君'],                         // MID(替补)
    '小麦': ['公孙离', '马可波罗', '孙尚香', '百里守约', '伽罗'],            // ADC
    '乔兮': ['后羿', '鲁班七号', '孙尚香', '虞姬'],                         // ADC(替补)
    '玖欣': ['鬼谷子', '太乙真人', '张飞', '牛魔', '大乔'],                 // SUP

    // ======== 北京JDG ========
    '轻语': ['关羽', '吕布', '夏侯惇', '花木兰', '老夫子', '狂铁'],         // TOP
    '无双': ['镜', '李白', '澜', '曜', '云中君'],                          // JG
    '清融': ['貂蝉', '诸葛亮', '上官婉儿', '不知火舞', '西施', '嬴政'],      // MID
    '絕意': ['公孙离', '马可波罗', '后羿', '虞姬', '孙尚香'],               // ADC
    '无畏': ['鬼谷子', '太乙真人', '张飞', '大乔', '瑶'],                   // SUP

    // ======== 成都AG超玩会 ========
    '轩染': ['关羽', '马超', '花木兰', '夏洛特', '老夫子', '吕布'],          // TOP
    '北诗': ['夏侯惇', '项羽', '白起', '老夫子'],                          // TOP(替补)
    '钟意': ['镜', '澜', '赵云', '裴擒虎', '韩信', '云中君'],               // JG
    '长生': ['貂蝉', '诸葛亮', '上官婉儿', '不知火舞', '嬴政'],             // MID
    '一诺': ['公孙离', '马可波罗', '孙尚香', '百里守约', '伽罗'],            // ADC
    '小俞': ['后羿', '鲁班七号', '孙尚香', '虞姬'],                         // ADC(替补)
    '大帅': ['鬼谷子', '张飞', '太乙真人', '牛魔', '瑶'],                   // SUP

    // ======== 重庆狼队 ========
    '归期': ['关羽', '花木兰', '夏洛特', '吕布', '老夫子', '马超'],          // TOP
    '小胖': ['镜', '澜', '李白', '裴擒虎', '赵云', '韩信'],                // JG
    '紫幻': ['貂蝉', '上官婉儿', '司马懿', '诸葛亮', '西施'],               // MID
    '道崽': ['公孙离', '马可波罗', '孙尚香', '后羿', '伽罗', '虞姬'],       // ADC
    '信':   ['鬼谷子', '太乙真人', '张飞', '大乔', '牛魔'],                 // SUP
    '晚星': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP(替补)

    // ======== 武汉eStarPro ========
    'Fly':  ['关羽', '花木兰', '马超', '夏洛特', '吕布'],                   // TOP
    '小楼': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    'Ming': ['诸葛亮', '嬴政', '不知火舞', '王昭君', '貂蝉'],               // MID
    '亮宇': ['后羿', '鲁班七号', '孙尚香', '虞姬'],                         // ADC
    '紫渊': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== KSG ========
    '流星': ['关羽', '花木兰', '吕布', '老夫子', '狂铁'],                   // TOP
    '句号': ['镜', '澜', '裴擒虎', '赵云', '韩信'],                        // JG
    '流浪': ['貂蝉', '诸葛亮', '上官婉儿', '西施', '不知火舞', '嬴政'],      // MID
    '风箫': ['公孙离', '马可波罗', '孙尚香', '后羿', '伽罗'],               // ADC
    '一笙': ['鬼谷子', '太乙真人', '张飞', '大乔', '瑶'],                   // SUP

    // ======== 上海RNG.M ========
    '樱花': ['关羽', '花木兰', '吕布', '夏洛特', '老夫子'],                 // TOP
    '赤辰': ['赵云', '裴擒虎', '云中君', '韩信', '娜可露露'],               // JG
    '雨空': ['诸葛亮', '嬴政', '貂蝉', '不知火舞'],                         // MID
    '极光': ['后羿', '孙尚香', '马可波罗', '鲁班七号'],                      // ADC
    '久酷': ['张飞', '牛魔', '太乙真人', '蔡文姬'],                         // SUP

    // ======== 上海EDG.M ========
    '小泽': ['关羽', '吕布', '花木兰', '老夫子'],                           // TOP
    '夏凌': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    '花卷': ['诸葛亮', '貂蝉', '不知火舞', '嬴政'],                         // MID
    '鸣鸣': ['后羿', '孙尚香', '鲁班七号', '虞姬'],                         // ADC
    '涛':   ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 广州TTG ========
    '萝卜': ['关羽', '花木兰', '马超', '吕布', '夏洛特'],                   // TOP
    '佳心': ['镜', '赵云', '裴擒虎', '韩信', '澜'],                        // JG
    '鹤辞': ['诸葛亮', '貂蝉', '上官婉儿', '嬴政', '不知火舞'],             // MID
    '小雪': ['公孙离', '马可波罗', '孙尚香', '后羿', '伽罗'],               // ADC
    '涵':   ['鬼谷子', '张飞', '太乙真人', '牛魔'],                         // SUP

    // ======== 深圳DYG ========
    '小乐': ['关羽', '花木兰', '吕布', '老夫子', '夏洛特'],                 // TOP
    '小轩': ['镜', '赵云', '裴擒虎', '澜', '大司命'],                      // JG
    '向鱼': ['诸葛亮', '貂蝉', '武则天', '西施', '上官婉儿'],               // MID
    '钎城': ['公孙离', '马可波罗', '孙尚香', '后羿'],                       // ADC
    '落空': ['鬼谷子', '张飞', '太乙真人', '大乔'],                         // SUP

    // ======== 南通Hero久竞 ========
    '坦然': ['关羽', '花木兰', '马超', '夏洛特', '吕布', '老夫子'],          // TOP
    '落尘': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    '玖熙': ['诸葛亮', '嬴政', '貂蝉', '不知火舞'],                         // MID
    '妖刀': ['公孙离', '马可波罗', '后羿', '孙尚香'],                       // ADC
    '白清': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 济南RW侠 ========
    '小度': ['关羽', '吕布', '花木兰', '老夫子'],                           // TOP
    '今屿': ['赵云', '裴擒虎', '澜', '韩信', '云中君'],                    // JG
    '挽墨': ['诸葛亮', '嬴政', '貂蝉', '不知火舞'],                         // MID
    '佩恩': ['后羿', '孙尚香', '马可波罗', '鲁班七号'],                      // ADC
    '梦溪': ['张飞', '太乙真人', '鬼谷子', '牛魔'],                         // SUP

    // ======== 杭州LGD.NBW ========
    '小落': ['关羽', '花木兰', '吕布', '老夫子'],                           // TOP
    '米苏': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    '九尾': ['诸葛亮', '貂蝉', '上官婉儿', '嬴政', '西施'],                 // MID
    '小涵': ['后羿', '孙尚香', '马可波罗', '鲁班七号'],                      // ADC
    '小崽': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 西安WE ========
    '文涛': ['关羽', '吕布', '花木兰', '老夫子'],                           // TOP
    '子意': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    '明崽': ['诸葛亮', '嬴政', '貂蝉', '不知火舞'],                         // MID
    '昭珏': ['后羿', '孙尚香', '鲁班七号', '虞姬'],                         // ADC
    '九幽': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 长沙TES.A (与TTG共用选手，此处仅补充独有选手) ========
    '阿豆': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 佛山DRG ========
    '花缘': ['关羽', '花木兰', '吕布', '马超', '老夫子'],                   // TOP
    '小小阳': ['赵云', '裴擒虎', '韩信', '云中君'],                         // JG
    '柚子': ['诸葛亮', '貂蝉', '嬴政', '不知火舞'],                         // MID
    '梦岚': ['后羿', '孙尚香', '马可波罗', '鲁班七号'],                      // ADC
    '呆呆': ['张飞', '太乙真人', '鬼谷子', '牛魔'],                         // SUP

    // ======== 桐乡情久 ========
    '无玄': ['关羽', '吕布', '花木兰', '老夫子'],                           // TOP
    '深巅': ['赵云', '裴擒虎', '韩信', '云中君'],                           // JG
    '久寒': ['诸葛亮', '嬴政', '貂蝉', '不知火舞'],                         // MID
    '陌冷': ['后羿', '孙尚香', '鲁班七号', '虞姬'],                         // ADC
    '楠枫': ['张飞', '太乙真人', '牛魔', '蔡文姬'],                         // SUP

    // ======== 无锡TCG ========
    '大海': ['关羽', '吕布', '夏侯惇', '花木兰'],                           // TOP
    '安凉': ['赵云', '裴擒虎', '云中君', '韩信'],                           // JG
    '清弦': ['诸葛亮', '嬴政', '不知火舞', '王昭君'],                       // MID
    '北觅': ['后羿', '鲁班七号', '孙尚香', '狄仁杰'],                       // ADC
    '数字': ['牛魔', '张飞', '蔡文姬', '太乙真人'],                         // SUP

    // ======== 默认英雄池（兜底） ========
    '_default_对抗路': ['关羽', '吕布', '夏侯惇', '花木兰'],
    '_default_打野': ['赵云', '裴擒虎', '云中君', '韩信'],
    '_default_中路': ['诸葛亮', '嬴政', '不知火舞', '王昭君'],
    '_default_发育路': ['后羿', '鲁班七号', '孙尚香', '狄仁杰'],
    '_default_游走': ['牛魔', '张飞', '蔡文姬', '太乙真人'],
};

export function getPlayerHeroes(playerId, role) {
    return PLAYER_HERO_POOLS[playerId] || PLAYER_HERO_POOLS[`_default_${role}`] || [];
}

export function getHero(heroName) {
    return HEROES[heroName] || null;
}

export function getCounterInfo(heroName) {
    return COUNTER_DATA[heroName] || { counters: [], counteredBy: [] };
}

export function getHeroesForPosition(position) {
    return KPL_META_HEROES[position] || [];
}

/**
 * 评估阵容强度
 */
export function evaluateComp(picks) {
    const heroes = picks.map(h => HEROES[h]).filter(Boolean);
    if (!heroes.length) return { avgPower: 0, types: {}, synergy: 0, desc: '无阵容' };
    const types = {};
    heroes.forEach(h => { types[h.role] = (types[h.role] || 0) + 1; });
    const hasWarrior = types.warrior > 0 || types.tank > 0;
    const hasAssassin = types.assassin > 0;
    const hasMage = types.mage > 0;
    const hasMarksman = types.marksman > 0;
    const hasSupport = types.support > 0;
    let synergy = 0;
    if (hasWarrior) synergy += 3;
    if (hasMage) synergy += 3;
    if (hasMarksman) synergy += 4;
    if (hasSupport) synergy += 3;
    if (Object.keys(types).length >= 3) synergy += 2;
    const desc = [];
    if (types.assassin >= 2) desc.push('双刺阵容');
    if (types.tank >= 2) desc.push('双坦阵容');
    if (hasMarksman && hasSupport) desc.push('保射体系');
    if (hasAssassin && hasMage) desc.push('双C阵容');
    return { avgPower: 0, types, synergy, desc: desc.join(', ') || '均衡阵容' };
}

