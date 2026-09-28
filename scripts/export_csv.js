const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../data/meta_ads_sono_master.json');
const csvPath = path.resolve(__dirname, '../data/meta_ads_sono_master.csv');

const ads = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const headers = [
  'ID',
  'Categoria_Pesquisa',
  'Termo_Pesquisa',
  'Anunciante',
  'Data_Inicio',
  'Status_Ativo',
  'Collation_Count',
  'Plataformas',
  'Titulo_Headline',
  'Copy_Texto',
  'Botao_CTA',
  'Landing_Page',
  'Tipo_Midia',
  'Midia_URL',
  'Snapshot_URL'
];

const esc = (val) => {
  if (!val) return '""';
  return '"' + String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
};

const rows = ads.map(a => [
  esc(a.id),
  esc(a.searchCategory),
  esc(a.searchTerm),
  esc(a.pageName),
  esc(a.startDate),
  a.isActive ? '"Sim"' : '"Não"',
  esc(a.raw?.collation_count || 1),
  esc((a.platforms || []).join('; ')),
  esc(a.headline),
  esc(a.primaryText),
  esc(a.ctaText),
  esc(a.landingPageUrl),
  esc(a.media?.type),
  esc(a.media?.localVideoUrl || a.media?.videoUrl || (a.media?.urls && a.media.urls[0])),
  esc(a.adSnapshotUrl)
]);

const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
fs.writeFileSync(csvPath, csv, 'utf8');
console.log('✅ CSV atualizado com sucesso com', ads.length, 'anúncios!');
