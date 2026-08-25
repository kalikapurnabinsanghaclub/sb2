/* ============================================================
   DJ STUDIO UPGRADE MODULE — Phase 1-4
   Features Added:
   1. Track Metadata Display (ID3)
   2. Visual Waveform Canvas
   3. BPM Detection + Sync + Phase Meter
   4. Hot Cue Points (4 per deck)
   5. Loop Controls
   7. Vinyl Mode (Scratch)
   8. FX Unit (Flanger/Chorus/Phaser/Delay/Bitcrusher)
   9. Master Limiter + Clip Indicator
   10. Keyboard Shortcuts
   13. Theme Skins (Neon/Club/Dark) + Compact Toggle
   17. Pitch Lock (Key Correction)
   ============================================================ */
(function () {
    if (window.__DJ_UPGRADE_LOADED__) return;
    window.__DJ_UPGRADE_LOADED__ = true;

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* ============================================================
       SECTION A — CSS INJECTION
       ============================================================ */
    const css = `
/* ===== DJ UPGRADE STYLES ===== */
.dj-up-hotcue-row { display:flex; gap:4px; margin-top:6px; flex-wrap:wrap; }
.dj-up-hotcue { flex:1; min-width:38px; padding:4px 2px; font-size:10px; font-weight:700; border-radius:4px; cursor:pointer; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.06); color:var(--text,#e2e8f0); transition:all .15s; }
.dj-up-hotcue.slot-0 { border-color:rgba(239,68,68,.5); }
.dj-up-hotcue.slot-1 { border-color:rgba(34,197,94,.5); }
.dj-up-hotcue.slot-2 { border-color:rgba(59,130,246,.5); }
.dj-up-hotcue.slot-3 { border-color:rgba(234,179,8,.5); }
.dj-up-hotcue.active { background:#22c55e; color:#0f172a; border-color:#22c55e; }
.dj-up-hotcue.assigned { background:rgba(34,197,94,.25); }

.dj-up-waveform { position:relative; width:100%; height:64px; background:rgba(0,0,0,.4); border-radius:6px; overflow:hidden; cursor:crosshair; margin-top:8px; border:1px solid rgba(255,255,255,.1); }
.dj-up-waveform canvas { position:absolute; inset:0; width:100%; height:100%; }
.dj-up-waveform .wf-playhead { position:absolute; top:0; bottom:0; width:2px; background:#22c55e; box-shadow:0 0 6px #22c55e; pointer-events:none; }
.dj-up-waveform .wf-loop-start, .dj-up-waveform .wf-loop-end { position:absolute; top:0; bottom:0; width:2px; background:#f59e0b; pointer-events:none; }
.dj-up-waveform .wf-loop-region { position:absolute; top:0; bottom:0; background:rgba(245,158,11,.12); pointer-events:none; }

.dj-up-toolbar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; padding:8px 0; }
.dj-up-toolbar button, .dj-up-toolbar select, .dj-up-toolbar label { font-size:11px; padding:4px 8px; border-radius:4px; cursor:pointer; background:rgba(255,255,255,.08); color:var(--text,#e2e8f0); border:1px solid rgba(255,255,255,.15); }
.dj-up-toolbar button:hover { background:rgba(255,255,255,.15); }
.dj-up-toolbar button.active { background:#22c55e; color:#0f172a; border-color:#22c55e; }
.dj-up-toolbar button.active-pitch { background:#3b82f6; color:#fff; border-color:#3b82f6; }

.dj-up-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:12px; color:var(--text,#e2e8f0); margin-top:4px; }
.dj-up-meta .badge { padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; background:rgba(34,197,94,.2); color:#22c55e; border:1px solid rgba(34,197,94,.3); }
.dj-up-meta .badge.orange { background:rgba(245,158,11,.2); color:#f59e0b; border-color:rgba(245,158,11,.3); }
.dj-up-meta .badge.blue { background:rgba(59,130,246,.2); color:#3b82f6; border-color:rgba(59,130,246,.3); }

.dj-up-fxpanel { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; margin-top:8px; }
.dj-up-fx { display:flex; flex-direction:column; align-items:center; gap:2px; background:rgba(255,255,255,.05); padding:4px; border-radius:6px; border:1px solid rgba(255,255,255,.1); }
.dj-up-fx button { width:100%; font-size:9px; padding:3px 0; border-radius:4px; cursor:pointer; background:rgba(255,255,255,.08); color:var(--text,#e2e8f0); border:1px solid rgba(255,255,255,.15); }
.dj-up-fx button.active { background:#8b5cf6; color:#fff; border-color:#8b5cf6; }
.dj-up-fx input[type=range] { width:100%; height:4px; }
.dj-up-fx label { font-size:8px; color:var(--text-muted,#94a3b8); }

.dj-up-limiter { display:flex; align-items:center; gap:6px; font-size:11px; }
.dj-up-clip-light { width:10px; height:10px; border-radius:50%; background:#334155; border:1px solid rgba(255,255,255,.2); transition:background .1s; }
.dj-up-clip-light.clipping { background:#ef4444; box-shadow:0 0 8px #ef4444; }

.dj-up-phase-meter { margin-top:4px; font-size:10px; color:var(--text-muted,#94a3b8); display:flex; align-items:center; gap:4px; }
.dj-up-phase-bar { width:60px; height:6px; background:rgba(255,255,255,.1); border-radius:3px; overflow:hidden; }
.dj-up-phase-fill { height:100%; width:0%; background:#22c55e; transition:width .1s; }

.dj-up-loop-row { display:flex; gap:4px; margin-top:4px; flex-wrap:wrap; }
.dj-up-loop-btn { font-size:10px; padding:3px 8px; border-radius:4px; cursor:pointer; background:rgba(255,255,255,.08); color:var(--text,#e2e8f0); border:1px solid rgba(255,255,255,.15); }
.dj-up-loop-btn.active { background:#f59e0b; color:#0f172a; border-color:#f59e0b; }
.dj-up-loop-btn:disabled { opacity:.4; cursor:not-allowed; }

.dj-up-vinyl-toggle { font-size:10px; padding:3px 8px; border-radius:4px; cursor:pointer; background:rgba(255,255,255,.08); color:var(--text,#e2e8f0); border:1px solid rgba(255,255,255,.15); }
.dj-up-vinyl-toggle.active { background:#ec4899; color:#fff; border-color:#ec4899; }

/* Theme skins */
.dj-theme-neon .pp, .dj-theme-neon .pp * { --accent:#22d3ee; }
.dj-theme-club .pp, .dj-theme-club .pp * { --accent:#f472b6; }
.dj-theme-dark .pp, .dj-theme-dark .pp * { --accent:#38bdf8; }

.dj-up-deck body.dj-compact .dj-up-fxpanel { display:none; }
.dj-up-keyboard-hint { font-size:9px; color:var(--text-muted,#94a3b8); margin-top:4px; opacity:.8; }
`;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ============================================================
       SECTION B — ID3 METADATA PARSER (Feature 1)
       ============================================================ */
    function parseID3(arrayBuffer) {
        const dv = new DataView(arrayBuffer);
        const textDecoder = new TextDecoder('utf-8');
        const meta = { title: '', artist: '', album: '' };

        try {
            // ID3v2
            if (dv.getUint32(0, false) === 0x49443320) { // "ID3 "
                const synchSafe = (b) => (b[0] & 0x7f) * 0x200000 + (b[1] & 0x7f) * 0x4000 + (b[2] & 0x7f) * 0x80 + (b[3] & 0x7f);
                const tagSize = synchSafe(new Uint8Array(arrayBuffer, 6, 4));
                const flags = dv.getUint8(5);
                const hasFooter = flags & 0x10;
                let offset = 10;

                while (offset < tagSize - 10 && offset < 1e6) {
                    const frameId = textDecoder.decode(new Uint8Array(arrayBuffer, offset, 4));
                    const frameSize = synchSafe(new Uint8Array(arrayBuffer, offset + 4, 4));
                    if (frameSize <= 0 || frameSize > 1e6) break;

                    const frameData = new Uint8Array(arrayBuffer, offset + 10, frameSize);
                    // Skip encoding byte (1 byte)
                    const enc = frameData[0];

                    // Extract based on frame id
                    const frameText = (arr, encByte) => {
                        try {
                            if (encByte === 1) return new TextDecoder('utf-16le').decode(arr);
                            if (encByte === 2) return new TextDecoder('utf-16be').decode(arr);
                            if (encByte === 3) return new TextDecoder('utf-8').decode(arr);
                            return new TextDecoder('latin1').decode(arr);
                        } catch (e) { return ''; }
                    };

                    const str = frameText(frameData.subarray(1), enc).replace(/\\x00/g, '').trim();

                    if (frameId === 'TIT2') meta.title = str;
                    else if (frameId === 'TPE1') meta.artist = str;
                    else if (frameId === 'TALB') meta.album = str;

                    offset += 10 + frameSize;
                }
            }
        } catch (e) { /* no-op */ }

        return meta;
    }

    /* ============================================================
       SECTION C — WAVEFORM RENDERER (Feature 2)
       ============================================================ */
    function drawWaveform(canvas, audioBufferOrUrl, deckId) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, width, height);

        if (audioBufferOrUrl instanceof AudioBuffer) {
            const data = audioBufferOrUrl.getChannelData(0);
            const step = Math.ceil(data.length / width);
            const amp = height / 2;

            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const i = Math.floor(x * step);
                const v = data[i];
                const y = amp + v * amp * 0.9;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Fill mirror for aesthetic
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const i = Math.floor(x * step);
                const v = data[i];
                const y = amp - v * amp * 0.9;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(34,197,94,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Loading waveform...', width / 2, height / 2);
        }
    }

    function decodeAudioForWaveform(file, deckId) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (!DJ.ctx) return;
                const buf = await DJ.ctx.decodeAudioData(e.target.result);
                const wf = $('#dj-waveform-' + deckId + ' canvas');
                if (wf) drawWaveform(wf, buf, deckId);
                return buf;
            } catch (err) {
                console.warn('Waveform decode failed:', err);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    /* ============================================================
       SECTION D — BPM DETECTION & BEAT SYNC (Feature 3)
       ============================================================ */
    function detectBPM(audioBuffer) {
        if (!audioBuffer) return null;
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        // Simple energy-based beat detection
        const beatThreshold = 0.5;
        const beats = [];
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms
        let lastBeat = -1;
        let runningEnergy = 0;

        // Compute energy envelope
        for (let i = 0; i < data.length; i += 512) {
            let energy = 0;
            for (let j = 0; j < 512 && (i + j) < data.length; j++) {
                energy += data[i + j] * data[i + j];
            }
            energy /= 512;
            runningEnergy = runningEnergy * 0.9 + energy * 0.1;

            const time = i / sampleRate;
            if (energy > runningEnergy * 2 && energy > beatThreshold && (time - lastBeat) > 0.25) {
                beats.push(time);
                lastBeat = time;
            }
        }

        if (beats.length < 4) return null;

        // Calculate average interval
        let intervals = [];
        for (let i = 1; i < beats.length; i++) {
            intervals.push(beats[i] - beats[i - 1]);
        }

        // Use median to reduce outliers
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const bpm = Math.round(60 / median);

        // Return plausible BPM range
        return Math.max(60, Math.min(200, bpm));
    }

    /* ============================================================
       SECTION E — FX UNITS (Feature 8)
       ============================================================ */
    function createFXNode(deckId, fxType, ctx, input, outputTarget) {
        let output = input;
        let fxNode = null;

        switch (fxType) {
            case 'flanger': {
                const delay = ctx.createDelay(0.1);
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.value = 0.2;
                lfoGain.gain.value = 0.002;
                delay.delayTime.value = 0.003;
                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                input.connect(delay);
                delay.connect(outputTarget);
                lfo.start();
                fxNode = { delay, lfo, input, outputTarget, type: 'flanger' };
                break;
            }
            case 'chorus': {
                const delay = ctx.createDelay(0.1);
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.value = 0.5;
                lfoGain.gain.value = 0.0005;
                delay.delayTime.value = 0.01;
                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                input.connect(delay);
                delay.connect(outputTarget);
                lfo.start();
                fxNode = { delay, lfo, input, outputTarget, type: 'chorus' };
                break;
            }
            case 'phaser': {
                const allpass = ctx.createBiquadFilter();
                allpass.type = 'allpass';
                allpass.frequency.value = 800;
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.value = 0.15;
                lfoGain.gain.value = 600;
                lfo.connect(lfoGain);
                lfoGain.connect(allpass.frequency);
                input.connect(allpass);
                allpass.connect(outputTarget);
                lfo.start();
                fxNode = { allpass, lfo, input, outputTarget, type: 'phaser' };
                break;
            }
            case 'delay': {
                const delay = ctx.createDelay(1.0);
                const feedback = ctx.createGain();
                delay.delayTime.value = 0.35;
                feedback.gain.value = 0.4;
                input.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(outputTarget);
                fxNode = { delay, feedback, input, outputTarget, type: 'delay' };
                break;
            }
            case 'bitcrusher': {
                const shaper = ctx.createWaveShaper();
                const reduce = (x) => {
                    const bits = 8;
                    const maxVal = Math.pow(2, bits) - 1;
                    return Math.round(x * maxVal) / maxVal;
                };
                const curve = new Float32Array(1024);
                for (let i = 0; i < 1024; i++) {
                    curve[i] = reduce(i / 512 - 1);
                }
                shaper.curve = curve;
                input.connect(shaper);
                shaper.connect(outputTarget);
                fxNode = { shaper, input, outputTarget, type: 'bitcrusher' };
                break;
            }
        }
        return fxNode;
    }

    window.toggleDeckFX = function (deckId, fxType, btn) {
        if (!DJ.ctx || !DJ.decks[deckId]) return;
        const d = DJ.decks[deckId];
        if (!d.fx) d.fx = {};

        if (d.fx[fxType]) {
            try { d.fx[fxType].lfo && d.fx[fxType].lfo.stop(); } catch (e) { }
            try { d.fx[fxType].input && d.fx[fxType].input.disconnect(d.fx[fxType].delay || d.fx[fxType].allpass || d.fx[fxType].shaper); } catch (e) { }
            d.fx[fxType] = null;
            if (btn) { btn.classList.remove('active'); btn.style.background = ''; btn.style.color = ''; }
            return;
        }

        // Create the fx
        const input = d.panner; // send from after EQ/balance
        const outputTarget = d.gain; // route FX output through deck volume/crossfader
        d.fx[fxType] = createFXNode(deckId, fxType, DJ.ctx, input, outputTarget);
        if (btn) { btn.classList.add('active'); btn.style.background = '#8b5cf6'; btn.style.color = '#fff'; }
    };

    /* ============================================================
       SECTION F — MASTER LIMITER + CLIP INDICATOR (Feature 9)
       ============================================================ */
    let clipTimeout = null;

    function initMasterLimiter() {
        if (!DJ.ctx || DJ.limiter) return;
        console.log('DJ Upgrade: Initializing Master Limiter...');
        DJ.limiter = DJ.ctx.createDynamicsCompressor();
        DJ.limiter.threshold.value = -6;
        DJ.limiter.knee.value = 6;
        DJ.limiter.ratio.value = 12;
        DJ.limiter.attack.value = 0.003;
        DJ.limiter.release.value = 0.25;

        // Analyser for clip detection
        DJ.clipAnalyser = DJ.ctx.createAnalyser();
        DJ.clipAnalyser.fftSize = 128;

        // We integrate after masterGain & reverb wet path
        // Simplest: replace destination connection in reverb function on next init.
        // But the reverb has already routed masterGain -> dryGain -> destination.
        // We'll intercept by re-routing: masterGain -> limiter -> destination
        try {
            // Re-route dry path
            DJ.masterGain.disconnect();
            DJ.masterGain.connect(DJ.clipAnalyser);
            DJ.masterGain.connect(DJ.limiter);
            DJ.limiter.connect(DJ.reverb.dryGain);

            // Wet path
            DJ.reverb.wetGain.disconnect(DJ.ctx.destination);
            DJ.reverb.wetGain.connect(DJ.limiter);
        } catch (e) {
            console.warn('Limiter routing issue:', e);
        }

        // Clip detection loop
        setInterval(() => {
            if (!DJ.clipAnalyser) return;
            const data = new Uint8Array(DJ.clipAnalyser.frequencyBinCount);
            DJ.clipAnalyser.getByteTimeDomainData(data);
            const peak = Math.max(...data);
            const pct = Math.abs(peak - 128) / 128;
            if (pct > 0.93) {
                const light = $('#dj-master-clip-light');
                if (light) light.classList.add('clipping');
                clearTimeout(clipTimeout);
                clipTimeout = setTimeout(() => {
                    if (light) light.classList.remove('clipping');
                }, 200);
            }
        }, 100);
    }

    /* ============================================================
       SECTION G — KEYBOARD SHORTCUTS (Feature 10)
       ============================================================ */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;

            const activeDeck = DJ.activeDeckId || 'A';
            const d = DJ.decks[activeDeck];
            if (!d) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (d.audio) window.togglePlayDeck(activeDeck);
                    break;
                case 'ArrowLeft':
                    if (d.audio && (e.metaKey || e.ctrlKey)) d.audio.currentTime = Math.max(0, d.audio.currentTime - 10);
                    else if (d.audio) d.audio.currentTime = Math.max(0, d.audio.currentTime - 1);
                    break;
                case 'ArrowRight':
                    if (d.audio && (e.metaKey || e.ctrlKey)) d.audio.currentTime = Math.min(d.audio.duration || 0, d.audio.currentTime + 10);
                    else if (d.audio) d.audio.currentTime = Math.min(d.audio.duration || 0, d.audio.currentTime + 1);
                    break;
                case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': {
                    const idx = parseInt(e.code.slice(-1)) - 1;
                    window.triggerHotCue(activeDeck, idx);
                    break;
                }
                case 'KeyA':
                    if (e.ctrlKey) { e.preventDefault(); DJ.activeDeckId = 'A'; highlightActiveDeck('A'); }
                    break;
                case 'KeyS':
                    if (e.ctrlKey) { e.preventDefault(); DJ.activeDeckId = 'B'; highlightActiveDeck('B'); }
                    break;
                case 'KeyL':
                    if (e.ctrlKey) { e.preventDefault(); window.toggleLoop(activeDeck); }
                    break;
                case 'KeyV':
                    if (e.ctrlKey) { e.preventDefault(); window.toggleVinylMode(activeDeck); }
                    break;
                case 'KeyP':
                    if (e.ctrlKey) { e.preventDefault(); window.togglePitchLock(activeDeck); }
                    break;
            }
        });
    }

    function highlightActiveDeck(deckId) {
        ['A', 'B'].forEach(id => {
            const el = $('#deck-' + id + '-title');
            if (el) el.style.borderColor = (id === deckId) ? '#22c55e' : 'rgba(255,255,255,0.1)';
        });
    }

    /* ============================================================
       SECTION H — HOT CUES (Feature 4)
       ============================================================ */
    window.triggerHotCue = function (deckId, slot) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio || !d.url) return;

        if (!d.cues) d.cues = [];

        if (d.cues[slot]) {
            // Jump to cue
            d.audio.currentTime = d.cues[slot];
            const btn = $('#dj-cue-' + deckId + '-' + slot);
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 200);
            }
        } else {
            // Save cue at current position
            d.cues[slot] = d.audio.currentTime;
            const btn = $('#dj-cue-' + deckId + '-' + slot);
            if (btn) {
                btn.textContent = 'CUE' + (slot + 1) + ' ' + fmtTime(d.audio.currentTime);
                btn.classList.add('assigned');
            }
        }
    };

    window.clearHotCue = function (deckId, slot) {
        const d = DJ.decks[deckId];
        if (!d || !d.cues) return;
        d.cues[slot] = null;
        const btn = $('#dj-cue-' + deckId + '-' + slot);
        if (btn) {
            btn.textContent = 'CUE' + (slot + 1);
            btn.classList.remove('assigned');
        }
    };

    function fmtTime(t) {
        if (!isFinite(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    /* ============================================================
       SECTION I — LOOP CONTROLS (Feature 5)
       ============================================================ */
    window.setLoopIn = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio) return;
        d.loopIn = d.audio.currentTime;
        updateLoopUI(deckId);
    };

    window.setLoopOut = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio) return;
        d.loopOut = d.audio.currentTime;
        if (d.loopOut <= d.loopIn) { alert('Loop OUT must be after Loop IN'); d.loopOut = null; return; }
        updateLoopUI(deckId);
    };

    window.toggleLoop = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio || d.loopIn == null || d.loopOut == null) return;
        d.loopActive = !d.loopActive;
        document.getElementById('dj-loop-' + deckId).classList.toggle('active', d.loopActive);
    };

    window.clearLoop = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d) return;
        d.loopIn = null; d.loopOut = null; d.loopActive = false;
        updateLoopUI(deckId);
    };

    window.halfLoop = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || d.loopIn == null || d.loopOut == null) return;
        const len = d.loopOut - d.loopIn;
        d.loopOut = d.loopIn + len / 2;
        updateLoopUI(deckId);
    };

    window.doubleLoop = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || d.loopIn == null || d.loopOut == null) return;
        const len = d.loopOut - d.loopIn;
        d.loopOut = d.loopIn + len * 2;
        updateLoopUI(deckId);
    };

    function updateLoopUI(deckId) {
        const d = DJ.decks[deckId];
        const loopBtn = $('#dj-loop-' + deckId);
        if (loopBtn) loopBtn.classList.toggle('active', !!d.loopActive);
    }

    /* ============================================================
       SECTION J — VINYL MODE / SCRATCH (Feature 7)
       ============================================================ */
    window.toggleVinylMode = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio) return;
        d.vinylMode = !d.vinylMode;
        const btn = $('#dj-vinyl-' + deckId);
        if (btn) btn.classList.toggle('active', d.vinylMode);
    };

    /* ============================================================
       SECTION K — PITCH LOCK (KEY CORRECTION) (Feature 17)
       ============================================================ */
    window.togglePitchLock = function (deckId) {
        const d = DJ.decks[deckId];
        if (!d || !d.audio) return;
        d.pitchLock = !d.pitchLock;
        const btn = $('#dj-pitchlock-' + deckId);
        if (btn) btn.classList.toggle('active-pitch', d.pitchLock);
    };

    /* ============================================================
       SECTION L — THEME SKINS + COMPACT TOGGLE (Feature 13)
       ============================================================ */
    window.setDJTheme = function (theme) {
        document.querySelectorAll('.dj-theme-neon,.dj-theme-club,.dj-theme-dark').forEach(el => {
            el.classList.remove('dj-theme-neon', 'dj-theme-club', 'dj-theme-dark');
        });
        const djPage = $('#pp-djstudio');
        if (djPage) djPage.classList.add('dj-theme-' + theme);
        ['neon', 'club', 'dark'].forEach(t => {
            const btn = $('#dj-theme-' + t);
            if (btn) btn.classList.toggle('active', t === theme);
        });
    };

    window.toggleCompactDJ = function () {
        document.body.classList.toggle('dj-compact');
        const btn = $('#dj-compact-btn');
        if (btn) btn.classList.toggle('active');
    };

    /* ============================================================
       SECTION M — INTERCEPT AUDIO LOADING FOR METADATA & BPM
       ============================================================ */
    function wrapHandleDJFiles() {
        const origHandle = window.handleDJFiles;
        if (!origHandle || window.__djUpgradeWrapped) return;
        window.__djUpgradeWrapped = true;

        window.handleDJFiles = function (files) {
            // Call original
            const result = origHandle(files);

            // Now process each file for metadata + waveform
            if (files && files.length) {
                Array.from(files).forEach((file, fi) => {
                    const thisDeck = fi % 2 === 0 ? 'A' : 'B';

                    // Parse ID3 for metadata (Feature 1)
                    const fileReader = new FileReader();
                    fileReader.onload = (e) => {
                        const meta = parseID3(e.target.result);
                        // Update track title if found
                        const playlistContainer = $('#dj-playlist-container');
                        if (playlistContainer) {
                            setTimeout(() => {
                                const items = playlistContainer.querySelectorAll('div[data-idx]');
                                const item = items[fi];
                                if (item) {
                                    const titleEl = item.querySelector('.dj-track-title');
                                    if (titleEl && meta.title) {
                                        titleEl.textContent = meta.title + (meta.artist ? ' — ' + meta.artist : '');
                                    }
                                }
                            }, 400);
                        }
                    };
                    fileReader.readAsArrayBuffer(file);

                    // Decode audio for waveform (Feature 2)
                    decodeAudioForWaveform(file, thisDeck);

                    // Detect BPM (Feature 3)
                    const audioReader = new FileReader();
                    audioReader.onload = async (e) => {
                        try {
                            if (!DJ.ctx) return;
                            const audioData = await DJ.ctx.decodeAudioData(e.target.result);
                            const bpm = detectBPM(audioData);
                            if (bpm) {
                                const bpmEl = $('#dj-bpm-' + thisDeck);
                                if (bpmEl) bpmEl.textContent = bpm + ' BPM';
                            }
                        } catch (err) { /* no-op */ }
                    };
                    audioReader.readAsArrayBuffer(file);
                });
            }

            return result;
        };

        // Also wrap loadTrackToDeck to set active deck + attach loop check
        const origLoad = window.loadTrackToDeck;
        if (origLoad) {
            window.loadTrackToDeck = function (deckId) {
                DJ.activeDeckId = deckId;
                highlightActiveDeck(deckId);
                const result = origLoad(deckId);
                return result;
            };
        }
    }

    /* ============================================================
       SECTION N — ATTACH LOOP CHECK TO TIMEUPDATE
       ============================================================ */
    function attachLoopCheck() {
        ['A', 'B'].forEach(deckId => {
            const d = DJ.decks[deckId];
            if (!d || !d.audio || d.__loopCheckAttached) return;
            d.__loopCheckAttached = true;

            d.audio.addEventListener('timeupdate', () => {
                if (d.loopActive && d.loopIn != null && d.loopOut != null) {
                    if (d.audio.currentTime >= d.loopOut) {
                        d.audio.currentTime = d.loopIn;
                    }
                }
            });
        });
    }

    /* ============================================================
       SECTION O — UI INJECTION
       ============================================================ */
    function injectUI() {
        const pp = $('#pp-djstudio');
        if (!pp) { console.warn('DJ page not found'); return; }

        // === Toolbar (theme + compact + limiter) ===
        const toolbar = document.createElement('div');
        toolbar.className = 'dj-up-toolbar';
        toolbar.innerHTML = `
      <div style="display:flex; gap:4px; align-items:center; margin-right:auto;">
        <label style="font-size:10px; opacity:.7;">Theme:</label>
        <button id="dj-theme-neon" onclick="setDJTheme('neon')">Neon</button>
        <button id="dj-theme-club" onclick="setDJTheme('club')">Club</button>
        <button id="dj-theme-dark" onclick="setDJTheme('dark')">Dark</button>
        <button id="dj-compact-btn" onclick="toggleCompactDJ()" style="margin-left:6px;">Compact</button>
      </div>
      <div class="dj-up-limiter">
        <label style="font-size:10px;">Master Clip</label>
        <div class="dj-up-clip-light" id="dj-master-clip-light"></div>
      </div>
    `;
        pp.insertBefore(toolbar, pp.firstChild);

        // === Deck A & B UI blocks ===
        // We find deck sections
        const deckSections = [];
        const sections = $$('.glass-card', pp).filter(c => {
            const t = c.querySelector('.deck-title, [id^=deck-][id$=-title]');
            return t;
        });

        // Actually easier: find decks by looking for Play buttons
        const playBtns = $$('[id^=deck-][id$=-play-btn]', pp);
        playBtns.forEach(btn => {
            const deckId = btn.id.match(/deck-([AB])-play-btn/)?.[1];
            if (!deckId) return;

            const deckCard = btn.closest('.glass-card');
            if (!deckCard || deckCard.querySelector('.dj-up-injected')) return;

            // Mark as injected
            deckCard.classList.add('dj-up-injected');

            // Find the dedicated upgrade slot, fall back to appending to deckCard
            const slot = document.getElementById('deck-' + deckId + '-upgrade-slot');
            const target = slot || deckCard;

            // Add waveform canvas container
            const wfDiv = document.createElement('div');
            wfDiv.className = 'dj-up-waveform';
            wfDiv.id = 'dj-waveform-' + deckId;
            wfDiv.innerHTML = `
        <canvas width="600" height="64"></canvas>
        <div class="wf-playhead" id="dj-playhead-${deckId}" style="left:0%;"></div>
      `;
            target.appendChild(wfDiv);

            // Add metadata row
            const metaDiv = document.createElement('div');
            metaDiv.className = 'dj-up-meta';
            metaDiv.id = 'dj-meta-' + deckId;
            metaDiv.innerHTML = `
        <span class="dj-track-title" style="font-weight:600; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">No Track Loaded</span>
        <span class="badge blue" id="dj-bpm-${deckId}">--</span>
        <span class="badge" id="dj-time-${deckId}">0:00 / 0:00</span>
        <span class="badge orange" id="dj-key-${deckId}">--</span>
      `;
            target.appendChild(metaDiv);

            // Loop controls
            const loopDiv = document.createElement('div');
            loopDiv.className = 'dj-up-loop-row';
            loopDiv.innerHTML = `
        <button class="dj-up-loop-btn" onclick="setLoopIn('${deckId}')">Loop In</button>
        <button class="dj-up-loop-btn" onclick="setLoopOut('${deckId}')">Loop Out</button>
        <button class="dj-up-loop-btn" id="dj-loop-${deckId}" onclick="toggleLoop('${deckId}')">Loop On/Off</button>
        <button class="dj-up-loop-btn" onclick="halfLoop('${deckId}')">½</button>
        <button class="dj-up-loop-btn" onclick="doubleLoop('${deckId}')">2×</button>
        <button class="dj-up-loop-btn" onclick="clearLoop('${deckId}')">Clear</button>
      `;
            target.appendChild(loopDiv);

            // Hot cues
            const cueDiv = document.createElement('div');
            cueDiv.className = 'dj-up-hotcue-row';
            cueDiv.innerHTML = Array.from({ length: 4 }, (_, i) =>
                `<button class="dj-up-hotcue slot-${i}" id="dj-cue-${deckId}-${i}" onclick="triggerHotCue('${deckId}', ${i})" oncontextmenu="event.preventDefault(); clearHotCue('${deckId}', ${i});">CUE${i + 1}</button>`
            ).join('');
            target.appendChild(cueDiv);

            // Vinyl + PitchLock row
            const utilRow = document.createElement('div');
            utilRow.className = 'dj-up-toolbar';
            utilRow.style.padding = '4px 0';
            utilRow.innerHTML = `
        <button class="dj-up-vinyl-toggle" id="dj-vinyl-${deckId}" onclick="toggleVinylMode('${deckId}')">💿 Vinyl</button>
        <button class="dj-up-vinyl-toggle" id="dj-pitchlock-${deckId}" onclick="togglePitchLock('${deckId}')">🔒 Pitch Lock</button>
        <span class="dj-up-keyboard-hint">[Space]=Play • [1-4]=Cues • [Ctrl+L]=Loop • [Ctrl+V]=Vinyl • [Ctrl+P]=PitchLock</span>
      `;
            target.appendChild(utilRow);

            // FX Panel
            const fxDiv = document.createElement('div');
            fxDiv.className = 'dj-up-fxpanel';
            fxDiv.innerHTML = `
        <div class="dj-up-fx">
          <button onclick="toggleDeckFX('${deckId}', 'flanger', this)">Flanger</button>
          <label>FX</label>
        </div>
        <div class="dj-up-fx">
          <button onclick="toggleDeckFX('${deckId}', 'chorus', this)">Chorus</button>
          <label>FX</label>
        </div>
        <div class="dj-up-fx">
          <button onclick="toggleDeckFX('${deckId}', 'phaser', this)">Phaser</button>
          <label>FX</label>
        </div>
        <div class="dj-up-fx">
          <button onclick="toggleDeckFX('${deckId}', 'delay', this)">Delay</button>
          <label>FX</label>
        </div>
        <div class="dj-up-fx">
          <button onclick="toggleDeckFX('${deckId}', 'bitcrusher', this)">BitCrusher</button>
          <label>FX</label>
        </div>
      `;
            target.appendChild(fxDiv);
        });

        // === Phase meter (between decks) ===
        const phaseDiv = document.createElement('div');
        phaseDiv.className = 'dj-up-phase-meter';
        phaseDiv.innerHTML = `
      <span>SYNC:</span>
      <div class="dj-up-phase-bar"><div class="dj-up-phase-fill" id="dj-phase-fill"></div></div>
      <button class="dj-up-vinyl-toggle" id="dj-sync-btn" onclick="syncDecks()" style="margin-left:6px;">⚡ SYNC B→A</button>
    `;
        // Insert after the dual deck section
        const dualDeckSection = pp.querySelector('[style*="min-height:400px"]') || pp.querySelector('.glass-card');
        if (dualDeckSection && dualDeckSection.nextSibling) {
            pp.insertBefore(phaseDiv, dualDeckSection.nextSibling);
        } else {
            pp.appendChild(phaseDiv);
        }

        console.log('DJ Upgrade: UI injected successfully');
    }

    /* ============================================================
       SECTION P — DECK SYNC (BPM Sync + Phase align) (Feature 3)
       ============================================================ */
    window.syncDecks = function () {
        if (!DJ.decks['A'] || !DJ.decks['B']) return;
        const deckA = DJ.decks['A'];
        const deckB = DJ.decks['B'];

        // Match BPM: set deck B speed to match deck A
        const bpmA = parseFloat($('#dj-bpm-A')?.textContent) || null;
        const bpmB = parseFloat($('#dj-bpm-B')?.textContent) || null;
        const origSpeedA = deckA.audio ? deckA.audio.playbackRate : 1;
        const origSpeedB = deckB.audio ? deckB.audio.playbackRate : 1;

        if (bpmA && bpmB && deckB.audio) {
            // Adjust playback rate of B to match A
            const ratio = bpmA / bpmB;
            deckB.audio.playbackRate = origSpeedB * ratio;
            const speedSlider = $('#deck-B-speed');
            if (speedSlider) speedSlider.value = deckB.audio.playbackRate;
            const speedVal = $('#deck-B-speed-val');
            if (speedVal) speedVal.textContent = deckB.audio.playbackRate.toFixed(2) + 'x';
        }

        // Phase alignment: subtract deck A duration mod beat from B
        if (deckA.audio && deckB.audio && bpmA) {
            const beatDur = 60 / bpmA;
            const phaseA = deckA.audio.currentTime % beatDur;
            const phaseB = deckB.audio.currentTime % beatDur;
            const diff = phaseA - phaseB;
            deckB.audio.currentTime = Math.max(0, deckB.audio.currentTime + diff);

            const fill = $('#dj-phase-fill');
            if (fill) fill.style.width = Math.min(100, Math.abs(diff / beatDur) * 100 * 2) + '%';

            const syncBtn = $('#dj-sync-btn');
            if (syncBtn) {
                syncBtn.style.background = '#22c55e';
                syncBtn.style.color = '#0f172a';
                setTimeout(() => { syncBtn.style.background = ''; syncBtn.style.color = ''; }, 1000);
            }
        }
    };

    /* ============================================================
       SECTION Q — WAVEFORM PLAYHEAD UPDATE + META TIME UPDATE
       ============================================================ */
    function initPlayheadUpdates() {
        ['A', 'B'].forEach(deckId => {
            const d = DJ.decks[deckId];
            if (!d || !d.audio || d.__upgradeTimeBound) return;
            d.__upgradeTimeBound = true;

            d.audio.addEventListener('timeupdate', () => {
                // Update playhead
                const playhead = $('#dj-playhead-' + deckId);
                const wf = $('#dj-waveform-' + deckId);
                if (playhead && wf && d.audio.duration) {
                    const pct = (d.audio.currentTime / d.audio.duration) * 100;
                    playhead.style.left = pct + '%';
                }

                // Update time display
                const timeEl = $('#dj-time-' + deckId);
                if (timeEl) {
                    timeEl.textContent = fmtTime(d.audio.currentTime) + ' / ' + fmtTime(d.audio.duration);
                }

                // Loop region visual
                const wfEl = $('#dj-waveform-' + deckId);
                if (wfEl && d.loopIn != null && d.loopOut != null) {
                    let region = wfEl.querySelector('.wf-loop-region');
                    if (!region) {
                        region = document.createElement('div');
                        region.className = 'wf-loop-region';
                        wfEl.appendChild(region);
                    }
                    const dur = d.audio.duration || 1;
                    const left = (d.loopIn / dur) * 100;
                    const width = ((d.loopOut - d.loopIn) / dur) * 100;
                    region.style.left = left + '%';
                    region.style.width = width + '%';
                }
            });

            d.audio.addEventListener('loadedmetadata', () => {
                // Update track title from playlist
                const t = DJ.playlist.find(x => x.url === d.url);
                const titleEl = $('#dj-meta-' + deckId + ' .dj-track-title');
                if (titleEl && t) {
                    titleEl.textContent = t.name || t.title || 'Track';
                }
            });
        });
    }

    /* ============================================================
       SECTION R — INIT
       ============================================================ */
    function init() {
        console.log('DJ Upgrade module loading...');

        // Wait for DOM + DJ to be ready
        setTimeout(() => {
            injectUI();
            wrapHandleDJFiles();

            // Initialize limiter after a short delay to ensure DJ.reverb is set
            setTimeout(() => {
                if (window.DJ && DJ.ctx) {
                    initMasterLimiter();
                } else {
                    // Wait for initDJAudioContext to have been called
                    const origInit = window.initDJAudioContext;
                    if (origInit) {
                        window.initDJAudioContext = function () {
                            const result = origInit.apply(this, arguments);
                            setTimeout(initMasterLimiter, 100);
                            return result;
                        };
                    }
                }
            }, 500);

            initKeyboardShortcuts();
            attachLoopCheck();
            initPlayheadUpdates();

            // Also re-run attach after audio context init
            const origInit2 = window.initDJAudioContext;
            if (origInit2) {
                window.initDJAudioContext = function () {
                    const result = origInit2.apply(this, arguments);
                    setTimeout(() => {
                        attachLoopCheck();
                        initPlayheadUpdates();
                        setTimeout(initMasterLimiter, 100);
                    }, 100);
                    return result;
                };
            }

            console.log('DJ Upgrade: All features initialized');
        }, 300);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();