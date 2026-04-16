#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KPL所有战队选手头像抓取脚本
从KPL官网抓取18支战队的所有选手头像
命名格式: 战队名-选手名.png
"""

import os
import re
import json
import time
import requests
from playwright.sync_api import sync_playwright

SAVE_DIR = "players_by_team"
os.makedirs(SAVE_DIR, exist_ok=True)

def sanitize_filename(filename):
    """清理文件名中的非法字符"""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    return filename

def download_image(url, filepath):
    """下载图片"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://kpl.qq.com/'
        }
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200 and len(response.content) > 500:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"    Error downloading: {e}")
    return False

def fetch_players_from_page():
    """从KPL官网页面抓取选手数据"""
    
    players_data = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        try:
            print("[INFO] 正在访问KPL战队页面...")
            page.goto("https://kpl.qq.com/#/Teams", wait_until="networkidle", timeout=60000)
            time.sleep(5)
            
            # 等待页面加载
            print("[INFO] 等待页面加载完成...")
            
            # 方法1: 尝试从页面脚本中提取战队和选手数据
            print("[INFO] 尝试提取页面数据...")
            
            # 查找所有图片元素
            all_images = page.query_selector_all('img')
            print(f"[INFO] 页面中找到 {len(all_images)} 个图片元素")
            
            # 筛选选手头像 (通常包含特定关键词)
            player_images = []
            for img in all_images:
                src = img.get_attribute('src') or ''
                alt = img.get_attribute('alt') or ''
                
                # 选手头像通常的URL模式
                if 'player' in src.lower() or 'avatar' in src.lower() or any(x in src for x in ['.png', '.jpg', '.jpeg']):
                    # 获取父元素中的选手名称
                    parent = img.evaluate('el => el.parentElement')
                    player_name = ''
                    
                    # 尝试从周围的文本获取选手名
                    try:
                        # 查找相邻的文本元素
                        name_elem = img.evaluate('''el => {
                            const parent = el.parentElement;
                            const sibling = parent.querySelector("div, span, p");
                            return sibling ? sibling.innerText : "";
                        }''')
                        if name_elem:
                            player_name = name_elem.strip()
                    except:
                        pass
                    
                    if src and 'http' in src:
                        player_images.append({
                            'src': src,
                            'alt': alt,
                            'name': player_name or alt
                        })
            
            print(f"[INFO] 筛选出 {len(player_images)} 个可能的选手头像")
            
            # 下载这些图片
            for idx, player in enumerate(player_images):
                src = player['src']
                name = player['name'] or player['alt'] or f"player_{idx}"
                
                # 清理文件名
                safe_name = sanitize_filename(name)
                if not safe_name.endswith(('.png', '.jpg', '.jpeg')):
                    safe_name += '.png'
                
                filepath = os.path.join(SAVE_DIR, safe_name)
                
                if os.path.exists(filepath):
                    print(f"  [SKIP] {safe_name}")
                    continue
                
                if download_image(src, filepath):
                    print(f"  [OK] {safe_name}")
                    players_data.append({
                        'name': name,
                        'file': safe_name,
                        'src': src
                    })
                    time.sleep(0.3)
                else:
                    print(f"  [FAIL] {safe_name}")
            
            # 方法2: 尝试点击每个战队查看详情
            print("\n[INFO] 尝试获取战队详情...")
            
            # 查找战队链接或按钮
            team_elements = page.query_selector_all('a[href*="team"], .team-item, .team-card, [class*="Team"]')
            print(f"[INFO] 找到 {len(team_elements)} 个战队元素")
            
            # 保存页面源码供分析
            html_content = page.content()
            with open(os.path.join(SAVE_DIR, 'page_source.html'), 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("[INFO] 已保存页面源码到 page_source.html")
            
            # 尝试从页面源码中提取选手数据
            print("[INFO] 分析页面数据...")
            
            # 查找JSON数据
            json_matches = re.findall(r'window\.__INITIAL_STATE__\s*=\s*({.+?});', html_content)
            if json_matches:
                try:
                    data = json.loads(json_matches[0])
                    print(f"[INFO] 从页面提取到初始状态数据")
                    
                    # 保存数据供分析
                    with open(os.path.join(SAVE_DIR, 'initial_state.json'), 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    print("[INFO] 已保存初始状态数据到 initial_state.json")
                    
                except Exception as e:
                    print(f"[WARN] 解析初始状态数据失败: {e}")
            
        except Exception as e:
            print(f"[ERROR] 抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
    
    return players_data

def organize_by_team():
    """整理已下载的选手头像，尝试按战队分组"""
    
    print("\n[INFO] 整理选手头像...")
    
    # 读取已下载的文件
    files = [f for f in os.listdir(SAVE_DIR) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    # 尝试识别战队（基于文件名中的关键词）
    team_keywords = {
        'AG': ['ag', '超玩会', '一诺', '长生', '钟意', '轩染', '大帅'],
        '狼队': ['狼队', '小胖', '向鱼', '妖刀', '归期', '一笙', '道崽'],
        'eStar': ['estar', '花海', '清融', '坦然', '易峥', '子阳', '绝意'],
        'WB': ['wb', '暖阳', '花卷', '梓墨', '乔兮', '星宇', '小麦'],
        'TTG': ['ttg', '清清', '不然', '紫幻', '风箫', '帆帆', '玖欣'],
        'DRG': ['drg', '百兽', '鹏鹏', '青枫', '梦岚', '阿改', '花缘'],
        'KSG': ['ksg', '啊泽', '今屿', '一曲', '小玖', '小A', '流浪'],
        'RW侠': ['rw', '飞', '无双', '千世', '花云', '笑影', '小A'],
        'LGD': ['lgd', '小落', '赤辰', '九尾', '小久', '久凡', '小崽'],
        'EDGM': ['edg', '柠栀', '落尘', '一曲', ' Silver', '笑影'],
        'WE': ['we', '百兽', '鹏鹏', '青枫', '佩恩', '天波'],
        'TES': ['tes', '苏沫', '不然', '黎明', '蓝桉', '冰尘'],
        'Hero': ['hero', '傲寒', '阿豆', '星痕', '铃铛', '秋沫'],
        'DYG': ['dyg', '流星', '夏凌', '青枫', '钎城', '三岁'],
        'RNGM': ['rng', '阳阳', '云黎', '小羽', '极光', '离洛'],
        'VG': ['vg', '无上', '季节', '笑', '小年', '天波'],
        'JDG': ['jdg', '誓约', '季节', '早点', '钎城', '梦溪'],
        'KLG': ['klg', '舒尹', '云顶', '挽梦', '小瞳', '夕愈'],
    }
    
    # 统计
    team_counts = {team: 0 for team in team_keywords.keys()}
    unclassified = []
    
    for filename in files:
        classified = False
        lower_name = filename.lower()
        
        for team, keywords in team_keywords.items():
            if any(kw.lower() in lower_name for kw in keywords):
                team_counts[team] += 1
                classified = True
                break
        
        if not classified:
            unclassified.append(filename)
    
    # 输出统计
    print("\n[STATS] 各战队头像数量:")
    for team, count in sorted(team_counts.items(), key=lambda x: -x[1]):
        if count > 0:
            print(f"  {team}: {count}个")
    
    if unclassified:
        print(f"\n[WARN] 未分类头像: {len(unclassified)}个")
        for f in unclassified[:10]:
            print(f"    - {f}")
    
    return team_counts

def main():
    print("=" * 60)
    print("KPL 18支战队选手头像抓取")
    print("=" * 60)
    print(f"[INFO] 保存目录: {SAVE_DIR}")
    print()
    
    # 抓取选手头像
    players = fetch_players_from_page()
    
    # 整理统计
    print("\n" + "=" * 60)
    team_stats = organize_by_team()
    
    # 总统计
    total_files = len([f for f in os.listdir(SAVE_DIR) if f.endswith(('.png', '.jpg', '.jpeg'))])
    print(f"\n[SUMMARY] 总计下载: {total_files} 个选手头像")
    print(f"[SUMMARY] 覆盖战队: {sum(1 for c in team_stats.values() if c > 0)} / 18")
    
    print("\n" + "=" * 60)
    print("提示:")
    print("- 检查 players_by_team/ 目录查看下载的头像")
    print("- 查看 page_source.html 了解页面结构")
    print("- 如需更多选手，建议手动从KPL官网下载")
    print("=" * 60)

if __name__ == "__main__":
    main()
