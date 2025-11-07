// update.js
import fs from "fs";
import https from "https";
import http from "http";

const sourceUrl = "https://rasd.tv/index.php/channel/1/directo-%D8%AA%D9%88%D8%AC%D9%8A%D9%87/";

https.get(sourceUrl, (res) => {
  let html = "";
  res.on("data", chunk => html += chunk);
  res.on("end", () => {
    const match = html.match(/https?:\/\/[^\s"']+\.m3u8/);
    if (!match) {
      console.error("❌ No se encontró ningún enlace .m3u8 en la página.");
      process.exit(1);
    }

    const m3u8url = match[0];

    // Creamos el proxy HTTP local → convierte el .m3u8 en un flujo TS directo
    const server = http.createServer((req, res) => {
      https.get(m3u8url, (playlist) => {
        let listData = "";
        playlist.on("data", chunk => listData += chunk);
        playlist.on("end", () => {
          const tsMatch = listData.match(/https?:\/\/[^\s"']+\.ts/);
          if (!tsMatch) {
            res.writeHead(404);
            return res.end("TS no encontrado");
          }

          const tsUrl = tsMatch[0];
          https.get(tsUrl, (tsStream) => {
            res.writeHead(200, { "Content-Type": "video/MP2T" });
            tsStream.pipe(res);
          });
        });
      });
    });

    const PORT = 8081;
    server.listen(PORT, () => {
      console.log(`✅ Proxy MPEG-TS activo en: http://localhost:${PORT}/rasdtv.ts`);

      const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="RASDTV" tvg-logo="https://rasd.tv/logo.png" group-title="Noticias",🇪🇭 RASD TV Live
http://localhost:${PORT}/rasdtv.ts
`;
      fs.writeFileSync("rasdtv.m3u", m3u);
      console.log("✅ Archivo rasdtv.m3u actualizado y listo para Smart IPTV.");
    });
  });
}).on("error", (err) => {
  console.error("❌ Error al conectar con rasd.tv:", err.message);
});
