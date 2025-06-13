# FormSync - Collaborative Form Builder

A real-time collaborative form filling system built with Next.js, Socket.io, and PostgreSQL. Create forms and collaborate on filling them in real-time, similar to Google Docs but for structured forms.

## Features

- **Real-time Collaboration**: Multiple users can fill forms simultaneously with live updates
- **Form Builder**: Drag-and-drop interface for creating custom forms
- **User Authentication**: Secure login and session management
- **PostgreSQL Database**: Robust data storage with Knex.js ORM
- **TypeScript**: Full type safety across the application
- **Socket.io**: Real-time bidirectional communication
- **shadcn/ui**: Modern, accessible UI components

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Socket.io, Custom TypeScript server
- **Database**: PostgreSQL with Knex.js migrations
- **Real-time**: Socket.io with room-based architecture

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use Docker)
- Yarn package manager

### Option 1: Local Development with Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd form-sync
   yarn install
   ```

2. **Start with Docker**:
   ```bash
   docker-compose up
   ```
   
   This will:
   - Start PostgreSQL database
   - Run database migrations and seeds
   - Start the application on http://localhost:3000

### Option 2: Local Development with Local PostgreSQL

1. **Setup database**:
   ```bash
   # Create PostgreSQL database named 'formsync'
   createdb formsync
   
   # Or update DATABASE_URL in .env.development
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Run database migrations**:
   ```bash
   yarn db:migrate
   yarn db:seed
   ```

4. **Start development server**:
   ```bash
   yarn dev
   ```

5. **Open application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.development` for local development:

```env
DATABASE_URL=postgresql://formsync:formsync_password@localhost:5432/formsync
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Available Scripts

```bash
# Development
yarn dev              # Start development server with TypeScript
yarn build            # Build for production
yarn start            # Start production server

# Database
yarn db:migrate       # Run database migrations
yarn db:rollback      # Rollback last migration
yarn db:seed          # Run database seeds
yarn db:make-migration <name>  # Create new migration
yarn db:make-seed <name>       # Create new seed

# Utilities
yarn lint             # Run ESLint
```

## Database Schema

- **users**: User accounts and authentication
- **forms**: Form definitions and metadata
- **form_fields**: Individual form field configurations
- **form_responses**: Response instances for forms
- **field_values**: Individual field values with collaboration tracking

## Architecture

### Real-time Collaboration
- Socket.io rooms (one per form)
- Field-level updates to minimize conflicts
- Optimistic updates with server synchronization
- User presence indicators

### API Routes
- `GET/POST /api/forms` - Form CRUD operations
- `GET/POST /api/auth` - Authentication endpoints
- Socket.io events for real-time updates

### Project Structure
```
├── app/                    # Next.js App Router pages
├── components/ui/          # shadcn/ui components
├── components/forms/       # Custom form components
├── lib/
│   ├── db.ts              # Knex database configuration
│   ├── socket.ts          # Socket.io client setup
│   └── auth.ts            # Authentication utilities
├── migrations/            # Database migrations
├── seeds/                 # Database seeds
├── types/                 # TypeScript type definitions
└── server.ts              # Custom Socket.io server
```

## Development Workflow

1. **Create migrations**: `yarn db:make-migration add_new_feature`
2. **Run migrations**: `yarn db:migrate` 
3. **Add API routes**: Create in `app/api/`
4. **Build UI components**: Use shadcn/ui patterns
5. **Add real-time features**: Extend Socket.io events
6. **Test**: Access http://localhost:3000

## Production Deployment

### Docker Deployment (Recommended)
```bash
# Build and start production containers
docker-compose up --build

# Or for detached mode
docker-compose up -d --build
```

### Manual Deployment
1. Build the application: `yarn build`
2. Set production environment variables
3. Run migrations: `yarn db:migrate`
4. Start server: `yarn start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test locally with `yarn dev`
5. Submit a pull request

## License

[Add your license here]