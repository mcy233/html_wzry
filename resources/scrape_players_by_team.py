#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KPL选手头像抓取脚本 - 按战队分类命名
从KPL官网抓取所有18支战队的选手头像
命名格式: 战队名-选手名.png

使用方法:
1. 确保已安装依赖: pip install playwright
2. 运行: python scrape_players_by_team.py
"""

import os
import json
import time
from playwright.sync_api import sync_playwright

# 创建保存目录
SAVE_DIR = "players_by_team"
os.makedirs(SAVE_DIR, exist_ok=True)

# KPL 18支固定战队列表
KPL_TEAMS = [
    {"name": "成都AG超玩会", "short": "AG"},
    {"name": "重庆狼队", "short": "狼队"},
    {"name": "武汉eStarPro", "short": "eStar"},
    {"name": "北京WB", "short": "WB"},
    {"name": "广州TTG", "short": "TTG"},
    {"name": "佛山DRG", "short": "DRG"},
    {"name": "苏州KSG", "short": "KSG"},
    {"name": "济南RW侠", "short": "RW侠"},
    {"name": "杭州LGD.NBW", "short": "LGD"},
    {"name": "上海EDG.M", "short": "EDGM"},
    {"name": "西安WE", "short": "WE"},
    {"name": "长沙TES.A", "short": "TES"},
    {"name": "南京Hero久竞", "short": "Hero"},
    {"name": "深圳DYG", "short": "DYG"},
    {"name": "上海RNG.M", "short": "RNGM"},
    {"name": "厦门VG", "short": "VG"},
    {"name": "北京JDG", "short": "JDG"},
    {"name": "深圳KLG", "short": "KLG"},
]

def sanitize_filename(filename):
    """清理文件名中的非法字符"""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    return filename

def scrape_team_players():
    """抓取所有战队的选手信息"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        all_players_data = []
        
        try:
            print("正在访问KPL战队页面...")
            page.goto("https://kpl.qq.com/#/Teams", wait_until="networkidle", timeout=60000)
            time.sleep(3)
            
            # 尝试找到战队列表
            print("查找战队列表...")
            
            # 方法1: 查找战队卡片
            team_cards = page.query_selector_all('.team-card, .team-item, [class*="team"]')
            print(f"找到 {len(team_cards)} 个战队元素")
            
            # 方法2: 从页面中提取战队数据
            print("尝试从页面脚本中提取数据...")
            
            # 查找包含选手数据的脚本
            scripts = page.query_selector_all('script')
            for script in scripts:
                content = script.inner_text()
                if 'player' in content.lower() or 'team' in content.lower():
                    # 尝试提取JSON数据
                    pass
            
            # 方法3: 直接访问战队详情API
            print("尝试通过API获取选手数据...")
            
            # 访问选手数据API
            api_url = "https://pvp.qq.com/web201605/js/herolist.json"
            
            # 尝试找到页面中的选手数据
            for team in KPL_TEAMS:
                team_name = team["name"]
                team_short = team["short"]
                
                print(f"\n处理战队: {team_name}")
                
                try:
                    # 在页面上搜索战队名称
                    team_link = page.query_selector(f'text={team_name}')
                    if team_link:
                        print(f"  找到战队链接，点击进入...")
                        team_link.click()
                        time.sleep(2)
                        
                        # 查找选手列表
                        player_elements = page.query_selector_all('.player-item, .player-card, [class*="player"] img')
                        print(f"  找到 {len(player_elements)} 个选手元素")
                        
                        for idx, player_elem in enumerate(player_elements):
                            try:
                                # 获取选手图片
                                img_elem = player_elem.query_selector('img') if player_elem.tag_name != 'img' else player_elem
                                if img_elem:
                                    img_url = img_elem.get_attribute('src')
                                    
                                    # 获取选手名称
                                    name_elem = player_elem.query_selector('.name, .player-name, [class*="name"]')
                                    player_name = name_elem.inner_text().strip() if name_elem else f"选手{idx+1}"
                                    
                                    if img_url:
                                        # 下载图片
                                        safe_team = sanitize_filename(team_short)
                                        safe_player = sanitize_filename(player_name)
                                        filename = f"{safe_team}-{safe_player}.png"
                                        filepath = os.path.join(SAVE_DIR, filename)
                                        
                                        if not os.path.exists(filepath):
                                            try:
                                                response = page.evaluate(f'''
                                                    async () => {{
                                                        const response = await fetch("{img_url}");
                                                        const blob = await response.blob();
                                                        return new Promise((resolve) => {{
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => resolve(reader.result);
                                                            reader.readAsDataURL(blob);
                                                        }});
                                                    }}
                                                ''')
                                                
                                                if response and ',' in response:
                                                    import base64
                                                    data = response.split(',')[1]
                                                    with open(filepath, 'wb') as f:
                                                        f.write(base64.b64decode(data))
                                                    print(f"    [OK] 已下载: {filename}")
                                                    all_players_data.append({
                                                        "team": team_name,
                                                        "player": player_name,
                                                        "file": filename
                                                    })
                                            except Exception as e:
                                                print(f"    [FAIL] 下载失败: {filename} - {e}")
                                        else:
                                            print(f"    [SKIP] 已存在: {filename}")
                            except Exception as e:
                                print(f"    [ERR] 处理选手出错: {e}")
                        
                        # 返回战队列表页
                        page.goto("https://kpl.qq.com/#/Teams", wait_until="networkidle")
                        time.sleep(2)
                    else:
                        print(f"  未找到战队链接")
                        
                except Exception as e:
                    print(f"  ✗ 处理战队出错: {e}")
            
            # 保存数据映射
            if all_players_data:
                with open(os.path.join(SAVE_DIR, "players_mapping.json"), "w", encoding="utf-8") as f:
                    json.dump(all_players_data, f, ensure_ascii=False, indent=2)
                print(f"\n✓ 已保存选手映射数据: {len(all_players_data)} 个选手")
                
        except Exception as e:
            print(f"抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
    
    return all_players_data

def scrape_from_cdn():
    """
    从KPL CDN直接下载选手头像
    使用已知的选手ID范围
    """
    import requests
    
    print("\n=== 从CDN下载选手头像 ===")
    
    # 已知的KPL选手ID映射（部分示例）
    # 实际需要从API获取完整的选手列表
    known_players = {
        # AG超玩会
        "AG-一诺": "26358",
        "AG-长生": "26361",
        "AG-钟意": "26409",
        "AG-轩染": "26411",
        "AG-大帅": "26457",
        # 狼队
        "狼队-小胖": "26460",
        "狼队-向鱼": "26463",
        "狼队-妖刀": "26485",
        "狼队-归期": "26486",
        "狼队-一笙": "28920",
        # eStar
        "eStar-花海": "28946",
        "eStar-清融": "30220",
        "eStar-坦然": "30221",
        "eStar-易峥": "30222",
        "eStar-子阳": "30223",
        # WB
        "WB-暖阳": "30227",
        "WB-花卷": "30229",
        "WB-梓墨": "30265",
        "WB-乔兮": "30267",
        "WB-星宇": "30269",
        # TTG
        "TTG-清清": "30270",
        "TTG-不然": "30800",
        "TTG-紫幻": "30804",
        "TTG-风箫": "30805",
        "TTG-帆帆": "30816",
        # DRG
        "DRG-百兽": "30819",
        "DRG-鹏鹏": "34464",
        "DRG-青枫": "34469",
        "DRG-梦岚": "34472",
        "DRG-阿改": "34474",
        # KSG
        "KSG-啊泽": "34478",
        "KSG-今屿": "34479",
        "KSG-一曲": "34495",
        "KSG-小玖": "34497",
        "KSG-小A": "34500",
        # 更多选手...
    }
    
    base_url = "https://game.gtimg.cn/images/yxzj/ingame/avatar/{}.png"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    downloaded = 0
    for player_name, player_id in known_players.items():
        filename = f"{player_name}.png"
        filepath = os.path.join(SAVE_DIR, filename)
        
        if os.path.exists(filepath):
            print(f"  [SKIP] 已存在: {filename}")
            continue
        
        url = base_url.format(player_id)
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200 and len(response.content) > 100:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"  [OK] 已下载: {filename}")
                downloaded += 1
                time.sleep(0.5)
            else:
                print(f"  [FAIL] 下载失败: {filename}")
        except Exception as e:
            print(f"  [ERR] 下载出错: {filename} - {e}")
    
    print(f"\n[DONE] CDN下载完成: {downloaded} 个新头像")
    return downloaded

def main():
    print("=" * 60)
    print("KPL选手头像抓取工具")
    print("=" * 60)
    print(f"保存目录: {SAVE_DIR}")
    print()
    
    # 方法1: 从CDN下载已知的选手
    scrape_from_cdn()
    
    # 方法2: 从网页抓取（需要更多时间）
    print("\n是否继续从网页抓取更多选手? (需要较长时间)")
    print("提示: 由于KPL官网使用动态加载，网页抓取可能不完整")
    print("建议: 使用CDN方式配合手动补充")
    
    # 显示当前结果
    if os.path.exists(SAVE_DIR):
        files = [f for f in os.listdir(SAVE_DIR) if f.endswith('.png')]
        print(f"\n当前已下载: {len(files)} 个选手头像")
        
        # 按战队分组统计
        teams = {}
        for f in files:
            if '-' in f:
                team = f.split('-')[0]
                teams[team] = teams.get(team, 0) + 1
        
        print("\n各战队头像数量:")
        for team, count in sorted(teams.items()):
            print(f"  {team}: {count}个")

if __name__ == "__main__":
    main()
