# Pictet Analytics Admin UI

A modern admin interface for managing teams, rooms, juries, sessions, and room sessions. Built with Vite, React, and TypeScript.

## Features

- 📊 **Complete CRUD Operations** for:
  - Teams
  - Rooms
  - Juries
  - Sessions
  - Room Sessions
- 🎨 **Clean UI** with sidebar navigation and topbar
- 🔔 **Toast Notifications** for user feedback
- ⚡ **Fast** - powered by Vite
- 🔒 **Type-safe** - TypeScript throughout
- 🎯 **Auto-generated API Client** from OpenAPI spec

## Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:8080)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
VITE_API_URL=http://localhost:8080
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── api/                    # Auto-generated API client
│   ├── core/              # API core configuration
│   ├── models/            # TypeScript types
│   └── services/          # API service methods
├── components/
│   ├── layout/            # Layout components (sidebar, topbar)
│   └── shared/            # Reusable components (tables, modals, etc.)
├── pages/                 # Page components for each entity
│   ├── teams/
│   ├── rooms/
│   ├── juries/
│   ├── sessions/
│   └── roomSessions/
├── apiConfig.ts           # API client configuration
├── App.tsx                # Main app with routing
└── main.tsx               # App entry point
```

## API Integration

The application uses an auto-generated API client based on the OpenAPI specification (`openapi.yaml`). To regenerate the client after API changes:

```bash
npx openapi-typescript-codegen --input openapi.yaml --output src/api --client axios
```

## Usage Guide

### Managing Entities

1. **Teams**: Create and manage teams that participate in sessions
2. **Rooms**: Define rooms with capacity for hosting sessions
3. **Juries**: Add jury members with names and emails
4. **Sessions**: Schedule sessions between teams and juries with start/end times
5. **Room Sessions**: Assign rooms to specific sessions

### CRUD Operations

Each entity page provides:
- **List View**: Table with all records
- **Create**: Click "+ Create [Entity]" button
- **Edit**: Click "Edit" button on any row
- **Delete**: Click "Delete" button with confirmation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080` |

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **API Code Generation**: openapi-typescript-codegen

## Development

### Adding New Features

1. Generated API types are in `src/api/models/`
2. Generated API services are in `src/api/services/`
3. Create new pages in `src/pages/`
4. Add routes in `src/App.tsx`

### Styling

The application uses plain CSS with a clean, modern design. Shared styles are in:
- `src/index.css` - Global styles
- `src/components/layout/Layout.css` - Layout styles
- `src/pages/teams/Teams.css` - Form and page styles (reused across pages)

## License

MIT

