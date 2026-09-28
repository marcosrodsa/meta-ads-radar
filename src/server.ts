import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const PORT = 3333;
const galleryPath = path.resolve(process.cwd(), 'gallery.html');
const mediaDir = path.resolve(process.cwd(), 'data/media');

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // 1. Página inicial da galeria
  if (url === '/' || url === '/gallery' || url.startsWith('/?')) {
    if (fs.existsSync(galleryPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Referrer-Policy': 'no-referrer',
      });
      res.end(fs.readFileSync(galleryPath));
      return;
    }
  }

  // 2. Servir arquivos de mídia locais (/media/videos/... ou /media/images/...)
  if (url.startsWith('/media/')) {
    const relativePath = decodeURIComponent(url.replace('/media/', ''));
    const safePath = path.normalize(path.join(mediaDir, relativePath));

    if (!safePath.startsWith(mediaDir) || !fs.existsSync(safePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado.');
      return;
    }

    const stat = fs.statSync(safePath);
    const ext = path.extname(safePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';

    // Suporte a HTTP Range para reprodução de vídeo MP4 contínua
    const range = req.headers.range;
    if (range && ext === '.mp4') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(safePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(safePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Página não encontrada.');
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 SERVIDOR DA GALERIA DE CRIATIVOS ATUALIZADO!`);
  console.log(`🔗 Acesse no seu navegador: http://localhost:${PORT}`);
  console.log(`📁 Mídia local ativa com streaming de vídeo MP4.`);
  console.log(`=============================================================\n`);
});
