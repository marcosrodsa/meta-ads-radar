import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { scrapeMetaAds } from './scraper.js';
import { NormalizedMetaAd } from './types.js';

export interface SearchItem {
  term: string;
  category: 'Concorrentes e Marcas' | 'Ingredientes da Fórmula' | 'Ângulos de Dor e Benefício' | 'Creatina Pura e Performance';
}

export const SEARCH_TARGETS: SearchItem[] = [
  // 1. Pesquisa por Concorrentes Diretos e Marcas de Manipulação / Suplementos
  { term: 'Oficial Farma sono', category: 'Concorrentes e Marcas' },
  { term: 'Manual sono', category: 'Concorrentes e Marcas' },
  { term: 'Dux Nutrition sono', category: 'Concorrentes e Marcas' },
  { term: 'Growth Supplements sono', category: 'Concorrentes e Marcas' },
  { term: 'Desinchá noite sono', category: 'Concorrentes e Marcas' },
  { term: 'Novanoite', category: 'Concorrentes e Marcas' },

  // 2. Pesquisa por Ingredientes da Fórmula
  { term: 'Indutor do sono', category: 'Ingredientes da Fórmula' },
  { term: 'GABA sono', category: 'Ingredientes da Fórmula' },
  { term: 'Ashwagandha sono', category: 'Ingredientes da Fórmula' },
  { term: '5-HTP sono', category: 'Ingredientes da Fórmula' },
  { term: 'Triptofano melatonina', category: 'Ingredientes da Fórmula' },

  // 3. Pesquisa por Ângulos de Dor e Benefício
  { term: 'mente agitada sono', category: 'Ângulos de Dor e Benefício' },
  { term: 'corpo cansado mente a mil', category: 'Ângulos de Dor e Benefício' },
  { term: 'sono reparador suplemento', category: 'Ângulos de Dor e Benefício' },
  { term: 'acordar sem disposição', category: 'Ângulos de Dor e Benefício' },

  // 4. Creatina Pura e Performance
  { term: 'creatina 100 pura', category: 'Creatina Pura e Performance' },
  { term: 'creatina monohidratada pura', category: 'Creatina Pura e Performance' },
  { term: 'creatina forca recuperacao', category: 'Creatina Pura e Performance' },
];

export interface EnrichedAd extends NormalizedMetaAd {
  searchCategory: string;
  searchTerm: string;
}

const program = new Command();

program
  .name('meta-ads-batch-runner')
  .description('Executa bateria completa de pesquisas organizadas por categoria (Sono / Suplementos)')
  .option('-l, --limit <number>', 'Quantidade máxima de anúncios por termo de pesquisa', '4')
  .option('-c, --country <string>', 'Código do país', 'BR')
  .option('-o, --output-dir <dir>', 'Diretório para salvar os resultados', './data')
  .option('--filter-cat <string>', 'Filtrar por categoria específica (concorrentes | ingredientes | dores | all)', 'all');

program.parse(process.argv);
const opts = program.opts();

async function runBatch() {
  const limit = parseInt(opts.limit, 10) || 4;
  const country = opts.country.toUpperCase();
  const filterCat = opts.filterCat.toLowerCase();
  const outputDir = path.resolve(process.cwd(), opts.outputDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let targets = SEARCH_TARGETS;
  if (filterCat.includes('concorrente')) {
    targets = targets.filter(t => t.category === 'Concorrentes e Marcas');
  } else if (filterCat.includes('ingrediente')) {
    targets = targets.filter(t => t.category === 'Ingredientes da Fórmula');
  } else if (filterCat.includes('dor') || filterCat.includes('angulos')) {
    targets = targets.filter(t => t.category === 'Ângulos de Dor e Benefício');
  } else if (filterCat.includes('creatina')) {
    targets = targets.filter(t => t.category === 'Creatina Pura e Performance');
  }

  console.log('\n=============================================================');
  console.log('       🛌 BATCH RUNNER: PESQUISA DE ANÚNCIOS DE SONO         ');
  console.log('=============================================================');
  console.log(`📋 Total de termos a pesquisar: ${targets.length}`);
  console.log(`🎯 Limite por termo: ${limit} anúncios`);
  console.log(`🌎 País: ${country}`);
  console.log(`📁 Diretório de saída: ${outputDir}`);
  console.log('-------------------------------------------------------------\n');

  const allAds: EnrichedAd[] = [];
  const seenAdIds = new Set<string>();

  // Carrega anúncios já salvos anteriormente para mesclar e evitar duplicados
  const masterJsonPath = path.join(outputDir, 'meta_ads_sono_master.json');
  if (fs.existsSync(masterJsonPath)) {
    try {
      const existing: EnrichedAd[] = JSON.parse(fs.readFileSync(masterJsonPath, 'utf-8'));
      for (const ad of existing) {
        if (!seenAdIds.has(ad.id)) {
          seenAdIds.add(ad.id);
          allAds.push(ad);
        }
      }
      console.log(`📂 Carregados ${allAds.length} anúncios existentes do histórico para enriquecimento.\n`);
    } catch {
      // Ignora se o arquivo estiver corrompido
    }
  }

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    console.log(`\n[${i + 1}/${targets.length}] 🔎 [${item.category}] Pesquisando: "${item.term}"...`);

    try {
      const result = await scrapeMetaAds({
        searchQuery: item.term,
        country,
        maxAds: limit,
        activeStatus: 'active',
      });

      let addedCount = 0;
      for (const ad of result.ads) {
        if (!seenAdIds.has(ad.id)) {
          seenAdIds.add(ad.id);
          allAds.push({
            ...ad,
            searchCategory: item.category,
            searchTerm: item.term,
          });
          addedCount++;
        }
      }

      console.log(`   └─ ✅ Encontrados: ${result.ads.length} (${addedCount} novos únicos acumulados)`);
    } catch (err: any) {
      console.error(`   └─ ❌ Erro ao buscar "${item.term}":`, err.message || err);
    }

    // Pequeno intervalo respeitoso entre requisições
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 Bateria concluída! Total de anúncios únicos: ${allAds.length}`);
  console.log('=============================================================\n');

  // 1. Salvar JSON Master
  fs.writeFileSync(masterJsonPath, JSON.stringify(allAds, null, 2), 'utf-8');
  console.log(`💾 JSON Completo salvo em: ${masterJsonPath}`);

  // 2. Salvar CSV Master
  const masterCsvPath = path.join(outputDir, 'meta_ads_sono_master.csv');
  const headers = [
    'ID',
    'Categoria_Pesquisa',
    'Termo_Pesquisa',
    'Anunciante',
    'Data_Inicio',
    'Status_Ativo',
    'Plataformas',
    'Titulo_Headline',
    'Copy_Texto',
    'Botao_CTA',
    'Landing_Page',
    'Tipo_Midia',
    'Midia_URL',
    'Snapshot_URL'
  ];

  const escapeCsv = (val?: string | null) => {
    if (!val) return '""';
    return `"${String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  };

  const rows = allAds.map(ad => [
    escapeCsv(ad.id),
    escapeCsv(ad.searchCategory),
    escapeCsv(ad.searchTerm),
    escapeCsv(ad.pageName),
    escapeCsv(ad.startDate),
    ad.isActive ? '"Sim"' : '"Não"',
    escapeCsv(ad.platforms.join('; ')),
    escapeCsv(ad.headline),
    escapeCsv(ad.primaryText),
    escapeCsv(ad.ctaText),
    escapeCsv(ad.landingPageUrl),
    escapeCsv(ad.media.type),
    escapeCsv(ad.media.urls[0] || ad.media.videoUrl),
    escapeCsv(ad.adSnapshotUrl)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(masterCsvPath, csvContent, 'utf-8');
  console.log(`💾 CSV Completo salvo em: ${masterCsvPath}`);

  // 3. Salvar resumo analítico em Markdown
  const reportPath = path.join(outputDir, 'relatorio_ads_sono.md');
  const advertisersCount: Record<string, number> = {};
  const ctaCount: Record<string, number> = {};
  const mediaCount: Record<string, number> = {};

  for (const ad of allAds) {
    advertisersCount[ad.pageName] = (advertisersCount[ad.pageName] || 0) + 1;
    const cta = ad.ctaText || 'Sem botão';
    ctaCount[cta] = (ctaCount[cta] || 0) + 1;
    const media = ad.media.type || 'none';
    mediaCount[media] = (mediaCount[media] || 0) + 1;
  }

  const topAdvertisers = Object.entries(advertisersCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const mdReport = `# 📊 Relatório de Análise - Anúncios de Sono e Suplementação

- **Data da Extração**: ${new Date().toLocaleString('pt-BR')}
- **Total de Anúncios Únicos Capturados**: ${allAds.length}
- **Termos Pesquisados**: ${targets.length}

---

## 🏆 Top Anunciantes Mais Ativos no Nicho
| Anunciante | Quantidade de Anúncios Capturados |
| --- | --- |
${topAdvertisers.map(([name, count]) => `| **${name}** | ${count} |`).join('\n')}

---

## 📱 Distribuição de Formatos de Mídia
${Object.entries(mediaCount).map(([type, count]) => `- **${type.toUpperCase()}**: ${count} anúncios`).join('\n')}

---

## 🔘 Botões de Chamada para Ação (CTAs Mais Usados)
${Object.entries(ctaCount).map(([cta, count]) => `- **${cta}**: ${count} anúncios`).join('\n')}

---

## 💡 Destaques de Criativos e Copies por Categoria

${targets.map(t => {
  const adsForTerm = allAds.filter(a => a.searchTerm === t.term);
  if (adsForTerm.length === 0) return '';
  return `### 🔎 ${t.term} (${t.category})
${adsForTerm.map((a, idx) => `
#### ${idx + 1}. ${a.pageName} (Início: ${a.startDate || 'N/D'})
- **Título**: ${a.headline || 'N/D'}
- **Copy**: ${a.primaryText ? `"${a.primaryText.substring(0, 200)}..."` : 'N/D'}
- **CTA**: [${a.ctaText || 'N/D'}] -> ${a.landingPageUrl || 'N/D'}
- **Mídia**: ${a.media.type} (${a.media.urls[0] || 'N/D'})
- **Link Oficial**: [Ver Anúncio no Facebook Ad Library](${a.adSnapshotUrl})
`).join('\n')}`;
}).filter(Boolean).join('\n---\n')}
`;

  fs.writeFileSync(reportPath, mdReport, 'utf-8');
  console.log(`📄 Relatório analítico salvo em: ${reportPath}\n`);
}

runBatch();
