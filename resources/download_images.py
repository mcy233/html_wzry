#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
城市地标图片下载脚本
用于从免费图库下载游戏所需的城市地标图片

使用方法:
1. 安装依赖: pip install requests
2. 运行脚本: python download_images.py
"""

import os
import requests
import time
from urllib.parse import urlparse

# 创建下载目录
def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

# 下载图片函数
def download_image(url, filepath, timeout=30):
    """从URL下载图片并保存"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"✓ 下载成功: {filepath}")
            return True
        else:
            print(f"✗ 下载失败 ({response.status_code}): {url}")
            return False
    except Exception as e:
        print(f"✗ 下载出错: {url} - {str(e)}")
        return False

# 城市图片配置
# 注意：这些URL需要从Pixabay/Unsplash等网站手动获取
CITY_IMAGES = {
    "beijing": [
        {"name": "gugong", "desc": "故宫"},
        {"name": "changcheng", "desc": "长城"},
        {"name": "niaochao", "desc": "鸟巢"},
        {"name": "tiananmen", "desc": "天安门"},
    ],
    "chengdu": [
        {"name": "panda", "desc": "大熊猫"},
        {"name": "wuhouci", "desc": "武侯祠"},
        {"name": "kuanzhai", "desc": "宽窄巷子"},
    ],
    "chongqing": [
        {"name": "hongyadong", "desc": "洪崖洞"},
        {"name": "jiefangbei", "desc": "解放碑"},
        {"name": "suodao", "desc": "长江索道"},
    ],
    "shanghai": [
        {"name": "waitan", "desc": "外滩"},
        {"name": "dongfang", "desc": "东方明珠"},
        {"name": "chenghuang", "desc": "城隍庙"},
    ],
    "guangzhou": [
        {"name": "tower", "desc": "广州塔"},
        {"name": "chenjia", "desc": "陈家祠"},
    ],
    "shenzhen": [
        {"name": "window", "desc": "世界之窗"},
        {"name": "bay", "desc": "深圳湾"},
    ],
    "wuhan": [
        {"name": "huanghelou", "desc": "黄鹤楼"},
        {"name": "university", "desc": "武汉大学"},
    ],
    "hangzhou": [
        {"name": "xihu", "desc": "西湖"},
        {"name": "lingyin", "desc": "灵隐寺"},
    ],
    "xian": [
        {"name": "dayanta", "desc": "大雁塔"},
        {"name": "bingmayong", "desc": "兵马俑"},
    ],
    "suzhou": [
        {"name": "zhuozheng", "desc": "拙政园"},
        {"name": "huqiu", "desc": "虎丘"},
    ],
    "jinan": [
        {"name": "baotu", "desc": "趵突泉"},
        {"name": "daming", "desc": "大明湖"},
    ],
    "changsha": [
        {"name": "yuelu", "desc": "岳麓山"},
        {"name": "juzizhou", "desc": "橘子洲头"},
    ],
    "foshan": [
        {"name": "zumiao", "desc": "祖庙"},
    ],
    "nantong": [
        {"name": "langshan", "desc": "狼山"},
    ],
    "tongxiang": [
        {"name": "wuzhen", "desc": "乌镇"},
    ],
    "wuxi": [
        {"name": "lingshan", "desc": "灵山大佛"},
        {"name": "yuantou", "desc": "鼋头渚"},
    ],
}

def create_placeholder_images():
    """创建占位符图片（当无法下载真实图片时使用）"""
    print("\n=== 创建占位符图片 ===")
    
    # 这里可以创建简单的占位符图片
    # 由于需要PIL库，这里仅创建空文件作为标记
    
    for city, images in CITY_IMAGES.items():
        city_dir = f"cities/{city}"
        ensure_dir(city_dir)
        
        for img_info in images:
            filename = f"{city}_{img_info['name']}.jpg"
            filepath = os.path.join(city_dir, filename)
            
            if not os.path.exists(filepath):
                # 创建占位符标记文件
                placeholder = filepath + ".placeholder"
                with open(placeholder, 'w', encoding='utf-8') as f:
                    f.write(f"占位符: {img_info['desc']}\n")
                    f.write(f"需要下载: {city} {img_info['desc']} 图片\n")
                    f.write(f"建议来源: Pixabay/Unsplash\n")
                    f.write(f"搜索关键词: {city} {img_info['desc']}\n")
                print(f"创建占位符: {placeholder}")

def download_from_pixabay():
    """
    从Pixabay下载图片
    注意：Pixabay需要API Key才能批量下载
    请访问 https://pixabay.com/api/docs/ 获取API Key
    """
    print("\n=== Pixabay下载功能 ===")
    print("注意：需要Pixabay API Key才能使用此功能")
    print("请访问 https://pixabay.com/api/docs/ 获取API Key")
    print("然后将API Key填入下方变量")
    
    # 请填入你的Pixabay API Key
    PIXABAY_API_KEY = "YOUR_API_KEY_HERE"
    
    if PIXABAY_API_KEY == "YOUR_API_KEY_HERE":
        print("\n未配置API Key，跳过Pixabay下载")
        return
    
    base_url = "https://pixabay.com/api/"
    
    for city, images in CITY_IMAGES.items():
        city_dir = f"cities/{city}"
        ensure_dir(city_dir)
        
        for img_info in images:
            search_term = f"{city} {img_info['desc']}"
            filename = f"{city}_{img_info['name']}.jpg"
            filepath = os.path.join(city_dir, filename)
            
            if os.path.exists(filepath):
                print(f"跳过已存在: {filename}")
                continue
            
            params = {
                'key': PIXABAY_API_KEY,
                'q': search_term,
                'image_type': 'photo',
                'orientation': 'horizontal',
                'per_page': 3
            }
            
            try:
                response = requests.get(base_url, params=params, timeout=30)
                data = response.json()
                
                if data.get('hits'):
                    # 下载第一张图片
                    image_url = data['hits'][0]['largeImageURL']
                    download_image(image_url, filepath)
                    time.sleep(1)  # 避免请求过快
                else:
                    print(f"未找到图片: {search_term}")
            except Exception as e:
                print(f"搜索失败: {search_term} - {str(e)}")

def main():
    print("=" * 60)
    print("王者荣耀KPL小游戏 - 城市地标图片下载工具")
    print("=" * 60)
    
    # 确保基础目录存在
    ensure_dir("cities")
    ensure_dir("teams")
    ensure_dir("players")
    ensure_dir("heroes")
    ensure_dir("ui")
    ensure_dir("food")
    ensure_dir("effects")
    
    print("\n=== 目录结构已创建 ===")
    
    # 创建占位符
    create_placeholder_images()
    
    # 尝试从Pixabay下载（需要API Key）
    download_from_pixabay()
    
    print("\n" + "=" * 60)
    print("下载任务完成！")
    print("=" * 60)
    print("\n下一步操作:")
    print("1. 手动从Pixabay/Unsplash下载图片到对应文件夹")
    print("2. 按照素材清单文档中的命名规范重命名文件")
    print("3. 使用图片压缩工具优化文件大小")
    print("\n推荐下载链接:")
    print("- Pixabay: https://pixabay.com/zh/")
    print("- Unsplash: https://unsplash.com/")

if __name__ == "__main__":
    main()
