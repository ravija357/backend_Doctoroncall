const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    // Default db is extracted from URI or fallback
    const db = client.db('doctoroncall');
    const user = await db.collection('users').findOne({ role: 'doctor' });

    if (!user) {
        console.log('No doctor found');
        process.exit(1);
    }

    const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const payload = {
        specialization: 'Neurology',
        experience: 10,
        qualifications: ['MBBS', 'MD'],
        bio: 'Experienced neurologist with 10+ years of clinical practice.',
        fees: 1200,
        hospital: 'Neuro Clinic'
    };

    console.log('PUT request...');
    let res = await fetch('http://localhost:3001/api/doctors/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    let data = await res.text();
    console.log('PUT Status:', res.status, 'Response:', data);

    if (res.status === 404) {
        console.log('POST request...');
        res = await fetch('http://localhost:3001/api/doctors/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        data = await res.text();
        console.log('POST Status:', res.status, 'Response:', data);
    }

    process.exit(0);
}
run().catch(console.error);
