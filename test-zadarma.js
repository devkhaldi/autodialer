const Zadarma = require('zadarma-api');

// COPY YOUR KEYS FROM .env.local HERE
const API_KEY = 'e25c815af9a2fea92a9a';
const API_SECRET = '6a9692c534939329c5aa'; 
const FROM = '365816'; 
const TO = '19093900003';

const api = new Zadarma.Api(API_KEY, API_SECRET);

async function testOfficialSDK() {
    console.log('\n--- TESTING WITH OFFICIAL ZADARMA SDK ---');
    
    try {
        // 1. Test Balance
        console.log('Testing Account Balance...');
        const balance = await api.getBalance();
        console.log('Balance Response:', JSON.stringify(balance, null, 2));
        
        // 2. Test Callback
        console.log('\nTesting Callback...');
        const callback = await api.requestCallback(FROM, TO);
        console.log('Callback Response:', JSON.stringify(callback, null, 2));
        
    } catch (err) {
        console.error('SDK ERROR:', err.message);
    }
}

testOfficialSDK();
