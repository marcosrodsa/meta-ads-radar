const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../data/meta_ads_sono_master.json');
let ads = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Filtro rigoroso anti-lixo (exclui raquete, padel, etc.)
const banned = ['padel', 'raquete', 'beach tennis', 'troca de tela', 'conserto', 'imóvel', 'aluguel'];
const relevant = [
  'sono', 'dormir', 'insônia', 'insonia', 'descanso', 'acordar', 'melatonina', 'gaba', 
  'triptofano', 'ashwagandha', '5-htp', '5htp', 'ksm', 'cortisol', 'relaxamento', 'mente', 
  'ansiedade', 'estresse', 'noite', 'repouso', 'creatina', 'suplemento', 'treino', 
  'muscular', 'forca', 'força', 'massa', 'recuperação', 'proteina', 'proteína', 
  'monohidratada', 'manipulação', 'farmacia', 'farmácia', 'nutri', 'saúde', 'saude',
  'cansaço', 'cansado', 'exaustão', 'disposição', 'fadiga', 'magnésio', 'magnesio'
];

ads = ads.filter(ad => {
  const text = ((ad.headline || '') + ' ' + (ad.primaryText || '') + ' ' + (ad.pageName || '')).toLowerCase();
  if (banned.some(b => text.includes(b))) return false;
  return relevant.some(r => text.includes(r));
});

// Classificação real de escala
ads = ads.map(ad => {
  const collation = ad.raw?.collation_count || 1;
  const isScale = collation >= 2;
  
  let scaleStatus = 'TESTE';
  let scaleBadge = '🧪 EM TESTE';
  let scaleDesc = 'Recém-lançado (fase de validação)';

  if (collation >= 4) {
    scaleStatus = 'SUPER_ESCALADO';
    scaleBadge = '🚀 SUPER ESCALADO';
    scaleDesc = `${collation} variações de conjuntos de anúncios ativos simultaneamente`;
  } else if (collation >= 2) {
    scaleStatus = 'ESCALADO';
    scaleBadge = '🔥 ESCALADO';
    scaleDesc = `${collation} variações ativas em escala horizontal`;
  } else if (ad.startDate && ad.startDate < '2026-09-27') {
    scaleStatus = 'VALIDADO';
    scaleBadge = '⚡ VALIDADO';
    scaleDesc = 'Ativo continuamente há vários dias';
  }

  // Extração robusta de URLs de mídia remotas da CDN do Meta
  const snap = ad.raw?.snapshot || {};
  const firstCard = snap.cards?.[0] || {};
  const firstVid = snap.videos?.[0] || {};
  const firstImg = snap.images?.[0] || {};

  const remoteVideoUrl = ad.media?.videoUrl || 
    (ad.media?.urls && ad.media.urls.find(u => u && (u.includes('.mp4') || u.includes('video.')))) ||
    firstCard.video_hd_url || firstCard.video_sd_url ||
    firstVid.video_hd_url || firstVid.video_sd_url || '';

  const videoPoster = firstCard.video_preview_image_url || firstVid.video_preview_image_url || 
    snap.page_profile_picture_url || '';

  const remoteImageUrl = (ad.media?.urls && ad.media.urls.find(u => u && !u.includes('.mp4') && !u.includes('video.'))) ||
    firstCard.resized_image_url || firstCard.original_image_url ||
    firstImg.resized_image_url || firstImg.original_image_url ||
    videoPoster || '';

  // Correspondência com produtos da EduPharma
  const isCreatina = (ad.searchCategory || '').includes('Creatina') || 
    ((ad.headline || '') + ' ' + (ad.primaryText || '')).toLowerCase().includes('creatina');

  const edupharmaMatch = isCreatina 
    ? '⚡ Creatina 100% Pura' 
    : '🌙 Composto Indutor do Sono';

  return {
    ...ad,
    collation,
    scaleStatus,
    scaleBadge,
    scaleDesc,
    edupharmaMatch,
    remoteVideoUrl,
    remoteImageUrl,
    videoPoster
  };
});

// Ordena: Super Escalados e Escalados primeiro
ads.sort((a, b) => b.collation - a.collation);

// Contagens para os botões de filtro
const countSuper = ads.filter(a => a.scaleStatus === 'SUPER_ESCALADO' || a.collation >= 4).length;
const countScale = ads.filter(a => a.scaleStatus === 'ESCALADO').length;
const countScaleAll = ads.filter(a => a.collation >= 2).length;
const countValidated = ads.filter(a => a.scaleStatus === 'VALIDADO').length;
const countTesting = ads.filter(a => a.scaleStatus === 'TESTE').length;
const countSono = ads.filter(a => a.edupharmaMatch.includes('Sono')).length;
const countCreatina = ads.filter(a => a.edupharmaMatch.includes('Creatina')).length;
const countVideos = ads.filter(a => a.media.type === 'video' || a.media.localVideoUrl).length;
const countWhatsapp = ads.filter(a => (a.landingPageUrl || '').includes('whatsapp') || (a.ctaText || '').toLowerCase().includes('whatsapp')).length;

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <title>Radar de Criativos Escalados no Meta Ads | EduPharma</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080b12;
      --bg-card: #0f1523;
      --bg-card-hover: #151d30;
      --border: #1e293b;
      --border-focus: #06b6d4;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --purple: #8b5cf6;
      --amber: #f59e0b;
      --rose: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 24px 32px 100px;
    }
    header { max-width: 1440px; margin: 0 auto 32px; }
    .top-bar {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--border); padding-bottom: 24px;
    }
    .brand-wrap { display: flex; align-items: center; gap: 14px; }
    .badge-logo {
      background: linear-gradient(135deg, var(--cyan), var(--emerald));
      color: #000; font-weight: 800; font-size: 15px; padding: 8px 16px; border-radius: 10px;
      letter-spacing: -0.5px;
    }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .products-bar { display: flex; gap: 10px; flex-wrap: wrap; }
    .prod-btn {
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 9999px;
      text-decoration: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
    }
    .prod-btn:hover { background: rgba(16, 185, 129, 0.2); transform: translateY(-1px); }

    /* Legenda de Escala */
    .legend-card {
      background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 14px; padding: 20px 24px; margin-top: 20px;
    }
    .legend-header {
      font-size: 13px; font-weight: 800; color: var(--cyan); text-transform: uppercase;
      letter-spacing: 0.05em; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
    }
    .legend-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;
    }
    .legend-badge-item {
      background: #090e1a; border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .legend-badge-item .badge-scale { align-self: flex-start; }
    .legend-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
    .legend-desc strong { color: #f1f5f9; }

    .stats-bar {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px; margin-top: 20px;
    }
    .stat-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 12px; padding: 14px 18px;
    }
    .stat-label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
    .stat-value { font-size: 22px; font-weight: 800; margin-top: 2px; }

    .controls {
      max-width: 1440px; margin: 0 auto 28px; display: flex; flex-direction: column; gap: 14px;
    }
    .search-input {
      width: 100%; background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; padding: 14px 18px; color: #fff; font-size: 14px; outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--cyan); }
    .filters-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .filter-label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-right: 4px; }
    .filter-pill {
      background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted);
      padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .filter-pill:hover { color: #fff; border-color: #475569; }
    .filter-pill.active { background: var(--cyan); border-color: var(--cyan); color: #000; font-weight: 700; }
    
    .filter-pill.pill-super.active { background: #f43f5e; border-color: #f43f5e; color: #fff; }
    .filter-pill.pill-scale.active { background: #10b981; border-color: #10b981; color: #000; }
    .filter-pill.pill-scale-all.active { background: #f59e0b; border-color: #f59e0b; color: #000; }
    .filter-pill.pill-valid.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
    .filter-pill.pill-test.active { background: #eab308; border-color: #eab308; color: #000; }

    .grid {
      max-width: 1440px; margin: 0 auto; display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px;
    }
    .card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
      overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s;
    }
    .card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-3px); box-shadow: 0 16px 32px rgba(0,0,0,0.5); }
    .card-top {
      padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.01);
    }
    .page-info { display: flex; align-items: center; gap: 10px; }
    .page-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; background: #1e293b; }
    .page-name { font-size: 13px; font-weight: 700; color: #fff; }
    .ad-date { font-size: 11px; color: var(--text-muted); }
    
    .badge-scale {
      font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .badge-super { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); color: #fb7185; }
    .badge-scale-ok { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; }
    .badge-testing { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; }

    .media-box {
      width: 100%; height: 380px; background: #000; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .media-box video, .media-box img { width: 100%; height: 100%; object-fit: contain; }
    .media-tag {
      position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.75);
      border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(6px);
      padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #fff;
    }
    .card-content { padding: 18px; display: flex; flex-direction: column; gap: 10px; flex-grow: 1; }
    .pill-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag-sm { background: #1e293b; color: #cbd5e1; font-size: 11px; padding: 3px 8px; border-radius: 5px; }
    .tag-match { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #38bdf8; font-weight: 700; }
    
    .ad-title { font-size: 14px; font-weight: 700; color: #f8fafc; line-height: 1.4; }
    .ad-copy-box {
      font-size: 12px; color: var(--text-muted); line-height: 1.6; max-height: 95px;
      overflow-y: auto; white-space: pre-line; padding-right: 4px;
    }
    .card-scale-detail {
      font-size: 11px; color: #94a3b8; background: #0c111c; padding: 6px 10px; border-radius: 6px;
      border: 1px dashed #1e293b;
    }
    .card-bottom {
      padding: 14px 18px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap;
    }
    .btn-act {
      flex: 1; min-width: 100px; background: #1e293b; color: #fff; border: 1px solid #334155;
      padding: 8px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
      text-align: center; text-decoration: none; cursor: pointer; transition: all 0.15s;
    }
    .btn-act:hover { background: #334155; }
    .btn-meta { background: var(--cyan); border-color: var(--cyan); color: #000; font-weight: 700; }
    .btn-meta:hover { background: #38bdf8; }
    .btn-download { background: #0f766e; border-color: #14b8a6; color: #fff; }
    .btn-download:hover { background: #14b8a6; color: #000; }
    #toast {
      position: fixed; bottom: 20px; right: 20px; background: var(--emerald);
      color: #000; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 6px;
      opacity: 0; transform: translateY(10px); transition: all 0.2s; pointer-events: none; z-index: 1000;
    }
    #toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>

  <header>
    <div class="top-bar">
      <div class="brand-wrap">
        <div class="badge-logo">EDUPHARMA</div>
        <div>
          <h1>Mapeamento de Criativos Escalados no Meta Ads</h1>
          <p class="subtitle">Radar Filtrado (Sem Ruído) para Composto Indutor do Sono & Creatina 100% Pura</p>
        </div>
      </div>
      <div class="products-bar">
        <a class="prod-btn" href="https://www.edupharma.store/longevidade/composto-indutor-do-sono" target="_blank">
          🌙 Composto Indutor do Sono (R$ 74,50) ↗
        </a>
        <a class="prod-btn" href="https://www.edupharma.store/longevidade/creatina-100-pura" target="_blank">
          ⚡ Creatina 100% Pura (R$ 89,70) ↗
        </a>
      </div>
    </div>

    <div class="legend-card">
      <div class="legend-header">
        <span>📌 LEGENDA DE ESCALA (STATUS DO CRIATIVO):</span>
      </div>
      <div class="legend-grid">
        <div class="legend-badge-item">
          <span class="badge-scale badge-super">🚀 SUPER ESCALADO</span>
          <div class="legend-desc"><strong>Collation &ge; 4 instâncias</strong>: Criativo campeão absoluto, duplicado em 4+ conjuntos de anúncios com alto orçamento diário simultâneo.</div>
        </div>
        <div class="legend-badge-item">
          <span class="badge-scale badge-scale-ok">🔥 ESCALADO</span>
          <div class="legend-desc"><strong>Collation &ge; 2 instâncias</strong>: Criativo em escala horizontal ativa (rodando em 2 ou 3 conjuntos simultâneos para públicos diferentes).</div>
        </div>
        <div class="legend-badge-item">
          <span class="badge-scale badge-scale-ok" style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.4); color: #c084fc;">⚡ VALIDADO</span>
          <div class="legend-desc"><strong>Ativo há vários dias ininterruptos</strong>: Sobreviveu ao corte padrão de 48-72h e continua rodando com retorno positivo comprovado.</div>
        </div>
        <div class="legend-badge-item">
          <span class="badge-scale badge-testing">🧪 EM TESTE</span>
          <div class="legend-desc"><strong>Lançado nas últimas 48h</strong>: Anúncio recém-publicado pelo anunciante, ainda em fase inicial de teste de criativo e copy.</div>
        </div>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-box">
        <div class="stat-label">Criativos Validados &amp; Filtrados</div>
        <div class="stat-value" id="st-total">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">🔥 Em Escala Horizontal (Collation &gt;= 2)</div>
        <div class="stat-value" id="st-scaled" style="color: var(--rose);">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Vídeos MP4 Prontos</div>
        <div class="stat-value" id="st-videos" style="color: var(--cyan);">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Marcas / Anunciantes Mapeados</div>
        <div class="stat-value" id="st-adv" style="color: var(--emerald);">0</div>
      </div>
    </div>
  </header>

  <div class="controls">
    <input type="text" id="search-box" class="search-input" placeholder="🔎 Digite para filtrar por marca (Oficial Farma, Reviva, etc.), ingrediente (GABA, Ashwagandha) ou dor...">
    <div class="filters-row">
      <span class="filter-label">Status de Escala:</span>
      <button class="filter-pill active" data-f="all">Todos (${ads.length})</button>
      <button class="filter-pill pill-super" data-f="super">🚀 Super Escalados (${countSuper})</button>
      <button class="filter-pill pill-scale" data-f="scale">🔥 Escalados (${countScale})</button>
      <button class="filter-pill pill-scale-all" data-f="scale-all">🔥+🚀 Todos Escalados (${countScaleAll})</button>
      <button class="filter-pill pill-valid" data-f="validated">⚡ Validados (${countValidated})</button>
      <button class="filter-pill pill-test" data-f="testing">🧪 Em Teste (${countTesting})</button>
    </div>
    <div class="filters-row">
      <span class="filter-label">Segmentos &amp; Formato:</span>
      <button class="filter-pill" data-f="sono">🌙 Nicho Sono &amp; Desaceleração (${countSono})</button>
      <button class="filter-pill" data-f="creatina">⚡ Nicho Creatina 100% Pura (${countCreatina})</button>
      <button class="filter-pill" data-f="video">🎥 Apenas Vídeos MP4 (${countVideos})</button>
      <button class="filter-pill" data-f="whatsapp">💬 Direto para WhatsApp (${countWhatsapp})</button>
    </div>
  </div>

  <main class="grid" id="ads-grid"></main>

  <div id="toast">Copy copiada com sucesso!</div>

  <script id="ads-data" type="application/json">
    ${JSON.stringify(ads)}
  </script>

  <script>
    const DATA = JSON.parse(document.getElementById('ads-data').textContent);
    
    // Stats
    document.getElementById('st-total').innerText = DATA.length;
    document.getElementById('st-scaled').innerText = DATA.filter(a => a.collation >= 2).length;
    document.getElementById('st-videos').innerText = DATA.filter(a => a.media.type === 'video' || a.media.localVideoUrl).length;
    document.getElementById('st-adv').innerText = new Set(DATA.map(a => a.pageName)).size;

    let activeFilter = 'all';
    let query = '';

    function toast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    function copyText(idx) {
      const ad = DATA[idx];
      const txt = (ad.headline ? ad.headline + '\\n\\n' : '') + (ad.primaryText || '');
      navigator.clipboard.writeText(txt).then(() => toast('📋 Copy copiada!'));
    }

    function handleMediaError(videoEl, snapshotUrl, poster) {
      const box = videoEl.parentElement;
      if (!box) return;
      box.innerHTML = 
        '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + (poster ? 'url(' + poster + ') center/cover no-repeat' : '#0a0f1d') + ';padding:20px;text-align:center;">' +
          '<div style="background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);">' +
            '<div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;font-weight:600;">🎬 Vídeo Meta Ads</div>' +
            '<a href="' + snapshotUrl + '" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#06b6d4;color:#000;font-weight:800;font-size:12px;padding:8px 14px;border-radius:8px;text-decoration:none;">▶️ Assistir no Ad Library ↗</a>' +
          '</div>' +
        '</div>';
    }

    function handleImgError(imgEl, snapshotUrl) {
      const box = imgEl.parentElement;
      if (!box) return;
      box.innerHTML = 
        '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0f1d;padding:20px;text-align:center;">' +
          '<div style="background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);">' +
            '<div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;font-weight:600;">🖼️ Imagem Meta Ads</div>' +
            '<a href="' + snapshotUrl + '" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#06b6d4;color:#000;font-weight:800;font-size:12px;padding:8px 14px;border-radius:8px;text-decoration:none;">🔍 Ver Anúncio ↗</a>' +
          '</div>' +
        '</div>';
    }

    function render() {
      const grid = document.getElementById('ads-grid');
      grid.innerHTML = '';

      const items = DATA.filter(ad => {
        if (query) {
          const q = query.toLowerCase();
          const matchCopy = (ad.primaryText || '').toLowerCase().includes(q);
          const matchHead = (ad.headline || '').toLowerCase().includes(q);
          const matchPage = (ad.pageName || '').toLowerCase().includes(q);
          const matchTerm = (ad.searchTerm || '').toLowerCase().includes(q);
          if (!matchCopy && !matchHead && !matchPage && !matchTerm) return false;
        }
        if (activeFilter === 'super') return ad.scaleStatus === 'SUPER_ESCALADO' || ad.collation >= 4;
        if (activeFilter === 'scale') return ad.scaleStatus === 'ESCALADO';
        if (activeFilter === 'scale-all') return ad.collation >= 2;
        if (activeFilter === 'validated') return ad.scaleStatus === 'VALIDADO';
        if (activeFilter === 'testing') return ad.scaleStatus === 'TESTE';
        if (activeFilter === 'sono') return ad.edupharmaMatch.includes('Sono');
        if (activeFilter === 'creatina') return ad.edupharmaMatch.includes('Creatina');
        if (activeFilter === 'video') return ad.remoteVideoUrl || ad.media?.type === 'video' || ad.media?.localVideoUrl;
        if (activeFilter === 'whatsapp') return (ad.landingPageUrl || '').includes('whatsapp') || (ad.ctaText || '').toLowerCase().includes('whatsapp');
        return true;
      });

      if (!items.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--text-muted);">Nenhum criativo encontrado para este filtro.</div>';
        return;
      }

      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      items.forEach((ad) => {
        const origIdx = DATA.indexOf(ad);
        const card = document.createElement('div');
        card.className = 'card';

        const localVid = ad.media?.localVideoUrl;
        const remoteVid = ad.remoteVideoUrl || ad.media?.videoUrl || (ad.media?.urls && ad.media.urls.find(u => u && (u.includes('.mp4') || u.includes('video.'))));
        const videoSrc = isLocalHost ? (localVid || remoteVid) : (remoteVid || localVid);

        const localImg = ad.media?.localImageUrl;
        const remoteImg = ad.remoteImageUrl || (ad.media?.urls && ad.media.urls.find(u => u && !u.includes('.mp4') && !u.includes('video.'))) || ad.pageProfilePicture;
        const imgSrc = isLocalHost ? (localImg || remoteImg) : (remoteImg || localImg);

        const isVid = !!(videoSrc || ad.media?.type === 'video');

        let mHtml = '';
        if (isVid && videoSrc) {
          mHtml = '<div class="media-box">' +
            '<video src="' + videoSrc + '" poster="' + (ad.videoPoster || '') + '" controls playsinline preload="metadata" referrerpolicy="no-referrer" onerror="handleMediaError(this, \\'' + ad.adSnapshotUrl + '\\', \\'' + (ad.videoPoster || '') + '\\')"></video>' +
            '<div class="media-tag">🎥 ' + (isLocalHost && localVid ? 'VÍDEO MP4 LOCAL' : 'VÍDEO MP4') + '</div>' +
          '</div>';
        } else if (imgSrc) {
          mHtml = '<div class="media-box">' +
            '<img src="' + imgSrc + '" loading="lazy" referrerpolicy="no-referrer" onerror="handleImgError(this, \\'' + ad.adSnapshotUrl + '\\')" />' +
            '<div class="media-tag">' + (ad.media?.type === 'carousel' ? '🖼️ CARROSSEL' : '🖼️ IMAGEM') + '</div>' +
          '</div>';
        } else {
          mHtml = '<div class="media-box" style="color:var(--text-muted);font-size:12px;">' +
            '<a class="btn-act btn-meta" href="' + ad.adSnapshotUrl + '" target="_blank">🔍 Ver Mídia no Ad Library ↗</a>' +
          '</div>';
        }

        const head = ad.headline || ad.caption || ad.pageName;
        const copy = ad.primaryText || 'Sem texto de copy no anúncio.';

        let badgeClass = 'badge-testing';
        if (ad.scaleStatus === 'SUPER_ESCALADO') badgeClass = 'badge-super';
        else if (ad.scaleStatus === 'ESCALADO' || ad.scaleStatus === 'VALIDADO') badgeClass = 'badge-scale-ok';

        let downloadBtn = '';
        if (isVid && videoSrc) {
          downloadBtn = '<a class="btn-act btn-download" href="' + videoSrc + '" download="' + ad.id + '.mp4" target="_blank">⬇️ Baixar MP4</a>';
        }

        card.innerHTML = 
          '<div class="card-top">' +
            '<div class="page-info">' +
              (ad.pageProfilePicture ? '<img class="page-avatar" src="' + ad.pageProfilePicture + '">' : '') +
              '<div>' +
                '<div class="page-name">' + ad.pageName + '</div>' +
                '<div class="ad-date">📅 Início: ' + (ad.startDate || 'Ativo') + '</div>' +
              '</div>' +
            '</div>' +
            '<span class="badge-scale ' + badgeClass + '">' + ad.scaleBadge + '</span>' +
          '</div>' +
          mHtml +
          '<div class="card-content">' +
            '<div class="pill-tags">' +
              '<span class="tag-sm tag-match">' + ad.edupharmaMatch + '</span>' +
              (ad.ctaText ? '<span class="tag-sm">🔘 ' + ad.ctaText + '</span>' : '') +
              '<span class="tag-sm">📱 ' + (ad.platforms ? ad.platforms.slice(0, 2).join(', ') : '') + '</span>' +
            '</div>' +
            '<div class="card-scale-detail">📊 Indicador: ' + ad.scaleDesc + '</div>' +
            '<div class="ad-title">' + head + '</div>' +
            '<div class="ad-copy-box">' + copy + '</div>' +
          '</div>' +
          '<div class="card-bottom">' +
            '<button class="btn-act" onclick="copyText(' + origIdx + ')">📋 Copiar Copy</button>' +
            downloadBtn +
            (ad.landingPageUrl ? '<a class="btn-act" href="' + ad.landingPageUrl + '" target="_blank">🌐 Loja</a>' : '') +
            '<a class="btn-act btn-meta" href="' + ad.adSnapshotUrl + '" target="_blank">🔍 Ad Library ↗</a>' +
          '</div>';

        grid.appendChild(card);
      });
    }

    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeFilter = e.currentTarget.getAttribute('data-f');
        render();
      });
    });

    document.getElementById('search-box').addEventListener('input', (e) => {
      query = e.target.value.trim();
      render();
    });

    render();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../gallery.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, '../index.html'), html, 'utf8');
console.log('✅ gallery.html e index.html regenerados com sucesso!');
