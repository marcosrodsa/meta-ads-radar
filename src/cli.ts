import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { scrapeMetaAds, buildMetaAdsLibraryUrl, parseMetaAdsUrl } from './scraper.js';
import { NormalizedMetaAd } from './types.js';

const program = new Command();

program
  .name('meta-ads-scraper')
  .description('Extrai anúncios da Meta Ad Library filtrando por produto, anunciante ou URL')
  .version('1.0.0')
  .option('-q, --query <string>', 'Termo de busca ou nome do produto (ex: "creatina", "robô aspirador")')
  .option('-u, --url <string>', 'URL direta da Meta Ad Library')
  .option('-p, --page-id <string>', 'ID da página no Facebook para buscar todos os anúncios dela')
  .option('-c, --country <string>', 'Código do país (ex: BR, US, ALL)', 'BR')
  .option('-s, --status <string>', 'Status dos anúncios: active, inactive ou all', 'active')
  .option('-m, --media-type <string>', 'Tipo de mídia: all, image, video', 'all')
  .option('--sort <string>', 'Ordenação: mostRecent ou impressions', 'mostRecent')
  .option('-l, --limit <number>', 'Quantidade máxima de anúncios', '10')
  .option('-t, --token <string>', 'Token da API Apify (caso queira sobrepor o .env)')
  .option('-o, --output <file>', 'Arquivo para salvar o resultado (.json ou .csv)')
  .option('--details', 'Buscar detalhes avançados de transparência do anunciante', false)
  .option('--generate-url', 'Apenas gera o link oficial da Meta Ad Library e sai');

program.parse(process.argv);
const opts = program.opts();

async function main() {
  const query = opts.query;
  const url = opts.url;
  const pageId = opts.pageId;
  const country = opts.country.toUpperCase();
  const rawStatus = (opts.status || 'active').toLowerCase();
  const activeStatus = (['active', 'inactive', 'all'].includes(rawStatus) ? rawStatus : 'active') as 'active' | 'inactive' | 'all';
  const limit = parseInt(opts.limit, 10) || 10;
  const mediaType = (['all', 'image', 'video'].includes(opts.mediaType) ? opts.mediaType : 'all') as 'all' | 'image' | 'video';
  const sortBy = opts.sort === 'impressions' ? 'impressions' : 'mostRecent';

  // Modo rápido: apenas gerar a URL da Ad Library
  if (opts.generateUrl) {
    if (!query) {
      console.error('❌ Erro: Passe o termo do produto com -q para gerar o link.');
      process.exit(1);
    }
    const directUrl = buildMetaAdsLibraryUrl(query, country, activeStatus);
    console.log('\n🔗 URL oficial da Meta Ad Library:');
    console.log(directUrl);
    console.log('');
    return;
  }

  if (!query && !url && !pageId) {
    console.error('❌ Erro: Informe ao menos uma das opções:');
    console.error('   -q "nome do produto"');
    console.error('   -u "https://www.facebook.com/ads/library/?..."');
    console.error('   -p "page_id_do_anunciante"');
    console.log('\nUse --help para ver todos os parâmetros.');
    process.exit(1);
  }

  console.log('\n=============================================================');
  console.log('            🎯 META ADS LIBRARY SCRAPER (APIFY)              ');
  console.log('=============================================================');
  if (query) console.log(`🔍 Produto/Busca: "${query}"`);
  if (url) {
    console.log(`🔗 URL Fornecida: "${url}"`);
    const parsed = parseMetaAdsUrl(url);
    if (parsed.query) console.log(`   └─ Termo extraído: "${parsed.query}"`);
    if (parsed.pageId) console.log(`   └─ Page ID extraído: "${parsed.pageId}"`);
  }
  if (pageId) console.log(`🏢 Page ID: ${pageId}`);
  console.log(`🌎 País: ${country} | Status: ${activeStatus} | Mídia: ${mediaType} | Limite: ${limit}`);
  console.log('-------------------------------------------------------------\n');

  try {
    const result = await scrapeMetaAds({
      searchQuery: query,
      url,
      pageId,
      country,
      activeStatus,
      mediaType,
      sortBy,
      maxAds: limit,
      fetchDetails: opts.details,
      apifyToken: opts.token,
    });

    console.log(`\n🎉 Coleta concluída com sucesso! ${result.ads.length} anúncios encontrados.\n`);

    // Listagem amigável dos anúncios no terminal
    result.ads.forEach((ad: NormalizedMetaAd, index: number) => {
      console.log(`[#${index + 1}] ${ad.pageName} (ID: ${ad.id})`);
      if (ad.startDate) console.log(`    📅 Início: ${ad.startDate} ${ad.isActive ? '🟢 (Ativo)' : '🔴 (Inativo)'}`);
      if (ad.platforms && ad.platforms.length > 0) {
        console.log(`    📱 Plataformas: ${ad.platforms.join(', ')}`);
      }
      if (ad.headline) console.log(`    📌 Título: "${ad.headline}"`);
      if (ad.primaryText) {
        const cleanCopy = ad.primaryText.replace(/\s+/g, ' ').substring(0, 140);
        console.log(`    💬 Copy: "${cleanCopy}..."`);
      }
      if (ad.ctaText) console.log(`    🔘 Botão: [${ad.ctaText}]`);
      if (ad.landingPageUrl) console.log(`    🌐 Destino: ${ad.landingPageUrl}`);
      if (ad.media.urls.length > 0) {
        console.log(`    🖼️  Mídia (${ad.media.type}): ${ad.media.urls[0]}`);
      }
      console.log(`    🔗 Ver na Biblioteca: ${ad.adSnapshotUrl}`);
      console.log('-------------------------------------------------------------');
    });

    // Salvar em arquivo se especificado
    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      const ext = path.extname(outputPath).toLowerCase();

      if (ext === '.csv') {
        const headers = [
          'ID',
          'Anunciante',
          'Page_ID',
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

        const rows = result.ads.map(ad => [
          escapeCsv(ad.id),
          escapeCsv(ad.pageName),
          escapeCsv(ad.pageId),
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
        fs.writeFileSync(outputPath, csvContent, 'utf-8');
        console.log(`\n💾 Planilha CSV salva com sucesso: ${outputPath}`);
      } else {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`\n💾 Arquivo JSON salvo com sucesso: ${outputPath}`);
      }
    }
  } catch (err: any) {
    console.error('\n❌ Erro durante o scraping:');
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
