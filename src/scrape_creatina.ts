import * as fs from 'fs';
import * as path from 'path';
import { scrapeMetaAds } from './scraper.js';

const MASTER_PATH = path.resolve(process.cwd(), 'data/meta_ads_sono_master.json');

const CREATINA_QUERIES = [
  { query: 'creatina 100% pura', cat: 'Creatina 100% Pura' },
  { query: 'creatina monohidratada pura', cat: 'Creatina Monohidratada' },
  { query: 'creatina manipulada farmacia', cat: 'Creatina Manipulada' },
  { query: 'creatina forca muscular treino', cat: 'Creatina Performance & Treino' },
  { query: 'creatina massa magra definicao', cat: 'Creatina Ganho de Massa' },
  { query: 'creatina creapure', cat: 'Creatina Creapure / Selo Puro' },
  { query: 'creatina OficialFarma', cat: 'Concorrentes Creatina' },
  { query: 'creatina Dux Nutrition', cat: 'Concorrentes Creatina' },
  { query: 'creatina Growth Supplements', cat: 'Concorrentes Creatina' },
  { query: 'creatina Max Titanium', cat: 'Concorrentes Creatina' },
  { query: 'creatina recuperacao muscular', cat: 'Creatina Benefícios & Recuperação' },
  { query: 'creatina cognicao memoria foco', cat: 'Creatina Longevidade & Cognição' },
  { query: 'creatina para mulheres', cat: 'Creatina Feminina & Energia' },
  { query: 'creatina idosos disposicao', cat: 'Creatina Saúde & Longevidade' },
  { query: 'creatina 150g pura', cat: 'Creatina 150g Monohidratada' }
];

const BANNED = ['padel', 'raquete', 'beach tennis', 'troca de tela', 'conserto', 'imóvel', 'aluguel', 'iphone', 'carro', 'vestido', 'calçado', 'curso de'];

const CREATINA_KEYWORDS = [
  'creatina', 'creapure', 'monohidratada', 'monohidrato', 'força', 'forca', 
  'massa muscular', 'massa magra', 'recuperação muscular', 'pos-treino', 'pós-treino', 
  'hipertrofia', 'suplementação', 'suplemento', 'explosão muscular', 'resistencia', 
  'resistência', 'nutri', 'farmacia de manipulacao', 'farmácia de manipulação', 
  'cognição', 'longevidade', 'disposição', 'fadiga', 'edupharma', 'oficialfarma'
];

async function runCreatinaScraper() {
  let masterAds: any[] = [];
  if (fs.existsSync(MASTER_PATH)) {
    masterAds = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));
  }

  const seenIds = new Set(masterAds.map(a => a.id));
  console.log(`\n=============================================================`);
  console.log(`⚡ INICIANDO RASPAGEM EXPANDIDA DE CREATINA (Meta Ads Library)`);
  console.log(`📊 Base anterior: ${masterAds.length} anúncios`);
  console.log(`=============================================================\n`);

  let totalNew = 0;

  for (const item of CREATINA_QUERIES) {
    console.log(`🔎 Raspando: "${item.query}"...`);
    try {
      const res = await scrapeMetaAds({
        searchQuery: item.query,
        country: 'BR',
        maxAds: 25,
        activeStatus: 'active',
      });

      let addedThisQuery = 0;
      for (const ad of res.ads) {
        if (seenIds.has(ad.id)) continue;

        const fullText = ((ad.headline || '') + ' ' + (ad.primaryText || '') + ' ' + (ad.pageName || '') + ' ' + (ad.caption || '')).toLowerCase();
        
        // Filtro anti-lixo
        if (BANNED.some(b => fullText.includes(b))) continue;

        // Deve conter termos de creatina ou treino/força
        const isCreatinaRelevant = CREATINA_KEYWORDS.some(k => fullText.includes(k));
        if (!isCreatinaRelevant) continue;

        seenIds.add(ad.id);
        masterAds.push({
          ...ad,
          searchCategory: item.cat,
          searchTerm: item.query,
        });
        addedThisQuery++;
        totalNew++;
      }

      console.log(`   └─ ✅ Encontrados: ${res.ads.length} | Novos de Creatina: ${addedThisQuery} (Total base: ${masterAds.length})`);
    } catch (err: any) {
      console.error(`   └─ ❌ Erro ao buscar "${item.query}":`, err.message || err);
    }

    // Delay para evitar rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(MASTER_PATH, JSON.stringify(masterAds, null, 2), 'utf-8');
  console.log(`\n🎉 Raspagem finalizada!`);
  console.log(`✨ Novos anúncios de Creatina adicionados: ${totalNew}`);
  console.log(`📦 Total geral no banco de dados: ${masterAds.length}`);
}

runCreatinaScraper();
