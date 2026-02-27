const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appointmentSchema = new Schema({}, { timestamps: true, strict: false });
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

async function check() {
    await mongoose.connect('mongodb://localhost:27017/doctoroncall');
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const apts = await Appointment.find({ createdAt: { $gt: last24h } });
    console.log('New appointments in last 24h:', apts.length);
    apts.forEach(a => console.log(a._id, a.status, a.createdAt));
    await mongoose.disconnect();
}

check().catch(console.error);
