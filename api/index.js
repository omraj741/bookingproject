import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import serverless from 'serverless-http'

dotenv.config()

const app = express()
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
].filter(Boolean))

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /https?:\/\/.*\.vercel\.app$/i.test(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by CORS.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
app.options(/.*/, cors())
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

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
const allowedStatuses = ['pending', 'confirmed', 'cancelled']

const ensureDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing.')
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDatabase()
    next()
  } catch (error) {
    next(error)
  }
})

app.get('/api', (_req, res) => {
  res.json({ message: 'Booking API is live.' })
})

app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return res.json(bookings)
  } catch {
    return res.status(500).json({ message: 'Could not load bookings.' })
  }
})

app.get('/api/bookings/stats', async (_req, res) => {
  try {
    const [total, statusCounts] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])

    const counts = Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count]))

    return res.json({
      total,
      confirmed: counts.confirmed || 0,
      pending: counts.pending || 0,
      cancelled: counts.cancelled || 0,
    })
  } catch {
    return res.status(500).json({ message: 'Could not load booking statistics.' })
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

    const booking = await Booking.create({ guestName, bookingDate, status })
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

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Request failed.'
  return res.status(500).json({ message })
})

export default serverless(app)
