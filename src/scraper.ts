import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
import {
  AdMedia,
  NormalizedMetaAd,
  ScrapeMetaAdsOptions,
  ScrapeResult,
} from './types.js';

dotenv.config();

/** ID padrão do ator do Apify fornecido */
export const DEFAULT_ACTOR_ID = process.env.APIFY_DEFAULT_ACTOR || 'bo5X18oGenWEV9vVo';

/**
 * Constrói a URL direta de visualização na biblioteca de anúncios da Meta
 */
export function buildMetaAdsLibraryUrl(
  query: string,
  country = 'BR',
  activeStatus: 'active' | 'inactive' | 'all' = 'active'
): string {
  const statusParam = activeStatus === 'active' ? 'active' : activeStatus === 'all' ? 'all' : 'inactive';
  const encodedQuery = encodeURIComponent(query.trim());
  return `https://www.facebook.com/ads/library/?active_status=${statusParam}&ad_type=all&country=${country}&q=${encodedQuery}&search_type=keyword_unordered&media_type=all`;
}

/**
 * Faz parse de uma URL da Meta Ad Library para extrair parâmetros úteis
 */
export function parseMetaAdsUrl(urlStr: string): {
  query?: string;
  pageId?: string;
  country?: string;
  activeStatus?: 'active' | 'inactive' | 'all';
} {
  try {
    const url = new URL(urlStr);
    const params = url.searchParams;

    const query = params.get('q') || undefined;
    const pageId = params.get('view_all_page_id') || undefined;
    const country = params.get('country') || undefined;
    const statusParam = params.get('active_status')?.toLowerCase();

    let activeStatus: 'active' | 'inactive' | 'all' | undefined = undefined;
    if (statusParam === 'active') activeStatus = 'active';
    else if (statusParam === 'all') activeStatus = 'all';
    else if (statusParam === 'inactive') activeStatus = 'inactive';

    return { query, pageId, country, activeStatus };
  } catch {
    return {};
  }
}

/**
 * Converte timestamp Unix (segundos) para string ISO legível
 */
function formatUnixTimestamp(timestamp?: number | string | null): string | undefined {
  if (!timestamp) return undefined;
  const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(num) || num <= 0) return undefined;

  // Se estiver em segundos (10 dígitos), converte para ms
  const ms = num < 10000000000 ? num * 1000 : num;
  return new Date(ms).toISOString().split('T')[0];
}

/**
 * Normaliza os dados retornados pelo ator do Apify
 */
export function normalizeAd(raw: Record<string, any>): NormalizedMetaAd {
  const id = String(raw.ad_archive_id || raw.adArchiveID || raw.adId || raw.id || 'unknown');
  const snapshot = raw.snapshot || {};

  const pageName =
    raw.page_name ||
    snapshot.page_name ||
    raw.pageName ||
    'Anunciante Desconhecido';

  const pageId =
    raw.page_id ||
    snapshot.page_id ||
    raw.pageId ||
    undefined;

  const pageProfilePicture =
    snapshot.page_profile_picture_url ||
    raw.pageProfilePicture ||
    undefined;

  const pageProfileUri =
    snapshot.page_profile_uri ||
    (pageId ? `https://www.facebook.com/${pageId}` : undefined);

  const startDate =
    formatUnixTimestamp(raw.start_date) ||
    raw.startDateFormatted ||
    raw.startDate ||
    undefined;

  const endDate =
    formatUnixTimestamp(raw.end_date) ||
    raw.endDateFormatted ||
    raw.endDate ||
    undefined;

  const isActive = raw.is_active ?? (raw.activeStatus === 'active');

  // Plataformas
  let platforms: string[] = [];
  if (Array.isArray(raw.publisher_platform)) {
    platforms = raw.publisher_platform;
  } else if (Array.isArray(raw.publisherPlatform)) {
    platforms = raw.publisherPlatform;
  } else if (typeof raw.publisher_platform === 'string') {
    platforms = [raw.publisher_platform];
  }

  // Texto e Copy
  const primaryText =
    snapshot.body?.text ||
    snapshot.body?.markup?.__html ||
    (typeof snapshot.body === 'string' ? snapshot.body : undefined) ||
    raw.primaryText ||
    undefined;

  const headline = snapshot.title || raw.headline || undefined;
  const caption = snapshot.caption || undefined;
  const linkDescription = snapshot.link_description || raw.description || undefined;
  const ctaText = snapshot.cta_text || raw.ctaText || undefined;
  const ctaType = snapshot.cta_type || undefined;
  const landingPageUrl = snapshot.link_url || raw.landingPageUrl || raw.linkUrl || undefined;

  const adSnapshotUrl =
    id !== 'unknown'
      ? `https://www.facebook.com/ads/library/?id=${id}`
      : raw.ad_snapshot_url || '';

  // Processamento de Mídia
  const media: AdMedia = {
    type: 'none',
    urls: [],
  };

  const images: string[] = [];
  const videos: string[] = [];

  // Vídeos do snapshot
  if (Array.isArray(snapshot.videos)) {
    for (const vid of snapshot.videos) {
      if (typeof vid === 'string') {
        videos.push(vid);
      } else if (typeof vid === 'object' && vid) {
        const videoUrl = vid.video_hd_url || vid.video_sd_url;
        if (videoUrl) videos.push(videoUrl);
        if (vid.video_preview_image_url && !media.thumbnailUrl) {
          media.thumbnailUrl = vid.video_preview_image_url;
        }
      }
    }
  }

  // Imagens do snapshot
  if (Array.isArray(snapshot.images)) {
    for (const img of snapshot.images) {
      if (typeof img === 'string') {
        images.push(img);
      } else if (typeof img === 'object' && img) {
        const imgUrl = img.original_image_url || img.resized_image_url;
        if (imgUrl) images.push(imgUrl);
      }
    }
  }

  // Cards de carrossel
  if (Array.isArray(snapshot.cards) && snapshot.cards.length > 0) {
    media.type = 'carousel';
    for (const card of snapshot.cards) {
      if (card.original_image_url) images.push(card.original_image_url);
      if (card.resized_image_url) images.push(card.resized_image_url);
      if (card.video_hd_url || card.video_sd_url) {
        videos.push(card.video_hd_url || card.video_sd_url);
      }
    }
  }

  if (videos.length > 0) {
    media.type = media.type === 'carousel' ? 'carousel' : 'video';
    media.videoUrl = videos[0];
    media.urls = Array.from(new Set(videos));
  } else if (images.length > 0) {
    if (media.type !== 'carousel') {
      media.type = images.length > 1 ? 'carousel' : 'image';
    }
    media.urls = Array.from(new Set(images));
  }

  const pageCategories = Array.isArray(snapshot.page_categories)
    ? snapshot.page_categories
    : undefined;

  return {
    id,
    pageName,
    pageId,
    pageProfileUri,
    pageProfilePicture,
    startDate,
    endDate,
    isActive,
    platforms,
    primaryText: primaryText ? String(primaryText).trim() : undefined,
    headline: headline ? String(headline).trim() : undefined,
    caption: caption ? String(caption).trim() : undefined,
    linkDescription: linkDescription ? String(linkDescription).trim() : undefined,
    ctaText: ctaText ? String(ctaText).trim() : undefined,
    ctaType,
    landingPageUrl,
    adSnapshotUrl,
    media,
    pageCategories,
    raw,
  };
}

/**
 * Executa o scraper de anúncios do Meta Ad Library via Apify
 */
export async function scrapeMetaAds(options: ScrapeMetaAdsOptions): Promise<ScrapeResult> {
  const token = options.apifyToken || process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error(
      'Token da Apify não encontrado. Defina APIFY_API_TOKEN no arquivo .env ou forneça a opção { apifyToken }.'
    );
  }

  let query = options.searchQuery;
  let pageId = options.pageId;
  let country = options.country || 'BR';
  let activeStatus = options.activeStatus || 'active';

  // Se foi passada uma URL direta da Meta Ad Library, extrai os parâmetros automaticamente
  if (options.url) {
    const parsed = parseMetaAdsUrl(options.url);
    if (parsed.query && !query) query = parsed.query;
    if (parsed.pageId && !pageId) pageId = parsed.pageId;
    if (parsed.country && !options.country) country = parsed.country;
    if (parsed.activeStatus && !options.activeStatus) activeStatus = parsed.activeStatus;
  }

  if (!query && !pageId) {
    throw new Error('Informe ao menos "searchQuery" (nome do produto/busca), "pageId" ou uma "url" da biblioteca.');
  }

  const client = new ApifyClient({ token });
  const maxAds = options.maxAds || 10;
  const actorId = options.actorId || DEFAULT_ACTOR_ID;

  // Monta payload de entrada exato do Actor bo5X18oGenWEV9vVo
  const actorInput: Record<string, any> = {
    maxItems: maxAds,
    country: country,
    activeStatus: activeStatus,
    category: 'all',
    mediaType: options.mediaType || 'all',
    sortBy: options.sortBy || 'mostRecent',
    fetchDetails: options.fetchDetails ?? false,
  };

  if (query) {
    actorInput.query = query;
  }
  if (pageId) {
    actorInput.pageId = pageId;
  }

  console.log(`[MetaAdsScraper] 🚀 Iniciando Actor: ${actorId}`);
  if (query) console.log(`[MetaAdsScraper] 🔎 Busca: "${query}"`);
  if (pageId) console.log(`[MetaAdsScraper] 🏢 Page ID: "${pageId}"`);
  console.log(`[MetaAdsScraper] 🌎 País: ${country} | Status: ${activeStatus} | Limite: ${maxAds}`);

  const run = await client.actor(actorId).call(actorInput);

  console.log(`[MetaAdsScraper] ✅ Execução concluída (${run.status}). Baixando dataset...`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`[MetaAdsScraper] 📦 Anúncios extraídos: ${items.length}`);

  const normalizedAds = items.map((item) => normalizeAd(item as Record<string, any>));

  return {
    query: query || '',
    pageId: pageId || undefined,
    country,
    totalFound: normalizedAds.length,
    scrapedAt: new Date().toISOString(),
    ads: normalizedAds,
  };
}
