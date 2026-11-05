const fs = require('fs');
const path = require('path');

const uploadDir = 'C:/Users/cuongnguyenviet8.CORP/.gemini/antigravity/brain/db8da83b-e9ca-4640-bf16-4c471d230bac/.user_uploaded/';
const artifactPath = 'C:/Users/cuongnguyenviet8.CORP/.gemini/antigravity/brain/db8da83b-e9ca-4640-bf16-4c471d230bac/aegis_daotao_dehoc_walkthrough.html';

const imgStudio = 'data:image/jpeg;base64,' + fs.readFileSync(uploadDir + 'media_1793862079638_ac265b33.jpg').toString('base64');
const imgFooter = 'data:image/png;base64,' + fs.readFileSync(uploadDir + 'media_1793850839308_2cfda51d.png').toString('base64');
const imgMath = 'data:image/jpeg;base64,' + fs.readFileSync(uploadDir + 'media_1793804892473_1ff83614.jpg').toString('base64');
const imgArenaLobby = 'data:image/jpeg;base64,' + fs.readFileSync(uploadDir + 'media_1793752583962_46a8bf5a.jpg').toString('base64');
const imgArenaPlay = 'data:image/jpeg;base64,' + fs.readFileSync(uploadDir + 'media_1793755106974_4a3f0d1f.jpg').toString('base64');
const imgBank = 'data:image/png;base64,' + fs.readFileSync(uploadDir + 'media_1793639413882_3f912119.png').toString('base64');

const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Quay Thao Tác Thực Tế — https://daotao.dehoc.vn</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.4); border-radius: 9999px; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex flex-col p-3 sm:p-6 select-none">
  <div class="max-w-7xl mx-auto w-full flex flex-col gap-4">

    <!-- Top Navigation Header -->
    <header class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
          🎥
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-black tracking-tight text-white">AEGIS GLOBAL — THAO TÁC THỰC TẾ</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              LIVE SCREENCAST • daotao.dehoc.vn
            </span>
          </div>
          <p class="text-xs text-slate-400">Trải nghiệm thực chiến: Soạn đề 3 chạm, Đề tin học không rò rỉ DOM, Đóng góp cộng đồng & Gameshow</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button id="btnVoiceToggle" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer">
          <span id="voiceIcon">🗣️</span>
          <span id="voiceLabel">Thuyết Minh: BẬT</span>
        </button>
        <button id="btnAudioToggle" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer">
          <span id="audioIcon">🎵</span>
          <span id="audioLabel">Hiệu Ứng Âm Thanh: BẬT</span>
        </button>
        <button id="btnRecordVideo" class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer">
          <span id="recDot" class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
          <span id="recLabel">🔴 Ghi & Xuất Video (MP4/WebM)</span>
        </button>
      </div>
    </header>

    <!-- Khung Màn Hình Browser Quay Thực Tế -->
    <div class="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col justify-end">
      <!-- Canvas Render Screencast 60fps -->
      <canvas id="cinemaCanvas" width="1920" height="1080" class="absolute inset-0 w-full h-full object-cover"></canvas>

      <!-- Phụ Đề & Lời Bình Thao Tác (Subtitles) -->
      <div class="relative z-20 mx-4 sm:mx-8 mb-2 p-3 sm:p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 backdrop-blur-md shadow-2xl text-center">
        <p id="subtitleText" class="text-sm sm:text-base md:text-lg font-bold text-emerald-200 tracking-wide transition-opacity duration-300 leading-relaxed">
          Đang kết nối vào hệ sinh thái trực tiếp: https://daotao.dehoc.vn...
        </p>
      </div>

      <!-- Video Control Bar (Dưới Đáy) -->
      <div class="relative z-20 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent flex flex-col gap-2">
        <!-- Progress Scrub Bar -->
        <div id="scrubContainer" class="w-full h-2 rounded-full bg-slate-800 cursor-pointer relative overflow-hidden group/bar">
          <div id="scrubProgress" class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-0 transition-all duration-100"></div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-300 pt-1">
          <div class="flex items-center gap-3">
            <button id="btnPlayPause" class="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/30">
              <span id="playIcon">▶</span>
            </button>
            <button id="btnPrevScene" class="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Thao tác trước">
              ⏮
            </button>
            <button id="btnNextScene" class="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Thao tác kế tiếp">
              ⏭
            </button>
            <span class="font-mono text-slate-400 ml-2" id="timeDisplay">00:00 / 02:40</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 font-mono text-[11px] text-emerald-400 border border-slate-700">
              🌐 Live: https://daotao.dehoc.vn
            </span>
            <button id="btnSpeed" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono font-bold text-emerald-300">
              1.0x
            </button>
            <button id="btnFullscreen" class="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Toàn màn hình">
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Danh Sách Các Bước Thao Tác Thực Tế -->
    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>🖱️</span>
          <span>QUY TRÌNH THAO TÁC THỰC TẾ TRÊN DAOTAO.DEHOC.VN (7 PHÂN ĐOẠN)</span>
        </h3>
        <span class="text-xs font-mono text-emerald-400" id="currentSceneBadge">Bước 1/7</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-7 gap-2" id="sceneButtonsList">
        <!-- Rendered by JS -->
      </div>
    </div>

  </div>

  <script>
    // Dữ Liệu Hình Ảnh Thật từ Trang Web daotao.dehoc.vn
    const REAL_IMAGES = {
      studio: "${imgStudio}",
      footer: "${imgFooter}",
      math: "${imgMath}",
      arenaLobby: "${imgArenaLobby}",
      arenaPlay: "${imgArenaPlay}",
      bank: "${imgBank}"
    };

    const loadedImgs = {};
    for (const [k, src] of Object.entries(REAL_IMAGES)) {
      const img = new Image();
      img.src = src;
      loadedImgs[k] = img;
    }

    // 7 Phân Đoạn Thao Tác Thực Tế
    const SCENES = [
      {
        id: 1,
        title: "Truy Cập Trang Chủ",
        url: "https://daotao.dehoc.vn",
        duration: 20,
        narration: "Bắt đầu trải nghiệm thực tế tại địa chỉ daotao.dehoc.vn. Hệ thống trang bị thanh điều hướng Sư phạm Zen 4 phòng làm việc độc lập: Zen Studio, ZenTopics, ZenQuestions và Đội nhóm học viên.",
        cursorPath: [
          { t: 0, x: 200, y: 50 },
          { t: 6, x: 380, y: 155, click: true, label: "Zen Studio" },
          { t: 12, x: 520, y: 155, click: true, label: "ZenTopics" },
          { t: 18, x: 1720, y: 155, click: true, label: "Nguyễn Việt..." }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'studio', "https://daotao.dehoc.vn", "Trang Chủ — Thanh Điều Hướng Sư Phạm Zen 4 Phân Hệ")
      },
      {
        id: 2,
        title: "Soạn Đề Tại Zen Studio",
        url: "https://daotao.dehoc.vn/creator/studio",
        duration: 25,
        narration: "Tại giao diện Zen Studio, giáo viên chỉ cần kéo thả file Word đề thi vào khung trung tâm. Động cơ CIG và Tam Giác Vàng tự động đọc 298 câu hỏi trong hai giây kèm đầy đủ phân loại nhận thức.",
        cursorPath: [
          { t: 0, x: 400, y: 300 },
          { t: 7, x: 960, y: 380, click: true, label: "Thả file Word" },
          { t: 15, x: 1780, y: 375, click: true, label: "Tải đề khác" },
          { t: 22, x: 600, y: 470, click: true, label: "Huy hiệu THONG_HIEU" }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'studio', "https://daotao.dehoc.vn/creator/studio", "Zen Studio — Bóc Tách 298 Câu Hỏi Tự Động Trong 2 Giây")
      },
      {
        id: 3,
        title: "Kiểm Tra Đề Tin Học & Nút Hủy",
        url: "https://daotao.dehoc.vn/creator/studio",
        duration: 25,
        narration: "Kiểm tra độ toàn vẹn của đề thi Tin học: Các thẻ mã lệnh HTML như ol, li, style được hiển thị nguyên vẹn 100%, không bị rò rỉ DOM. Thử nghiệm ngay nút Hủy Bỏ mới trên thanh điều khiển nổi.",
        cursorPath: [
          { t: 0, x: 960, y: 550 },
          { t: 8, x: 500, y: 640, click: true, label: "Câu 1: Đặc trưng AI" },
          { t: 16, x: 1200, y: 940, click: true, label: "Kích Hoạt Đấu Trường" },
          { t: 22, x: 1350, y: 940, click: true, label: "HỦY BỎ (CANCEL)", highlight: true }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'studio', "https://daotao.dehoc.vn/creator/studio", "Kháng Rò Rỉ DOM Đề Tin Học & Nút Hủy Bỏ Tức Thì")
      },
      {
        id: 4,
        title: "ZenTopics & Nút Cộng Đồng",
        url: "https://daotao.dehoc.vn/creator/topics",
        duration: 25,
        narration: "Chuyển sang ZenTopics: Xem cây thư mục chủ đề. Bấm Xem chi tiết để mở bảng thông tin và bấm nút Cộng đồng để chia sẻ đề thi sang kho Tri thức Mở toàn cầu, tự động ánh xạ nhánh COM.",
        cursorPath: [
          { t: 0, x: 500, y: 155 },
          { t: 6, x: 520, y: 155, click: true, label: "Chuyển ZenTopics" },
          { t: 14, x: 960, y: 520, click: true, label: "Xem chi tiết" },
          { t: 21, x: 1050, y: 680, click: true, label: "NÚT CỘNG ĐỒNG (COMMUNITY)", highlight: true }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'bank', "https://daotao.dehoc.vn/creator/topics", "ZenTopics — Quản Trị Cây Đề Thi & Đóng Góp Cộng Đồng")
      },
      {
        id: 5,
        title: "ZenQuestions & Soạn Đa Phương Tiện",
        url: "https://daotao.dehoc.vn/creator/questions",
        duration: 22,
        narration: "Tại ZenQuestions, giáo viên chỉnh sửa câu hỏi với bộ nhận diện phím tắt Ctrl+V thông minh: Dán ảnh MathType y=f(x) tự chuyển thành công thức KaTeX sắc nét, thu âm giọng đọc và nhúng video.",
        cursorPath: [
          { t: 0, x: 700, y: 155 },
          { t: 7, x: 720, y: 155, click: true, label: "ZenQuestions" },
          { t: 14, x: 960, y: 480, click: true, label: "Dán công thức MathType" },
          { t: 20, x: 1100, y: 640, click: true, label: "Lưu câu hỏi" }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'math', "https://daotao.dehoc.vn/creator/questions", "ZenQuestions — Dán MathType Ctrl+V & Soạn Đa Phương Tiện")
      },
      {
        id: 6,
        title: "Đấu Trường Aegis Arena",
        url: "https://daotao.dehoc.vn/arena",
        duration: 23,
        narration: "Bùng nổ đấu trường Aegis Arena: Chọn thể thức Rung Chuông Vàng hoặc Nhanh Như Chớp. Học viên quét mã PIN tham gia ngay lập tức, độ trễ bấm chuông thời gian thực dưới 2 mili-giây.",
        cursorPath: [
          { t: 0, x: 600, y: 300 },
          { t: 7, x: 550, y: 450, click: true, label: "Chọn Rung Chuông Vàng" },
          { t: 14, x: 960, y: 550, click: true, label: "Bắt đầu phòng thi" },
          { t: 20, x: 1200, y: 480, click: true, label: "Bấm chuông < 2ms" }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'arenaLobby', "https://daotao.dehoc.vn/arena", "Aegis Arena — Khởi Chạy Gameshow Thời Gian Thực < 2ms")
      },
      {
        id: 7,
        title: "Chân Trang & Khảo Thí Hoàn Hảo",
        url: "https://daotao.dehoc.vn",
        duration: 20,
        narration: "Khám phá chân trang với đầy đủ cổng thông tin Tổ chức, Pháp lý và trợ lý Hỏi đáp AI 24/7. Aegis Global khẳng định chuẩn mực cao nhất về khảo thí thích ứng và công nghệ giáo dục.",
        cursorPath: [
          { t: 0, x: 960, y: 500 },
          { t: 6, x: 650, y: 720, click: true, label: "Về Aegis Global" },
          { t: 13, x: 800, y: 720, click: true, label: "Hỏi đáp AI Hệ thống" },
          { t: 18, x: 190, y: 760, click: true, label: "VI Chuyển Ngôn Ngữ" }
        ],
        draw: (ctx, t, cX, cY) => drawBrowserScene(ctx, t, cX, cY, 'footer', "https://daotao.dehoc.vn", "Chân Trang Động — Quản Trị Tổ Chức, Pháp Lý & Hỏi Đáp AI")
      }
    ];

    let currentSceneIdx = 0;
    let sceneTime = 0;
    let totalElapsed = 0;
    let isPlaying = false;
    let playbackSpeed = 1.0;
    let voiceEnabled = true;
    let audioEnabled = true;
    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];

    const totalVideoDuration = SCENES.reduce((acc, s) => acc + s.duration, 0);
    const canvas = document.getElementById('cinemaCanvas');
    const ctx = canvas.getContext('2d');

    // Web Audio Synthesizer
    let audioCtx = null;
    let synthGain = null;

    function initAudio() {
      if (audioCtx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        synthGain = audioCtx.createGain();
        synthGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        synthGain.connect(audioCtx.destination);
      } catch {}
    }

    function playClickSfx() {
      if (!audioEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {}
    }

    // Speech Synthesis
    function speakCurrentScene() {
      if (!voiceEnabled || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const text = SCENES[currentSceneIdx].narration;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = 1.05 * playbackSpeed;
      
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
      if (viVoice) utter.voice = viVoice;
      
      window.speechSynthesis.speak(utter);
    }

    // Vẽ Browser Frame & Thao Tác Thực Tế
    function drawBrowserScene(ctx, t, cX, cY, imgKey, currentUrl, bannerTitle) {
      // Background Slate
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 1920, 1080);

      // Browser Window Header (macOS style)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1920, 90);

      // Window Action Dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(45, 45, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(70, 45, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(95, 45, 8, 0, Math.PI * 2); ctx.fill();

      // Navigation Arrows
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText("←", 140, 52);
      ctx.fillText("→", 175, 52);
      ctx.fillText("↻", 210, 52);

      // Realistic URL Address Bar
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(260, 20, 1200, 50, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = '16px system-ui';
      ctx.fillStyle = '#10b981';
      ctx.fillText("🔒", 285, 52);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(currentUrl, 320, 52);

      // Live Status Badge
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(1500, 24, 180, 42, 10);
      ctx.fill();
      ctx.stroke();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText("● LIVE PRODUCTION", 1520, 50);

      // Web Page Content Area
      const img = loadedImgs[imgKey];
      if (img && img.complete) {
        // Vẽ ảnh chụp thật tràn toàn bộ khu vực hiển thị web
        ctx.drawImage(img, 0, 90, 1920, 990);
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 90, 1920, 990);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText("Đang tải dữ liệu thực tế...", 960, 500);
      }

      // Banner Giới Thiệu Tính Năng Góc Trên Phải
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 115, 780, 55, 14);
      ctx.fill();
      ctx.stroke();
      ctx.font = 'bold 18px system-ui';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText("🎯 THAO TÁC: " + bannerTitle, 65, 150);

      // Vẽ Con Trỏ Chuột Vector Đang Thao Tác (Animated Cursor)
      drawRealisticCursor(ctx, cX, cY, t);
    }

    function drawRealisticCursor(ctx, x, y, t) {
      ctx.save();
      ctx.translate(x, y);

      // Ripple Effect khi click
      const ripplePhase = (t * 4) % 1;
      if (ripplePhase < 0.4) {
        ctx.strokeStyle = 'rgba(16, 185, 129, ' + (0.6 - ripplePhase * 1.5) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 10 + ripplePhase * 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Con trỏ chuột trắng viền đen sắc nét
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 24);
      ctx.lineTo(6, 18);
      ctx.lineTo(13, 26);
      ctx.lineTo(17, 23);
      ctx.lineTo(10, 16);
      ctx.lineTo(18, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Animation Loop với Tính Toán Quỹ Đạo Chuột Mượt Mà
    let lastTime = performance.now();
    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        sceneTime += dt * playbackSpeed;
        totalElapsed += dt * playbackSpeed;

        const curScene = SCENES[currentSceneIdx];
        if (sceneTime >= curScene.duration) {
          if (currentSceneIdx < SCENES.length - 1) {
            currentSceneIdx++;
            sceneTime = 0;
            updateSceneUI();
            speakCurrentScene();
          } else {
            isPlaying = false;
            updatePlayPauseButton();
          }
        }
      }

      // Tính tọa độ chuột nội suy mượt mà (Interpolation)
      const curScene = SCENES[currentSceneIdx];
      const paths = curScene.cursorPath;
      let cX = 960, cY = 540;

      if (paths && paths.length > 0) {
        if (sceneTime <= paths[0].t) {
          cX = paths[0].x; cY = paths[0].y;
        } else if (sceneTime >= paths[paths.length - 1].t) {
          const last = paths[paths.length - 1];
          cX = last.x; cY = last.y;
        } else {
          for (let i = 0; i < paths.length - 1; i++) {
            if (sceneTime >= paths[i].t && sceneTime <= paths[i + 1].t) {
              const segT = (sceneTime - paths[i].t) / (paths[i + 1].t - paths[i].t);
              // EaseInOut
              const ease = segT < 0.5 ? 2 * segT * segT : -1 + (4 - 2 * segT) * segT;
              cX = paths[i].x + (paths[i + 1].x - paths[i].x) * ease;
              cY = paths[i].y + (paths[i + 1].y - paths[i].y) * ease;
              break;
            }
          }
        }
      }

      // Render Cảnh
      curScene.draw(ctx, sceneTime, cX, cY);

      updateScrubBar();
      requestAnimationFrame(animate);
    }

    function updateScrubBar() {
      const pct = Math.min(100, (totalElapsed / totalVideoDuration) * 100);
      document.getElementById('scrubProgress').style.width = pct + '%';

      const curM = Math.floor(totalElapsed / 60).toString().padStart(2, '0');
      const curS = Math.floor(totalElapsed % 60).toString().padStart(2, '0');
      const totM = Math.floor(totalVideoDuration / 60).toString().padStart(2, '0');
      const totS = Math.floor(totalVideoDuration % 60).toString().padStart(2, '0');

      const timeStr = \`\${curM}:\${curS} / \${totM}:\${totS}\`;
      document.getElementById('timeDisplay').textContent = timeStr;
    }

    function updateSceneUI() {
      const s = SCENES[currentSceneIdx];
      document.getElementById('subtitleText').textContent = s.narration;
      document.getElementById('currentSceneBadge').textContent = \`Bước \${s.id}/7: \${s.title}\`;

      document.querySelectorAll('.scene-nav-btn').forEach((btn, idx) => {
        if (idx === currentSceneIdx) {
          btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'text-emerald-300');
          btn.classList.remove('bg-slate-950', 'border-slate-800', 'text-slate-400');
        } else {
          btn.classList.remove('bg-emerald-500/20', 'border-emerald-400', 'text-emerald-300');
          btn.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-400');
        }
      });
    }

    function updatePlayPauseButton() {
      document.getElementById('playIcon').textContent = isPlaying ? '⏸' : '▶';
    }

    function jumpToScene(idx) {
      initAudio();
      currentSceneIdx = Math.max(0, Math.min(SCENES.length - 1, idx));
      sceneTime = 0;
      totalElapsed = 0;
      for (let i = 0; i < currentSceneIdx; i++) {
        totalElapsed += SCENES[i].duration;
      }
      playClickSfx();
      updateSceneUI();
      speakCurrentScene();
    }

    // Render nút danh sách thao tác
    const listEl = document.getElementById('sceneButtonsList');
    SCENES.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.className = \`scene-nav-btn p-2 rounded-xl border text-left flex flex-col gap-0.5 transition active:scale-95 cursor-pointer \${
        idx === 0 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
      }\`;
      btn.innerHTML = \`
        <span class="text-[10px] font-mono font-bold uppercase text-slate-500">Bước \${s.id} (\${s.duration}s)</span>
        <span class="text-xs font-bold truncate">\${s.title}</span>
      \`;
      btn.onclick = () => {
        jumpToScene(idx);
        if (!isPlaying) {
          isPlaying = true;
          updatePlayPauseButton();
        }
      };
      listEl.appendChild(btn);
    });

    document.getElementById('btnPlayPause').onclick = () => {
      initAudio();
      isPlaying = !isPlaying;
      updatePlayPauseButton();
      if (isPlaying) speakCurrentScene();
      else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    document.getElementById('btnPrevScene').onclick = () => jumpToScene(currentSceneIdx - 1);
    document.getElementById('btnNextScene').onclick = () => jumpToScene(currentSceneIdx + 1);

    document.getElementById('scrubContainer').onclick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      const targetTime = clickRatio * totalVideoDuration;
      
      let accum = 0;
      for (let i = 0; i < SCENES.length; i++) {
        if (accum + SCENES[i].duration >= targetTime) {
          currentSceneIdx = i;
          sceneTime = targetTime - accum;
          totalElapsed = targetTime;
          break;
        }
        accum += SCENES[i].duration;
      }
      updateSceneUI();
      speakCurrentScene();
    };

    document.getElementById('btnVoiceToggle').onclick = () => {
      voiceEnabled = !voiceEnabled;
      document.getElementById('voiceLabel').textContent = \`Thuyết Minh: \${voiceEnabled ? 'BẬT' : 'TẮT'}\`;
      if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      else if (voiceEnabled && isPlaying) speakCurrentScene();
    };

    document.getElementById('btnAudioToggle').onclick = () => {
      audioEnabled = !audioEnabled;
      document.getElementById('audioLabel').textContent = \`Hiệu Ứng Âm Thanh: \${audioEnabled ? 'BẬT' : 'TẮT'}\`;
    };

    document.getElementById('btnSpeed').onclick = () => {
      const speeds = [1.0, 1.25, 1.5, 2.0];
      const curIdx = speeds.indexOf(playbackSpeed);
      playbackSpeed = speeds[(curIdx + 1) % speeds.length];
      document.getElementById('btnSpeed').textContent = \`\${playbackSpeed}x\`;
    };

    document.getElementById('btnFullscreen').onclick = () => {
      if (!document.fullscreenElement) {
        canvas.requestFullscreen?.() || canvas.parentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };

    // Export Video (MediaRecorder)
    document.getElementById('btnRecordVideo').onclick = () => {
      initAudio();
      if (!isRecording) {
        jumpToScene(0);
        isPlaying = true;
        updatePlayPauseButton();

        const stream = canvas.captureStream(60);
        recordedChunks = [];
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        } catch {
          mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = \`Aegis_Daotao_Dehoc_Live_Walkthrough_\${Date.now()}.webm\`;
          a.click();
          URL.revokeObjectURL(url);
          document.getElementById('recLabel').textContent = '🔴 Ghi & Xuất Video (MP4/WebM)';
          document.getElementById('recDot').classList.add('animate-ping');
          isRecording = false;
        };

        mediaRecorder.start();
        isRecording = true;
        document.getElementById('recLabel').textContent = 'ĐANG THU HÌNH... (BẤM DỪNG)';
        document.getElementById('recDot').classList.remove('animate-ping');
      } else {
        mediaRecorder.stop();
      }
    };

    updateSceneUI();
    requestAnimationFrame(animate);
  </script>
</body>
</html>`;

fs.writeFileSync(artifactPath, htmlContent, 'utf8');
console.log('SUCCESSFULLY_GENERATED_LIVE_WALKTHROUGH_HTML');

