/**
 * CardRenderer — 卡牌UI渲染组件
 * 负责绘制卡牌、手牌区、指令区等视觉元素
 */
import { CARD_TYPES, LANES } from '../data/cards.js';

export function renderCard(card, opts = {}) {
    const typeInfo = CARD_TYPES[card.type] || CARD_TYPES.tactic;
    const isSmall = opts.small || false;
    const isRevealed = opts.revealed || false;
    const isDisabled = opts.disabled || false;
    const isSelected = opts.selected || false;
    const isEnemy = opts.enemy || false;

    if (isEnemy && !isRevealed) {
        return `<div class="card card--back ${isSmall ? 'card--sm' : ''}" data-uid="${card.uid}">
            <div class="card__back-face">
                <span class="card__back-icon">🃏</span>
            </div>
        </div>`;
    }

    const targetLabel = card.target === 'choose' ? '选路' :
        card.target === 'all' ? '全局' :
        LANES[card.target]?.name || '';

    const costDots = '◆'.repeat(Math.min(card.cost, 5));

    return `<div class="card card--${card.type} ${isSmall ? 'card--sm' : ''} ${isDisabled ? 'card--disabled' : ''} ${isSelected ? 'card--selected' : ''}" 
        data-uid="${card.uid}" data-id="${card.id}" draggable="${!isDisabled}" title="${card.flavor || card.desc}">
        <div class="card__cost"><span>${card.cost}</span></div>
        <div class="card__header">
            <span class="card__type-icon">${typeInfo.icon}</span>
            <span class="card__name">${card.name}</span>
        </div>
        <div class="card__body">
            <div class="card__art">${_getCardArt(card)}</div>
        </div>
        <div class="card__footer">
            <span class="card__target">${targetLabel}</span>
            ${card.power > 0 ? `<span class="card__power">${card.power}</span>` : ''}
        </div>
        <div class="card__desc">${card.desc}</div>
    </div>`;
}

export function renderCardCompact(card) {
    const typeInfo = CARD_TYPES[card.type] || CARD_TYPES.tactic;
    return `<div class="card-compact card-compact--${card.type}" data-uid="${card.uid}" title="${card.desc}">
        <span class="card-compact__cost">${card.cost}</span>
        <span class="card-compact__icon">${typeInfo.icon}</span>
        <span class="card-compact__name">${card.name}</span>
    </div>`;
}

export function renderHandArea(cards, ap, maxAP, opts = {}) {
    const revealedSet = new Set((opts.revealedCards || []).map(c => c.uid));
    const disabledSet = new Set((opts.disabledCards || []).map(c => c.uid));

    return `<div class="hand-area">
        <div class="hand-area__info">
            <span class="hand-info__ap">⚡ ${ap}/${maxAP}</span>
            <span class="hand-info__count">手牌 ${cards.length}/6</span>
        </div>
        <div class="hand-area__cards" id="hand-cards">
            ${cards.map(c => renderCard(c, { disabled: disabledSet.has(c.uid) })).join('')}
        </div>
        <div class="hand-area__hint">拖放卡牌到上方指令区出牌 | 双击弃牌</div>
    </div>`;
}

export function renderCommandZone(slots, maxSlots) {
    let html = '<div class="cmd-zone" id="cmd-zone">';
    html += '<div class="cmd-zone__label">📋 本轮指令</div>';
    html += '<div class="cmd-zone__slots" id="cmd-slots">';
    for (let i = 0; i < maxSlots; i++) {
        const card = slots[i];
        if (card) {
            html += `<div class="cmd-slot cmd-slot--filled" data-idx="${i}">
                ${renderCardCompact(card.card)}
                ${card.targetLane ? `<span class="cmd-slot__lane">${LANES[card.targetLane]?.name || card.targetLane}</span>` : ''}
                <button class="cmd-slot__remove" data-idx="${i}">✕</button>
            </div>`;
        } else {
            html += `<div class="cmd-slot cmd-slot--empty" data-idx="${i}">
                <span class="cmd-slot__placeholder">拖放卡牌</span>
            </div>`;
        }
    }
    html += '</div>';
    html += '</div>';
    return html;
}

export function renderEnemyCards(count, revealed) {
    const revealedSet = new Set((revealed || []).map(c => c.uid));
    let html = '<div class="enemy-hand">';
    html += `<div class="enemy-hand__label">对手手牌 (${count}张)</div>`;
    html += '<div class="enemy-hand__cards">';
    for (let i = 0; i < count; i++) {
        const rev = revealed?.[i];
        if (rev && revealedSet.has(rev.uid)) {
            html += renderCard(rev, { small: true, enemy: true, revealed: true });
        } else {
            html += `<div class="card card--back card--sm"><div class="card__back-face"><span class="card__back-icon">🃏</span></div></div>`;
        }
    }
    html += '</div></div>';
    return html;
}

export function renderSettlements(settlements) {
    if (!settlements.length) return '';
    return `<div class="settlements">
        ${settlements.map(s => {
            const cls = s.side === 'my' ? 'settlement--my' : s.side === 'enemy' ? 'settlement--enemy' : '';
            return `<div class="settlement ${cls}">
                <span class="settlement__icon">${s.icon}</span>
                <span class="settlement__desc">${s.desc}</span>
            </div>`;
        }).join('')}
    </div>`;
}

export function renderLaneSelector(callback) {
    return `<div class="lane-selector" id="lane-selector">
        <div class="lane-selector__title">选择目标路线</div>
        <div class="lane-selector__options">
            <button class="lane-opt" data-lane="top">${LANES.top.icon} ${LANES.top.name}</button>
            <button class="lane-opt" data-lane="mid">${LANES.mid.icon} ${LANES.mid.name}</button>
            <button class="lane-opt" data-lane="bot">${LANES.bot.icon} ${LANES.bot.name}</button>
        </div>
    </div>`;
}

function _getCardArt(card) {
    const arts = {
        atk_top: '⬆️⚔️', atk_mid: '⏺️🔄', atk_bot: '⬇️⚔️',
        atk_all: '🌐💥', atk_gank: '🗡️👤', atk_dive: '💀🏰',
        atk_invade: '🌿🗡️', atk_group: '👥⚔️',
        def_steady: '🛡️🛡️', def_focus: '🛡️🎯', def_ambush: '🪤🎯',
        def_retreat: '🛡️💚', def_tower: '🏰🛡️',
        tac_baron: '🐉', tac_lord: '👑', tac_teamfight: '⚔️👥',
        tac_farm: '💰📈', tac_vision: '👁️🔍', tac_tempo: '⚡⚡',
        tac_split: '↗️↘️',
        ult_comeback: '🔥🔥🔥', ult_ace: '💀💀💀💀💀', ult_backdoor: '🏰💥', ult_pause: '⏸️🎙️',
    };
    return `<span class="card__art-emoji">${arts[card.id] || '⚔️'}</span>`;
}
