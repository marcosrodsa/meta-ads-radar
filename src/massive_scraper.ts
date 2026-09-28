import * as fs from 'fs';
import * as path from 'path';
import { scrapeMetaAds } from './scraper.js';
import { NormalizedMetaAd } from './types.js';

const MASTER_PATH = path.resolve(process.cwd(), 'data/meta_ads_sono_master.json');

const TARGET_QUERIES = [
  // Nicho Sono / Fórmulas e Concorrentes
  { query: 'suplemento sono', cat: 'Ingredientes da Fórmula' },
  { query: 'melatonina sono reparador', cat: 'Ingredientes da Fórmula' },
  { query: 'GABA triptofano sono', cat: 'Ingredientes da Fórmula' },
  { query: 'Ashwagandha KSM-66', cat: 'Ingredientes da Fórmula' },
  { query: '5-HTP sono ansiedade', cat: 'Ingredientes da Fórmula' },
  { query: 'Oficial Farma suplementos', cat: 'Concorrentes e Marcas' },
  { query: 'Dux Nutrition sono', cat: 'Concorrentes e Marcas' },
  { query: 'Growth sono melatonina', cat: 'Concorrentes e Marcas' },
  { query: 'desacelerar a mente sono', cat: 'Ângulos de Dor e Benefício' },
  { query: 'insonia sono profundo', cat: 'Ângulos de Dor e Benefício' },
  { query: 'acordar cansado sono', cat: 'Ângulos de Dor e Benefício' },

  // Nicho Creatina
  { query: 'creatina 100 pura monohidratada', cat: 'Creatina Pura e Performance' },
  { query: 'creatina pura forca', cat: 'Creatina Pura e Performance' },
  { query: 'creatina crescimento muscular', cat: 'Creatina Pura e Performance' },
  { query: 'creatina monohidratada 100', cat: 'Creatina Pura e Performance' },
];

const BANNED = ['padel', 'raquete', 'beach tennis', 'troca de tela', 'conserto', 'imóvel', 'aluguel', 'iphone', 'carro'];
const RELEVANT = [
  'sono', 'dormir', 'insônia', 'insonia', 'descanso', 'acordar', 'melatonina', 'gaba', 
  'triptofano', 'ashwagandha', '5-htp', '5htp', 'ksm', 'cortisol', 'relaxamento', 'mente', 
  'ansiedade', 'estresse', 'noite', 'repouso', 'creatina', 'suplemento', 'treino', 
  'muscular', 'forca', 'força', 'massa', 'recuperação', 'proteina', 'proteína', 
  'monohidratada', 'manipulação', 'farmacia', 'farmácia', 'nutri', 'saúde', 'saude',
  'cansaço', 'cansado', 'exaustão', 'disposição', 'fadiga', 'magnésio', 'magnesio'
];

async function main() {
  let masterAds: any[] = [];
  if (fs.existsSync(MASTER_PATH)) {
    masterAds = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));
  }

  const seenIds = new Set(masterAds.map(a => a.id));
  console.log(`\n=============================================================`);
  console.log(`🚀 INICIANDO MEGA COLETA DE ADS (Meta atual: no mínimo 100 anúncios)`);
  console.log(`📊 Anúncios atuais na base: ${masterAds.length}`);
  console.log(`=============================================================\n`);

  for (const item of TARGET_QUERIES) {
    if (masterAds.length >= 115) {
      console.log(`🎯 Meta de mais de 100 anúncios atingida com folga (${masterAds.length} anúncios)!`);
      break;
    }

    console.log(`\n🔎 Buscando: "${item.query}" (Categoria: ${item.cat})...`);
    try {
      const res = await scrapeMetaAds({
        searchQuery: item.query,
        country: 'BR',
        maxAds: 20,
        activeStatus: 'active',
      });

      let added = 0;
      for (const ad of res.ads) {
        if (seenIds.has(ad.id)) continue;

        // Filtro de relevância
        const text = ((ad.headline || '') + ' ' + (ad.primaryText || '') + ' ' + (ad.pageName || '')).toLowerCase();
        if (BANNED.some(b => text.includes(b))) continue;
        if (!RELEVANT.some(r => text.includes(r))) continue;

        seenIds.add(ad.id);
        masterAds.push({
          ...ad,
          searchCategory: item.cat,
          searchTerm: item.query,
        });
        added++;
      }

      console.log(`   └─ ✅ Encontrados: ${res.ads.length} | Adicionados limpos: ${added} (Total acumulado: ${masterAds.length})`);
    } catch (err: any) {
      console.error(`   └─ ❌ Erro ao buscar "${item.query}":`, err.message || err);
    }

    // Intervalo de segurança
    await new Promise(r => setTimeout(r, 1200));
  }

  fs.writeFileSync(MASTER_PATH, JSON.stringify(masterAds, null, 2), 'utf-8');
  console.log(`\n💾 Base atualizada e salva com ${masterAds.length} anúncios únicos em: ${MASTER_PATH}\n`);
}

main();
