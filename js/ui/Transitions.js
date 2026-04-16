/**
 * Transitions - 场景过渡动画效果
 */

export function fadeTransition(container, direction = 'in', duration = 400) {
    return new Promise(resolve => {
        container.style.transition = `opacity ${duration}ms ease`;
        container.style.opacity = direction === 'in' ? '0' : '1';
        requestAnimationFrame(() => {
            container.style.opacity = direction === 'in' ? '1' : '0';
        });
        setTimeout(resolve, duration);
    });
}

export function slideUpTransition(element, duration = 500) {
    return new Promise(resolve => {
        element.style.transform = 'translateY(30px)';
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        });
        setTimeout(resolve, duration);
    });
}

export function staggerIn(elements, delay = 80, duration = 400) {
    return new Promise(resolve => {
        elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * delay);
        });
        setTimeout(resolve, elements.length * delay + duration);
    });
}

export function pulseElement(element, scale = 1.1, duration = 300) {
    return new Promise(resolve => {
        element.style.transition = `transform ${duration / 2}ms ease`;
        element.style.transform = `scale(${scale})`;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            setTimeout(resolve, duration / 2);
        }, duration / 2);
    });
}

export function shakeElement(element, intensity = 5, duration = 400) {
    return new Promise(resolve => {
        const start = performance.now();
        function shake(now) {
            const elapsed = now - start;
            if (elapsed > duration) {
                element.style.transform = '';
                resolve();
                return;
            }
            const progress = elapsed / duration;
            const decay = 1 - progress;
            const x = (Math.random() - 0.5) * 2 * intensity * decay;
            const y = (Math.random() - 0.5) * 2 * intensity * decay;
            element.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        }
        requestAnimationFrame(shake);
    });
}
