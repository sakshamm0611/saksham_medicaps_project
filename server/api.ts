import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { broadcastSeatHold, broadcastSeatRelease, broadcastSeatsConfirmed } from './socket';
import { User } from './types';

export const apiRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_token_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// ===================== AUTH MIDDLEWARE =====================
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
    }
    next();
  });
}

function generateToken(user: User): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d'
  });
}

// ===================== AUTH ROUTES =====================
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'user',
    phone: phone || '',
    createdAt: now,
    updatedAt: now
  };

  db.createUser(newUser);
  const token = generateToken(newUser);

  const { passwordHash: _, ...userSafe } = newUser;
  res.status(201).json({
    success: true,
    message: 'Account registered successfully.',
    token,
    user: userSafe
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  const { passwordHash: _, ...userSafe } = user;

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: userSafe
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, ...userSafe } = req.user!;
  res.json({ success: true, user: userSafe });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone } = req.body;
  const user = req.user!;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  user.updatedAt = new Date().toISOString();

  const { passwordHash: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

// ===================== MOVIES ROUTES =====================
apiRouter.get('/movies', (req: Request, res: Response) => {
  const { search, genre, language, status, sort } = req.query as Record<string, string>;
  const movies = db.getMovies({ search, genre, language, status, sort });
  res.json({ success: true, count: movies.length, data: movies });
});

apiRouter.get('/movies/:id', (req: Request, res: Response) => {
  const movie = db.getMovieById(req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }
  res.json({ success: true, data: movie });
});

apiRouter.post('/movies', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, posterUrl, backdropUrl, genres, languages, duration, releaseDate, cast, director, rating, status, trailerUrl } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const now = new Date().toISOString();

  const movie = db.createMovie({
    id: `mov_${Date.now()}`,
    title,
    slug,
    description,
    posterUrl: posterUrl || '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
    backdropUrl: backdropUrl || '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
    trailerUrl: trailerUrl || '',
    genres: genres || ['Action'],
    languages: languages || ['English'],
    duration: Number(duration) || 120,
    releaseDate: releaseDate || now.split('T')[0],
    cast: Array.isArray(cast) ? cast : [cast || 'Cast Details'],
    director: director || 'Director Name',
    rating: Number(rating) || 8.5,
    status: status || 'now-showing',
    createdAt: now,
    updatedAt: now
  });

  res.status(201).json({ success: true, data: movie });
});

apiRouter.put('/movies/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateMovie(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }
  res.json({ success: true, data: updated });
});

apiRouter.delete('/movies/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteMovie(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }
  res.json({ success: true, message: 'Movie deleted successfully.' });
});

// ===================== THEATRES ROUTES =====================
apiRouter.get('/theatres', (req: Request, res: Response) => {
  const { city } = req.query as { city?: string };
  const theatres = db.getTheatres(city);
  const enriched = theatres.map((t) => ({
    ...t,
    screensData: db.getScreensForTheatre(t.id)
  }));
  res.json({ success: true, count: enriched.length, data: enriched });
});

apiRouter.get('/theatres/:id', (req: Request, res: Response) => {
  const theatre = db.getTheatreById(req.params.id);
  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found.' });
  }
  const screensData = db.getScreensForTheatre(theatre.id);
  res.json({ success: true, data: { ...theatre, screensData } });
});

// ===================== SHOWS ROUTES =====================
apiRouter.get('/shows', (req: Request, res: Response) => {
  const { movieId, theatreId, date } = req.query as Record<string, string>;
  const shows = db.getShows({ movieId, theatreId, date });
  // Exclude seat map array for high performance index queries
  const stripped = shows.map((s) => {
    const { seats, ...rest } = s;
    const availableCount = seats.filter((seat) => seat.status === 'available').length;
    return {
      ...rest,
      totalSeats: seats.length,
      availableSeats: availableCount
    };
  });
  res.json({ success: true, count: stripped.length, data: stripped });
});

apiRouter.get('/shows/:id/seats', (req: Request, res: Response) => {
  const show = db.getShowById(req.params.id);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }
  res.json({ success: true, data: show });
});

apiRouter.post('/shows', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { movieId, theatreId, screenId, showDate, startTime, endTime, format, basePrice } = req.body;
  if (!movieId || !theatreId || !screenId || !showDate || !startTime) {
    return res.status(400).json({ success: false, message: 'All show parameters are required.' });
  }

  const show = db.createShow({
    movieId,
    theatreId,
    screenId,
    showDate,
    startTime,
    endTime: endTime || '21:00',
    format: format || '2D',
    basePrice: Number(basePrice) || 250
  });

  if (!show) {
    return res.status(400).json({ success: false, message: 'Invalid screen configuration.' });
  }

  res.status(201).json({ success: true, data: show });
});

apiRouter.delete('/shows/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteShow(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }
  res.json({ success: true, message: 'Show cancelled and deleted.' });
});

// ===================== BOOKINGS & SEAT LOCKS =====================
apiRouter.post('/bookings/hold-seats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { showId, seatNumbers } = req.body;
  if (!showId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ success: false, message: 'Please select at least 1 seat.' });
  }

  const result = db.holdSeats(showId, seatNumbers, req.user!.id);
  if (!result.success) {
    return res.status(409).json(result);
  }

  // Real-time broadcast
  broadcastSeatHold(showId, seatNumbers, result.heldUntil!);

  res.json(result);
});

apiRouter.post('/bookings/release-hold', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { showId, seatNumbers } = req.body;
  if (!showId || !Array.isArray(seatNumbers)) {
    return res.status(400).json({ success: false, message: 'Show ID and seat numbers required.' });
  }

  db.releaseSeats(showId, seatNumbers, req.user!.id);
  broadcastSeatRelease(showId, seatNumbers);
  res.json({ success: true, message: 'Seat hold released.' });
});

apiRouter.post('/bookings/create-order', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { showId, seatNumbers } = req.body;
  if (!showId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ success: false, message: 'Show ID and seat numbers required.' });
  }

  const result = db.createBookingOrder(req.user!.id, showId, seatNumbers);
  if (!result.success) {
    return res.status(409).json(result);
  }

  res.status(201).json({
    success: true,
    bookingReference: result.booking?.bookingReference,
    bookingId: result.booking?.id,
    paymentOrder: result.paymentOrder
  });
});

apiRouter.get('/bookings/my-bookings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const bookings = db.getUserBookings(req.user!.id);
  res.json({ success: true, count: bookings.length, data: bookings });
});

apiRouter.get('/bookings/:ref', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const booking = db.getBookingByReference(req.params.ref);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking reference not found.' });
  }

  if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden access to this booking.' });
  }

  res.json({ success: true, data: booking });
});

apiRouter.post('/bookings/:ref/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const result = db.cancelBooking(req.params.ref, req.user!.id, req.user!.role, reason);
  if (!result.success) {
    return res.status(400).json(result);
  }

  const booking = db.getBookingByReference(req.params.ref);
  if (booking) {
    broadcastSeatRelease(booking.showId, booking.seats.map((s) => s.seatNumber));
  }

  res.json(result);
});

// ===================== PAYMENT VERIFICATION =====================
apiRouter.post('/payments/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bookingReference, razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;
  if (!bookingReference || !razorpay_order_id) {
    return res.status(400).json({ success: false, message: 'Missing payment verification credentials.' });
  }

  const result = db.verifyPayment(
    bookingReference,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    isMock !== false
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  const booking = db.getBookingByReference(bookingReference);
  if (booking) {
    broadcastSeatsConfirmed(booking.showId, booking.seats.map((s) => s.seatNumber));
  }

  res.json(result);
});

// ===================== ADMIN DASHBOARD =====================
apiRouter.get('/admin/dashboard', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const stats = db.getDashboardStats();
  res.json({ success: true, data: stats });
});

apiRouter.get('/admin/bookings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const bookings = db.getAllBookings();
  res.json({ success: true, count: bookings.length, data: bookings });
});

apiRouter.get('/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(({ passwordHash: _, ...u }) => u);
  res.json({ success: true, count: users.length, data: users });
});

apiRouter.post('/admin/reset-demo', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  db.resetDemoData();
  res.json({ success: true, message: 'Database reset to fresh demo state.' });
});

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'IMovies Engine', time: new Date().toISOString() });
});
