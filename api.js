// api.js - نسخه نهایی با منابع درست

const http = require('http');

const server = http.createServer(async (req, res) => {
    // تنظیمات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    if (req.url !== '/api' && req.url !== '/') {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
    }

    try {
        // ----- دریافت قیمت دلار از نوبیتکس (API رسمی) -----
        const dollarResponse = await fetch('https://api.nobitex.ir/v2/orderbook/USDTIRT');
        const dollarData = await dollarResponse.json();
        
        let dollarPrice = 'نامشخص';
        if (dollarData && dollarData.lastTradePrice) {
            const priceInRials = parseFloat(dollarData.lastTradePrice);
            const priceInToman = Math.round(priceInRials / 10);
            dollarPrice = priceInToman.toLocaleString() + ' تومان';
        }

        // ----- دریافت قیمت طلا و سکه از سایت طلا (gold-price.ir) -----
        // از یک API عمومی برای قیمت طلا استفاده می‌کنیم
        const goldResponse = await fetch('https://www.gold-price.ir/api/price');
        const goldData = await goldResponse.json();
        
        let goldPrice = 'نامشخص';
        let emamiPrice = 'نامشخص';
        
        if (goldData && goldData.gold_18) {
            goldPrice = goldData.gold_18.toLocaleString() + ' ریال';
        }
        if (goldData && goldData.emami) {
            emamiPrice = goldData.emami.toLocaleString() + ' ریال';
        }

        // اگه gold-price.ir جواب نداد، از یک منبع دیگه استفاده می‌کنیم
        if (goldPrice === 'نامشخص' || emamiPrice === 'نامشخص') {
            // منبع دوم: استفاده از سایت arz8.com
            const backupResponse = await fetch('https://www.arz8.com/api/v1/price');
            const backupData = await backupResponse.json();
            
            if (backupData && backupData.gold) {
                goldPrice = backupData.gold.gold_18 + ' ریال';
                emamiPrice = backupData.gold.emami + ' ریال';
            }
        }

        // ----- پاسخ نهایی -----
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: {
                dollar: dollarPrice,
                gold: goldPrice,
                emami: emamiPrice,
                fetchedAt: new Date().toLocaleString('fa-IR')
            }
        }));

    } catch (error) {
        console.error('Server Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch data: ' + error.message
        }));
    }
});

// اجرا روی پورت مشخص شده توسط Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});