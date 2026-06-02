const prisma = require('./prisma');

/**
 * Helper to construct a UTC Date object representing a specific local date and time in a target timezone.
 */
function getUtcDate(year, month, day, hour, minute, timeZone) {
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const partValues = {};
    parts.forEach(p => { partValues[p.type] = p.value; });
    
    let hr = parseInt(partValues.hour);
    if (hr === 24) hr = 0;
    
    const localDate = new Date(Date.UTC(
        parseInt(partValues.year),
        parseInt(partValues.month) - 1,
        parseInt(partValues.day),
        hr,
        parseInt(partValues.minute),
        parseInt(partValues.second)
    ));
    
    const diff = date.getTime() - localDate.getTime();
    return new Date(date.getTime() + diff);
}

/**
 * Checks if a staff member is available for a specific time slot.
 * @param {string} staffId 
 * @param {Date|string} startTime 
 * @param {Date|string} endTime 
 * @param {string} excludeBookingId - Optional booking ID to exclude from conflict check (for rescheduling)
 * @returns {Promise<{available: boolean, reason?: string}>}
 */
async function isStaffAvailable(staffId, startTime, endTime, excludeBookingId = null) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Fetch business timezone for staff member
    const staff = await prisma.user.findUnique({
        where: { id: staffId },
        include: { business: true }
    });
    const timezone = staff?.business?.timezone || 'UTC';

    // Get calendar components in business timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    const parts = formatter.formatToParts(start);
    const partValues = {};
    parts.forEach(p => { partValues[p.type] = p.value; });

    const localYear = parseInt(partValues.year);
    const localMonth = parseInt(partValues.month);
    const localDay = parseInt(partValues.day);

    const localDateStr = `${partValues.month}/${partValues.day}/${partValues.year}`;
    const dayOfWeek = new Date(localDateStr).getDay();

    // 1. Check Working Hours
    const wh = await prisma.workingHours.findUnique({
        where: { userId_dayOfWeek: { userId: staffId, dayOfWeek } }
    });

    if (!wh) {
        return { available: false, reason: "Staff does not work on this day" };
    }

    const [whStartH, whStartM] = wh.startTime.split(':').map(Number);
    const [whEndH, whEndM] = wh.endTime.split(':').map(Number);

    const workStart = getUtcDate(localYear, localMonth, localDay, whStartH, whStartM, timezone);
    const workEnd = getUtcDate(localYear, localMonth, localDay, whEndH, whEndM, timezone);

    if (start < workStart || end > workEnd) {
        return { available: false, reason: `Outside of working hours (${wh.startTime} - ${wh.endTime})` };
    }

    // 2. Check Breaks
    if (wh.breakStart && wh.breakEnd) {
        const [bsH, bsM] = wh.breakStart.split(':').map(Number);
        const [beH, beM] = wh.breakEnd.split(':').map(Number);
        const breakStart = getUtcDate(localYear, localMonth, localDay, bsH, bsM, timezone);
        const breakEnd = getUtcDate(localYear, localMonth, localDay, beH, beM, timezone);

        if (start < breakEnd && end > breakStart) {
            return { available: false, reason: `Overlaps with staff break (${wh.breakStart} - ${wh.breakEnd})` };
        }
    }

    // 3. Check Time Off (Approved)
    const timeOff = await prisma.timeOff.findFirst({
        where: {
            userId: staffId,
            status: 'APPROVED',
            startDate: { lte: end },
            endDate: { gte: start }
        }
    });

    if (timeOff) {
        return { available: false, reason: "Staff has approved time off during this period" };
    }

    // 4. Check Conflicting Bookings
    const conflict = await prisma.booking.findFirst({
        where: {
            acceptedById: staffId,
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            status: { notIn: ['CANCELLED', 'REJECTED', 'LATE_CANCELLED'] },
            startTime: { lt: end },
            endTime: { gt: start }
        }
    });

    if (conflict) {
        return { available: false, reason: "Staff has another appointment at this time" };
    }

    return { available: true };
}

module.exports = { isStaffAvailable, getUtcDate };
