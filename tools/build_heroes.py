"""
build_heroes.py - 从王者荣耀API数据生成完整英雄数据文件
同时下载英雄头像到 resources/heroes/ 目录
"""
import json, os, sys, urllib.request, ssl, time

HERO_RAW = {"廉颇":"105|3","小乔":"106|2","赵云":"107|1|4","墨子":"108|2|1","妲己":"109|2","嬴政":"110|2","孙尚香":"111|5","鲁班七号":"112|5","庄周":"113|6|3","刘禅":"114|6|3","高渐离":"115|2","阿轲":"116|4","钟无艳":"117|1|3","孙膑":"118|6|2","扁鹊":"119|2|1","白起":"120|3","芈月":"121|2|1","吕布":"123|1|3","周瑜":"124|2|1","夏侯惇":"126|3|1","甄姬":"127|2","曹操":"128|1","典韦":"129|1","宫本武藏":"130|1|4","李白":"131|4","马可波罗":"132|5","狄仁杰":"133|5","达摩":"134|1|3","项羽":"135|3|1","武则天":"136|2","老夫子":"139|1","关羽":"140|1|3","貂蝉":"141|2","安琪拉":"142|2","程咬金":"144|3","露娜":"146|4|2","姜子牙":"148|2","刘邦":"149|3|2","韩信":"150|4","王昭君":"152|2","兰陵王":"153|4","花木兰":"154|1","张良":"156|2","不知火舞":"157|4|2","娜可露露":"162|4","橘右京":"163|4|1","亚瑟":"166|1|3","孙悟空":"167|4","牛魔":"168|6|3","后羿":"169|5","刘备":"170|1","张飞":"171|3|6","李元芳":"173|5","虞姬":"174|5","钟馗":"175|6|3","杨戬":"178|1","雅典娜":"183|1|4","蔡文姬":"184|6|2","太乙真人":"186|6|3","哪吒":"180|1|3","诸葛亮":"190|2","黄忠":"192|5","大乔":"191|6|2","东皇太一":"187|6|2","干将莫邪":"182|2","鬼谷子":"189|6|2","铠":"193|1|3","百里守约":"196|5|4","百里玄策":"195|4","苏烈":"194|6|3","梦奇":"198|3|2","女娲":"179|2","明世隐":"501|6","公孙离":"199|5","杨玉环":"176|2","裴擒虎":"502|4","弈星":"197|2","狂铁":"503|1|3","米莱狄":"504|2","元歌":"125|4","孙策":"510|3|1","司马懿":"137|4|2","盾山":"509|6|3","伽罗":"508|5","沈梦溪":"312|2","李信":"507|1","上官婉儿":"513|2","嫦娥":"515|2|1","猪八戒":"511|3","盘古":"529|1","瑶":"505|6|2","云中君":"506|4","曜":"522|1|4","马超":"518|1","西施":"523|2","鲁班大师":"525|6|3","蒙犽":"524|5","镜":"531|4","蒙恬":"527|3","阿古朵":"533|5","夏洛特":"536|1","澜":"528|4|1","司空震":"537|1|2","艾琳":"155|5","云缨":"538|1|4","金蝉":"540|2","暃":"542|4","桑启":"534|6|2","戈娅":"548|5","海月":"521|2","赵怀真":"544|1","莱西奥":"545|5","姬小满":"564|1","亚连":"514|1|3","朵莉亚":"159|6|2","海诺":"563|1|2","敖隐":"519|5","大司命":"517|1","元流之子(法师)":"582|2","元流之子(坦克)":"581|3","少司缘":"577|6","影":"558|1","苍":"177|5","空空儿":"550|6","元流之子(射手)":"584|5","孙权":"151|5","蚩奼":"172|1","元流之子(辅助)":"585|6","大禹":"188|6|3","元流之子(刺客)":"583|6"}

ROLE_MAP = {
    '1': 'warrior',   # 战士
    '2': 'mage',      # 法师
    '3': 'tank',      # 坦克
    '4': 'assassin',  # 刺客
    '5': 'marksman',  # 射手
    '6': 'support',   # 辅助
}

ROLE_CN = {
    'warrior': '战士', 'mage': '法师', 'tank': '坦克',
    'assassin': '刺客', 'marksman': '射手', 'support': '辅助',
}

# 头像CDN地址（官方地址）
def hero_avatar_url(hero_id):
    return f"https://game.gtimg.cn/images/yxzj/img201606/heroimg/{hero_id}/{hero_id}.jpg"

def parse_heroes():
    heroes = []
    for name, raw in HERO_RAW.items():
        parts = raw.split('|')
        hero_id = int(parts[0])
        roles = [ROLE_MAP.get(r, 'warrior') for r in parts[1:]]
        primary = roles[0] if roles else 'warrior'
        heroes.append({
            'name': name,
            'id': hero_id,
            'primary_role': primary,
            'roles': roles,
            'avatar_url': hero_avatar_url(hero_id),
        })
    heroes.sort(key=lambda h: h['id'])
    return heroes

def download_avatars(heroes, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    success = 0
    fail = 0
    for h in heroes:
        fname = os.path.join(out_dir, f"{h['id']}.jpg")
        if os.path.exists(fname):
            success += 1
            continue
        try:
            req = urllib.request.Request(h['avatar_url'], headers={'User-Agent': 'Mozilla/5.0'})
            resp = urllib.request.urlopen(req, timeout=10, context=ctx)
            data = resp.read()
            if len(data) > 500:
                with open(fname, 'wb') as f:
                    f.write(data)
                success += 1
                print(f"  OK: {h['name']} ({h['id']})")
            else:
                fail += 1
                print(f"  SKIP (too small): {h['name']}")
        except Exception as e:
            fail += 1
            print(f"  FAIL: {h['name']} - {e}")
        time.sleep(0.1)
    print(f"\nDownloaded: {success} success, {fail} fail")

def generate_js(heroes, outfile):
    lines = [
        "/**",
        " * heroes.js - 王者荣耀全英雄数据（自动生成）",
        f" * 共 {len(heroes)} 位英雄",
        " * 数据源: 王者荣耀官方API",
        " * 英雄头像CDN: https://game.gtimg.cn/images/yxzj/img201606/heroimg/{id}/{id}.jpg",
        " */",
        "",
        "export const HERO_ROLES = {",
        "    warrior:  { name: '战士', icon: '⚔️', color: '#e76f51' },",
        "    mage:     { name: '法师', icon: '🔮', color: '#7209b7' },",
        "    tank:     { name: '坦克', icon: '🛡️', color: '#2a9d8f' },",
        "    assassin: { name: '刺客', icon: '🗡️', color: '#9b2335' },",
        "    marksman: { name: '射手', icon: '🏹', color: '#f4a261' },",
        "    support:  { name: '辅助', icon: '💚', color: '#2ecc71' },",
        "};",
        "",
        "export const HERO_IMG_CDN = 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/';",
        "",
        "export function heroImgUrl(heroId) {",
        "    return `${HERO_IMG_CDN}${heroId}/${heroId}.jpg`;",
        "}",
        "",
        "export function heroImgHTML(heroId, name, size = 48) {",
        "    const url = heroImgUrl(heroId);",
        "    const fallback = name ? name[0] : '?';",
        "    return `<span class=\"hero-avatar\" style=\"width:${size}px;height:${size}px\">",
        "        <img src=\"${url}\" alt=\"${name}\" width=\"${size}\" height=\"${size}\"",
        "             onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\"",
        "             style=\"border-radius:6px;object-fit:cover\"/>",
        "        <span class=\"hero-avatar-fallback\" style=\"display:none;width:${size}px;height:${size}px\">${fallback}</span>",
        "    </span>`;",
        "}",
        "",
        "export const HEROES = {",
    ]
    for h in heroes:
        roles_str = ', '.join([f"'{r}'" for r in h['roles']])
        lines.append(f"    '{h['name']}': {{ id: {h['id']}, name: '{h['name']}', role: '{h['primary_role']}', roles: [{roles_str}] }},")
    lines.append("};")
    lines.append("")

    # KPL常用英雄分组 - 用于BP
    lines.append("export const KPL_META_HEROES = {")
    lines.append("    '对抗路': ['关羽','马超','花木兰','吕布','夏侯惇','项羽','老夫子','孙策','曜','夏洛特','狂铁','白起','铠','芈月','猪八戒','哪吒','亚连','蒙恬','云缨','刘邦','达摩','盘古','李信','杨戬','司空震','赵怀真','海诺','蚩奼','姬小满'],")
    lines.append("    '打野':   ['镜','裴擒虎','澜','李白','云中君','娜可露露','曜','赵云','韩信','橘右京','露娜','兰陵王','阿轲','孙悟空','百里玄策','司马懿','元歌','暃','雅典娜','宫本武藏','大司命','影'],")
    lines.append("    '中路':   ['貂蝉','诸葛亮','上官婉儿','嬴政','干将莫邪','不知火舞','司马懿','墨子','嫦娥','西施','武则天','女娲','王昭君','杨玉环','安琪拉','沈梦溪','妲己','海月','弈星','米莱狄','扁鹊','金蝉','周瑜','甄姬','高渐离','张良','姜子牙','芈月'],")
    lines.append("    '发育路': ['公孙离','马可波罗','孙尚香','百里守约','后羿','鲁班七号','虞姬','黄忠','伽罗','蒙犽','狄仁杰','李元芳','艾琳','戈娅','莱西奥','敖隐','阿古朵','苍','孙权'],")
    lines.append("    '游走':   ['鬼谷子','张飞','太乙真人','牛魔','大乔','蔡文姬','东皇太一','孙膑','瑶','盾山','鲁班大师','明世隐','刘禅','庄周','钟馗','苏烈','桑启','朵莉亚','大禹','少司缘','空空儿'],")
    lines.append("};")
    lines.append("")

    # 克制关系
    lines.append("export const COUNTER_DATA = {")
    lines.append("    '廉颇': { counters: ['张良','王昭君'], counteredBy: ['后羿','貂蝉'] },")
    lines.append("    '赵云': { counters: ['后羿','鲁班七号'], counteredBy: ['东皇太一','张良'] },")
    lines.append("    '关羽': { counters: ['项羽','白起'], counteredBy: ['夏侯惇','花木兰'] },")
    lines.append("    '花木兰': { counters: ['关羽','马超'], counteredBy: ['吕布','老夫子'] },")
    lines.append("    '马超': { counters: ['花木兰','铠'], counteredBy: ['吕布','狂铁'] },")
    lines.append("    '吕布': { counters: ['马超','花木兰'], counteredBy: ['后羿','虞姬'] },")
    lines.append("    '镜': { counters: ['后羿','鲁班七号'], counteredBy: ['东皇太一','张飞'] },")
    lines.append("    '李白': { counters: ['干将莫邪','嬴政'], counteredBy: ['东皇太一','张良'] },")
    lines.append("    '澜': { counters: ['公孙离','马可波罗'], counteredBy: ['张飞','太乙真人'] },")
    lines.append("    '貂蝉': { counters: ['廉颇','项羽'], counteredBy: ['诸葛亮','嬴政'] },")
    lines.append("    '诸葛亮': { counters: ['貂蝉','露娜'], counteredBy: ['兰陵王','司马懿'] },")
    lines.append("    '上官婉儿': { counters: ['嬴政','干将莫邪'], counteredBy: ['东皇太一','钟馗'] },")
    lines.append("    '公孙离': { counters: ['伽罗','后羿'], counteredBy: ['镜','澜'] },")
    lines.append("    '马可波罗': { counters: ['鲁班七号','后羿'], counteredBy: ['澜','镜'] },")
    lines.append("    '鬼谷子': { counters: ['蔡文姬','孙膑'], counteredBy: ['明世隐','东皇太一'] },")
    lines.append("    '张飞': { counters: ['镜','澜'], counteredBy: ['鬼谷子','牛魔'] },")
    lines.append("    '太乙真人': { counters: ['澜','镜'], counteredBy: ['干将莫邪','嬴政'] },")
    lines.append("    '后羿': { counters: ['吕布','廉颇'], counteredBy: ['镜','赵云'] },")
    lines.append("    '韩信': { counters: ['后羿','干将莫邪'], counteredBy: ['东皇太一','张良'] },")
    lines.append("    '东皇太一': { counters: ['镜','李白','韩信'], counteredBy: ['孙膑','大乔'] },")
    lines.append("};")
    lines.append("")

    # 选手英雄池
    lines.append("export const PLAYER_HERO_POOLS = {")
    pools = {
        '梓墨': ['关羽','马超','花木兰','孙策','夏洛特','吕布'],
        '雨寂': ['夏侯惇','项羽','老夫子','白起'],
        '暖阳': ['镜','裴擒虎','澜','曜','赵云','云中君'],
        '丞丞': ['赵云','云中君','娜可露露','韩信'],
        '听悦': ['貂蝉','诸葛亮','上官婉儿','司马懿','西施'],
        '果冻': ['嬴政','墨子','不知火舞','王昭君'],
        '小麦': ['公孙离','马可波罗','孙尚香','百里守约','伽罗'],
        '乔兮': ['后羿','鲁班七号','孙尚香','虞姬'],
        '玖欣': ['鬼谷子','太乙真人','张飞','牛魔','大乔'],
        '无双': ['镜','李白','澜','曜','云中君'],
        '无畏': ['鬼谷子','太乙真人','张飞','大乔','瑶'],
        '奶龙': ['貂蝉','上官婉儿','不知火舞','嫦娥'],
        '小寒': ['公孙离','马可波罗','后羿','虞姬'],
        '一诺': ['公孙离','马可波罗','孙尚香','百里守约','伽罗'],
        '大帅': ['鬼谷子','张飞','太乙真人','牛魔','瑶'],
        '染祥': ['貂蝉','诸葛亮','上官婉儿','不知火舞'],
        '清清': ['关羽','马超','项羽','花木兰','蒙恬'],
        '紫幻': ['貂蝉','上官婉儿','司马懿','诸葛亮','西施'],
        '晚星': ['赵云','镜','云中君','裴擒虎'],
        '花海': ['澜','李白','娜可露露','裴擒虎','韩信'],
        '向阳': ['诸葛亮','嬴政','干将莫邪','王昭君'],
        '清融': ['关羽','吕布','花木兰','马超','夏洛特'],
        '九尾': ['公孙离','马可波罗','孙尚香','伽罗'],
        '飞牛': ['关羽','花木兰','吕布','老夫子','夏洛特'],
    }
    for player, pool in pools.items():
        pool_str = ', '.join([f"'{h}'" for h in pool])
        lines.append(f"    '{player}': [{pool_str}],")

    # 默认英雄池
    defaults = {
        '_default_对抗路': ['关羽','吕布','夏侯惇','花木兰'],
        '_default_打野': ['赵云','裴擒虎','云中君','韩信'],
        '_default_中路': ['诸葛亮','嬴政','不知火舞','王昭君'],
        '_default_发育路': ['后羿','鲁班七号','孙尚香','狄仁杰'],
        '_default_游走': ['牛魔','张飞','蔡文姬','太乙真人'],
    }
    for k, v in defaults.items():
        pool_str = ', '.join([f"'{h}'" for h in v])
        lines.append(f"    '{k}': [{pool_str}],")

    lines.append("};")
    lines.append("")
    lines.append("export function getPlayerHeroes(playerId, role) {")
    lines.append("    return PLAYER_HERO_POOLS[playerId] || PLAYER_HERO_POOLS[`_default_${role}`] || [];")
    lines.append("}")
    lines.append("")
    lines.append("export function getHero(heroName) {")
    lines.append("    return HEROES[heroName] || null;")
    lines.append("}")
    lines.append("")
    lines.append("export function getCounterInfo(heroName) {")
    lines.append("    return COUNTER_DATA[heroName] || { counters: [], counteredBy: [] };")
    lines.append("}")
    lines.append("")
    lines.append("export function getHeroesForPosition(position) {")
    lines.append("    return KPL_META_HEROES[position] || [];")
    lines.append("}")
    lines.append("")
    lines.append("/**")
    lines.append(" * 评估阵容强度")
    lines.append(" */")
    lines.append("export function evaluateComp(picks) {")
    lines.append("    const heroes = picks.map(h => HEROES[h]).filter(Boolean);")
    lines.append("    if (!heroes.length) return { avgPower: 0, types: {}, synergy: 0, desc: '无阵容' };")
    lines.append("    const types = {};")
    lines.append("    heroes.forEach(h => { types[h.role] = (types[h.role] || 0) + 1; });")
    lines.append("    const hasWarrior = types.warrior > 0 || types.tank > 0;")
    lines.append("    const hasAssassin = types.assassin > 0;")
    lines.append("    const hasMage = types.mage > 0;")
    lines.append("    const hasMarksman = types.marksman > 0;")
    lines.append("    const hasSupport = types.support > 0;")
    lines.append("    let synergy = 0;")
    lines.append("    if (hasWarrior) synergy += 3;")
    lines.append("    if (hasMage) synergy += 3;")
    lines.append("    if (hasMarksman) synergy += 4;")
    lines.append("    if (hasSupport) synergy += 3;")
    lines.append("    if (Object.keys(types).length >= 3) synergy += 2;")
    lines.append("    const desc = [];")
    lines.append("    if (types.assassin >= 2) desc.push('双刺阵容');")
    lines.append("    if (types.tank >= 2) desc.push('双坦阵容');")
    lines.append("    if (hasMarksman && hasSupport) desc.push('保射体系');")
    lines.append("    if (hasAssassin && hasMage) desc.push('双C阵容');")
    lines.append("    return { avgPower: 0, types, synergy, desc: desc.join(', ') || '均衡阵容' };")
    lines.append("}")
    lines.append("")

    with open(outfile, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {outfile} with {len(heroes)} heroes")

if __name__ == '__main__':
    heroes = parse_heroes()
    print(f"Parsed {len(heroes)} heroes")

    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    js_out = os.path.join(base, 'js', 'data', 'heroes.js')
    img_out = os.path.join(base, 'resources', 'heroes')

    generate_js(heroes, js_out)
    print(f"\nDownloading hero avatars to {img_out}...")
    download_avatars(heroes, img_out)
    print("\nDone!")
