const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const url = require('url');
const axios = require('axios');

// Función para descargar un archivo
async function downloadFile(uri, filepath) {
    try {
        const response = await axios({
            method: 'GET',
            url: uri,
            responseType: 'arraybuffer', // Para manejar archivos binarios (imágenes, etc.)
        });
        fs.writeFileSync(filepath, response.data);
        console.log(`Descargado: ${filepath}`);
    } catch (error) {
        console.log(`Error descargando ${uri}:`, error.message);
    }
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Habilitar la intercepción de solicitudes
    await page.setRequestInterception(true);

    // Escuchar todas las solicitudes de recursos
    page.on('request', async (request) => {
        const resourceUrl = request.url();
        const parsedUrl = url.parse(resourceUrl);

        // Solo descargar recursos externos (imágenes, CSS, JS, etc.)
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'script') {
            const filePath = path.join(__dirname, parsedUrl.pathname);
            const dir = path.dirname(filePath);

            // Crear directorios si no existen
            fs.mkdirSync(dir, { recursive: true });

            // Descargar el recurso
            await downloadFile(resourceUrl, filePath);
        }

        // Continuar con la solicitud
        request.continue();
    });

    // Ir a la página y esperar a que se cargue
    await page.goto('https://www.getdropset.app/', { waitUntil: 'networkidle2' });

    // Guardar el HTML de la página principal
    const html = await page.content();
    fs.writeFileSync('pagina_completa.html', html);

    // Cerrar el navegador
    await browser.close();
})();
