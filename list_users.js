const mongoose = require('mongoose');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/doctoroncall');
        console.log('Connected to MongoDB on 27017');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();

        console.log('--- Registered Users ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Name: ${u.firstName} ${u.lastName}`);
        });
        console.log('------------------------');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
