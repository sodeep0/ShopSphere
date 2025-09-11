# Overview

Krisha Krafts is a Nepal-focused e-commerce platform specializing in authentic handcrafted items like felt crafts, prayer wheels, statues, and handlooms. The application follows a full-stack architecture using React for the frontend and Express/Node.js for the backend, with a PostgreSQL database for data persistence. The platform is designed specifically for Cash on Delivery (COD) transactions within Nepal, emphasizing simplicity for solo development and maintenance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application uses React with TypeScript, built with Vite for fast development and optimized production builds. The UI framework leverages shadcn/ui components with Radix UI primitives for accessibility, styled with Tailwind CSS using a custom theme with Nepal-inspired colors. State management is handled through React Context (CartProvider) and TanStack Query for server state management. The application follows a single-page application (SPA) pattern with wouter for client-side routing.

## Backend Architecture
The server implements a RESTful API using Express.js with TypeScript support. The application uses a middleware-based architecture with custom authentication middleware for admin access using JWT tokens. File uploads are handled through multer middleware, specifically for CSV import functionality. The backend includes comprehensive logging and error handling middleware to capture API interactions and provide meaningful error responses.

## Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes four main entities: users (with customer/admin roles), products (handicraft inventory), orders (COD transactions), and order_items (order line items). The database is configured to work with Neon Database's serverless PostgreSQL offering. Database migrations are managed through Drizzle Kit with configuration pointing to a shared schema file.

## Authentication & Authorization
Authentication is implemented using JWT tokens with a simple admin/customer role system. The system is designed for a single admin account that manages the entire store, with customers able to place orders without full registration (simplified checkout process). Admin routes are protected with middleware that validates JWT tokens and admin role permissions.

## Data Management & Import System
A key feature is the CSV import system that allows bulk product uploads. The system uses multer for file handling and csv-parser for processing CSV data. This enables easy inventory management by allowing the admin to upload product catalogs from spreadsheets, supporting fields like name, description, price, stock, category, and image URLs.

## UI/UX Design Philosophy
The interface follows Nepal-cultural design principles with warm, earthy colors and cultural motifs. The design is mobile-first responsive using Tailwind CSS, optimized for local users with varying internet connections. The component architecture uses a modular approach with reusable components for products, cart functionality, and admin panels.

## Storage Strategy
The application uses in-memory storage (MemStorage class) for development and testing, with interfaces designed to easily swap to database-backed storage in production. This approach allows for rapid prototyping and testing while maintaining flexibility for production deployment.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Drizzle ORM**: Type-safe database operations and schema management
- **Drizzle Kit**: Database migration and schema management tooling

## Authentication & Security
- **jsonwebtoken**: JWT token generation and validation for admin authentication
- **bcrypt**: Password hashing for secure user credential storage

## File Processing
- **multer**: Multipart form data handling for CSV file uploads
- **csv-parser**: CSV file parsing for bulk product imports

## Frontend Framework & UI
- **React**: Core frontend framework with TypeScript support
- **Vite**: Build tool and development server
- **wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **shadcn/ui**: Pre-built component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling

## Development & Deployment
- **Vercel**: Serverless deployment platform for both frontend and backend
- **TSX**: TypeScript execution for Node.js development
- **ESBuild**: Fast JavaScript bundler for production builds

## Email Communications
- **Nodemailer**: Email service integration for order confirmations and notifications (configured to work with Gmail SMTP for free email sending)

The architecture emphasizes free or low-cost services suitable for a small business, with the flexibility to scale as the business grows. The design choices prioritize ease of maintenance for solo development while providing a robust foundation for a Nepal-focused handicraft e-commerce platform.