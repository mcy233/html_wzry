/**
 * SoundManager - 游戏音效系统
 * 使用 Web Audio API 合成所有音效，无需外部音频文件
 */
let _ctx = null;
let _enabled = true;
let _bgmGain = null;
let _sfxGain = null;
let _bgmOsc = null;
let _volume = { bgm: 0.3, sfx: 0.5 };

function getCtx() {
    if (!_ctx) {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _bgmGain = _ctx.createGain();
        _bgmGain.gain.value = _volume.bgm;
        _bgmGain.connect(_ctx.destination);
        _sfxGain = _ctx.createGain();
        _sfxGain.gain.value = _volume.sfx;
        _sfxGain.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
}

export function setEnabled(on) { _enabled = on; }
export function isEnabled() { return _enabled; }

export function setVolume(type, val) {
    _volume[type] = Math.max(0, Math.min(1, val));
    if (type === 'bgm' && _bgmGain) _bgmGain.gain.value = _volume.bgm;
    if (type === 'sfx' && _sfxGain) _sfxGain.gain.value = _volume.sfx;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.3) {
    if (!_enabled) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal * _volume.sfx, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(_sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, gainVal = 0.1) {
    if (!_enabled) return;
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal * _volume.sfx, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(_sfxGain);
    source.start(ctx.currentTime);
}

/* ====== UI 音效 ====== */
export function sfxClick() {
    playTone(800, 0.08, 'sine', 0.2);
}

export function sfxHover() {
    playTone(600, 0.04, 'sine', 0.1);
}

export function sfxSelect() {
    playTone(523, 0.06, 'sine', 0.25);
    setTimeout(() => playTone(659, 0.06, 'sine', 0.25), 60);
}

export function sfxConfirm() {
    playTone(523, 0.1, 'triangle', 0.3);
    setTimeout(() => playTone(659, 0.1, 'triangle', 0.3), 80);
    setTimeout(() => playTone(784, 0.15, 'triangle', 0.3), 160);
}

export function sfxCancel() {
    playTone(400, 0.1, 'sawtooth', 0.15);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.15), 80);
}

export function sfxBan() {
    playTone(200, 0.2, 'sawtooth', 0.2);
    playNoise(0.15, 0.08);
}

export function sfxPick() {
    playTone(880, 0.08, 'sine', 0.3);
    setTimeout(() => playTone(1047, 0.12, 'sine', 0.3), 70);
}

/* ====== 战斗音效 ====== */
export function sfxBattleStart() {
    [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.2, 'triangle', 0.35), i * 120);
    });
    setTimeout(() => playNoise(0.3, 0.1), 400);
}

export function sfxQTE() {
    playTone(1200, 0.05, 'sine', 0.4);
}

export function sfxQTEPerfect() {
    [1047, 1319, 1568].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.15, 'sine', 0.35), i * 80);
    });
}

export function sfxCounterWin() {
    playTone(784, 0.15, 'triangle', 0.4);
    setTimeout(() => playTone(988, 0.15, 'triangle', 0.4), 100);
    setTimeout(() => playTone(1319, 0.25, 'triangle', 0.4), 200);
    setTimeout(() => playNoise(0.2, 0.06), 300);
}

export function sfxCounterLose() {
    playTone(400, 0.2, 'sawtooth', 0.25);
    setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.25), 150);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.2), 300);
}

export function sfxKill() {
    playTone(880, 0.05, 'square', 0.2);
    setTimeout(() => playTone(1100, 0.08, 'square', 0.2), 50);
}

/* ====== 胜利/失败 ====== */
export function sfxVictory() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.25, 'triangle', 0.35), i * 150);
    });
    setTimeout(() => {
        playNoise(0.5, 0.08);
        playTone(1047, 0.5, 'sine', 0.2);
        playTone(1319, 0.5, 'sine', 0.2);
        playTone(1568, 0.5, 'sine', 0.2);
    }, 1100);
}

export function sfxDefeat() {
    const melody = [440, 392, 349, 330, 262];
    melody.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.25), i * 200);
    });
}

export function sfxCheer() {
    playNoise(1.0, 0.12);
    [784, 988, 1175].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.15, 'sine', 0.15), i * 100 + 200);
    });
}

/* ====== BGM系统 ====== */
export function startBGM(type = 'menu') {
    stopBGM();
    if (!_enabled) return;
    const ctx = getCtx();
    const notes = {
        menu: [262, 330, 392, 330, 262, 220, 262, 330],
        battle: [330, 392, 440, 392, 330, 440, 523, 440],
        explore: [262, 294, 330, 294, 262, 220, 196, 220],
    };
    const seq = notes[type] || notes.menu;
    let idx = 0;

    function playNext() {
        if (!_bgmOsc?._active) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = seq[idx % seq.length];
        gain.gain.setValueAtTime(0.08 * _volume.bgm, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(_bgmGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        idx++;
        _bgmOsc._timer = setTimeout(playNext, 900);
    }

    _bgmOsc = { _active: true, _timer: null };
    playNext();
}

export function stopBGM() {
    if (_bgmOsc) {
        _bgmOsc._active = false;
        if (_bgmOsc._timer) clearTimeout(_bgmOsc._timer);
        _bgmOsc = null;
    }
}

export function sfxNavigate() {
    playTone(440, 0.06, 'sine', 0.15);
    setTimeout(() => playTone(523, 0.06, 'sine', 0.15), 50);
}

export function sfxTraining() {
    playTone(659, 0.1, 'triangle', 0.2);
    setTimeout(() => playTone(784, 0.1, 'triangle', 0.2), 100);
    setTimeout(() => playTone(880, 0.15, 'triangle', 0.25), 200);
}

export function sfxGold() {
    playTone(1319, 0.08, 'sine', 0.3);
    setTimeout(() => playTone(1568, 0.1, 'sine', 0.3), 60);
}

export function sfxExplore() {
    playTone(392, 0.15, 'triangle', 0.2);
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.2), 120);
    setTimeout(() => playTone(659, 0.2, 'triangle', 0.2), 240);
}

/* ====== 卡牌音效 ====== */
export function sfxCardDraw() {
    playTone(600, 0.06, 'sine', 0.2);
    setTimeout(() => playTone(800, 0.06, 'sine', 0.15), 40);
}

export function sfxCardPlay() {
    playTone(440, 0.08, 'triangle', 0.3);
    playNoise(0.06, 0.08);
}

export function sfxCardReveal() {
    playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.25), 160);
    playNoise(0.1, 0.04);
}

export function sfxTowerDestroy() {
    playNoise(0.3, 0.15);
    playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.15), 100);
}

export function sfxObjective() {
    [392, 523, 659, 784].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.15, 'triangle', 0.3), i * 100);
    });
    setTimeout(() => playNoise(0.2, 0.06), 400);
}

export function sfxDiscard() {
    playTone(300, 0.1, 'sawtooth', 0.1);
}
