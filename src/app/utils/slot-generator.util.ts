export const generateSlots = (
    date: Date,
    startTime: string,
    endTime: string,
    intervalMinutes: number = 30
) => {
    const slots = [];
    const start = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    end.setHours(endHour, endMinute, 0, 0);

    let current = new Date(start);

    while (current < end) {
        const slotStart = current.toTimeString().slice(0, 5);
        const nextTime = new Date(current.getTime() + intervalMinutes * 60000);

        if (nextTime > end) break;

        const slotEnd = nextTime.toTimeString().slice(0, 5);

        slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isBooked: false,
        });

        current = nextTime;
    }

    return slots;
};
