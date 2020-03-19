const express = require('express');
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const { URL } = require('url');
const fse = require('fs-extra');
const path = require('path');;
const app = express();

let browser;

let alreadyLinks = [];

async function clonURL(inURL){
  const page = await browser.newPage();
  page.on('response', async (response) => {
    const url = new URL(response.url());
    let filePath = path.resolve(`./output${url.pathname}`);
    alreadyLinks.push('http://canada.nstl.com/imaginghardware'+filePath.split("imaginghardware").pop());
    if(filePath.includes("asp")){
      filePath = filePath.replace("asp","html");
    }
    if (path.extname(url.pathname).trim() === '') {
      filePath = `${filePath}/index.html`;
    }
    fse.outputFile(filePath, await response.buffer(), err => {
      fse.readFile(filePath, 'utf8', (err, data) => {
        if (err) return console.error(err)
        var newData = data.split(".asp").join(".html")
        fse.outputFile(filePath,newData);
      })
    })
  });
  await page.goto(inURL, {waitUntil: 'networkidle2'});
  const links = await page.$$eval('a', as => as.map(a => {return a.href}));
  return links;
}

app.get('/', function(req, res) {
  try{
    (async() => {
      browser = await puppeteer.launch({
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      var links = await clonURL('http://canada.nstl.com/imaginghardware/categories.asp');

      alreadyLinks.forEach(element => {
        if(links.includes(element)){
          links = links.filter(e => e !== element);
        }
      });
      
      links.forEach(newURL => {
        (async() => {
          links = await clonURL(newURL);
        })();
      });

      setTimeout(async () => {
        await browser.close();
      }, 5 * 1000);

      res.json({
          status: true,
          descripcion: '[ OK ] - Pagina clonada completamente',
      });
    })();
  }catch (err) {
        res.json({
            status: false,
            descripcion: '[ FAIL ] - Ocurrio un error interno en el servidor',
            message: err.message
        });
    }
});
+
app.listen(port, function() {
  console.log('App listening on port ' + port)
});
  