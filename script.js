const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram bot token and chat ID
const telegramToken = <YOUR-TELEGRAM-TOKEN>;
const chatId = <CHAT-ID>;
const bot = new TelegramBot(telegramToken, {polling: true});

async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

async function checkForVisaAppointments() {
  const browser = await puppeteer.launch({ headless: true }); // Using non-headless mode to visualize the actions
  const page = await browser.newPage();

  try {
    await page.goto('https://ita-schengen.idata.com.tr/tr/appointment-form', { waitUntil: 'networkidle0' });
  
    // Select 'Ankara' from the city dropdown
    await page.select('#city', '6'); // '6' is the value for Ankara
  
    // Wait for the cookie consent button to appear and click it
    const cookieButtonSelector = '#cookieJvns';
    if (await page.$(cookieButtonSelector) !== null) {
      await page.click(cookieButtonSelector);
    }
  
    await page.select('#office', '2'); // '2' is the value for Ankara Ofis
  
    await page.select('#getapplicationtype', '7'); // '7' is the value for Diğer (Other)
  
    await page.select('#officetype', '1'); // '1' is the value for STANDART
  
    await page.select('#totalPerson', '1'); // '1' is the value for 1 Person
  
    // Wait for the token to be available in the DOM
    await page.waitForSelector('input[name="_token"]');
  
    // Retrieve the value of the hidden input field
    const token = await page.evaluate(() => {
      const tokenInput = document.querySelector('input[name="_token"]');
      return tokenInput ? tokenInput.value : null;
    });
  
    console.log('CSRF Token:', token);

    await page.click('#btnAppCountNext');  
    await page.type('#name1', <NAME>);
    await page.type('#surname1', <SURNAME>);
    await page.select('#birthday1', <BIRTHDAY-DD>); // Selects day 15
    await page.select('#birthmonth1', <BIRTHDAY-MM>); // Selects month December
    await page.select('#birthyear1', <BIRTHDAY-YYYY>); // Selects year 2000
    await page.type('#passport1', <PASSPORT-NUMBER>);
    await page.type('#phone1', <PHONE-NUMBER>);
    await page.type('#email1', <EMAIL>);
  
    // Click the 'İleri' button again
    await page.click('#btnAppPersonalNext');
  
  // Listen for network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('ita-schengen.idata.com.tr/tr/getdate')) {
      console.log('Intercepted response from:', url);
      const responseData = await response.json(); // Assuming the response is JSON
      console.log('Response data:', responseData);
      
      var message;
      // Print the firstAvailableDate field
      if (responseData && responseData.firstAvailableDate) {
        message = `First Available Date: ${responseData.firstAvailableDate}`;
        console.log(message);
        await sendTelegramMessage(message); // Send message via Telegram
      } else {
        console.log('First Available Date not found or empty');
      }
    }
    });
  
    await page.click('#btnAppPreviewNext');
  
    // Add a delay or an explicit wait condition here if necessary
    // This is to ensure that the script doesn't end before the response is captured
    await page.waitForTimeout(5000); // Waits for 5 seconds; adjust as needed
  
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
}
const interval =  60 * 1000; // 10 minutes
setInterval(checkForVisaAppointments, interval);
