# AttendifyX - Cloud-Based Attendance System

A modern, offline-capable attendance tracking system built with Next.js and Supabase.

## Features

- ✅ **Multi-Role Authentication** - Student, Teacher, and Admin roles
- ✅ **QR-Based Attendance** - DATA-based QR codes (no URLs required)
- ✅ **Offline Support** - Works without internet, syncs when online
- ✅ **Real-Time Updates** - Live attendance tracking
- ✅ **Feedback System** - Students can justify absences
- ✅ **Notifications** - Instant alerts for updates
- ✅ **Secure** - QR code signing, Row Level Security (RLS)
- ✅ **Responsive** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (React)
- **Backend**: Vercel API Routes (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Offline Storage**: IndexedDB
- **QR Codes**: qrcode.js + html5-qrcode
- **Deployment**: Vercel

## Architecture

```
attendifyx-vercel/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── sessions/     # Session management
│   │   ├── attendance/   # Attendance tracking
│   │   ├── feedback/     # Feedback system
│   │   ├── notifications/# Notifications
│   │   └── profile/      # User profile
│   ├── student/          # Student dashboard
│   ├── teacher/          # Teacher dashboard
│   ├── page.jsx          # Login page
│   └── signup/page.jsx   # Signup page
├── components/            # React components
│   ├── QRScanner.jsx     # Camera-based QR scanner
│   ├── QRGenerator.jsx   # QR code generator
│   ├── OfflineIndicator.jsx
│   └── SyncButton.jsx
├── lib/                   # Utility libraries
│   ├── supabase.js       # Supabase client
│   ├── qr-utils.js       # QR code utilities
│   └── offline-storage.js # IndexedDB management
├── supabase/
│   └── schema.sql        # Database schema
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.local.example    # Environment variables template
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/attendifyx-vercel.git
cd attendifyx-vercel
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
QR_SECRET_KEY=your_random_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**
- Go to Supabase SQL Editor
- Run the schema from `supabase/schema.sql`

5. **Start development server**
```bash
npm run dev
```

6. **Open browser**
Navigate to `http://localhost:3000`

## Usage

### For Students

1. **Sign Up**: Create account with student ID
2. **Scan QR**: Use camera to scan teacher's QR code
3. **View Attendance**: Check attendance history
4. **Submit Feedback**: Justify absences
5. **View Notifications**: Get updates from teachers

### For Teachers

1. **Sign Up**: Create account with employee ID
2. **Create Session**: Generate QR code for attendance
3. **Monitor Attendance**: View real-time check-ins
4. **Review Feedback**: Validate or reject excuses
5. **Manage Sessions**: Close/delete sessions

## QR Code System

### DATA-Based QR Codes

Unlike traditional URL-based QR codes, AttendifyX uses DATA-based QR codes:

```json
{
  "data": {
    "type": "attendance",
    "session_id": "uuid",
    "session_code": "ABC123",
    "subject": "Mathematics",
    "teacher_name": "John Doe",
    "session_date": "2024-01-15",
    "start_time": "09:00"
  },
  "signature": "hmac_sha256_signature",
  "timestamp": 1705296000000
}
```

### Benefits

- ✅ **Works Offline** - No internet required to scan
- ✅ **Secure** - HMAC signature prevents fake QRs
- ✅ **Fast** - No network calls during scanning
- ✅ **Reliable** - Data stored locally, synced later

### Security

- QR codes are signed with HMAC-SHA256
- Signature prevents tampering
- Timestamp prevents replay attacks (24-hour expiry)

## Offline Functionality

### How It Works

1. **Online Mode**: Data saved directly to Supabase
2. **Offline Mode**: Data saved to IndexedDB
3. **Auto-Sync**: When internet restored, data syncs automatically

### Offline Storage

```javascript
// Attendance stored locally
{
  id: "uuid",
  session_id: "session-uuid",
  student_id: "student-uuid",
  method: "qr",
  scanned_at: "2024-01-15T09:05:00Z",
  synced: false
}
```

### Sync Queue

Pending operations are queued and synced when online:
- Attendance records
- Session updates
- Feedback submissions

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/list` - List sessions
- `GET /api/sessions/[id]` - Get session details
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `POST /api/attendance/sync` - Sync offline data
- `GET /api/attendance/list` - List attendance records

### Feedback
- `POST /api/feedback/submit` - Submit feedback
- `POST /api/feedback/reply` - Reply to feedback
- `GET /api/feedback/list` - List feedbacks

### Notifications
- `GET /api/notifications/list` - List notifications
- `PATCH /api/notifications/list` - Mark as read

### Profile
- `PATCH /api/profile/update` - Update profile

## Database Schema

### Tables

- **profiles** - User profiles (extends auth.users)
- **sessions** - Attendance sessions
- **attendance** - Attendance records
- **feedbacks** - Absence justifications
- **notifications** - User notifications
- **sync_log** - Sync operation logs

### Relationships

- sessions → profiles (teacher_id)
- attendance → sessions, profiles
- feedbacks → sessions, profiles (student & teacher)
- notifications → profiles

## Security

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only access their own data
- Teachers can view their sessions and student attendance
- Students can only view their own attendance

### Authentication

- Supabase Auth handles user authentication
- JWT tokens for API access
- Secure session management

### QR Code Security

- HMAC-SHA256 signing
- Timestamp-based expiry
- Signature verification on scan

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `QR_SECRET_KEY` | QR signing secret | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Required features:
- IndexedDB
- Service Workers
- Camera API (for QR scanning)
- Web Crypto API

## Troubleshooting

### QR Scanner Not Working

- Ensure HTTPS (required for camera access)
- Check browser permissions
- Verify `html5-qrcode` library is loaded

### Offline Sync Issues

- Check browser supports IndexedDB
- Verify service worker is registered
- Check browser console for errors

### Authentication Errors

- Verify Supabase credentials
- Check RLS policies
- Ensure email provider is enabled

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues
- Email: support@attendifyx.com

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Vercel](https://vercel.com/)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- [qrcode.js](https://github.com/davidshimjs/qrcodejs)

---

Built with ❤️ for modern educational institutions
