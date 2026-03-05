const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/doctoroncall');
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const c of collections) {
        if (c.name === 'system.profile') continue;
        const count = await db.collection(c.name).countDocuments({ createdAt: { $gt: last24h } });
        const recent = await db.collection(c.name).find({ createdAt: { $gt: last24h } }).sort({createdAt: -1}).limit(5).toArray();
        if (recent.length > 0) {
            console.log(`\n--- ${c.name} (${count} recent) ---`);
            recent.forEach(r => console.log(JSON.stringify(r).substring(0, 150)));
        }
    }

    await mongoose.disconnect();
}

check().catch(console.error);
