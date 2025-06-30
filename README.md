# FormSync

A collaborative form filling system where multiple users can work together to fill forms in real-time. Think Google Docs for structured forms.

## Features

- Real-time collaborative form editing
- Form builder with dynamic field types (text, email, select, checkbox, radio, etc.)
- User authentication and role-based access
- Shareable form links with unique codes
- Live user presence indicators
- Conflict-free field updates

## Tech Stack

**Frontend:**
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- Socket.io-client for real-time updates
- React Hook Form + Zod validation

**Backend:**
- Next.js API Routes
- Custom Socket.io server
- PostgreSQL database
- Knex.js for migrations and queries
- JWT authentication

**Infrastructure:**
- Docker & Docker Compose
- Node.js 20+

## Quick Start

### With Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/undestined/form-sync.git
cd form-sync

# Install dependencies
yarn install

# Start with Docker
docker-compose up
```

Access the application at http://localhost:3000

### Local Development

**Prerequisites:**
- Node.js 20+
- PostgreSQL
- Yarn

```bash
# Install dependencies
yarn install

# Set up database
createdb formsync

# Run migrations and seeds
yarn db:migrate
yarn db:seed

# Start development server
yarn dev
```

## Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://formsync:formsync_password@localhost:5432/formsync

NEXT_PUBLIC_SITE_URL=http://localhost:3000

# seed admin and a test user
ADMIN_EMAIL=admin@formsync.com
ADMIN_PASSWORD="#FormSync@2025"
TEST_USER_EMAIL="user@formsync.com"
TEST_USER_PASSWORD="#FormSyncUser@2025"
```

## Database Commands

```bash
yarn db:migrate              # Run pending migrations
yarn db:rollback             # Rollback last migration
yarn db:seed                 # Populate with sample data
yarn db:make-migration <name> # Create new migration
```

## Development Scripts

```bash
yarn dev       # Start development server
yarn build     # Build for production
yarn start     # Start production server
yarn lint      # Run ESLint
```

## Database Schema

- `users` - User accounts and authentication
- `forms` - Form definitions and metadata  
- `form_fields` - Individual field configurations
- `form_responses` - Form response instances
- `field_values` - Collaborative field values with user tracking

## Architecture

**Real-time Collaboration:**
- Socket.io rooms (one per form)
- Field-level updates to prevent conflicts
- Optimistic updates with server sync
- Last-write-wins conflict resolution

**API Structure:**
- `GET/POST /api/forms` - Form CRUD
- `GET /api/forms/share/[code]` - Access shared forms
- `POST /api/forms/[id]/responses` - Create responses
- `POST /api/forms/[id]/responses/[responseId]/submit` - Submit values
- `GET/POST /api/auth/*` - Authentication

## Project Structure

```
├── app/                    # Next.js pages and API routes
├── components/             # React components
│   ├── forms/             # Form-specific components
│   └── ui/                # shadcn/ui components
├── lib/                   # Shared utilities
│   ├── db.ts             # Database configuration
│   ├── socket-context.tsx # Socket.io client
│   └── validations/      # Zod schemas
├── migrations/           # Database migrations
├── seeds/               # Database seeds
├── types/               # TypeScript definitions
└── server.ts           # Custom Socket.io server
```

## Deployment

### Docker Production

```bash
docker-compose up -d --build
```

### Manual Deployment

1. Build the application: `yarn build`
2. Set production environment variables
3. Run migrations: `yarn db:migrate`
4. Start: `yarn start`

## Usage

1. Register/login as admin
2. Create forms with custom fields
3. Share form codes with users
4. Users join and collaboratively fill forms
5. See real-time updates from all collaborators
