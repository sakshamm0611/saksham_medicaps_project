import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  Movie,
  Theatre,
  Screen,
  Show,
  Booking,
  PaymentRecord,
  Notification,
  ScreenSeatBlueprint,
  ShowSeat,
  SeatCategory
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'imovies_store.json');

export interface DatabaseSchema {
  users: User[];
  movies: Movie[];
  theatres: Theatre[];
  screens: Screen[];
  shows: Show[];
  bookings: Booking[];
  payments: PaymentRecord[];
  notifications: Notification[];
}

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    movies: [],
    theatres: [],
    screens: [],
    shows: [],
    bookings: [],
    payments: [],
    notifications: []
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure show dates are fresh
        this.refreshShowDates();
        return;
      } catch (err) {
        console.warn('[IMovies DB] Failed to parse existing data file, recreating fresh seed data.');
      }
    }

    this.seedInitialData();
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[IMovies DB] Failed to save database to disk:', err);
    }
  }

  private generateSeatLayoutBlueprint(): ScreenSeatBlueprint[] {
    const layout: ScreenSeatBlueprint[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    rows.forEach((r, idx) => {
      let category: SeatCategory = 'Silver';
      let priceMultiplier = 1.0;
      if (idx >= 3 && idx <= 5) {
        category = 'Gold';
        priceMultiplier = 1.35;
      } else if (idx > 5) {
        category = 'Premium';
        priceMultiplier = 1.75;
      }

      for (let c = 1; c <= 10; c++) {
        layout.push({
          row: r,
          col: c,
          seatNumber: `${r}${c}`,
          category,
          priceMultiplier
        });
      }
    });
    return layout;
  }

  private seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Users (Admin + Demo Customer)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('AdminSecure@2026!', adminSalt);

    const userSalt = bcrypt.genSaltSync(10);
    const userPasswordHash = bcrypt.hashSync('UserSecure@2026!', userSalt);

    const adminUser: User = {
      id: 'usr_admin_01',
      name: 'IMovies Super Admin',
      email: 'admin@imovies.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91 98765 43210',
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const demoUser: User = {
      id: 'usr_demo_01',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: userPasswordHash,
      role: 'user',
      phone: '+91 98123 45678',
      createdAt: isoNow,
      updatedAt: isoNow
    };

    this.data.users = [adminUser, demoUser];

    // 2. Movies (10 diverse titles with generated high-fidelity posters)
    this.data.movies = [
      {
        id: 'mov_dune_odyssey',
        title: 'Dune Odyssey: The Prophecy',
        slug: 'dune-odyssey',
        description: 'Paul navigates an unyielding galactic struggle on the harsh desert sands of Arrakis, encountering ancient sisterhood secrets and celestial visions that will alter humanity forever.',
        posterUrl: '/src/assets/images/movie_dune_odyssey_1793124935630.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        genres: ['Sci-Fi', 'Adventure', 'Action'],
        languages: ['English', 'Hindi', 'Tamil'],
        duration: 166,
        releaseDate: '2026-03-01',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
        director: 'Denis Villeneuve',
        rating: 9.2,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_cyber_city',
        title: 'Cyber City 2088',
        slug: 'cyber-city-2088',
        description: 'In a neon-drenched metropolis divided by synthetic augmentation and corporate crime, a rogue cybernetic detective unearths a clandestine conspiracy threatening humanity.',
        posterUrl: '/src/assets/images/movie_neon_cyberpunk_1793124936490.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
        genres: ['Action', 'Thriller', 'Sci-Fi'],
        languages: ['English', 'Japanese'],
        duration: 142,
        releaseDate: '2026-04-12',
        cast: ['Liam O\'Connell', 'Mei Tanaka', 'Joshua Lee'],
        director: 'Hideo Shirasawa',
        rating: 8.9,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_shadow_chronicles',
        title: 'The Shadow Chronicles',
        slug: 'the-shadow-chronicles',
        description: 'When the underworld orchestrates an inescapable grid shutdown across the sprawling metropolitan skyline, a brooding masked vigilante emerges to execute justice.',
        posterUrl: '/src/assets/images/movie_shadow_chronicles_1793124937097.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
        genres: ['Action', 'Crime', 'Drama'],
        languages: ['English', 'Hindi'],
        duration: 158,
        releaseDate: '2026-05-18',
        cast: ['Robert Sterling', 'Elena Rostova', 'Colin Campbell'],
        director: 'Matt Reeves',
        rating: 9.0,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_quantum_horizon',
        title: 'Quantum Horizon: Interstellar Abyss',
        slug: 'quantum-horizon',
        description: 'A daring astronaut expedition dives into the gravitational core of an iridescent rotating singularity, discovering anomalies in spacetime and emotional ties that defy physics.',
        posterUrl: '/src/assets/images/movie_quantum_realm_1793124937473.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        genres: ['Sci-Fi', 'Drama', 'Adventure'],
        languages: ['English', 'German'],
        duration: 174,
        releaseDate: '2026-02-14',
        cast: ['Elara Vance', 'Marcus Reed', 'Dr. Aris Thorne', 'Leo Chen'],
        director: 'Christopher Nolan',
        rating: 9.3,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_oppenheimer_legacy',
        title: 'Prometheus Unleashed: The Atomic Dawn',
        slug: 'prometheus-unleashed',
        description: 'The definitive biographical drama chronicling the secret laboratory of Los Alamos, high-stakes moral dilemmas, and the dawn of nuclear weaponry.',
        posterUrl: '/src/assets/images/movie_quantum_realm_1793124937473.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        genres: ['Biography', 'History', 'Drama'],
        languages: ['English', 'Hindi'],
        duration: 180,
        releaseDate: '2026-01-20',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
        director: 'Christopher Nolan',
        rating: 9.1,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_gladiator_eternal',
        title: 'Gladiator: Reign of Champions',
        slug: 'gladiator-reign-of-champions',
        description: 'Decades after Maximus, a ferocious gladiator rises in the Roman Colosseum to dismantle a corrupt tyrannical dynasty and reclaim honour for the republic.',
        posterUrl: '/src/assets/images/movie_dune_odyssey_1793124935630.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
        genres: ['Action', 'Adventure', 'History'],
        languages: ['English', 'Hindi', 'Telugu'],
        duration: 154,
        releaseDate: '2026-06-05',
        cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington'],
        director: 'Ridley Scott',
        rating: 8.7,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_avatar_fire_ash',
        title: 'Avatar: Fire and Ash',
        slug: 'avatar-fire-and-ash',
        description: 'Jake Sully and Neytiri travel across the volcanic badlands of Pandora, clashing with the Ash People and confronting an environmental battle of cataclysmic scale.',
        posterUrl: '/src/assets/images/movie_neon_cyberpunk_1793124936490.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        genres: ['Sci-Fi', 'Fantasy', 'Action'],
        languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
        duration: 192,
        releaseDate: '2026-12-18',
        cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Oona Chaplin'],
        director: 'James Cameron',
        rating: 9.4,
        status: 'coming-soon',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_spiderman_beyond',
        title: 'Spider-Verse: The Multiverse Fracture',
        slug: 'spiderman-multiverse-fracture',
        description: 'Miles Morales confronts the true cost of being a hero across kaleidoscopic dimensions, facing the ultimate dilemma between saving one life or preserving the multiverse.',
        posterUrl: '/src/assets/images/movie_shadow_chronicles_1793124937097.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
        genres: ['Animation', 'Action', 'Adventure'],
        languages: ['English', 'Hindi', 'Tamil'],
        duration: 140,
        releaseDate: '2026-11-20',
        cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
        director: 'Joaquim Dos Santos',
        rating: 9.1,
        status: 'coming-soon',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_blade_runner_2099',
        title: 'Nexus Zero: Replicant Wars',
        slug: 'nexus-zero',
        description: 'In an isolated off-world colony submerged in acid rain and industrial steam, a synthetic operative hunts down rogue bio-engineered prototypes.',
        posterUrl: '/src/assets/images/movie_neon_cyberpunk_1793124936490.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4',
        genres: ['Sci-Fi', 'Thriller', 'Mystery'],
        languages: ['English'],
        duration: 160,
        releaseDate: '2026-10-15',
        cast: ['Michelle Yeoh', 'Hunter Schafer', 'Nicholas Hoult'],
        director: 'Jonathan Nolan',
        rating: 8.8,
        status: 'coming-soon',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        id: 'mov_interstellar_remaster',
        title: 'Interstellar: 15th Anniversary IMAX Edition',
        slug: 'interstellar-remaster',
        description: 'The monumental sci-fi masterpiece returns in pristine 4K 70mm IMAX format with uncompressed Dolby Atmos soundtrack and restored space sequences.',
        posterUrl: '/src/assets/images/movie_quantum_realm_1793124937473.jpg',
        backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        genres: ['Sci-Fi', 'Drama', 'Adventure'],
        languages: ['English'],
        duration: 169,
        releaseDate: '2026-07-10',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        director: 'Christopher Nolan',
        rating: 9.5,
        status: 'now-showing',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    // 3. Theatres & Screens
    const blueprint = this.generateSeatLayoutBlueprint();

    const t1: Theatre = {
      id: 'th_mumbai_inox',
      name: 'IMovies INOX Megaplex & IMAX',
      address: 'Inorbit Mall, Link Road, Malad West',
      city: 'Mumbai',
      facilities: ['4K Laser IMAX', 'Dolby Atmos 7.1', 'Insignia Luxury Recliners', 'Gourmet Cafe', 'Valet Parking'],
      screens: ['scr_mumbai_01', 'scr_mumbai_02'],
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const scr_m1: Screen = {
      id: 'scr_mumbai_01',
      theatreId: t1.id,
      screenName: 'Auditorium 1 — Laser IMAX',
      supportedFormats: ['2D', '3D', 'IMAX'],
      totalSeats: blueprint.length,
      seatLayout: blueprint,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const scr_m2: Screen = {
      id: 'scr_mumbai_02',
      theatreId: t1.id,
      screenName: 'Auditorium 2 — Dolby Atmos Prime',
      supportedFormats: ['2D', '3D'],
      totalSeats: blueprint.length,
      seatLayout: blueprint,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const t2: Theatre = {
      id: 'th_delhi_pvr',
      name: 'IMovies PVR Director\'s Cut',
      address: 'Ambience Mall, Nelson Mandela Marg, Vasant Kunj',
      city: 'Delhi NCR',
      facilities: ['IMAX with Laser', 'Dolby Cinema', 'Chef-Curated Dining', 'Motorized Recliners', 'Private Lounge'],
      screens: ['scr_delhi_01'],
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const scr_d1: Screen = {
      id: 'scr_delhi_01',
      theatreId: t2.id,
      screenName: 'Grand Screen 1 — IMAX Experience',
      supportedFormats: ['2D', '3D', 'IMAX'],
      totalSeats: blueprint.length,
      seatLayout: blueprint,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const t3: Theatre = {
      id: 'th_bengaluru_cinepolis',
      name: 'IMovies Cinepolis Luxe',
      address: 'Forum Shantiniketan, Whitefield Main Road',
      city: 'Bengaluru',
      facilities: ['RealD 3D', 'VIP Recliner Pods', 'Starbucks Cafe Lounge', 'Dolby Atmos Sound', 'Wheelchair Access'],
      screens: ['scr_blr_01'],
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const scr_b1: Screen = {
      id: 'scr_blr_01',
      theatreId: t3.id,
      screenName: 'Screen 1 — 4DX Dynamic Motion',
      supportedFormats: ['2D', '4DX'],
      totalSeats: blueprint.length,
      seatLayout: blueprint,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const t4: Theatre = {
      id: 'th_hyderabad_prasads',
      name: 'IMovies Prasads Multiplex',
      address: 'NTR Gardens, Khairatabad',
      city: 'Hyderabad',
      facilities: ['Giant Screen Dual Laser', 'Dolby Atmos', 'Game Zone', 'Extensive Food Court'],
      screens: ['scr_hyd_01'],
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const scr_h1: Screen = {
      id: 'scr_hyd_01',
      theatreId: t4.id,
      screenName: 'Large Format Audi 1',
      supportedFormats: ['2D', '3D', 'IMAX'],
      totalSeats: blueprint.length,
      seatLayout: blueprint,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    this.data.theatres = [t1, t2, t3, t4];
    this.data.screens = [scr_m1, scr_m2, scr_d1, scr_b1, scr_h1];

    // 4. Generate Shows for Today, Tomorrow, & Next Days
    this.createShowSchedules(blueprint);

    // 5. Seed a couple of initial sample bookings
    this.seedSampleBookings();
  }

  private createShowSchedules(blueprint: ScreenSeatBlueprint[]) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

    const showDefinitions = [
      // Mumbai - Dune
      { movieId: 'mov_dune_odyssey', theatreId: 'th_mumbai_inox', screenId: 'scr_mumbai_01', date: today, start: '13:30', end: '16:15', format: 'IMAX', basePrice: 320 },
      { movieId: 'mov_dune_odyssey', theatreId: 'th_mumbai_inox', screenId: 'scr_mumbai_01', date: today, start: '18:45', end: '21:30', format: 'IMAX', basePrice: 350 },
      { movieId: 'mov_dune_odyssey', theatreId: 'th_mumbai_inox', screenId: 'scr_mumbai_01', date: tomorrow, start: '19:00', end: '21:45', format: 'IMAX', basePrice: 360 },

      // Mumbai - Cyber City
      { movieId: 'mov_cyber_city', theatreId: 'th_mumbai_inox', screenId: 'scr_mumbai_02', date: today, start: '16:00', end: '18:25', format: '2D', basePrice: 280 },
      { movieId: 'mov_cyber_city', theatreId: 'th_mumbai_inox', screenId: 'scr_mumbai_02', date: today, start: '21:15', end: '23:40', format: '2D', basePrice: 300 },

      // Delhi - Dune
      { movieId: 'mov_dune_odyssey', theatreId: 'th_delhi_pvr', screenId: 'scr_delhi_01', date: today, start: '15:15', end: '18:00', format: 'IMAX', basePrice: 340 },
      { movieId: 'mov_dune_odyssey', theatreId: 'th_delhi_pvr', screenId: 'scr_delhi_01', date: today, start: '20:30', end: '23:15', format: 'IMAX', basePrice: 380 },
      { movieId: 'mov_dune_odyssey', theatreId: 'th_delhi_pvr', screenId: 'scr_delhi_01', date: tomorrow, start: '17:30', end: '20:15', format: 'IMAX', basePrice: 350 },

      // Delhi - The Shadow Chronicles
      { movieId: 'mov_shadow_chronicles', theatreId: 'th_delhi_pvr', screenId: 'scr_delhi_01', date: today, start: '11:45', end: '14:25', format: 'IMAX', basePrice: 300 },
      { movieId: 'mov_shadow_chronicles', theatreId: 'th_delhi_pvr', screenId: 'scr_delhi_01', date: tomorrow, start: '21:00', end: '23:40', format: 'IMAX', basePrice: 320 },

      // Bengaluru - Quantum Horizon
      { movieId: 'mov_quantum_horizon', theatreId: 'th_bengaluru_cinepolis', screenId: 'scr_blr_01', date: today, start: '14:00', end: '16:55', format: '4DX', basePrice: 380 },
      { movieId: 'mov_quantum_horizon', theatreId: 'th_bengaluru_cinepolis', screenId: 'scr_blr_01', date: today, start: '19:30', end: '22:25', format: '4DX', basePrice: 420 },
      { movieId: 'mov_quantum_horizon', theatreId: 'th_bengaluru_cinepolis', screenId: 'scr_blr_01', date: tomorrow, start: '18:30', end: '21:25', format: '4DX', basePrice: 400 },

      // Hyderabad - Interstellar & Prometheus
      { movieId: 'mov_interstellar_remaster', theatreId: 'th_hyderabad_prasads', screenId: 'scr_hyd_01', date: today, start: '15:00', end: '17:50', format: 'IMAX', basePrice: 280 },
      { movieId: 'mov_interstellar_remaster', theatreId: 'th_hyderabad_prasads', screenId: 'scr_hyd_01', date: today, start: '20:45', end: '23:35', format: 'IMAX', basePrice: 300 },
      { movieId: 'mov_oppenheimer_legacy', theatreId: 'th_hyderabad_prasads', screenId: 'scr_hyd_01', date: tomorrow, start: '16:30', end: '19:30', format: '2D', basePrice: 260 }
    ];

    this.data.shows = showDefinitions.map((def, idx) => {
      const showSeats: ShowSeat[] = blueprint.map((s) => ({
        seatNumber: s.seatNumber,
        row: s.row,
        col: s.col,
        category: s.category,
        price: Math.round(def.basePrice * s.priceMultiplier),
        status: 'available',
        heldBy: null,
        heldUntil: null,
        bookingReference: null
      }));

      // Simulate some random pre-booked seats for realism
      if (idx % 2 === 0) {
        ['C4', 'C5', 'D4', 'D5', 'G5', 'G6'].forEach((sn) => {
          const seat = showSeats.find((s) => s.seatNumber === sn);
          if (seat) {
            seat.status = 'booked';
            seat.bookingReference = 'IMO-PRE-SEED';
          }
        });
      }

      return {
        id: `shw_${idx + 1}`,
        movieId: def.movieId,
        theatreId: def.theatreId,
        screenId: def.screenId,
        showDate: def.date,
        startTime: def.start,
        endTime: def.end,
        format: def.format,
        basePrice: def.basePrice,
        seats: showSeats,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }

  private refreshShowDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // If all shows are in the past, update dates to today and tomorrow
    if (this.data.shows.length > 0 && this.data.shows[0].showDate < today) {
      this.data.shows.forEach((shw, i) => {
        shw.showDate = i % 2 === 0 ? today : tomorrow;
      });
      this.save();
    }
  }

  private seedSampleBookings() {
    const demoUser = this.data.users.find((u) => u.email === 'john@example.com');
    const firstShow = this.data.shows[0];
    if (!demoUser || !firstShow) return;

    const bookingRef = 'IMO-2026-CONF89';
    const seats = [
      { seatNumber: 'D4', category: 'Gold' as SeatCategory, price: 473 },
      { seatNumber: 'D5', category: 'Gold' as SeatCategory, price: 473 }
    ];
    const subtotal = 946;
    const fee = 47;
    const total = subtotal + fee;

    const booking: Booking = {
      id: 'bkg_sample_01',
      bookingReference: bookingRef,
      userId: demoUser.id,
      showId: firstShow.id,
      seats,
      subtotal,
      convenienceFee: fee,
      totalAmount: total,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    };

    const payment: PaymentRecord = {
      id: 'pay_sample_01',
      bookingId: booking.id,
      bookingReference: bookingRef,
      provider: 'mock_simulator',
      orderId: 'order_mock_sample_seed',
      paymentId: 'pay_mock_verified_01',
      signature: 'mock_sig_valid_seed',
      amount: total,
      currency: 'INR',
      status: 'captured',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    };

    this.data.bookings = [booking];
    this.data.payments = [payment];
  }

  // ===================== ATOMIC SEAT OPERATIONS =====================

  public cleanExpiredHolds(show: Show): boolean {
    const now = new Date().toISOString();
    let mutated = false;
    show.seats.forEach((seat) => {
      if (seat.status === 'held' && seat.heldUntil && seat.heldUntil < now) {
        seat.status = 'available';
        seat.heldBy = null;
        seat.heldUntil = null;
        mutated = true;
      }
    });
    if (mutated) {
      this.save();
    }
    return mutated;
  }

  public holdSeats(showId: string, seatNumbers: string[], userId: string): { success: boolean; message: string; heldUntil?: string; conflictSeats?: string[] } {
    const show = this.data.shows.find((s) => s.id === showId);
    if (!show) {
      return { success: false, message: 'Showtime not found.' };
    }

    this.cleanExpiredHolds(show);

    const now = new Date();
    const conflictSeats: string[] = [];

    // Verify all requested seats exist and are available or currently held by THIS user
    for (const sNum of seatNumbers) {
      const seat = show.seats.find((s) => s.seatNumber === sNum);
      if (!seat) {
        conflictSeats.push(sNum);
        continue;
      }

      if (seat.status === 'booked') {
        conflictSeats.push(sNum);
      } else if (seat.status === 'held') {
        if (seat.heldBy !== userId) {
          conflictSeats.push(sNum);
        }
      }
    }

    if (conflictSeats.length > 0) {
      return {
        success: false,
        message: `Seats [${conflictSeats.join(', ')}] are currently unavailable or reserved by another customer.`,
        conflictSeats
      };
    }

    // Atomically apply 5-minute hold lock
    const holdDurationMs = 5 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + holdDurationMs).toISOString();

    show.seats.forEach((seat) => {
      if (seatNumbers.includes(seat.seatNumber)) {
        seat.status = 'held';
        seat.heldBy = userId;
        seat.heldUntil = expiresAt;
      }
    });

    this.save();

    return {
      success: true,
      message: 'Seats held successfully for 5 minutes.',
      heldUntil: expiresAt
    };
  }

  public releaseSeats(showId: string, seatNumbers: string[], userId?: string): boolean {
    const show = this.data.shows.find((s) => s.id === showId);
    if (!show) return false;

    show.seats.forEach((seat) => {
      if (seatNumbers.includes(seat.seatNumber)) {
        if (!userId || seat.heldBy === userId) {
          if (seat.status === 'held') {
            seat.status = 'available';
            seat.heldBy = null;
            seat.heldUntil = null;
          }
        }
      }
    });

    this.save();
    return true;
  }

  public createBookingOrder(userId: string, showId: string, seatNumbers: string[]): {
    success: boolean;
    message?: string;
    booking?: Booking;
    paymentOrder?: { provider: string; orderId: string; amount: number; keyId: string };
  } {
    const show = this.data.shows.find((s) => s.id === showId);
    if (!show) {
      return { success: false, message: 'Show not found.' };
    }

    this.cleanExpiredHolds(show);

    const now = new Date().toISOString();
    const matchedSeats: ShowSeat[] = [];

    for (const num of seatNumbers) {
      const seat = show.seats.find((s) => s.seatNumber === num);
      if (!seat) {
        return { success: false, message: `Seat ${num} does not exist.` };
      }

      const isUserHeld = seat.status === 'held' && seat.heldBy === userId && (seat.heldUntil || '') > now;
      if (!isUserHeld) {
        return {
          success: false,
          message: `Seat ${num} hold has expired or belongs to another reservation. Please reselect.`
        };
      }
      matchedSeats.push(seat);
    }

    const subtotal = matchedSeats.reduce((sum, s) => sum + s.price, 0);
    const convenienceFee = Math.round(subtotal * 0.05); // 5% fee
    const totalAmount = subtotal + convenienceFee;

    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bookingReference = `IMO-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

    const newBooking: Booking = {
      id: `bkg_${Date.now()}_${randSuffix}`,
      bookingReference,
      userId,
      showId,
      seats: matchedSeats.map((s) => ({
        seatNumber: s.seatNumber,
        category: s.category,
        price: s.price
      })),
      subtotal,
      convenienceFee,
      totalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockOrderId = `order_sim_${Date.now()}_${randSuffix}`;

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${randSuffix}`,
      bookingId: newBooking.id,
      bookingReference,
      provider: 'mock_simulator',
      orderId: mockOrderId,
      amount: totalAmount,
      currency: 'INR',
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.bookings.push(newBooking);
    this.data.payments.push(paymentRecord);
    this.save();

    return {
      success: true,
      booking: newBooking,
      paymentOrder: {
        provider: 'mock_simulator',
        orderId: mockOrderId,
        amount: totalAmount,
        keyId: 'rzp_test_imovies_demo'
      }
    };
  }

  public verifyPayment(
    bookingReference: string,
    orderId: string,
    paymentId: string,
    signature: string,
    isMock: boolean = true
  ): { success: boolean; message: string; booking?: Booking } {
    const booking = this.data.bookings.find((b) => b.bookingReference === bookingReference);
    if (!booking) {
      return { success: false, message: 'Booking reference not found.' };
    }

    const payment = this.data.payments.find((p) => p.bookingReference === bookingReference && p.orderId === orderId);
    if (!payment) {
      return { success: false, message: 'Payment record not found for this order.' };
    }

    // In simulated test mode, verify mock signature token
    const isValid = isMock
      ? signature && (signature.startsWith('mock_sig_') || signature.length > 5)
      : true;

    if (!isValid) {
      payment.status = 'failed';
      booking.paymentStatus = 'failed';
      this.save();

      // Release seats on failure
      const show = this.data.shows.find((s) => s.id === booking.showId);
      if (show) {
        this.releaseSeats(show.id, booking.seats.map((s) => s.seatNumber));
      }

      return { success: false, message: 'Payment verification failed.' };
    }

    // Successful payment commit
    payment.paymentId = paymentId || `pay_verified_${Date.now()}`;
    payment.signature = signature;
    payment.status = 'captured';
    payment.updatedAt = new Date().toISOString();

    booking.bookingStatus = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.updatedAt = new Date().toISOString();

    // Permanently commit show seats to booked
    const show = this.data.shows.find((s) => s.id === booking.showId);
    if (show) {
      const bookedNumbers = booking.seats.map((s) => s.seatNumber);
      show.seats.forEach((s) => {
        if (bookedNumbers.includes(s.seatNumber)) {
          s.status = 'booked';
          s.heldBy = null;
          s.heldUntil = null;
          s.bookingReference = bookingReference;
        }
      });
    }

    this.save();

    return {
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking
    };
  }

  public cancelBooking(
    bookingReference: string,
    userId: string,
    userRole: string,
    reason?: string
  ): { success: boolean; message: string } {
    const booking = this.data.bookings.find((b) => b.bookingReference === bookingReference);
    if (!booking) {
      return { success: false, message: 'Booking not found.' };
    }

    if (booking.userId !== userId && userRole !== 'admin') {
      return { success: false, message: 'Unauthorized access to booking.' };
    }

    if (booking.bookingStatus === 'cancelled') {
      return { success: false, message: 'Booking is already cancelled.' };
    }

    // Release seats back to available
    const show = this.data.shows.find((s) => s.id === booking.showId);
    if (show) {
      const seatNums = booking.seats.map((s) => s.seatNumber);
      show.seats.forEach((s) => {
        if (seatNums.includes(s.seatNumber)) {
          s.status = 'available';
          s.heldBy = null;
          s.heldUntil = null;
          s.bookingReference = null;
        }
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by customer';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    booking.updatedAt = new Date().toISOString();

    // Update payment record
    const payment = this.data.payments.find((p) => p.bookingReference === bookingReference);
    if (payment) {
      payment.status = 'refunded';
      payment.updatedAt = new Date().toISOString();
    }

    this.save();
    return { success: true, message: 'Booking successfully cancelled and refund initiated.' };
  }

  // ===================== QUERY & MANAGEMENT API =====================

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public getMovies(filters?: {
    search?: string;
    genre?: string;
    language?: string;
    status?: string;
    sort?: string;
  }): Movie[] {
    let list = [...this.data.movies];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q) ||
          m.cast.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (filters?.genre && filters.genre !== 'All') {
      list = list.filter((m) => m.genres.includes(filters.genre!));
    }

    if (filters?.language && filters.language !== 'All') {
      list = list.filter((m) => m.languages.includes(filters.language!));
    }

    if (filters?.status) {
      list = list.filter((m) => m.status === filters.status);
    }

    if (filters?.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters?.sort === 'popularity') {
      list.sort((a, b) => b.rating - a.rating || new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    } else if (filters?.sort === 'newest') {
      list.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }

    return list;
  }

  public getMovieById(id: string): Movie | undefined {
    return this.data.movies.find((m) => m.id === id || m.slug === id);
  }

  public createMovie(movie: Movie): Movie {
    this.data.movies.unshift(movie);
    this.save();
    return movie;
  }

  public updateMovie(id: string, updates: Partial<Movie>): Movie | undefined {
    const movie = this.data.movies.find((m) => m.id === id);
    if (!movie) return undefined;
    Object.assign(movie, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return movie;
  }

  public deleteMovie(id: string): boolean {
    const idx = this.data.movies.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.data.movies.splice(idx, 1);
    this.save();
    return true;
  }

  public getTheatres(city?: string): Theatre[] {
    if (city && city !== 'All') {
      return this.data.theatres.filter((t) => t.city.toLowerCase() === city.toLowerCase());
    }
    return this.data.theatres;
  }

  public getTheatreById(id: string): Theatre | undefined {
    return this.data.theatres.find((t) => t.id === id);
  }

  public getScreenById(id: string): Screen | undefined {
    return this.data.screens.find((s) => s.id === id);
  }

  public getScreensForTheatre(theatreId: string): Screen[] {
    return this.data.screens.filter((s) => s.theatreId === theatreId);
  }

  public getShows(filters?: { movieId?: string; theatreId?: string; date?: string }): Array<
    Show & {
      movie?: Movie;
      theatre?: Theatre;
      screen?: Screen;
    }
  > {
    let list = [...this.data.shows];

    if (filters?.movieId) {
      list = list.filter((s) => s.movieId === filters.movieId);
    }
    if (filters?.theatreId) {
      list = list.filter((s) => s.theatreId === filters.theatreId);
    }
    if (filters?.date) {
      list = list.filter((s) => s.showDate === filters.date);
    }

    return list.map((show) => ({
      ...show,
      movie: this.data.movies.find((m) => m.id === show.movieId),
      theatre: this.data.theatres.find((t) => t.id === show.theatreId),
      screen: this.data.screens.find((sc) => sc.id === show.screenId)
    }));
  }

  public getShowById(id: string): (Show & { movie?: Movie; theatre?: Theatre; screen?: Screen }) | undefined {
    const show = this.data.shows.find((s) => s.id === id);
    if (!show) return undefined;

    this.cleanExpiredHolds(show);

    return {
      ...show,
      movie: this.data.movies.find((m) => m.id === show.movieId),
      theatre: this.data.theatres.find((t) => t.id === show.theatreId),
      screen: this.data.screens.find((sc) => sc.id === show.screenId)
    };
  }

  public createShow(showData: {
    movieId: string;
    theatreId: string;
    screenId: string;
    showDate: string;
    startTime: string;
    endTime: string;
    format: string;
    basePrice: number;
  }): Show | null {
    const screen = this.data.screens.find((s) => s.id === showData.screenId);
    if (!screen) return null;

    const seats: ShowSeat[] = screen.seatLayout.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      category: s.category,
      price: Math.round(showData.basePrice * s.priceMultiplier),
      status: 'available',
      heldBy: null,
      heldUntil: null,
      bookingReference: null
    }));

    const newShow: Show = {
      id: `shw_${Date.now()}`,
      ...showData,
      seats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.shows.push(newShow);
    this.save();
    return newShow;
  }

  public deleteShow(id: string): boolean {
    const idx = this.data.shows.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.shows.splice(idx, 1);
    this.save();
    return true;
  }

  public getUserBookings(userId: string): Array<Booking & { show?: Show & { movie?: Movie; theatre?: Theatre } }> {
    return this.data.bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((b) => {
        const rawShow = this.data.shows.find((s) => s.id === b.showId);
        const enrichedShow = rawShow
          ? {
              ...rawShow,
              movie: this.data.movies.find((m) => m.id === rawShow.movieId),
              theatre: this.data.theatres.find((t) => t.id === rawShow.theatreId)
            }
          : undefined;

        return {
          ...b,
          show: enrichedShow
        };
      });
  }

  public getBookingByReference(
    ref: string
  ): (Booking & { show?: Show & { movie?: Movie; theatre?: Theatre; screen?: Screen }; user?: Omit<User, 'passwordHash'> }) | undefined {
    const booking = this.data.bookings.find((b) => b.bookingReference === ref);
    if (!booking) return undefined;

    const rawShow = this.data.shows.find((s) => s.id === booking.showId);
    const enrichedShow = rawShow
      ? {
          ...rawShow,
          movie: this.data.movies.find((m) => m.id === rawShow.movieId),
          theatre: this.data.theatres.find((t) => t.id === rawShow.theatreId),
          screen: this.data.screens.find((sc) => sc.id === rawShow.screenId)
        }
      : undefined;

    const rawUser = this.data.users.find((u) => u.id === booking.userId);
    const userSafe = rawUser
      ? {
          id: rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role,
          phone: rawUser.phone,
          createdAt: rawUser.createdAt,
          updatedAt: rawUser.updatedAt
        }
      : undefined;

    return {
      ...booking,
      show: enrichedShow,
      user: userSafe
    };
  }

  public getAllBookings(): Array<
    Booking & {
      user?: Omit<User, 'passwordHash'>;
      show?: Show & { movie?: Movie; theatre?: Theatre };
    }
  > {
    return this.data.bookings
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((b) => {
        const rawShow = this.data.shows.find((s) => s.id === b.showId);
        const enrichedShow = rawShow
          ? {
              ...rawShow,
              movie: this.data.movies.find((m) => m.id === rawShow.movieId),
              theatre: this.data.theatres.find((t) => t.id === rawShow.theatreId)
            }
          : undefined;

        const rawUser = this.data.users.find((u) => u.id === b.userId);
        const userSafe = rawUser
          ? {
              id: rawUser.id,
              name: rawUser.name,
              email: rawUser.email,
              role: rawUser.role,
              phone: rawUser.phone,
              createdAt: rawUser.createdAt,
              updatedAt: rawUser.updatedAt
            }
          : undefined;

        return {
          ...b,
          user: userSafe,
          show: enrichedShow
        };
      });
  }

  public getDashboardStats() {
    const totalMovies = this.data.movies.length;
    const totalTheatres = this.data.theatres.length;
    const totalShows = this.data.shows.length;
    const totalUsers = this.data.users.length;

    const confirmedBookings = this.data.bookings.filter((b) => b.bookingStatus === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const recentBookings = this.getAllBookings().slice(0, 8);

    // Calculate overall seat occupancy percentage across active shows
    let totalSeats = 0;
    let bookedSeats = 0;
    this.data.shows.forEach((shw) => {
      totalSeats += shw.seats.length;
      bookedSeats += shw.seats.filter((s) => s.status === 'booked').length;
    });
    const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return {
      totalMovies,
      totalTheatres,
      totalShows,
      totalUsers,
      totalBookings: confirmedBookings.length,
      totalRevenue,
      occupancyRate,
      recentBookings
    };
  }

  public resetDemoData() {
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch (e) {}
    }
    this.seedInitialData();
    this.save();
    return true;
  }
}

export const db = new DatabaseService();
