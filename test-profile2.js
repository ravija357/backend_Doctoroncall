const mongoose = require('mongoose');
const User = require('./dist/app/models/User.model').default;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkDoctor() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ role: 'doctor' });
    if (!user) {
        console.log('No doctor user found.');
        process.exit(1);
    }

    const token = require('jsonwebtoken').sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('Token created:', token.substring(0, 20) + '...');

    const payload = {
        specialization: 'Neurology',
        experience: 10,
        qualifications: ['MBBS', 'MD'],
        bio: 'Experienced neurologist with 10+ years of clinical practice.',
        fees: 1200,
        hospital: 'Neuro Clinic'
    };

    console.log('Sending PUT...');
    let res = await fetch('http://localhost:3001/api/doctors/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });

    let data = await res.text();
    console.log('PUT Status:', res.status, 'Data:', data);

    if (res.status === 404) {
        console.log('Sending POST instead...');
        res = await fetch('http://localhost:3001/api/doctors/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        data = await res.text();
        console.log('POST Status:', res.status, 'Data:', data);
    }

    process.exit(0);
}
checkDoctor().catch(e => { console.error(e.message); process.exit(1); });
