const mongoose = require('mongoose');
const Appointment = require('./src/app/models/Appointment.model').default;
const User = require('./src/app/models/User.model').default;
const Doctor = require('./src/app/models/Doctor.model').default;

async function check() {
    await mongoose.connect('mongodb://localhost:27017/doctoroncall');

    const appointments = await Appointment.find().populate('doctor').populate('patient');
    console.log('Total Appointments:', appointments.length);

    appointments.forEach(a => {
        console.log(`ID: ${a._id}, Status: ${a.status}, Doctor: ${a.doctor ? a.doctor._id : 'null'}, Patient: ${a.patient ? a.patient.firstName : 'null'}`);
    });

    const doctors = await Doctor.find().populate('user');
    doctors.forEach(d => {
        console.log(`Doctor ID: ${d._id}, User ID: ${d.user ? d.user._id : 'null'}, Name: ${d.user ? d.user.firstName : 'unknown'}`);
    });

    await mongoose.disconnect();
}

check().catch(console.error);
