#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取南通Hero久竞和苏州KSG的选手头像 - 改进版
"""

import asyncio
import json
import os
import base64
from playwright.async_api import async_playwright

# 输出目录
OUTPUT_DIR = r"D:\project_data\html小游戏\王者荣耀比赛\resources\players_by_team"

# 目标战队（根据页面实际显示）
TARGET_TEAMS = {
    "南通Hero久竞": "Hero",
    "苏州KSG": "KSG"
}

async def fetch_team_players_v2():
    """从KPL官网抓取选手信息 - 改进版"""
    
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
            
            # 获取页面所有文本内容
            page_text = await page.evaluate('() => document.body.innerText')
            print(f"页面文本长度: {len(page_text)}")
            
            # 查找目标战队
            for team_full_name, team_short in TARGET_TEAMS.items():
                print(f"\n{'='*50}")
                print(f"查找战队: {team_full_name} ({team_short})")
                print(f"{'='*50}")
                
                # 检查页面是否包含该战队
                if team_full_name not in page_text:
                    print(f"页面中未找到 {team_full_name}，尝试搜索部分名称...")
                    # 尝试搜索部分名称
                    search_name = team_full_name.replace("南通", "").replace("苏州", "").replace("久竞", "")
                    if search_name not in page_text:
                        print(f"也未找到 {search_name}")
                        continue
                
                # 点击战队按钮
                clicked = False
                
                # 方法1: 直接通过文本点击
                try:
                    team_btn = await page.get_by_text(team_full_name, exact=False).first
                    if team_btn:
                        await team_btn.click()
                        clicked = True
                        print(f"通过文本点击了 {team_full_name}")
                        await asyncio.sleep(2)
                except Exception as e:
                    print(f"方法1失败: {e}")
                
                # 方法2: 如果方法1失败，尝试查找包含战队名称的元素
                if not clicked:
                    try:
                        # 使用XPath查找
                        elements = await page.query_selector_all(f'//*[contains(text(), "{team_full_name}")]')
                        for elem in elements:
                            try:
                                await elem.click()
                                clicked = True
                                print(f"通过XPath点击了 {team_full_name}")
                                await asyncio.sleep(2)
                                break
                            except:
                                continue
                    except Exception as e:
                        print(f"方法2失败: {e}")
                
                # 方法3: 尝试搜索简化名称
                if not clicked:
                    try:
                        short_search = team_short
                        elem = await page.get_by_text(short_search, exact=False).first
                        if elem:
                            await elem.click()
                            clicked = True
                            print(f"通过简称点击了 {short_search}")
                            await asyncio.sleep(2)
                    except Exception as e:
                        print(f"方法3失败: {e}")
                
                if not clicked:
                    print(f"无法点击战队 {team_full_name}，跳过")
                    continue
                
                # 等待页面更新
                await asyncio.sleep(2)
                
                # 获取当前页面HTML，分析结构
                html_content = await page.content()
                
                # 查找选手列表 - 尝试多种选择器
                player_found = False
                
                # 选择器列表
                selectors = [
                    '.player-item',
                    '.player-list .item',
                    '[class*="player"]',
                    '.member-item',
                    '.team-player',
                    '.player-card',
                    '.avatar-item',
                    'a[href*="player"]',
                    '.member-list .item',
                    '.roster-item'
                ]
                
                for selector in selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        if elements and len(elements) > 0:
                            print(f"使用选择器 '{selector}' 找到 {len(elements)} 个元素")
                            
                            for idx, elem in enumerate(elements):
                                try:
                                    # 获取选手名称
                                    player_name = None
                                    
                                    # 尝试多种方式获取名称
                                    name_selectors = ['.name', '.player-name', '.nickname', 'h3', 'h4', '.title', '[class*="name"]']
                                    for ns in name_selectors:
                                        try:
                                            ne = await elem.query_selector(ns)
                                            if ne:
                                                text = await ne.text_content()
                                                if text and text.strip():
                                                    player_name = text.strip()
                                                    break
                                        except:
                                            continue
                                    
                                    # 尝试从元素的文本内容获取
                                    if not player_name:
                                        try:
                                            text = await elem.text_content()
                                            if text:
                                                # 提取可能的选手名（通常是2-4个汉字）
                                                import re
                                                matches = re.findall(r'[\u4e00-\u9fa5]{2,4}', text)
                                                if matches:
                                                    player_name = matches[0]
                                        except:
                                            pass
                                    
                                    # 尝试从alt或title获取
                                    if not player_name:
                                        try:
                                            img = await elem.query_selector('img')
                                            if img:
                                                alt = await img.get_attribute('alt')
                                                if alt:
                                                    player_name = alt.strip()
                                        except:
                                            pass
                                    
                                    if not player_name:
                                        player_name = f"选手{idx+1}"
                                    
                                    # 清理选手名
                                    player_name = player_name.replace('（', '(').replace('）', ')')
                                    if '(' in player_name:
                                        player_name = player_name.split('(')[0].strip()
                                    
                                    print(f"  选手: {player_name}")
                                    
                                    # 获取头像URL
                                    img_url = None
                                    
                                    # 查找img元素
                                    try:
                                        img = await elem.query_selector('img')
                                        if img:
                                            img_url = await img.get_attribute('src')
                                    except:
                                        pass
                                    
                                    # 尝试从背景图获取
                                    if not img_url:
                                        try:
                                            style = await elem.evaluate('el => getComputedStyle(el).backgroundImage')
                                            if style and style != 'none':
                                                img_url = style.replace('url("', '').replace('url(', '').replace('")', '').replace(')', '')
                                        except:
                                            pass
                                    
                                    if img_url:
                                        # 处理URL
                                        if img_url.startswith('//'):
                                            img_url = 'https:' + img_url
                                        elif img_url.startswith('/'):
                                            img_url = 'https://kpl.qq.com' + img_url
                                        
                                        print(f"    头像: {img_url[:60]}...")
                                        
                                        # 下载图片
                                        filename = f"{team_short}-{player_name}.png"
                                        filepath = os.path.join(OUTPUT_DIR, filename)
                                        
                                        try:
                                            # 使用fetch下载图片
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
                                                print(f"    ✓ 已保存: {filename}")
                                                
                                                players_data.append({
                                                    "team": team_full_name,
                                                    "team_short": team_short,
                                                    "player": player_name,
                                                    "player_id": player_name,
                                                    "file": filename
                                                })
                                                player_found = True
                                            else:
                                                print(f"    ✗ 下载失败")
                                        except Exception as e:
                                            print(f"    ✗ 保存出错: {e}")
                                    
                                except Exception as e:
                                    print(f"  处理元素出错: {e}")
                                    continue
                            
                            if player_found:
                                break
                    except Exception as e:
                        continue
                
                if not player_found:
                    print(f"  未找到 {team_full_name} 的选手信息")
                    
                    # 尝试截图查看页面结构
                    try:
                        screenshot_path = os.path.join(OUTPUT_DIR, f"debug_{team_short}.png")
                        await page.screenshot(path=screenshot_path, full_page=True)
                        print(f"  已保存调试截图: {screenshot_path}")
                    except:
                        pass
            
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
    print("抓取南通Hero久竞和苏州KSG选手头像")
    print("=" * 60)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 抓取选手
    players = await fetch_team_players_v2()
    
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
            print(f"  ✓ {p['team']}: {p['player']}")
    else:
        print("\n未能抓取到选手头像，请检查页面结构")


if __name__ == "__main__":
    asyncio.run(main())
