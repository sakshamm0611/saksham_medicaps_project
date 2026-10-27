# IMovies — Cinema Management & Movie Ticket Booking System

**IMovies** is a full-stack cinema management and real-time movie ticket booking platform inspired by BookMyShow, built with dark cinematic aesthetics, high-definition typography, atomic seat concurrency protection, and an administrator command center.

---

## Features

- **Dynamic Movie Discovery**:
  - Browse Now Showing blockbusters and Coming Soon premieres.
  - Multi-attribute filtering by Genre (Sci-Fi, Action, Drama, Thriller, Adventure, etc.) and Language (English, Hindi, Tamil, Telugu).
  - Search by movie title, director, or cast.
  - Sorting by Top Rated, Popularity, and Release Date.
- **Flagship Multiplexes & Theatres**:
  - Filter cinemas by metropolitan city (Mumbai, Delhi NCR, Bengaluru, Hyderabad).
  - Detailed auditorium amenities: 4K Laser IMAX, Dolby Cinema, Dolby Atmos 7.1, 4DX Dynamic Motion, Insignia Motorized Recliners.
- **Interactive Visual Seat Map**:
  - Multi-tier seat categorization: Silver Standard, Gold Club, and Premium Recliners with price multipliers.
  - Real-time Socket.IO synchronization: live broadcast of seat holds, releases, and confirmed bookings across all connected viewers in the same auditorium room.
  - **5-Minute Atomic Hold Engine**: Automatically locks selected seats upon proceeding to checkout. Prevents double-booking race conditions with 409 conflict detection.
  - Automatic expiration cleanup when checkout is abandoned or timeout finishes.
- **Checkout & Payment Verification**:
  - Server-side trusted price computation (subtotal + 5% convenience fee).
  - Instant Test Payment Simulator (clearly labeled for local verification) and Razorpay test mode integration.
  - Server-side cryptographic signature verification before confirming booking tickets.
- **Printable E-Ticket Passes**:
  - Unique booking references (e.g. `IMO-XXXX-XXXX`).
  - Cryptographically verifiable QR code for contactless admission.
  - High-fidelity print styles (`@media print`) via "Print E-Ticket Pass".
- **User Dashboard**:
  - View confirmed admission passes.
  - Self-service cancellation workflow with automatic seat release and refund status tracking.
- **Administrator Command Center**:
  - Overview KPI metrics: Gross Revenue, Confirmed Bookings, Active Movies, Total Theatres, Scheduled Shows, and Real-Time Seat Occupancy %.
  - Complete Movie Management: Add new titles with director, duration, genres, and ratings.
  - Showtime Scheduler: Schedule shows for any auditorium screen with date, time, and base price.
  - Live Bookings Ledger: Track customer transactions and statuses in real time.
  - "Reset Demo Data" action to easily prime or refresh initial seed data.

---

## Demo Credentials

Two pre-configured accounts are seeded and available via one-click buttons on `/login`:

| Account | Email | Password | Role | Access |
|---|---|---|---|---|
| **Demo Customer** | `john@example.com` | `UserSecure@2026!` | User | Ticket booking, Seat map, User Dashboard |
| **Super Admin** | `admin@imovies.com` | `AdminSecure@2026!` | Admin | Admin Console (`/admin`), Schedule shows, Manage movies |

You can also register any new customer account with instant authentication.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Canvas Confetti, QRCode generator.
- **Backend**: Node.js, Express, Socket.IO, JWT authentication, bcryptjs password hashing.
- **Database Engine**: Persistent file-backed JSON store (`data/imovies_store.json`) with in-memory cache and atomic locking.
- **Real-Time**: Socket.IO rooms (`show_${showId}`) broadcasting `seats_held`, `seats_released`, `seats_confirmed`.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new customer account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Get current session profile

### Movies & Theatres
- `GET /api/movies` - List movies with query filters (`search`, `genre`, `language`, `status`, `sort`)
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies` - (Admin) Create movie
- `DELETE /api/movies/:id` - (Admin) Delete movie
- `GET /api/theatres` - List theatres by city
- `GET /api/theatres/:id` - Get theatre details

### Shows & Seating
- `GET /api/shows` - Get scheduled showtimes
- `GET /api/shows/:id/seats` - Retrieve visual seat layout with current availability & active holds
- `POST /api/shows` - (Admin) Schedule a showtime

### Bookings & Payments
- `POST /api/bookings/hold-seats` - Atomically lock seats for 5 minutes
- `POST /api/bookings/release-hold` - Release seat hold
- `POST /api/bookings/create-order` - Generate booking order
- `POST /api/payments/verify` - Verify payment signature and commit seats to confirmed status
- `GET /api/bookings/my-bookings` - Fetch user's booking passes
- `GET /api/bookings/:ref` - Fetch booking ticket pass by reference code
- `POST /api/bookings/:ref/cancel` - Cancel booking and trigger refund

### Admin
- `GET /api/admin/dashboard` - KPI analytics & occupancy rate
- `GET /api/admin/bookings` - All system booking transactions
- `POST /api/admin/reset-demo` - Reset database to initial seed data
