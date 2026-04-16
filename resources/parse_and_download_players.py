#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从KPL页面HTML解析并下载所有选手头像
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
        print(f"    Error: {e}")
    return False

def parse_players_from_html(html_content):
    """从HTML内容中解析选手信息"""
    players = []
    
    # 查找所有选手信息块
    # 模式: <div class="player-bg">...</div>
    player_blocks = re.findall(
        r'<div[^>]*class="player-bg"[^>]*>(.*?)</div>\s*</div>\s*</div>\s*</div>',
        html_content,
        re.DOTALL
    )
    
    print(f"[INFO] 找到 {len(player_blocks)} 个选手信息块")
    
    for block in player_blocks:
        try:
            # 提取选手图片URL
            img_match = re.search(r'<img[^>]*src="([^"]+)"[^>]*>', block)
            img_url = img_match.group(1) if img_match else None
            
            # 提取选手名称
            name_match = re.search(r'<div[^>]*class="name"[^>]*>([^<]+)</div>', block)
            player_name = name_match.group(1).strip() if name_match else None
            
            # 提取位置
            place_match = re.search(r'<div[^>]*class="place"[^>]*>([^<]+)</div>', block)
            position = place_match.group(1).strip() if place_match else None
            
            if img_url and player_name:
                players.append({
                    'name': player_name,
                    'position': position,
                    'img_url': img_url
                })
        except Exception as e:
            print(f"[WARN] 解析选手信息出错: {e}")
    
    return players

def fetch_all_teams_players():
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
                print(f"\n[INFO] 处理战队: {team_name}")
                
                try:
                    # 查找并点击战队按钮
                    team_btn = page.query_selector(f'text={team_name}')
                    if team_btn:
                        team_btn.click()
                        time.sleep(3)  # 等待页面加载
                        
                        # 获取页面HTML
                        html_content = page.content()
                        
                        # 解析选手信息
                        players = parse_players_from_html(html_content)
                        print(f"  [OK] 找到 {len(players)} 个选手")
                        
                        # 下载选手头像
                        for player in players:
                            player_name = player['name']
                            img_url = player['img_url']
                            
                            # 清理文件名: 战队名-选手名.png
                            safe_team = sanitize_filename(team_short)
                            safe_player = sanitize_filename(player_name.split('（')[0])  # 去掉括号内容
                            filename = f"{safe_team}-{safe_player}.png"
                            filepath = os.path.join(SAVE_DIR, filename)
                            
                            if os.path.exists(filepath):
                                print(f"    [SKIP] {filename}")
                                all_players.append({
                                    'team': team_name,
                                    'team_short': team_short,
                                    'player': player_name,
                                    'file': filename,
                                    'position': player['position']
                                })
                                continue
                            
                            if download_image(img_url, filepath):
                                print(f"    [OK] {filename}")
                                all_players.append({
                                    'team': team_name,
                                    'team_short': team_short,
                                    'player': player_name,
                                    'file': filename,
                                    'position': player['position']
                                })
                                time.sleep(0.5)
                            else:
                                print(f"    [FAIL] {filename}")
                    else:
                        print(f"  [WARN] 未找到战队按钮: {team_name}")
                        
                except Exception as e:
                    print(f"  [ERR] 处理战队出错: {e}")
            
        except Exception as e:
            print(f"[ERR] 抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
    
    return all_players

def main():
    print("=" * 60)
    print("KPL 18支战队选手头像抓取")
    print("命名格式: 战队名-选手名.png")
    print("=" * 60)
    print(f"[INFO] 保存目录: {SAVE_DIR}")
    print()
    
    # 抓取所有选手
    players = fetch_all_teams_players()
    
    # 保存数据映射
    if players:
        with open(os.path.join(SAVE_DIR, "players_mapping.json"), "w", encoding="utf-8") as f:
            json.dump(players, f, ensure_ascii=False, indent=2)
        print(f"\n[INFO] 已保存选手映射数据")
    
    # 统计
    print("\n" + "=" * 60)
    print("统计信息:")
    print("=" * 60)
    
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
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
