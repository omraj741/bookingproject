import dotenv from 'dotenv'
import dns from 'node:dns'
import { fileURLToPath } from 'node:url'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

dotenv.config()
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: fileURLToPath(new URL('./.env.local', import.meta.url)) })
}

const dnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean)

if (dnsServers?.length) dns.setServers(dnsServers)

const app = express()
const allowedOrigins = new Set([
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by CORS.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}))
app.use(express.json())

const bookingSchema = new mongoose.Schema({
  guestName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)
const allowedStatuses = ['pending', 'confirmed', 'cancelled']

app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch {
    res.status(500).json({ message: 'Could not load bookings.' })
  }
})

app.get('/api/bookings/stats', async (_req, res) => {
  try {
    const [total, statusCounts] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    const counts = Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count]))

    res.json({
      total,
      confirmed: counts.confirmed || 0,
      pending: counts.pending || 0,
      cancelled: counts.cancelled || 0,
    })
  } catch {
    res.status(500).json({ message: 'Could not load booking statistics.' })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const guestName = typeof req.body?.guestName === 'string' ? req.body.guestName.trim() : ''
    const bookingDate = req.body?.bookingDate
    const status = allowedStatuses.includes(req.body?.status) ? req.body.status : 'pending'

    if (!/^[A-Za-z\s]+$/.test(guestName)) {
      return res.status(400).json({ message: 'Guest name should contain letters only, without numbers or special characters.' })
    }

    const booking = await Booking.create({
      guestName,
      bookingDate,
      status,
    })

    return res.status(201).json(booking)
  } catch {
    return res.status(400).json({ message: 'Could not create booking.' })
  }
})

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }

    const updates = {}

    if (typeof req.body?.guestName === 'string' && req.body.guestName.trim()) {
      const cleanedGuestName = req.body.guestName.trim()

      if (!/^[A-Za-z\s]+$/.test(cleanedGuestName)) {
        return res.status(400).json({ message: 'Guest name should contain letters only, without numbers or special characters.' })
      }

      updates.guestName = cleanedGuestName
    }

    if (req.body?.bookingDate) {
      updates.bookingDate = req.body.bookingDate
    }

    if (allowedStatuses.includes(req.body?.status)) {
      updates.status = req.body.status
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid booking fields were provided for update.' })
    }

    const booking = await Booking.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' })
    }

    return res.json(booking)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update booking.'
    return res.status(400).json({ message })
  }
})

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }

    const booking = await Booking.findByIdAndDelete(id)

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' })
    }

    return res.json({ message: 'Booking deleted successfully.', id: booking._id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete booking.'
    return res.status(400).json({ message })
  }
})

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Configure it in the environment or local .env file.')
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const port = process.env.PORT || 5000
  app.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`))
}

startServer().catch((error) => {
  console.error('Could not start API server:', error)
  process.exit(1)
})