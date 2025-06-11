# SPAM Counter App

A simple application to track spam clicks with user statistics, achievements, and leaderboards.

## Database Migration: SQLite to Supabase

This project has been migrated from SQLite to Supabase for better scalability and cloud-based storage.

### Database Initialization

The application includes a smart initialization system that:

- Checks if the database is already initialized before creating tables
- Automatically creates tables and initial data if they don't exist
- Uses Supabase's API directly to create tables instead of SQL scripts
- Provides graceful error handling if the database isn't properly initialized
- Continues to function even if the database initialization is incomplete

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 2. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

### 3. Supabase Database Setup

The database initialization now uses direct Supabase API calls instead of SQL functions, making it more compatible with Supabase's permissions system.

Initialize the database using the provided script:

```bash
npm run db:init
```

This script will:

1. Check if the database is already initialized
2. Create all necessary tables if they don't exist
3. Set up initial data for achievements and global stats
4. Provide detailed logs of the initialization process

The script is designed to be run once before starting the application. It will not overwrite existing data if the database is already initialized.

Alternatively, you can manually set up the database through the Supabase dashboard by creating the following tables:

- `spam_clicks`: Records each spam click with user_id
- `user_stats`: Tracks user statistics like total clicks and streaks
- `global_stats`: Tracks global statistics
- `achievements`: Defines available achievements
- `user_achievements`: Tracks which users have earned which achievements

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The application uses the following tables:

- `spam_clicks`: Records each spam click with user_id
- `user_stats`: Tracks user statistics like total clicks and streaks
- `global_stats`: Tracks global statistics
- `achievements`: Defines available achievements
- `user_achievements`: Tracks which users have earned which achievements

## API Routes

- `/api/updateSpamCount`: Records spam clicks for a user
- `/api/getUserStats`: Gets user statistics, achievements, global stats, and leaderboard position
