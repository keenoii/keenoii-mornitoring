import { NextResponse } from 'next/server';
import db from '@/lib/sqlite-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, title, organizer, startTime, endTime } = body;

    if (!roomId || !title || !organizer || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    if (new Date(startTime).getTime() >= new Date(endTime).getTime()) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    // Backend Overlap Conflict Detection
    const conflictingBookings = db.prepare(`
      SELECT * FROM room_bookings
      WHERE roomId = ?
        AND status = 'confirmed'
        AND datetime(?) < datetime(endTime)
        AND datetime(?) > datetime(startTime)
    `).all(roomId, startTime, endTime) as any[];

    if (conflictingBookings.length > 0) {
      const conflict = conflictingBookings[0];
      return NextResponse.json(
        {
          error: `ช่วงเวลานี้ชนกับการจองอื่น: "${conflict.title}" (${new Date(conflict.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(conflict.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})`,
          conflictBooking: conflict,
        },
        { status: 409 }
      );
    }

    const bookingId = `bk-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO room_bookings (id, roomId, title, organizer, startTime, endTime, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `).run(bookingId, roomId, title, organizer, startTime, endTime, now, now);

    // Update room occupancy status to 'reserved' if booking is today
    db.prepare(`
      UPDATE rooms
      SET occupancyStatus = 'reserved', updatedAt = ?
      WHERE id = ?
    `).run(now, roomId);

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        roomId,
        title,
        organizer,
        startTime,
        endTime,
        status: 'confirmed',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create room booking' },
      { status: 500 }
    );
  }
}
