# AttendifyX Vercel Deployment Guide

Complete guide to deploy your converted attendance system to Vercel.

## Prerequisites

1. **Vercel Account** - Create at [vercel.com](https://vercel.com)
2. **Supabase Account** - Create at [supabase.com](https://supabase.com)
3. **Node.js** - Install [Node.js 18+](https://nodejs.org/)
4. **Git** - Install [Git](https://git-scm.com/)

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `attendifyx`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 1.2 Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click "New Query"
4. Copy the entire content from `supabase/schema.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute the schema

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...` - keep this secret!)

### 1.4 Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings if needed

## Step 2: Set Up Local Environment

### 2.1 Install Dependencies

```bash
cd attendifyx-vercel
npm install
```

### 2.2 Create Environment File

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

### 2.3 Configure Environment Variables

Edit `.env.local` and fill in your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# QR Code Security Secret (generate a random string)
QR_SECRET_KEY=your_random_secret_key_change_in_production

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Never commit `.env.local` to Git
- Use a strong QR_SECRET_KEY (generate with: `openssl rand -base64 32`)

## Step 3: Test Locally

### 3.1 Start Development Server

```bash
npm run dev
```

### 3.2 Test the Application

1. Open `http://localhost:3000`
2. Test student signup:
   - Click "Create Account"
   - Select "Student"
   - Fill in details
   - Submit
3. Test teacher signup:
   - Create another account as "Teacher"
4. Test login with both accounts
5. Test session creation (teacher dashboard)
6. Test QR code scanning (student dashboard)

## Step 4: Deploy to Vercel

### 4.1 Initialize Git Repository

```bash
cd attendifyx-vercel
git init
git add .
git commit -m "Initial commit"
```

### 4.2 Push to GitHub

1. Create a new repository on GitHub
2. Add remote and push:

```bash
git remote add origin https://github.com/your-username/attendifyx-vercel.git
git branch -M main
git push -u origin main
```

### 4.3 Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   QR_SECRET_KEY=your_random_secret_key_here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
6. Click **"Deploy"**
7. Wait for deployment to complete (2-3 minutes)

### 4.4 Alternative: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

## Step 5: Post-Deployment Setup

### 5.1 Test Production URL

1. Open your deployed URL (e.g., `https://attendifyx.vercel.app`)
2. Test all features:
   - Login/Signup
   - Session creation
   - QR code generation
   - QR code scanning
   - Attendance marking
   - Feedback system
   - Notifications

### 5.2 Configure Custom Domain (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables

### 5.3 Set Up Row Level Security (RLS)

Your schema already includes RLS policies. Verify they're working:

1. Go to Supabase → **Authentication** → **Policies**
2. Review policies for each table
3. Test that users can only access their own data

## Step 6: Monitor and Maintain

### 6.1 Check Vercel Logs

1. Go to Vercel project → **Logs**
2. Monitor for errors
3. Set up alerts if needed

### 6.2 Monitor Supabase

1. Go to Supabase dashboard
2. Check **Database** → **Logs** for database errors
3. Monitor **API** usage
4. Check **Authentication** → **Users** for user activity

### 6.3 Backup Strategy

Supabase automatically backs up your database. For additional safety:

1. Go to **Database** → **Backups**
2. Review backup schedule
3. Consider manual backups before major changes

## Troubleshooting

### Issue: Build fails on Vercel

**Solution:**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Issue: Supabase connection errors

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project status (is it paused?)
- Ensure RLS policies allow access

### Issue: QR codes not working

**Solution:**
- Verify `QR_SECRET_KEY` matches between local and production
- Check browser console for errors
- Ensure `html5-qrcode` library is loading

### Issue: Offline sync not working

**Solution:**
- Check browser supports IndexedDB
- Verify service worker is registered
- Check browser console for IndexedDB errors

### Issue: Authentication not working

**Solution:**
- Verify Supabase Auth is enabled
- Check email provider settings
- Review RLS policies on `profiles` table

## Security Checklist

- [ ] QR_SECRET_KEY is strong and unique
- [ ] SUPABASE_SERVICE_ROLE_KEY is never exposed in client code
- [ ] RLS policies are properly configured
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Environment variables are not committed to Git
- [ ] Regular backups are enabled
- [ ] Monitoring is set up

## Performance Optimization

### Enable Caching

Vercel automatically caches static assets. For additional optimization:

```javascript
// In next.config.js
module.exports = {
  // ... existing config
  compress: true,
  swcMinify: true,
}
```

### Database Indexes

Your schema already includes indexes. Monitor query performance and add more if needed.

## Scaling Considerations

### For High Traffic

1. **Vercel**: Automatically scales with serverless functions
2. **Supabase**: Consider upgrading to Pro plan for higher limits
3. **Database**: Add read replicas if needed

### For Many Users

1. Implement pagination in API routes
2. Add rate limiting
3. Consider caching frequently accessed data

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## Summary

Your AttendifyX system is now:
- ✅ Converted from PHP/MySQL to Node.js/Supabase
- ✅ Deployed to Vercel
- ✅ Using Supabase Auth for authentication
- ✅ Using DATA-based QR codes (offline-capable)
- ✅ Supporting offline functionality with IndexedDB
- ✅ Auto-syncing when online
- ✅ Secure with QR code signing and RLS

The system is production-ready and can handle real-world usage!
