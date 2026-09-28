export interface ScrapeMetaAdsOptions {
  /** Termo de busca / produto específico (ex: "creatina", "robô aspirador") */
  searchQuery?: string;
  /** URL direta copiada da biblioteca de anúncios da Meta */
  url?: string;
  /** ID da página no Facebook para buscar todos os anúncios dela */
  pageId?: string;
  /** Código de 2 letras do país (ex: "BR", "US", "ALL"). Padrão: "BR" */
  country?: string;
  /** Status do anúncio: "active" | "inactive" | "all". Padrão: "active" */
  activeStatus?: 'active' | 'inactive' | 'all';
  /** Tipo de mídia: "all" | "image" | "video" | "meme" | "none". Padrão: "all" */
  mediaType?: 'all' | 'image' | 'video' | 'meme' | 'none';
  /** Ordenação: "mostRecent" | "impressions". Padrão: "mostRecent" */
  sortBy?: 'mostRecent' | 'impressions';
  /** Limite máximo de anúncios a extrair. Padrão: 10 */
  maxAds?: number;
  /** Se deve buscar detalhes avançados de transparência do anunciante */
  fetchDetails?: boolean;
  /** Token de autenticação da Apify (opcional se APIFY_API_TOKEN estiver no .env) */
  apifyToken?: string;
  /** Identificador do ator do Apify a ser executado. Padrão: "bo5X18oGenWEV9vVo" */
  actorId?: string;
}

export interface AdMedia {
  type: 'image' | 'video' | 'carousel' | 'none' | 'unknown';
  urls: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface NormalizedMetaAd {
  /** ID único do anúncio na Meta Ad Library */
  id: string;
  /** Nome do anunciante / Página do Facebook */
  pageName: string;
  /** ID numérico da página do Facebook */
  pageId?: string;
  /** Link da página no Facebook */
  pageProfileUri?: string;
  /** URL da foto de perfil da página */
  pageProfilePicture?: string;
  /** Data em que o anúncio começou a ser veiculado (ISO string ou formatada) */
  startDate?: string;
  /** Data de término do anúncio (se inativo) */
  endDate?: string;
  /** Se o anúncio está ativo atualmente */
  isActive: boolean;
  /** Plataformas de veiculação (ex: FACEBOOK, INSTAGRAM, MESSENGER, AUDIENCE_NETWORK) */
  platforms: string[];
  /** Texto principal / Copy do anúncio */
  primaryText?: string;
  /** Título do anúncio / Headline */
  headline?: string;
  /** Descrição / legenda adicional */
  caption?: string;
  /** Descrição do link */
  linkDescription?: string;
  /** Texto do botão de ação (ex: "Saiba mais", "Comprar agora", "Learn more") */
  ctaText?: string;
  /** Tipo técnico do CTA (ex: "LEARN_MORE", "SHOP_NOW") */
  ctaType?: string;
  /** Link de destino / Landing page real do produto */
  landingPageUrl?: string;
  /** Link permanente para visualizar este anúncio na Meta Ad Library */
  adSnapshotUrl: string;
  /** Mídia do anúncio (imagens, vídeos, carrosséis) */
  media: AdMedia;
  /** Categorias do anunciante */
  pageCategories?: string[];
  /** Dados brutos retornados pelo scraper */
  raw?: Record<string, unknown>;
}

export interface ScrapeResult {
  query: string;
  pageId?: string;
  country: string;
  totalFound: number;
  scrapedAt: string;
  ads: NormalizedMetaAd[];
}
