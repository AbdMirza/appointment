const prisma = require('../../utils/prisma');

/**
 * Slot Generation Engine
 * Converts staff schedules, service durations, buffers, existing bookings
 * and time-off into real bookable time slots.
 */

/**
 * Generate available slots for a given business, service, and date range.
 *
 * @param {Object} params
 * @param {string} params.businessId
 * @param {string} params.serviceId
 * @param {string} params.startDate  - ISO date string "YYYY-MM-DD"
 * @param {string} params.endDate    - ISO date string "YYYY-MM-DD"
 * @param {string} [params.staffId]  - optional filter to one staff member
 * @returns {Object} slots grouped by date string
 */
async function generateAvailableSlots({ businessId, serviceId, startDate, endDate, staffId }) {
    console.log(`[SlotEngine] Generating slots: ${startDate} to ${endDate} for service ${serviceId}`);

    // 1. Load service details
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
            staff: {
                where: staffId
                    ? { id: staffId, isActive: true, deletedAt: null }
                    : { isActive: true, deletedAt: null },
                select: { id: true, name: true }
            }
        }
    });

    if (!service || service.businessId !== businessId) {
        throw new Error('Service not found or does not belong to this business');
    }

    const eligibleStaff = service.staff;
    if (eligibleStaff.length === 0) {
        console.log(`[SlotEngine] No staff found for service ${serviceId}`);
        return {}; // no staff assigned to this service
    }
    console.log(`[SlotEngine] Found ${eligibleStaff.length} eligible staff: ${eligibleStaff.map(s => s.name).join(', ')}`);

    const totalDuration = service.duration + service.bufferTimeBefore + service.bufferTimeAfter;
    const staffIds = eligibleStaff.map(s => s.id);

    // 2. Load booking config (or use defaults)
    const config = await prisma.bookingConfig.findUnique({
        where: { businessId }
    });
    const slotInterval = config?.slotInterval ?? 15;
    const minBookingNotice = config?.minBookingNotice ?? 120; // minutes
    const maxBookingWindow = config?.maxBookingWindow ?? 30; // days

    // 3. Load business hours
    const businessHours = await prisma.businessHours.findMany({
        where: { businessId }
    });
    const businessHoursMap = {};
    businessHours.forEach(h => { businessHoursMap[h.dayOfWeek] = h; });

    // 4. Load working hours for all eligible staff
    const workingHours = await prisma.workingHours.findMany({
        where: { userId: { in: staffIds }, businessId }
    });
    // Map: staffId -> { dayOfWeek -> workingHours }
    const staffWorkingHoursMap = {};
    workingHours.forEach(wh => {
        if (!staffWorkingHoursMap[wh.userId]) staffWorkingHoursMap[wh.userId] = {};
        staffWorkingHoursMap[wh.userId][wh.dayOfWeek] = wh;
    });

    // 5. Compute date range boundaries
    // Parse as LOCAL dates (not UTC) to avoid timezone shift
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const rangeStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

    const [ey, em, ed] = endDate.split('-').map(Number);
    const rangeEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);

    // Enforce max booking window
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxBookingWindow);
    if (rangeEnd > maxDate) {
        rangeEnd.setTime(maxDate.getTime());
        rangeEnd.setHours(23, 59, 59, 999);
    }

    // 6. Load approved time-off for eligible staff in the date range
    const timeOffs = await prisma.timeOff.findMany({
        where: {
            userId: { in: staffIds },
            status: 'APPROVED',
            startDate: { lte: rangeEnd },
            endDate: { gte: rangeStart }
        }
    });
    // Map: staffId -> array of { startDate, endDate }
    const staffTimeOffMap = {};
    timeOffs.forEach(to => {
        if (!staffTimeOffMap[to.userId]) staffTimeOffMap[to.userId] = [];
        staffTimeOffMap[to.userId].push({ startDate: new Date(to.startDate), endDate: new Date(to.endDate) });
    });

    // 7. Load existing bookings (non-cancelled) for eligible staff in the date range
    const existingBookings = await prisma.booking.findMany({
        where: {
            acceptedById: { in: staffIds },
            status: { notIn: ['CANCELLED', 'REJECTED'] },
            startTime: { lte: rangeEnd },
            endTime: { gte: rangeStart }
        }
    });
    // Map: staffId -> array of { startTime, endTime }
    const staffBookingsMap = {};
    existingBookings.forEach(b => {
        const sid = b.acceptedById;
        if (!staffBookingsMap[sid]) staffBookingsMap[sid] = [];
        staffBookingsMap[sid].push({ startTime: new Date(b.startTime), endTime: new Date(b.endTime) });
    });

    // Also load PENDING/CONFIRMED bookings that don't have a staff yet — these block ALL staff for the service
    const unassignedBookings = await prisma.booking.findMany({
        where: {
            serviceId,
            acceptedById: null,
            status: { notIn: ['CANCELLED', 'REJECTED'] },
            startTime: { lte: rangeEnd },
            endTime: { gte: rangeStart }
        }
    });

    // 8. Generate slots day by day
    const result = {};
    const current = new Date(rangeStart);

    while (current <= rangeEnd) {
        // Use local date formatting (not UTC) to match frontend date keys
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const dayOfWeek = current.getDay();
        const daySlotsAll = [];

        // Check business open
        const bh = businessHoursMap[dayOfWeek];
        if (bh && !bh.isOpen) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        for (const staff of eligibleStaff) {
            // Check time-off
            const offs = staffTimeOffMap[staff.id] || [];
            const dayStart = new Date(current);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(current);
            dayEnd.setHours(23, 59, 59, 999);

            const hasTimeOff = offs.some(to => to.startDate <= dayEnd && to.endDate >= dayStart);
            if (hasTimeOff) continue;

            // Get working hours for this day
            const wh = staffWorkingHoursMap[staff.id]?.[dayOfWeek];
            if (!wh) continue;

            const [whStartH, whStartM] = wh.startTime.split(':').map(Number);
            const [whEndH, whEndM] = wh.endTime.split(':').map(Number);

            const workStart = new Date(current);
            workStart.setHours(whStartH, whStartM, 0, 0);

            const workEnd = new Date(current);
            workEnd.setHours(whEndH, whEndM, 0, 0);

            // Break times
            let breakStart = null, breakEnd = null;
            if (wh.breakStart && wh.breakEnd) {
                const [bsH, bsM] = wh.breakStart.split(':').map(Number);
                const [beH, beM] = wh.breakEnd.split(':').map(Number);
                breakStart = new Date(current);
                breakStart.setHours(bsH, bsM, 0, 0);
                breakEnd = new Date(current);
                breakEnd.setHours(beH, beM, 0, 0);
            }

            // Staff bookings for this day
            const staffBookings = (staffBookingsMap[staff.id] || []).filter(
                b => b.startTime < dayEnd && b.endTime > dayStart
            );

            // Generate candidate slots
            const slotStart = new Date(workStart);

            while (slotStart.getTime() + totalDuration * 60000 <= workEnd.getTime()) {
                const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

                // Actual appointment times (excluding buffers for display)
                const appointmentStart = new Date(slotStart.getTime() + service.bufferTimeBefore * 60000);
                const appointmentEnd = new Date(appointmentStart.getTime() + service.duration * 60000);

                // Check min booking notice
                const minNoticeTime = new Date(now.getTime() + minBookingNotice * 60000);
                if (appointmentStart < minNoticeTime) {
                    slotStart.setMinutes(slotStart.getMinutes() + slotInterval);
                    continue;
                }

                // Check break overlap
                if (breakStart && breakEnd) {
                    if (slotStart < breakEnd && slotEnd > breakStart) {
                        slotStart.setMinutes(slotStart.getMinutes() + slotInterval);
                        continue;
                    }
                }

                // Check booking conflicts
                const hasConflict = staffBookings.some(b =>
                    slotStart < b.endTime && slotEnd > b.startTime
                );

                // Check unassigned booking conflicts
                const hasUnassignedConflict = unassignedBookings.some(b =>
                    slotStart < new Date(b.endTime) && slotEnd > new Date(b.startTime)
                );

                if (!hasConflict && !hasUnassignedConflict) {
                    daySlotsAll.push({
                        startTime: appointmentStart.toISOString(),
                        endTime: appointmentEnd.toISOString(),
                        staffId: staff.id,
                        staffName: staff.name || 'Staff'
                    });
                } else {
                    // console.log(`[SlotEngine] Conflict for slot ${appointmentStart.toISOString()} (Staff conflict: ${hasConflict}, Unassigned: ${hasUnassignedConflict})`);
                }

                slotStart.setMinutes(slotStart.getMinutes() + slotInterval);
            }
        }

        console.log(`[SlotEngine] Generated ${daySlotsAll.length} slots for ${dateStr}`);

        if (daySlotsAll.length > 0) {
            result[dateStr] = daySlotsAll;
        }

        current.setDate(current.getDate() + 1);
    }

    return result;
}

module.exports = { generateAvailableSlots };
