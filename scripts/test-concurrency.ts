
import axios from 'axios';

const API_URL = 'http://localhost:3001/api'; // Adjust port if needed

// You need to set these variables with valid IDs from your DB
const PATIENT_TOKEN = 'YOUR_PATIENT_TOKEN';
const DOCTOR_ID = 'YOUR_DOCTOR_ID';
const DATE = '2023-12-25'; // Ensure this date has slots generated/available
const START_TIME = '10:00';
const END_TIME = '10:30';

async function testConcurrency() {
    console.log('🚀 Starting Concurrency Test...');

    const numRequests = 5;
    const requests = [];

    for (let i = 0; i < numRequests; i++) {
        requests.push(
            axios.post(
                `${API_URL}/appointments`,
                {
                    doctorId: DOCTOR_ID,
                    date: DATE,
                    startTime: START_TIME,
                    endTime: END_TIME,
                    reason: `Concurrency Test Request ${i + 1}`
                },
                {
                    headers: { Authorization: `Bearer ${PATIENT_TOKEN}` }
                }
            ).then(res => ({ status: 'fulfilled', data: res.data }))
                .catch(err => ({ status: 'rejected', error: err.response?.data || err.message }))
        );
    }

    const results = await Promise.all(requests);

    let successCount = 0;
    let failCount = 0;

    results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
            console.log(`✅ Request ${index + 1}: Success`, res.data);
            successCount++;
        } else {
            console.log(`❌ Request ${index + 1}: Failed`, res.error);
            failCount++;
        }
    });

    console.log('\n📊 Summary:');
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    if (successCount === 1 && failCount === numRequests - 1) {
        console.log('✅ TEST PASSED: Only one booking succeeded.');
    } else {
        console.log('❌ TEST FAILED: Unexpected result distribution.');
    }
}

testConcurrency();
