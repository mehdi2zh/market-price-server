// api.js - نسخه مخصوص Render

const http = require('http');

const server = http.createServer(async (req, res) => {
    // تنظیمات CORS برای اینکه اکستنشن بتونه بهش وصل بشه
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // فقط به درخواست‌های GET پاسخ بده
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

    // فقط آدرس /api رو قبول کن
    if (req.url !== '/api' && req.url !== '/') {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
    }

    try {
        // دریافت اطلاعات از tgju.org
        const response = await fetch('https://www.tgju.org/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();

        // استخراج قیمت‌ها
        const dollarMatch = html.match(/دلار.*?(\d{1,3}(?:,\d{3})*)/);
        const goldMatch = html.match(/طلای ۱۸ عیار.*?(\d{1,3}(?:,\d{3})*)/);
        const emamiMatch = html.match(/سکه امامی.*?(\d{1,3}(?:,\d{3})*)/);

        let dollarPrice = 'نامشخص';
        let goldPrice = 'نامشخص';
        let emamiPrice = 'نامشخص';

        if (dollarMatch && dollarMatch[1]) {
            const priceInRials = parseInt(dollarMatch[1].replace(/,/g, ''));
            dollarPrice = Math.round(priceInRials / 10).toLocaleString() + ' تومان';
        }
        if (goldMatch && goldMatch[1]) {
            goldPrice = goldMatch[1].replace(/,/g, '') + ' ریال';
        }
        if (emamiMatch && emamiMatch[1]) {
            emamiPrice = emamiMatch[1].replace(/,/g, '') + ' ریال';
        }

        // پاسخ نهایی
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
            error: 'Failed to fetch data from TGJU' 
        }));
    }
});

// اجرا روی پورت مشخص شده توسط Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});