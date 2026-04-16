#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取南通Hero久竞和苏州KSG的选手头像 - V3
"""

import asyncio
import json
import os
import base64
import re
import sys

# 设置stdout编码
sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

# 输出目录
OUTPUT_DIR = r"D:\project_data\html小游戏\王者荣耀比赛\resources\players_by_team"

# 目标战队（根据页面实际显示）
TARGET_TEAMS = {
    "南通Hero久竞": "Hero",
    "KSG": "KSG"
}

async def fetch_team_players_v3():
    """从KPL官网抓取选手信息"""
    
    players_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            print("正在访问KPL官网...")
            await page.goto('https://kpl.qq.com/#/Teams', wait_until='networkidle', timeout=60000)
            await asyncio.sleep(3)
            
            # 查找目标战队
            for team_full_name, team_short in TARGET_TEAMS.items():
                print(f"\n{'='*50}")
                print(f"查找战队: {team_full_name} ({team_short})")
                print(f"{'='*50}")
                
                # 点击战队按钮
                clicked = False
                
                # 方法1: 使用XPath查找并点击
                try:
                    elements = await page.query_selector_all(f'//*[contains(text(), "{team_full_name}")]')
                    for elem in elements:
                        try:
                            # 尝试点击元素的父元素或本身
                            await elem.click()
                            clicked = True
                            print(f"已点击 {team_full_name}")
                            await asyncio.sleep(2)
                            break
                        except:
                            # 尝试点击父元素
                            try:
                                parent = await elem.evaluate('el => el.parentElement')
                                if parent:
                                    await elem.evaluate('el => el.parentElement.click()')
                                    clicked = True
                                    print(f"已点击 {team_full_name} (父元素)")
                                    await asyncio.sleep(2)
                                    break
                            except:
                                continue
                except Exception as e:
                    print(f"点击失败: {e}")
                
                if not clicked:
                    print(f"无法点击战队 {team_full_name}，跳过")
                    continue
                
                # 等待页面更新
                await asyncio.sleep(2)
                
                # 查找选手列表
                player_found = False
                
                # 首先尝试找到所有包含选手头像的img元素
                try:
                    # 获取页面所有图片
                    all_images = await page.query_selector_all('img')
                    print(f"页面共有 {len(all_images)} 个图片元素")
                    
                    # 筛选可能是选手头像的图片（根据URL特征）
                    player_imgs = []
                    for img in all_images:
                        try:
                            src = await img.get_attribute('src')
                            alt = await img.get_attribute('alt') or ''
                            
                            if src:
                                # 检查是否是选手头像URL
                                if 'kpl' in src.lower() or 'tmes' in src.lower() or 'cdn' in src.lower():
                                    # 排除英雄图标（通常包含hero或特定尺寸）
                                    if alt and len(alt) >= 2 and len(alt) <= 4:
                                        # 可能是选手名（2-4个汉字）
                                        import re
                                        if re.match(r'^[\u4e00-\u9fa5]{2,4}$', alt):
                                            player_imgs.append((img, alt, src))
                        except:
                            continue
                    
                    print(f"找到 {len(player_imgs)} 个可能的选手头像")
                    
                    # 处理每个选手
                    for img, player_name, img_url in player_imgs:
                        try:
                            print(f"  选手: {player_name}")
                            
                            # 处理URL
                            if img_url.startswith('//'):
                                img_url = 'https:' + img_url
                            
                            # 下载图片
                            filename = f"{team_short}-{player_name}.png"
                            filepath = os.path.join(OUTPUT_DIR, filename)
                            
                            # 使用fetch下载
                            response = await page.evaluate(f'''
                                async () => {{
                                    try {{
                                        const response = await fetch("{img_url}");
                                        if (!response.ok) return null;
                                        const blob = await response.blob();
                                        return new Promise((resolve) => {{
                                            const reader = new FileReader();
                                            reader.onloadend = () => resolve(reader.result);
                                            reader.readAsDataURL(blob);
                                        }});
                                    }} catch (e) {{
                                        return null;
                                    }}
                                }}
                            ''')
                            
                            if response and ',' in response:
                                img_data = base64.b64decode(response.split(',')[1])
                                with open(filepath, 'wb') as f:
                                    f.write(img_data)
                                print(f"    [OK] 已保存: {filename}")
                                
                                players_data.append({
                                    "team": team_full_name,
                                    "team_short": team_short,
                                    "player": player_name,
                                    "player_id": player_name,
                                    "file": filename
                                })
                                player_found = True
                            else:
                                print(f"    [FAIL] 下载失败")
                        except Exception as e:
                            print(f"    [ERROR] {e}")
                            continue
                
                except Exception as e:
                    print(f"处理图片时出错: {e}")
                
                # 如果上面的方法没找到，尝试通过选手列表结构查找
                if not player_found:
                    print("尝试通过列表结构查找...")
                    
                    selectors = [
                        '.player-item img',
                        '.member-item img',
                        '.team-player img',
                        '.player-card img',
                        '[class*="player"] img',
                        '.avatar img'
                    ]
                    
                    for selector in selectors:
                        try:
                            imgs = await page.query_selector_all(selector)
                            if imgs:
                                print(f"选择器 '{selector}' 找到 {len(imgs)} 个图片")
                                
                                for img in imgs:
                                    try:
                                        src = await img.get_attribute('src')
                                        alt = await img.get_attribute('alt') or ''
                                        
                                        if src and alt:
                                            # 清理选手名
                                            player_name = alt.strip()
                                            if '(' in player_name:
                                                player_name = player_name.split('(')[0].strip()
                                            
                                            # 只保留2-4个汉字的名称
                                            if re.match(r'^[\u4e00-\u9fa5]{2,4}$', player_name):
                                                print(f"  选手: {player_name}")
                                                
                                                if src.startswith('//'):
                                                    src = 'https:' + src
                                                
                                                filename = f"{team_short}-{player_name}.png"
                                                filepath = os.path.join(OUTPUT_DIR, filename)
                                                
                                                response = await page.evaluate(f'''
                                                    async () => {{
                                                        try {{
                                                            const response = await fetch("{src}");
                                                            if (!response.ok) return null;
                                                            const blob = await response.blob();
                                                            return new Promise((resolve) => {{
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => resolve(reader.result);
                                                                reader.readAsDataURL(blob);
                                                            }});
                                                        }} catch (e) {{
                                                            return null;
                                                        }}
                                                    }}
                                                ''')
                                                
                                                if response and ',' in response:
                                                    img_data = base64.b64decode(response.split(',')[1])
                                                    with open(filepath, 'wb') as f:
                                                        f.write(img_data)
                                                    print(f"    [OK] {filename}")
                                                    
                                                    players_data.append({
                                                        "team": team_full_name,
                                                        "team_short": team_short,
                                                        "player": player_name,
                                                        "player_id": player_name,
                                                        "file": filename
                                                    })
                                                    player_found = True
                                    except Exception as e:
                                        continue
                                
                                if player_found:
                                    break
                        except:
                            continue
                
                if not player_found:
                    print(f"  [WARNING] 未找到 {team_full_name} 的选手信息")
            
        except Exception as e:
            print(f"抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
    
    return players_data


def update_mapping_file(new_players):
    """更新选手映射文件"""
    mapping_file = os.path.join(OUTPUT_DIR, "players_mapping.json")
    
    # 读取现有数据
    existing_data = []
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            pass
    
    # 合并数据
    all_players = existing_data + new_players
    
    # 去重
    seen = set()
    unique_players = []
    for p in all_players:
        key = (p.get('team', ''), p.get('player', ''))
        if key not in seen:
            seen.add(key)
            unique_players.append(p)
    
    # 保存
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(unique_players, f, ensure_ascii=False, indent=2)
    
    print(f"\n映射文件已更新，共 {len(unique_players)} 名选手")


async def main():
    print("=" * 60)
    print("抓取南通Hero久竞和KSG选手头像")
    print("=" * 60)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 抓取选手
    players = await fetch_team_players_v3()
    
    print(f"\n{'='*60}")
    print(f"抓取完成！共获取 {len(players)} 名选手头像")
    print(f"{'='*60}")
    
    # 更新映射文件
    if players:
        update_mapping_file(players)
    
    # 显示结果
    if players:
        print("\n已抓取的选手:")
        for p in players:
            print(f"  - {p['team']}: {p['player']}")
    else:
        print("\n未能抓取到选手头像")


if __name__ == "__main__":
    asyncio.run(main())
