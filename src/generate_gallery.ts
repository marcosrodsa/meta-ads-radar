import * as fs from 'fs';
import * as path from 'path';

interface AdItem {
  id: string;
  pageName: string;
  pageProfilePicture?: string;
  startDate?: string;
  isActive?: boolean;
  platforms: string[];
  primaryText?: string;
  headline?: string;
  caption?: string;
  ctaText?: string;
  landingPageUrl?: string;
  adSnapshotUrl?: string;
  searchCategory?: string;
  searchTerm?: string;
  media: {
    type: 'image' | 'video' | 'carousel' | 'none';
    urls: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
  };
}

export function buildGalleryHtml(ads: AdItem[]): string {
  const jsonStr = JSON.stringify(ads).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radar de Criativos Escalados - EduPharma (Sono & Creatina)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-card: #111726;
      --border-color: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-purple: #8b5cf6;
      --accent-amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 24px 32px 80px;
    }
    header { max-width: 1440px; margin: 0 auto 30px; }
    .top-bar {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;
    }
    .brand-wrap { display: flex; align-items: center; gap: 14px; }
    .badge-logo {
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald));
      color: #000; font-weight: 800; font-size: 15px; padding: 6px 14px; border-radius: 8px;
    }
    h1 { font-size: 24px; font-weight: 800; }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .products-bar { display: flex; gap: 10px; flex-wrap: wrap; }
    .prod-btn {
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px;
      text-decoration: none; transition: all 0.2s;
    }
    .prod-btn:hover { background: rgba(16, 185, 129, 0.2); }
    .stats-bar {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px; margin-top: 20px;
    }
    .stat-box {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 14px 18px;
    }
    .stat-label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
    .stat-value { font-size: 22px; font-weight: 800; margin-top: 2px; }
    .controls {
      max-width: 1440px; margin: 0 auto 28px; display: flex; flex-direction: column; gap: 14px;
    }
    .search-input {
      width: 100%; background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 14px 18px; color: #fff; font-size: 14px; outline: none;
    }
    .search-input:focus { border-color: var(--accent-cyan); }
    .filters-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-pill {
      background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted);
      padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .filter-pill:hover { color: #fff; border-color: #475569; }
    .filter-pill.active { background: var(--accent-cyan); border-color: var(--accent-cyan); color: #000; font-weight: 700; }
    .grid {
      max-width: 1440px; margin: 0 auto; display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;
    }
    .card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s;
    }
    .card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-3px); box-shadow: 0 16px 32px rgba(0,0,0,0.5); }
    .card-top {
      padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.01);
    }
    .page-info { display: flex; align-items: center; gap: 10px; }
    .page-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #1e293b; }
    .page-name { font-size: 13px; font-weight: 700; color: #fff; }
    .ad-date { font-size: 11px; color: var(--text-muted); }
    .badge-scale {
      font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px;
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399;
    }
    .media-box {
      width: 100%; height: 360px; background: #000; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .media-box video, .media-box img { width: 100%; height: 100%; object-fit: contain; }
    .media-tag {
      position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.75);
      border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(6px);
      padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; color: #fff;
    }
    .card-content { padding: 16px; display: flex; flex-direction: column; gap: 10px; flex-grow: 1; }
    .pill-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag-sm { background: #1e293b; color: #cbd5e1; font-size: 11px; padding: 3px 8px; border-radius: 5px; }
    .ad-title { font-size: 14px; font-weight: 700; color: #f8fafc; line-height: 1.4; }
    .ad-copy-box {
      font-size: 12px; color: var(--text-muted); line-height: 1.6; max-height: 90px;
      overflow-y: auto; white-space: pre-line; padding-right: 4px;
    }
    .card-bottom {
      padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; gap: 8px;
    }
    .btn-act {
      flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155;
      padding: 8px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
      text-align: center; text-decoration: none; cursor: pointer; transition: all 0.15s;
    }
    .btn-act:hover { background: #334155; }
    .btn-meta { background: var(--accent-cyan); border-color: var(--accent-cyan); color: #000; font-weight: 700; }
    .btn-meta:hover { background: #38bdf8; }
    #toast {
      position: fixed; bottom: 20px; right: 20px; background: var(--accent-emerald);
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
          <p class="subtitle">Radar de Criativos para Composto Indutor do Sono & Creatina 100% Pura</p>
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

    <div class="stats-bar">
      <div class="stat-box">
        <div class="stat-label">Anúncios Mapeados</div>
        <div class="stat-value" id="st-total">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Criativos em Vídeo (MP4)</div>
        <div class="stat-value" id="st-videos" style="color: var(--accent-cyan);">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Carrosséis / Imagens</div>
        <div class="stat-value" id="st-images" style="color: var(--accent-purple);">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Anunciantes Mapeados</div>
        <div class="stat-value" id="st-adv" style="color: var(--accent-emerald);">0</div>
      </div>
    </div>
  </header>

  <div class="controls">
    <input type="text" id="search-box" class="search-input" placeholder="🔎 Pesquise por termo, marca (Oficial Farma, Dux, etc.), ingrediente (GABA, Ashwagandha) ou dores...">
    <div class="filters-row">
      <button class="filter-pill active" data-f="all">Todos</button>
      <button class="filter-pill" data-f="sono">🌙 Nicho Sono & Ansiedade</button>
      <button class="filter-pill" data-f="creatina">⚡ Nicho Creatina 100% Pura</button>
      <button class="filter-pill" data-f="video">🎥 Apenas Vídeos</button>
      <button class="filter-pill" data-f="carousel">🖼️ Imagens / Carrossel</button>
      <button class="filter-pill" data-f="whatsapp">💬 Direto para WhatsApp</button>
    </div>
  </div>

  <main class="grid" id="ads-grid"></main>

  <div id="toast">Copy copiada com sucesso!</div>

  <script id="ads-data" type="application/json">
    ${jsonStr}
  </script>

  <script>
    const DATA = JSON.parse(document.getElementById('ads-data').textContent);
    
    // Stats
    document.getElementById('st-total').innerText = DATA.length;
    document.getElementById('st-videos').innerText = DATA.filter(a => a.media.type === 'video').length;
    document.getElementById('st-images').innerText = DATA.filter(a => a.media.type !== 'video').length;
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
        if (activeFilter === 'sono') return ad.searchCategory !== 'Creatina Pura e Performance';
        if (activeFilter === 'creatina') return ad.searchCategory === 'Creatina Pura e Performance';
        if (activeFilter === 'video') return ad.media.type === 'video';
        if (activeFilter === 'carousel') return ad.media.type !== 'video';
        if (activeFilter === 'whatsapp') return (ad.landingPageUrl || '').includes('whatsapp') || (ad.ctaText || '').toLowerCase().includes('whatsapp');
        return true;
      });

      if (!items.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--text-muted);">Nenhum criativo encontrado para esta busca.</div>';
        return;
      }

      items.forEach((ad) => {
        const origIdx = DATA.indexOf(ad);
        const card = document.createElement('div');
        card.className = 'card';

        const isVid = ad.media.type === 'video' && ad.media.urls && ad.media.urls.length > 0;
        const mUrl = (ad.media.urls && ad.media.urls[0]) || ad.media.videoUrl;

        let mHtml = '';
        if (isVid) {
          mHtml = '<div class="media-box"><video src="' + mUrl + '" controls playsinline preload="metadata"></video><div class="media-tag">🎥 VÍDEO MP4</div></div>';
        } else if (mUrl) {
          mHtml = '<div class="media-box"><img src="' + mUrl + '" loading="lazy" /><div class="media-tag">' + (ad.media.type === 'carousel' ? '🖼️ CARROSSEL' : '🖼️ IMAGEM') + '</div></div>';
        } else {
          mHtml = '<div class="media-box" style="color:var(--text-muted);font-size:12px;">Sem mídia direta</div>';
        }

        const head = ad.headline || ad.caption || ad.pageName;
        const copy = ad.primaryText || 'Sem texto de copy no anúncio.';

        card.innerHTML = 
          '<div class="card-top">' +
            '<div class="page-info">' +
              (ad.pageProfilePicture ? '<img class="page-avatar" src="' + ad.pageProfilePicture + '">' : '') +
              '<div>' +
                '<div class="page-name">' + ad.pageName + '</div>' +
                '<div class="ad-date">📅 Início: ' + (ad.startDate || 'Ativo') + '</div>' +
              '</div>' +
            '</div>' +
            '<span class="badge-scale">🔥 ESCALADO</span>' +
          '</div>' +
          mHtml +
          '<div class="card-content">' +
            '<div class="pill-tags">' +
              '<span class="tag-sm">📁 ' + (ad.searchCategory || 'Geral') + '</span>' +
              (ad.ctaText ? '<span class="tag-sm">🔘 ' + ad.ctaText + '</span>' : '') +
              '<span class="tag-sm">📱 ' + (ad.platforms ? ad.platforms.slice(0, 2).join(', ') : '') + '</span>' +
            '</div>' +
            '<div class="ad-title">' + head + '</div>' +
            '<div class="ad-copy-box">' + copy + '</div>' +
          '</div>' +
          '<div class="card-bottom">' +
            '<button class="btn-act" onclick="copyText(' + origIdx + ')">📋 Copiar Copy</button>' +
            (ad.landingPageUrl ? '<a class="btn-act" href="' + ad.landingPageUrl + '" target="_blank">🌐 Ver LP</a>' : '') +
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
}

// Execução
const dataFile = path.resolve(process.cwd(), 'data/meta_ads_sono_master.json');
if (fs.existsSync(dataFile)) {
  const adsData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const html = buildGalleryHtml(adsData);
  fs.writeFileSync(path.resolve(process.cwd(), 'gallery.html'), html, 'utf-8');
  console.log('✅ gallery.html atualizado com sucesso!');
}
