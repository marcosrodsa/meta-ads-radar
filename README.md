# 🎯 Meta Ads Library Scraper (TypeScript + Apify)

Scraper de anúncios da **Meta Ad Library** (Facebook, Instagram, WhatsApp, Messenger) construído em **TypeScript / Node.js**, com suporte ao Actor Apify `bo5X18oGenWEV9vVo` (`igolaizola/facebook-ad-library-scraper`).

Permite pesquisar anúncios de um **produto específico**, por **palavra-chave**, por **ID de anunciante** ou colando diretamente a **URL da Meta Ad Library**.

---

## ⚡ O que é extraído de cada anúncio

- **ID do anúncio**: Link permanente oficial na Meta Ad Library.
- **Anunciante**: Nome da Página, Page ID, Link do perfil e Foto de perfil.
- **Copy e Texto**: Texto principal (`body`), título (`headline`), legenda (`caption`) e descrição do link.
- **Call to Action (CTA)**: Texto do botão (ex: *"Shop now"*, *"Saiba mais"*, *"Send WhatsApp message"*).
- **Destino Real**: URL da Landing Page final ou link direto do WhatsApp/Instagram.
- **Mídias**: Links diretos em alta resolução para **vídeos MP4**, **imagens** e **carrosséis**.
- **Metadados**: Data de início (`startDate`), status (`isActive`) e plataformas veiculadas.

---

## 🛠️ Instalação e Configuração

O projeto já está configurado no diretório:
`C:\Users\marco\.gemini\antigravity-ide\scratch\meta-ads-scraper`

O arquivo `.env` já contém o seu token e o ID do Actor configurados:
```env
APIFY_API_TOKEN=seu_token_apify_aqui
APIFY_DEFAULT_ACTOR=bo5X18oGenWEV9vVo
```

Para compilar o código TypeScript:
```bash
npm run build
```

---

## 💻 Como Usar via Terminal (CLI)

### 1. Buscar anúncios de um produto específico
```bash
npm run scrape -- -q "creatina" -c BR -l 5
```

### 2. Buscar e exportar direto para arquivo JSON
```bash
npm run scrape -- -q "whey protein" -c BR -l 10 -o whey_anuncios.json
```

### 3. Buscar e exportar para Planilha CSV (abre no Excel / Sheets)
```bash
npm run scrape -- -q "tenis corrida" -c BR -l 10 -o tenis.csv
```

### 4. Buscar usando o link direto da biblioteca da Meta
Você pode copiar o link da barra do seu navegador e colar diretamente:
```bash
npm run scrape -- -u "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=fone+bluetooth" -l 5
```

### 5. Buscar apenas anúncios com vídeo
```bash
npm run scrape -- -q "curso de programacao" -m video -l 5
```

### 6. Buscar todos os anúncios de uma Página específica (Page ID)
```bash
npm run scrape -- -p "788487007677436" -l 10
```

### 7. Apenas gerar o link oficial da biblioteca para abrir no navegador
```bash
npm run scrape -- -q "smartwatch" --generate-url
```

---

## 📋 Parâmetros da CLI

| Flag | Descrição | Padrão |
| --- | --- | --- |
| `-q, --query <texto>` | Termo ou produto específico a pesquisar | - |
| `-u, --url <url>` | URL direta da Meta Ad Library | - |
| `-p, --page-id <id>` | ID da página no Facebook para filtrar por anunciante | - |
| `-c, --country <país>` | Código do país (ex: `BR`, `US`, `ALL`) | `BR` |
| `-s, --status <status>` | `active` (somente ativos), `inactive` ou `all` | `active` |
| `-m, --media-type <tipo>`| `all`, `image`, `video` | `all` |
| `--sort <ordem>` | `mostRecent` (mais recentes) ou `impressions` | `mostRecent` |
| `-l, --limit <n>` | Limite máximo de anúncios a extrair | `10` |
| `-o, --output <arquivo>` | Salvar em `.json` ou `.csv` | - |
| `--details` | Buscar transparência detalhada do anunciante | `false` |

---

## 🚀 Integração no Next.js (App Router)

Você pode importar a função `scrapeMetaAds` em qualquer **Server Action** ou rota API (`route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { scrapeMetaAds } from './scraper';

export async function POST(req: Request) {
  try {
    const { product, country = 'BR', limit = 10 } = await req.json();

    const data = await scrapeMetaAds({
      searchQuery: product,
      country,
      maxAds: limit,
      activeStatus: 'active',
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```
