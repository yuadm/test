# Daryel - Annual Leave Management System

A Next.js application for managing employee annual leave, integrated with Supabase for authentication and data storage.

## Features

- **User Authentication**: Secure login system with role-based access control
- **Dashboard**: Overview of leave statistics and branch summaries
- **Leave Management**: Request, approve, and track leave applications
- **Employee Management**: Add, edit, and manage employee records with live search functionality
- **Branch Management**: Organize employees by branches with filtering capabilities
- **Real-time Search**: Filter employees as you type with immediate results
- **Calendar View**: Visualize leave schedules in a calendar format
- **Reporting**: Generate reports on leave usage

## Tech Stack

- **Frontend**: Next.js 15.2.4 with TypeScript
- **UI Framework**: Tailwind CSS
- **Authentication & Database**: Supabase
- **Deployment**: Vercel

## Environment Setup

1. Clone the repository
2. Copy `env.example` to `.env.local` and update with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

The application is configured for deployment on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

Make sure to set the environment variables in your Vercel project settings.

## Security Notes

- The application uses environment variables for sensitive information
- For local development, fallback values are provided but should be replaced with your own credentials
- Never commit `.env.local` files to version control
