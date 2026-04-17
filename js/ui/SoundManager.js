/**
 * SoundManager - 游戏音效系统 v2
 * MP3优先 + 合成音效fallback + 场景BGM自动切换
 */
import { eventBus } from '../core/EventBus.js';

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

export function setEnabled(on) {
    _enabled = on;
    if (!on) {
        stopBGM();
        stopFileBGM();
        stopAmbient();
    }
}
export function isEnabled() { return _enabled; }

export function setVolume(type, val) {
    _volume[type] = Math.max(0, Math.min(1, val));
    if (type === 'bgm' && _bgmGain) _bgmGain.gain.value = _volume.bgm;
    if (type === 'sfx' && _sfxGain) _sfxGain.gain.value = _volume.sfx;
    if (type === 'bgm') updateFileVolumes();
}

export function getVolume(type) { return _volume[type] ?? 0; }

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

/* ====== MP3音效播放 ====== */

const _sfxCache = new Map();
const SFX_DIR = 'resources/audio/sfx/';

function _playSfxFile(name) {
    if (!_enabled) return false;
    const src = SFX_DIR + name;
    try {
        const audio = new Audio(src);
        audio.volume = Math.max(0, Math.min(1, _volume.sfx));
        audio.preload = 'auto';
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
        return true;
    } catch { return false; }
}

function sfxFileOrSynth(fileName, synthFn) {
    if (!_enabled) return;
    if (!_playSfxFile(fileName)) synthFn();
}

/* ====== UI 音效 ====== */
export function sfxClick() {
    sfxFileOrSynth('click.mp3', () => playTone(800, 0.08, 'sine', 0.2));
}

export function sfxHover() {
    sfxFileOrSynth('hover.mp3', () => playTone(600, 0.04, 'sine', 0.1));
}

export function sfxSelect() {
    sfxFileOrSynth('confirm.mp3', () => {
        playTone(523, 0.06, 'sine', 0.25);
        setTimeout(() => playTone(659, 0.06, 'sine', 0.25), 60);
    });
}

export function sfxConfirm() {
    sfxFileOrSynth('confirm.mp3', () => {
        playTone(523, 0.1, 'triangle', 0.3);
        setTimeout(() => playTone(659, 0.1, 'triangle', 0.3), 80);
        setTimeout(() => playTone(784, 0.15, 'triangle', 0.3), 160);
    });
}

export function sfxCancel() {
    sfxFileOrSynth('cancel.mp3', () => {
        playTone(400, 0.1, 'sawtooth', 0.15);
        setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.15), 80);
    });
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
    sfxFileOrSynth('battle-start.mp3', () => {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.2, 'triangle', 0.35), i * 120);
        });
        setTimeout(() => playNoise(0.3, 0.1), 400);
    });
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
    sfxFileOrSynth('kill.mp3', () => {
        playTone(880, 0.05, 'square', 0.2);
        setTimeout(() => playTone(1100, 0.08, 'square', 0.2), 50);
    });
}

/* ====== 胜利/失败 ====== */
export function sfxVictory() {
    sfxFileOrSynth('victory-sting.mp3', () => {
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
    });
}

export function sfxDefeat() {
    sfxFileOrSynth('defeat-sting.mp3', () => {
        const melody = [440, 392, 349, 330, 262];
        melody.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.3, 'sine', 0.25), i * 200);
        });
    });
}

export function sfxCheer() {
    sfxFileOrSynth('crowd-cheer.mp3', () => {
        playNoise(1.0, 0.12);
        [784, 988, 1175].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.15, 'sine', 0.15), i * 100 + 200);
        });
    });
}

/* ====== 额外音效 ====== */
export function sfxNavigate() {
    sfxFileOrSynth('navigate.mp3', () => {
        playTone(440, 0.06, 'sine', 0.15);
        setTimeout(() => playTone(523, 0.06, 'sine', 0.15), 50);
    });
}

export function sfxTraining() {
    sfxFileOrSynth('level-up.mp3', () => {
        playTone(659, 0.1, 'triangle', 0.2);
        setTimeout(() => playTone(784, 0.1, 'triangle', 0.2), 100);
        setTimeout(() => playTone(880, 0.15, 'triangle', 0.25), 200);
    });
}

export function sfxGold() {
    sfxFileOrSynth('coin.mp3', () => {
        playTone(1319, 0.08, 'sine', 0.3);
        setTimeout(() => playTone(1568, 0.1, 'sine', 0.3), 60);
    });
}

export function sfxExplore() {
    playTone(392, 0.15, 'triangle', 0.2);
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.2), 120);
    setTimeout(() => playTone(659, 0.2, 'triangle', 0.2), 240);
}

export function sfxCardDraw() {
    sfxFileOrSynth('card-flip.mp3', () => {
        playTone(600, 0.06, 'sine', 0.2);
        setTimeout(() => playTone(800, 0.06, 'sine', 0.15), 40);
    });
}

export function sfxCardPlay() {
    playTone(440, 0.08, 'triangle', 0.3);
    playNoise(0.06, 0.08);
}

export function sfxCardReveal() {
    sfxFileOrSynth('card-flip.mp3', () => {
        playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);
        setTimeout(() => playTone(784, 0.12, 'sine', 0.25), 160);
        playNoise(0.1, 0.04);
    });
}

export function sfxSSRReveal() {
    _playSfxFile('ssr-reveal.mp3') || sfxCardReveal();
}

export function sfxSRReveal() {
    _playSfxFile('sr-reveal.mp3') || sfxCardReveal();
}

export function sfxLevelUp() {
    sfxFileOrSynth('level-up.mp3', () => sfxTraining());
}

export function sfxStarUp() {
    sfxFileOrSynth('star-up.mp3', () => {
        [784, 988, 1175, 1568].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.2, 'triangle', 0.3), i * 100);
        });
    });
}

export function sfxTowerDestroy() {
    sfxFileOrSynth('tower.mp3', () => {
        playNoise(0.3, 0.15);
        playTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.15), 100);
    });
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

/* ====== 合成BGM (fallback) ====== */
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

/* ====== MP3 BGM + 场景自动切换 ====== */
let _fileBGM = null;
let _fileAmbient = null;
let _currentBGMType = null;
let _bgmGeneration = 0;

const BGM_FILES = {
    menu:    'resources/audio/bgm/menu.mp3',
    home:    'resources/audio/bgm/home.mp3',
    battle:  'resources/audio/bgm/battle.mp3',
    bp:      'resources/audio/bgm/bp.mp3',
    recruit: 'resources/audio/bgm/recruit.mp3',
    explore: 'resources/audio/bgm/explore.mp3',
    victory: 'resources/audio/bgm/victory.mp3',
    defeat:  'resources/audio/bgm/defeat.mp3',
};

const SCENE_BGM_MAP = {
    title:         'menu',
    teamSelect:    'menu',
    home:          'home',
    matchCalendar: 'home',
    roster:        'home',
    training:      'home',
    season:        'home',
    settings:      'home',
    postcards:     'home',
    strategyGuide: 'home',
    recruit:       'recruit',
    transfer:      'home',
    collection:    'home',
    explore:       'explore',
    bp:            'bp',
    battle:        'battle',
    quickBattle:   'battle',
};

const AMBIENT_FILES = {
    crowd:   'resources/audio/ambient/crowd-cheer.mp3',
    arena:   'resources/audio/ambient/arena-hum.mp3',
    city:    'resources/audio/ambient/city-ambient.mp3',
    base:    'resources/audio/ambient/base-ambient.mp3',
};

const CROSSFADE_MS = 800;

function _killAudio(audio) {
    if (!audio) return;
    audio.onerror = null;
    audio.onended = null;
    audio.pause();
    audio.src = '';
}

function _crossfadeBGM(newSrc, loop, vol, gen) {
    const oldAudio = _fileBGM;
    if (oldAudio) {
        oldAudio.onerror = null;
        const startVol = oldAudio.volume;
        const fadeStep = startVol / (CROSSFADE_MS / 50);
        const fadeInterval = setInterval(() => {
            oldAudio.volume = Math.max(0, oldAudio.volume - fadeStep);
            if (oldAudio.volume <= 0.01) {
                clearInterval(fadeInterval);
                _killAudio(oldAudio);
            }
        }, 50);
    }

    const newAudio = new Audio();
    newAudio.src = newSrc;
    newAudio.loop = loop;
    newAudio.volume = 0;
    newAudio.preload = 'auto';
    _fileBGM = newAudio;

    const targetVol = Math.max(0, Math.min(1, vol));
    const p = newAudio.play();
    if (p && p.catch) p.catch(() => {});

    const fadeInStep = targetVol / (CROSSFADE_MS / 50);
    const fadeIn = setInterval(() => {
        if (_fileBGM !== newAudio) { clearInterval(fadeIn); return; }
        newAudio.volume = Math.min(targetVol, newAudio.volume + fadeInStep);
        if (newAudio.volume >= targetVol - 0.01) {
            newAudio.volume = targetVol;
            clearInterval(fadeIn);
        }
    }, 50);

    newAudio.onerror = () => {
        if (_bgmGeneration !== gen) return;
        _fileBGM = null;
        _currentBGMType = null;
        startBGM('menu');
    };
}

export function startFileBGM(type = 'menu') {
    if (type === _currentBGMType && _fileBGM && !_fileBGM.paused) return;

    const src = BGM_FILES[type];
    if (!src) { stopFileBGM(); return; }

    const gen = ++_bgmGeneration;
    const noLoop = type === 'victory' || type === 'defeat';
    _currentBGMType = type;

    stopBGM();

    if (_fileBGM) {
        _crossfadeBGM(src, !noLoop, _volume.bgm, gen);
    } else {
        const audio = new Audio();
        audio.src = src;
        audio.loop = !noLoop;
        audio.volume = Math.max(0, Math.min(1, _volume.bgm));
        audio.preload = 'auto';
        _fileBGM = audio;

        audio.onerror = () => {
            if (_bgmGeneration !== gen) return;
            _fileBGM = null;
            _currentBGMType = null;
            startBGM('menu');
        };

        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
    }
}

export function stopFileBGM() {
    ++_bgmGeneration;
    _killAudio(_fileBGM);
    _fileBGM = null;
    _currentBGMType = null;
}

export function stopAllAudio() {
    stopBGM();
    stopFileBGM();
    stopAmbient();
}

export function startAmbient(type = 'arena') {
    stopAmbient();
    if (!_enabled) return;
    const src = AMBIENT_FILES[type];
    if (!src) return;
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, _volume.bgm * 0.4));
    audio.preload = 'auto';
    _fileAmbient = audio;
    audio.onerror = () => { _fileAmbient = null; };
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
}

export function stopAmbient() {
    _killAudio(_fileAmbient);
    _fileAmbient = null;
}

export function updateFileVolumes() {
    if (_fileBGM) _fileBGM.volume = Math.max(0, Math.min(1, _volume.bgm));
    if (_fileAmbient) _fileAmbient.volume = Math.max(0, Math.min(1, _volume.bgm * 0.4));
}

/* ====== 场景BGM自动切换 ====== */
export function initSceneBGM() {
    eventBus.on('scene:change', (sceneName) => {
        if (!_enabled) return;
        const bgmType = SCENE_BGM_MAP[sceneName];
        if (bgmType === _currentBGMType && _fileBGM && !_fileBGM.paused) {
            return;
        }
        stopBGM();
        stopAmbient();
        if (bgmType) {
            startFileBGM(bgmType);
        } else {
            stopFileBGM();
        }
    });
}
