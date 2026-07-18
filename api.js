// api.js
// این فایل کار یک سرور کوچک را انجام می‌دهد که اطلاعات بازار را از tgju.org می‌گیرد.

export default async function handler(req, res) {
  // فقط اجازه می‌دهیم درخواست‌های GET به این آدرس بیایند
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // تنظیم هدرها برای اینکه هر سایتی (مثل اکستنشن شما) بتواند از این اطلاعات استفاده کند
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  try {
    // درخواست به سایت tgju.org برای دریافت اطلاعات کامل صفحه
    const response = await fetch('https://www.tgju.org/');
    // اگر سایت جواب نداد، خطا بده
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // متن کامل صفحه را به دست می‌آوریم
    const html = await response.text();

    // ---- استخراج قیمت‌ها از متن HTML با استفاده از الگوها (Regex) ----
    // الگوی جستجو برای قیمت دلار
    const dollarMatch = html.match(/"dollar".*?(\d{1,3}(?:,\d{3})*)/);
    // الگوی جستجو برای قیمت طلای ۱۸ عیار
    const goldMatch = html.match(/"طلای ۱۸ عیار".*?(\d{1,3}(?:,\d{3})*)/);
    // الگوی جستجو برای قیمت سکه امامی
    const emamiMatch = html.match(/"سکه امامی".*?(\d{1,3}(?:,\d{3})*)/);

    // ---- پردازش داده‌های پیدا شده ----
    let dollarPrice = 'نامشخص';
    let goldPrice = 'نامشخص';
    let emamiPrice = 'نامشخص';

    if (dollarMatch && dollarMatch[1]) {
      // تبدیل رشته عدد به عدد و تقسیم بر ۱۰ برای تبدیل ریال به تومان
      const priceInRials = parseInt(dollarMatch[1].replace(/,/g, ''));
      dollarPrice = Math.round(priceInRials / 10).toLocaleString() + ' تومان';
    }
    if (goldMatch && goldMatch[1]) {
      goldPrice = goldMatch[1].replace(/,/g, '') + ' ریال';
    }
    if (emamiMatch && emamiMatch[1]) {
      emamiPrice = emamiMatch[1].replace(/,/g, '') + ' ریال';
    }
    // ---------------------------------

    // اگر هیچ قیمتی پیدا نشد، یک خطا برگردان
    if (dollarPrice === 'نامشخص' && goldPrice === 'نامشخص' && emamiPrice === 'نامشخص') {
      return res.status(404).json({ error: 'Price data not found on the page.' });
    }

    // در نهایت، اطلاعات را به صورت یک پاسخ JSON برای اکستنشن شما برمی‌گردانیم
    res.status(200).json({
      success: true,
      data: {
        dollar: dollarPrice,
        gold: goldPrice,
        emami: emamiPrice,
        // می‌توانید تاریخ دریافت را هم اضافه کنید
        fetchedAt: new Date().toLocaleString('fa-IR')
      }
    });

  } catch (error) {
    // اگر هر جای کار خطایی رخ داد، اینجا به ما اطلاع می‌دهد
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Failed to fetch or parse data from TGJU' });
  }
}