/**
 * Components - 可复用UI组件工厂
 * 所有通用界面元素在此集中管理
 */

export function createElement(tag, className, innerHTML) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
}

export function createButton(text, onClick, className = 'btn') {
    const btn = createElement('button', className, text);
    btn.addEventListener('click', onClick);
    return btn;
}

export function createProgressBar(value, max, className = 'progress-bar') {
    const wrapper = createElement('div', className);
    const fill = createElement('div', 'progress-fill');
    fill.style.width = `${Math.min(100, (value / max) * 100)}%`;
    wrapper.appendChild(fill);
    return wrapper;
}

export function createPlayerCard(player) {
    const card = createElement('div', 'player-card');
    card.innerHTML = `
        <div class="player-card__avatar">${player.id.charAt(0)}</div>
        <div class="player-card__info">
            <div class="player-card__name">${player.id}</div>
            <div class="player-card__role">${player.role}</div>
            <div class="player-card__rating">${player.rating}</div>
        </div>
    `;
    return card;
}

export function createMomentumBar(myPercent = 50) {
    const bar = createElement('div', 'momentum-bar');
    bar.innerHTML = `
        <div class="momentum-bar__fill momentum-bar__fill--my" style="width:${myPercent}%"></div>
        <div class="momentum-bar__fill momentum-bar__fill--enemy" style="width:${100 - myPercent}%"></div>
        <div class="momentum-bar__indicator" style="left:${myPercent}%"></div>
    `;
    return bar;
}

export function createStatRadar(stats) {
    const size = 140;
    const center = size / 2;
    const r = 55;
    const labels = Object.keys(stats);
    const values = Object.values(stats);
    const n = labels.length;
    const angleStep = (Math.PI * 2) / n;

    const points = values.map((v, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const ratio = v / 100;
        return `${center + r * ratio * Math.cos(angle)},${center + r * ratio * Math.sin(angle)}`;
    }).join(' ');

    const gridLines = [0.25, 0.5, 0.75, 1].map(ratio => {
        const pts = Array.from({ length: n }, (_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${center + r * ratio * Math.cos(angle)},${center + r * ratio * Math.sin(angle)}`;
        }).join(' ');
        return `<polygon points="${pts}" class="radar-grid"/>`;
    }).join('');

    const labelEls = labels.map((label, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const lx = center + (r + 18) * Math.cos(angle);
        const ly = center + (r + 18) * Math.sin(angle);
        return `<text x="${lx}" y="${ly}" class="radar-label">${label}</text>`;
    }).join('');

    const wrapper = createElement('div', 'stat-radar');
    wrapper.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${gridLines}
            <polygon points="${points}" class="radar-fill"/>
            ${labelEls}
        </svg>
    `;
    return wrapper;
}

export function showToast(message, duration = 2000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = createElement('div', 'toast-container');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = createElement('div', 'toast', message);
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--show'));
    setTimeout(() => {
        toast.classList.remove('toast--show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function typeWriter(element, text, speed = 40) {
    return new Promise(resolve => {
        let i = 0;
        element.textContent = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}
