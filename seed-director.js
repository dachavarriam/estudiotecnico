const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const NOCODB_URL = env.NOCODB_URL || "https://noco.wembla.com";
const NOCODB_TOKEN = env.NOCODB_API_TOKEN;
const PROJECT_ID = env.NOCODB_PROJECT_ID || 'pqoiuan33cgquux';
const TABLE_ID = 'myyvu2xakmkxqz3'; // users table

console.log(`Seeding Director User in ${TABLE_ID}...`);

// Helper to make request
function request(method, path, body = null) {
    return new Promise((resolve) => {
        const options = {
            hostname: NOCODB_URL.replace('https://', '').replace('http://', ''),
            port: 443,
            path: `/api/v1/db/data/v1/${PROJECT_ID}${path}`,
            method: method,
            headers: {
                'xc-token': NOCODB_TOKEN,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.headers['Content-Length'] = body.length;
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    const director = {
        "Name": "Director General",
        "email": "director@tashonduras.com",
        "Role": "director",
        "Slack ID": "U_DIRECTOR_DEMO" // Placeholder
    };

    const res = await request('POST', `/${TABLE_ID}`, JSON.stringify(director));
    console.log("Status:", res.status);
    console.log("Response:", res.data);
}

run();
