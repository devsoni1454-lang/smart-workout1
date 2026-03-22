// const fetch = require('node-fetch'); 
// Using native Node.js modules to avoid external dependencies

// Simple test script using Node.js built-in modules to avoid extra dependencies if possible
// But since we are on the user's machine and they might have Node 18, fetch might work.
// To be safe, I'll use the 'http' module which is always there, or just assume they have dependencies installed.
// actually, let's use a simple axios-like helper with http to be dependency-free for the test script
const http = require('http');

const makeRequest = (path, method, body, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('🚀 Starting API Tests...\n');

    // 1. Register
    const testUser = {
        name: 'TestUser_' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'password123'
    };

    console.log(`1. Testing Registration for ${testUser.email}...`);
    try {
        const regRes = await makeRequest('/api/auth/register', 'POST', testUser);
        if (regRes.status === 201) {
            console.log('✅ Registration Successful');
        } else {
            console.error('❌ Registration Failed:', regRes.body);
            return;
        }

        // 2. Login
        console.log(`\n2. Testing Login...`);
        const loginRes = await makeRequest('/api/auth/login', 'POST', {
            email: testUser.email,
            password: testUser.password
        });

        if (loginRes.status === 200 && loginRes.body.token) {
            console.log('✅ Login Successful');
            const token = loginRes.body.token;

            // 3. Get Profile
            console.log(`\n3. Testing Protected Route (Get Profile)...`);
            const profileRes = await makeRequest('/api/users/profile', 'GET', null, token);

            if (profileRes.status === 200 && profileRes.body.email === testUser.email) {
                console.log('✅ Profile Fetch Successful');
            } else {
                console.error('❌ Profile Fetch Failed:', profileRes.body);
            }

            // 4. Test Tracker
            console.log(`\n4. Testing Tracker (Log Daily Activity)...`);
            const trackerPayload = {
                date: new Date().toISOString().split('T')[0],
                caloriesIn: 2000,
                caloriesBurned: 500,
                waterIntake: 2.5,
                sleepHours: 8,
                steps: 10000,
                notes: 'Test daily activity'
            };
            const trackerRes = await makeRequest('/api/tracker', 'POST', trackerPayload, token);

            if (trackerRes.status === 201) {
                console.log('✅ Tracker Log Successful');
                console.log('Response:', trackerRes.body);
            } else {
                console.error('❌ Tracker Log Failed:', trackerRes.body);
            }

        } else {
            console.error('❌ Login Failed:', loginRes.body);
        }

    } catch (error) {
        console.error('❌ Test Script Error:', error.message);
        console.log('Make sure the server is running on port 5000!');
    }
};

runTests();
