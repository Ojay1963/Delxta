const Reservation = require('../models/Reservation')
const { sendEmail } = require('../utils/email')
const PHONE_11_DIGITS_REGEX = /^\d{11}$/

const createReservation = async (req, res, next) => {
  try {
    const { name, email, phone, guests, date, time, requests } = req.body
    if (!name || !email || !phone || !guests || !date || !time) {
      return res.status(400).json({ message: 'All required fields must be provided.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ message: 'A valid email is required.' })
    }
    if (!PHONE_11_DIGITS_REGEX.test(String(phone).trim())) {
      return res.status(400).json({ message: 'Phone number must be exactly 11 digits.' })
    }
    if ((Number(guests) || 0) < 1) {
      return res.status(400).json({ message: 'Guests must be at least 1.' })
    }

    const reservation = await Reservation.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      guests: Number(guests),
      date,
      time,
      requests,
    })

    await sendEmail({
      to: email,
      subject: 'Reservation Received - Delxta',
      html: `<p>Hi ${name}, your reservation request for ${date} at ${time} has been received.</p>`,
    })

    return res.status(201).json({
      message: 'Reservation submitted successfully.',
      reservation,
    })
  } catch (error) {
    return next(error)
  }
}

const getAdminReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 }).limit(200)
    return res.json({ reservations })
  } catch (error) {
    return next(error)
  }
}

const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    const allowedStatuses = ['pending', 'confirmed', 'cancelled']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status.' })
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' })
    }

    if (status === 'confirmed' || status === 'cancelled') {
      await sendEmail({
        to: reservation.email,
        subject: `Reservation ${status === 'confirmed' ? 'Confirmed' : 'Cancelled'} - Delxta`,
        html: `<p>Hi ${reservation.name}, your reservation on ${reservation.date} at ${reservation.time} is now <strong>${status}</strong>.</p>`,
      })
    }

    return res.json({
      message: `Reservation marked as ${status}.`,
      reservation,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { createReservation, getAdminReservations, updateReservationStatus }
