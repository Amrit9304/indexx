const puppeteer = require('puppeteer');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

app.get('/', async (_req, res) => {
  try {
    const iResponse = await fetch('https://shooting-star-unique-api.vercel.app/api/mwl/random/card');
    
    if (iResponse.status !== 200) {
      throw new Error(`Request failed with status ${iResponse.status}`);
    }

    const i = await iResponse.text();
    
    const shoobUrl = `https://shoob.gg/cards/info/${i}`;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(shoobUrl);

    await page.waitForSelector('.cardData img');

    const { cardData } = await page.evaluate(() => {
      const getTextContent = (element) => (element ? element.textContent?.trim() : '');

      const breadcrumbElements = document.querySelectorAll('[itemid*="category="] span');
      let tierElement = null;
      let tier = '';
      for (let i = 0; i < breadcrumbElements.length; i++) {
        const currentTierElement = breadcrumbElements[i];
        const currentTier = getTextContent(currentTierElement);
        if (currentTier) {
          tierElement = currentTierElement;
          tier = currentTier.replace(/^\D+/g, '');
          break;
        }
      }

      const sourceElements = document.querySelectorAll(`[itemprop='itemListElement'] > span`);
      const sourceElement = sourceElements[sourceElements.length - 1];
      const source = getTextContent(sourceElement);

      const cardPods = Array.from(document.querySelectorAll('.cardData img'));
      const cards = cardPods.map((card) => ({
        name: card.getAttribute('title'),
        tier: tier,
        source: source,
        image: card.getAttribute('src'),
      }));

      return { tier, source, cardData: cards[0] };
    });

    res.json(cardData);

    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the request.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
