
const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;
const geminiAI = new GoogleGenerativeAI("AIzaSyCt5LjxI0v5on4bf-KeWpObmowIbJe2G7Q");

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Function to scrape Amazon product data
async function scrapeAmazonProduct(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });

    const productData = await page.evaluate(() => {
        const getText = (selector) => document.querySelector(selector)?.innerText.trim() || 'N/A';
        const getAllTexts = (selector) => [...document.querySelectorAll(selector)].map(el => el.innerText.trim());

        return {
            title: getText('#productTitle'),
            price: getText('.a-price .a-offscreen'),
            rating: getText('.a-icon-alt'),
            totalRatings: getText('#acrCustomerReviewText'),
            availability: getText('#availability span'),
            productDetails: getAllTexts('#productDetails_detailBullets_sections1 tr'),
            images: [...document.querySelectorAll('#altImages img')].map(img => img.src.replace('_SS40_', '_SL1000_'))
        };
    });

    await browser.close();
    return productData;
}

// Function to generate AI summary
async function generateAISummary(productData) {
    const prompt = `Summarize the following Amazon product:\nTitle: ${productData.title}\nPrice: ${productData.price}\nRating: ${productData.rating}\nTotal Ratings: ${productData.totalRatings}\nAvailability: ${productData.availability}\nDetails: ${productData.productDetails.join(", ")}\n`;

    try {
        const model = geminiAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating AI summary:", error);
        return "AI summary unavailable.";
    }
}

// ✅ POST route for /summary — for frontend script.js
app.post("/summary", async (req, res) => {
    try {
        const { url } = req.body;
        const productData = await scrapeAmazonProduct(url);
        const summary = await generateAISummary(productData);

        res.json({
            title: productData.title,
            price: productData.price,
            rating: productData.rating,
            summary: summary
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to fetch product summary." });
    }
});

// Optional: GET route if needed for testing
app.get('/scrape', async (req, res) => {
    const amazonUrl = req.query.url;
    if (!amazonUrl) return res.status(400).json({ error: "Missing Amazon product URL!" });

    console.log(`Scraping product: ${amazonUrl}`);
    const productData = await scrapeAmazonProduct(amazonUrl);
    productData.aiSummxary = await generateAISummary(productData);

    fs.writeFileSync('public/scraped-data.json', JSON.stringify(productData, null, 2));
    console.log("✅ Data saved in public/scraped-data.json");

    res.redirect('/index.html');
});

// Start Express server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
