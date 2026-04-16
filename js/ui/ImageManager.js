/**
 * ImageManager - 图片资源管理器
 * 使用从玩加电竞下载的真实战队Logo和选手头像，加载失败时回退到 SVG 生成
 *
 * 目录结构:
 *   resources/teams/{wanplusTeamId}.png    — 战队Logo
 *   resources/players/{wanplusPlayerId}.png — 选手头像
 */
import { generateTeamLogo, generatePlayerAvatar } from './TeamLogos.js';
import { getTeamLogoPath, getPlayerAvatarPath } from '../data/wanplusAssets.js';
import { getPlayerHDAvatarPath } from '../data/playerAvatarsByTeam.js';

/**
 * 获取战队logo HTML
 * 优先使用wanplus真实图片，失败回退SVG
 */
export function teamLogoHTML(teamId, team, size = 64) {
    const realPath = getTeamLogoPath(teamId);
    const svgFallback = generateTeamLogo(teamId, team, size);
    if (!realPath) {
        return `<span class="img-wrapper img-wrapper--team" style="width:${size}px;height:${size}px">${svgFallback}</span>`;
    }
    return `<span class="img-wrapper img-wrapper--team" style="width:${size}px;height:${size}px">
        <img src="${realPath}" alt="${team.shortName}" width="${size}" height="${size}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
             style="border-radius:8px;object-fit:contain"/>
        <span class="img-fallback" style="display:none">${svgFallback}</span>
    </span>`;
}

/**
 * 获取选手头像 HTML
 * 优先匹配wanplus选手头像，失败回退SVG
 */
export function playerAvatarHTML(player, teamColor, size = 48) {
    const hdPath = getPlayerHDAvatarPath(player.id);
    const realPath = hdPath || getPlayerAvatarPath(player.id);
    const svgFallback = generatePlayerAvatar(player, teamColor, size);
    if (!realPath) {
        return `<span class="img-wrapper img-wrapper--player" style="width:${size}px;height:${size}px">${svgFallback}</span>`;
    }
    return `<span class="img-wrapper img-wrapper--player" style="width:${size}px;height:${size}px">
        <img src="${realPath}" alt="${player.id}" width="${size}" height="${size}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
             style="border-radius:6px;object-fit:cover"/>
        <span class="img-fallback" style="display:none">${svgFallback}</span>
    </span>`;
}
