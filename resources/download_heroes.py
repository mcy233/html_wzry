#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从KPL官网CDN下载英雄图片
"""

import os
import requests
import time

HEROES_DIR = "heroes"
os.makedirs(HEROES_DIR, exist_ok=True)

# KPL英雄图片URL模板
# 英雄ID列表（部分常见英雄）
HERO_IDS = [
    105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
    115, 116, 117, 118, 119, 120, 121, 122, 123, 124,
    125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
    135, 136, 137, 138, 139, 140, 141, 142, 143, 144,
    145, 146, 147, 148, 149, 150, 151, 152, 153, 154,
    155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
    165, 166, 167, 168, 169, 170, 171, 172, 173, 174,
    175, 176, 177, 178, 179, 180, 181, 182, 183, 184,
    185, 186, 187, 188, 189, 190, 191, 192, 193, 194,
    195, 196, 197, 198, 199, 500, 501, 502, 503, 504,
    505, 506, 507, 508, 509, 510, 511, 512, 513, 514,
    515, 516, 517, 518, 519, 520, 521, 522, 523, 524,
    525, 526, 527, 528, 529, 530, 531, 532, 533, 534,
    535, 536, 537, 538, 539, 540, 541, 542, 543, 544,
    545, 546, 547, 548, 549, 550, 551, 552, 553, 554,
    555, 556, 557, 558, 559, 560, 561, 562, 563, 564,
    565, 566, 567, 568, 569, 570, 571, 572, 573, 574,
    575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585
]

def download_hero_image(hero_id):
    """下载单个英雄图片"""
    url = f"https://mnappkplshop-pic.tmes.qq.com/cdn/archive/folder/assetsfile/hero/{hero_id}.jpg"
    filepath = f"{HEROES_DIR}/hero_{hero_id:03d}.jpg"
    
    if os.path.exists(filepath):
        print(f"  [SKIP] 已存在: hero_{hero_id:03d}.jpg")
        return True
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://kpl.qq.com/'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200 and len(response.content) > 1000:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"  [OK] 已下载: hero_{hero_id:03d}.jpg ({len(response.content)//1024}KB)")
            return True
        else:
            print(f"  [FAIL] 无法下载 hero_{hero_id:03d}.jpg (状态: {response.status_code})")
            return False
    except Exception as e:
        print(f"  [ERROR] hero_{hero_id:03d}.jpg - {str(e)}")
        return False

def main():
    print("=" * 60)
    print("KPL英雄图片下载工具")
    print("=" * 60)
    print(f"\n准备下载 {len(HERO_IDS)} 个英雄图片...\n")
    
    success_count = 0
    fail_count = 0
    
    for i, hero_id in enumerate(HERO_IDS):
        if download_hero_image(hero_id):
            success_count += 1
        else:
            fail_count += 1
        
        # 每10个暂停一下，避免请求过快
        if (i + 1) % 10 == 0:
            time.sleep(0.5)
    
    print(f"\n{'=' * 60}")
    print(f"下载完成！")
    print(f"  成功: {success_count} 个")
    print(f"  失败: {fail_count} 个")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
