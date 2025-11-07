// update.js
import fs from "fs";
import https from "https";

const url = "https://rasd.tv/index.php/channel/1/directo-%D8%AA%D9%88%D8%AC%D9%8A%D9%87/";

https.get(url, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const match = data.match(/https?:\/\/[^\s"']+\.m3u8/);
    if (!match) {
      console.error("❌ No se encontró ningún enlace .m3u8 en la página.");
      process.exit(1);
    }
    const streamUrl = match[0];
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="RASDTV" tvg-logo="https://rasd.tv/logo.png" group-title="Noticias",RASD TV
${streamUrl}
`;
    fs.writeFileSync("rasdtv.m3u", m3u);
    console.log(`✅ Archivo actualizado con el stream:\n${streamUrl}`);
  });
}).on("error", (err) => {
  console.error("Error al conectar con rasd.tv:", err.message);
});
