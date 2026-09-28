import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

const DATA_FILE = path.resolve(process.cwd(), 'data/meta_ads_sono_master.json');
const MEDIA_DIR = path.resolve(process.cwd(), 'data/media');
const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');
const IMAGES_DIR = path.join(MEDIA_DIR, 'images');

async function downloadFile(url: string, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    return true; // Já baixado
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok || !res.body) {
      return false;
    }

    // @ts-ignore
    await pipeline(res.body, fs.createWriteStream(destPath));
    return true;
  } catch (err: any) {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Arquivo de dados não encontrado:', DATA_FILE);
    process.exit(1);
  }

  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const ads = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`\n=============================================================`);
  console.log(`📥 INICIANDO DOWNLOAD LOCAL DE CRIATIVOS (${ads.length} anúncios)`);
  console.log(`📁 Salvando em: ${MEDIA_DIR}`);
  console.log(`=============================================================\n`);

  let downloadedVideos = 0;
  let downloadedImages = 0;

  for (let i = 0; i < ads.length; i++) {
    const ad = ads[i];
    const isVideo = ad.media?.type === 'video' || (ad.media?.urls && ad.media.urls.some((u: string) => u.includes('.mp4') || u.includes('video')));
    const videoUrl = ad.media?.videoUrl || (ad.media?.urls && ad.media.urls[0]);

    if (isVideo && videoUrl) {
      const fileName = `${ad.id}.mp4`;
      const filePath = path.join(VIDEOS_DIR, fileName);
      process.stdout.write(`[${i + 1}/${ads.length}] 🎥 Baixando vídeo do anúncio ${ad.id} (${ad.pageName})... `);
      const ok = await downloadFile(videoUrl, filePath);
      if (ok) {
        ad.media.localVideoUrl = `/media/videos/${fileName}`;
        downloadedVideos++;
        console.log('✅ OK');
      } else {
        console.log('⚠️ Falha (usando link remoto)');
      }
    } else if (ad.media?.urls && ad.media.urls[0]) {
      const imgUrl = ad.media.urls[0];
      const fileName = `${ad.id}.jpg`;
      const filePath = path.join(IMAGES_DIR, fileName);
      process.stdout.write(`[${i + 1}/${ads.length}] 🖼️ Baixando imagem do anúncio ${ad.id} (${ad.pageName})... `);
      const ok = await downloadFile(imgUrl, filePath);
      if (ok) {
        ad.media.localImageUrl = `/media/images/${fileName}`;
        downloadedImages++;
        console.log('✅ OK');
      } else {
        console.log('⚠️ Falha');
      }
    }
  }

  // Atualiza o JSON com os links locais
  fs.writeFileSync(DATA_FILE, JSON.stringify(ads, null, 2), 'utf-8');
  console.log(`\n🎉 Concluído! ${downloadedVideos} vídeos e ${downloadedImages} imagens baixados para seu computador.`);
}

main();
