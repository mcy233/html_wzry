#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KPL所有战队选手头像下载
从页面源码解析选手信息并下载
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
        print(f"      Error: {e}")
    return False

def parse_players_from_html(html_content, team_short):
    """从HTML内容中解析选手信息"""
    players = []
    
    # 查找所有选手信息块 - 使用更精确的模式
    # 选手信息在 <div class="player-bg"> 中
    player_pattern = r'<div[^>]*class="player-bg"[^>]*>.*?<div[^>]*class="img"[^>]*>.*?<img[^>]*src="([^"]+)"[^>]*>.*?<div[^>]*class="info"[^>]*>.*?<div[^>]*class="name"[^>]*>([^<]+)</div>.*?<div[^>]*class="place"[^>]*>([^<]+)</div>'
    
    matches = re.findall(player_pattern, html_content, re.DOTALL)
    
    for match in matches:
        img_url = match[0]
        player_name = match[1].strip()
        position = match[2].strip()
        
        # 提取选手ID（括号前的名字）
        player_id = player_name.split('（')[0] if '（' in player_name else player_name
        
        players.append({
            'name': player_name,
            'id': player_id,
            'position': position,
            'img_url': img_url
        })
    
    return players

def fetch_team_players():
    """抓取所有战队的选手"""
    
    all_players = []
    
    # KPL 18支战队
    teams = [
        ("成都AG超玩会", "AG"),
        ("佛山DRG", "DRG"),
        ("深圳DYG", "DYG"),
        ("上海EDG.M", "EDGM"),
        ("武汉eStarPro", "eStar"),
        ("南京Hero久竞", "Hero"),
        ("北京JDG", "JDG"),
        ("苏州KSG", "KSG"),
        ("重庆狼队", "狼队"),
        ("杭州LGD.NBW", "LGD"),
        ("上海RNG.M", "RNGM"),
        ("济南RW侠", "RW侠"),
        ("长沙TES.A", "TES"),
        ("广州TTG", "TTG"),
        ("北京WB", "WB"),
        ("西安WE", "WE"),
        ("情久", "情久"),
        ("无锡TCG", "TCG"),
    ]
    
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
            
            for team_name, team_short in teams:
                print(f"\n[INFO] 处理战队: {team_name} ({team_short})")
                
                try:
                    # 查找并点击战队按钮
                    team_btn = page.query_selector(f'text={team_name}')
                    if team_btn:
                        team_btn.click()
                        time.sleep(3)  # 等待页面加载
                        
                        # 获取页面HTML
                        html_content = page.content()
                        
                        # 解析选手信息
                        players = parse_players_from_html(html_content, team_short)
                        print(f"  [OK] 找到 {len(players)} 个选手")
                        
                        # 下载选手头像
                        for player in players:
                            player_name = player['id']  # 使用选手ID（括号前的名字）
                            player_full_name = player['name']
                            img_url = player['img_url']
                            position = player['position']
                            
                            # 清理文件名: 战队名-选手名.png
                            safe_team = sanitize_filename(team_short)
                            safe_player = sanitize_filename(player_name)
                            filename = f"{safe_team}-{safe_player}.png"
                            filepath = os.path.join(SAVE_DIR, filename)
                            
                            if os.path.exists(filepath):
                                print(f"    [SKIP] {filename}")
                                all_players.append({
                                    'team': team_name,
                                    'team_short': team_short,
                                    'player': player_full_name,
                                    'player_id': player_name,
                                    'position': position,
                                    'file': filename
                                })
                                continue
                            
                            if download_image(img_url, filepath):
                                print(f"    [OK] {filename}")
                                all_players.append({
                                    'team': team_name,
                                    'team_short': team_short,
                                    'player': player_full_name,
                                    'player_id': player_name,
                                    'position': position,
                                    'file': filename
                                })
                                time.sleep(0.3)
                            else:
                                print(f"    [FAIL] {filename}")
                    else:
                        print(f"  [WARN] 未找到战队按钮: {team_name}")
                        
                except Exception as e:
                    print(f"  [ERR] 处理战队出错: {e}")
                    import traceback
                    traceback.print_exc()
            
        except Exception as e:
            print(f"[ERR] 抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
    
    return all_players

def main():
    print("=" * 70)
    print("KPL 18支战队选手头像抓取")
    print("命名格式: 战队名-选手名.png")
    print("=" * 70)
    print(f"[INFO] 保存目录: {SAVE_DIR}")
    print()
    
    # 抓取所有选手
    players = fetch_team_players()
    
    # 保存数据映射
    if players:
        with open(os.path.join(SAVE_DIR, "players_mapping.json"), "w", encoding="utf-8") as f:
            json.dump(players, f, ensure_ascii=False, indent=2)
        print(f"\n[INFO] 已保存选手映射数据到 players_mapping.json")
    
    # 统计
    print("\n" + "=" * 70)
    print("统计信息:")
    print("=" * 70)
    
    # 按战队分组统计
    team_counts = {}
    for p in players:
        team = p['team_short']
        team_counts[team] = team_counts.get(team, 0) + 1
    
    print(f"\n总计: {len(players)} 个选手头像")
    print(f"覆盖战队: {len(team_counts)} / 18")
    
    print("\n各战队选手数量:")
    for team, count in sorted(team_counts.items(), key=lambda x: -x[1]):
        print(f"  {team}: {count}人")
    
    print("\n" + "=" * 70)
    print("完成!")
    print("=" * 70)

if __name__ == "__main__":
    main()
