/**
 * Arcade Hub 音频引擎（纯 WebAudio 合成，无外部音频文件）
 * 站内游戏引入此脚本后可用：
 *   ArcadeAudio.sfx('eat')        播放音效
 *   ArcadeAudio.bgm('pulse')      播放循环背景音乐（首次用户交互后自动开始）
 *   ArcadeAudio.tone(440,.2)      播放单音（如 Simon 四色音）
 * 静音按钮与音量滑块由本脚本自动挂载，状态存 localStorage，全站游戏共享。
 */
(function () {
  var MUTED_KEY = "arcade_audio_muted";
  var VOL_KEY = "arcade_audio_volume";
  var muted = false;
  var volume = 0.8; // 默认音量，比静音开关独立
  try {
    muted = localStorage.getItem(MUTED_KEY) === "1";
    var sv = parseFloat(localStorage.getItem(VOL_KEY));
    if (!isNaN(sv)) volume = Math.min(1, Math.max(0, sv));
  } catch (e) {}

  var ctx = null, master = null, sfxGain = null, bgmGain = null, noiseBuf = null;
  var pendingTrack = null, currentTrack = null, bgmTimer = null, step = 0;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.6;
      sfxGain.connect(master);
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.4;
      bgmGain.connect(master);
      var len = ctx.sampleRate * 0.4;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  function freq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // 单音：type 波形，vol 音量，slideTo 结束前滑到该频率
  function tone(f, dur, type, vol, when, slideTo) {
    when = when || ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(f, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  function noise(dur, vol, cutoff) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff || 1200;
    g.gain.setValueAtTime(vol || 0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(lp);
    lp.connect(g);
    g.connect(sfxGain);
    src.start();
  }

  function seq(notes, stepDur, type, vol) {
    for (var i = 0; i < notes.length; i++) {
      if (notes[i]) {
        (function (n, t) {
          tone(freq(n), stepDur * 0.9, type || "square", vol || 0.3, ctx.currentTime + t);
        })(notes[i], i * stepDur);
      }
    }
  }

  var SFX = {
    click:  function () { tone(660, 0.06, "square", 0.25); },
    move:   function () { tone(220, 0.05, "triangle", 0.3); },
    flip:   function () { tone(440, 0.07, "triangle", 0.3, null, 520); },
    eat:    function () { seq([76, 81], 0.06, "square", 0.3); },
    merge:  function () { seq([72, 76, 79], 0.05, "square", 0.32); },
    score:  function () { seq([72, 76, 79, 84], 0.07, "square", 0.32); },
    hit:    function () { tone(150, 0.08, "square", 0.35, null, 90); },
    brick:  function () { tone(520, 0.05, "square", 0.28, null, 700); },
    jump:   function () { tone(300, 0.15, "square", 0.3, null, 640); },
    flag:   function () { seq([88, 84], 0.06, "triangle", 0.3); },
    explode:function () { noise(0.45, 0.7, 900); tone(90, 0.4, "sawtooth", 0.35, null, 40); },
    whack:  function () { tone(180, 0.09, "square", 0.4, null, 320); },
    miss:   function () { tone(180, 0.12, "sawtooth", 0.22, null, 120); },
    match:  function () { seq([72, 79, 84], 0.07, "triangle", 0.34); },
    levelup:function () { seq([72, 76, 79, 84, 88], 0.09, "square", 0.32); },
    win:    function () { seq([72, 76, 79, 84, 79, 84, 88], 0.1, "square", 0.32); },
    draw:   function () { seq([69, 65, 62], 0.12, "triangle", 0.28); },
    over:   function () { seq([64, 60, 57, 52], 0.14, "sawtooth", 0.28); },
  };

  // 背景音乐：16 步主旋律 + 8 步贝斯循环（音高为 MIDI 音符号，0 为休止）
  var TRACKS = {
    bright: { bpm: 132, wave: "square",
      mel: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0],
      bass: [48, 48, 55, 55, 52, 52, 57, 57] },
    chill: { bpm: 96, wave: "triangle",
      mel: [64, 0, 67, 69, 0, 71, 0, 69, 67, 0, 64, 0, 62, 0, 60, 0],
      bass: [36, 0, 43, 0, 41, 0, 45, 0] },
    pulse: { bpm: 150, wave: "square",
      mel: [69, 69, 0, 72, 74, 0, 72, 0, 69, 69, 0, 67, 65, 0, 67, 0],
      bass: [45, 45, 52, 52, 43, 43, 50, 50] },
    march: { bpm: 120, wave: "square",
      mel: [60, 0, 64, 0, 67, 0, 64, 0, 65, 0, 69, 0, 72, 0, 69, 0],
      bass: [36, 36, 43, 43, 41, 41, 48, 48] },
    dream: { bpm: 88, wave: "sine",
      mel: [72, 0, 74, 0, 79, 0, 76, 0, 74, 0, 72, 0, 71, 0, 67, 0],
      bass: [48, 0, 55, 0, 53, 0, 52, 0] },
    tense: { bpm: 104, wave: "sawtooth",
      mel: [69, 0, 68, 0, 69, 0, 72, 0, 69, 0, 68, 0, 65, 0, 68, 0],
      bass: [45, 0, 44, 0, 45, 0, 40, 0] },
  };

  function stopBgm() {
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    currentTrack = null;
  }

  function startBgm(name) {
    stopBgm();
    var t = TRACKS[name];
    if (!t) return;
    currentTrack = name;
    step = 0;
    var stepDur = 60 / t.bpm / 2;
    bgmTimer = setInterval(function () {
      if (!ctx || muted) return;
      var now = ctx.currentTime;
      var m = t.mel[step % 16];
      if (m) bgmNote(freq(m), stepDur * 0.85, t.wave, now);
      var b = t.bass[step % 8];
      if (b) bgmNote(freq(b - 12), stepDur * 1.6, "triangle", now);
      step++;
    }, stepDur * 1000);
  }

  function bgmNote(f, dur, type, when) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(bgmGain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  function setMuted(v) {
    muted = v;
    try { localStorage.setItem(MUTED_KEY, v ? "1" : "0"); } catch (e) {}
    if (v) {
      stopBgm();
    } else if (pendingTrack) {
      if (ensure()) startBgm(pendingTrack);
    }
    updateUI();
  }

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
    if (ctx) master.gain.value = volume;
    // 拖动滑块表达的是"想要声音"，静音状态下拖动即取消静音
    if (volume > 0 && muted) {
      muted = false;
      try { localStorage.setItem(MUTED_KEY, "0"); } catch (e) {}
      if (pendingTrack && ensure() && !currentTrack) startBgm(pendingTrack);
    }
    updateUI();
  }

  // ---- 音量滑块 + 静音按钮 ----
  var wrap = null, btn = null, slider = null;
  function mountBtn() {
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.style.cssText =
      "position:fixed;top:10px;right:10px;z-index:99999;display:flex;align-items:center;gap:6px;" +
      "background:rgba(13,11,30,.85);border:1px solid rgba(34,211,238,.5);border-radius:999px;" +
      "padding:5px 10px;box-shadow:0 0 10px rgba(34,211,238,.25);";
    slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(Math.round(volume * 100));
    slider.title = "调节音量";
    slider.setAttribute("aria-label", "音量");
    slider.style.cssText = "width:74px;height:14px;accent-color:#22d3ee;cursor:pointer;margin:0;";
    slider.addEventListener("input", function () { setVolume(Number(slider.value) / 100); });
    // 拖动滑块时别让游戏收到键盘/触摸
    slider.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    btn = document.createElement("button");
    btn.id = "arcade-audio-toggle";
    btn.style.cssText =
      "background:transparent;border:none;color:#22d3ee;font-size:15px;line-height:1;" +
      "cursor:pointer;width:24px;height:24px;padding:0;";
    btn.setAttribute("aria-label", "静音开关");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setMuted(!muted);
    });
    wrap.appendChild(slider);
    wrap.appendChild(btn);
    updateUI();
    document.body.appendChild(wrap);
  }
  function updateUI() {
    if (!btn || !slider) return;
    var silent = muted || volume === 0;
    btn.textContent = silent ? "🔇" : volume < 0.45 ? "🔉" : "🔊";
    btn.title = silent ? "开启声音" : "静音";
    slider.value = String(Math.round(volume * 100));
    slider.title = "音量 " + Math.round(volume * 100) + "%";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountBtn);
  } else {
    mountBtn();
  }

  // 首次交互解锁 AudioContext，并补播挂起的 BGM
  function unlock() {
    if (ensure() && pendingTrack && !muted && !currentTrack) startBgm(pendingTrack);
  }
  addEventListener("pointerdown", unlock, { once: false });
  addEventListener("keydown", unlock, { once: false });

  // 切到后台自动暂停 BGM，回前台恢复
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.visibilityState === "hidden") {
      stopBgm(); // currentTrack 清空，但 pendingTrack 保留
    } else if (pendingTrack && !muted) {
      startBgm(pendingTrack);
    }
  });

  window.ArcadeAudio = {
    sfx: function (name) {
      if (muted || !SFX[name]) return;
      if (!ensure()) return;
      SFX[name]();
    },
    bgm: function (name) {
      pendingTrack = name;
      if (!muted && ensure() && document.visibilityState !== "hidden") startBgm(name);
    },
    stopBgm: function () {
      stopBgm();
      pendingTrack = null;
    },
    tone: function (f, dur, type, vol) {
      if (muted || !ensure()) return;
      tone(f, dur || 0.2, type || "square", vol || 0.3);
    },
    mute: function () { setMuted(true); },
    unmute: function () { setMuted(false); },
    isMuted: function () { return muted; },
  };
})();
