# LocalCommunity — Hyperlocal Peer-to-Peer Campus Marketplace

> **"Buy. Sell. Rent. Donate. Connect locally."**  
> A production-style, full-stack community marketplace engineered for college and university campuses. Built with **React**, **Vite**, **Tailwind CSS**, **Node.js/Express**, and **MongoDB/Mongoose**.

---

## 📌 Project Overview

**LocalCommunity** addresses the friction students face when buying and selling course materials, electronics, cycles, and hostel essentials. Unlike generic e-commerce sites, LocalCommunity is designed around verified local trust circles, structured negotiation offers, multi-type listings (Sell, Rent, Exchange, Donate), contextual buyer-seller chat, persistent notifications, and automated rule-based recommendations.

Designed as an end-to-end full-stack portfolio application demonstrating strong **Software Engineering**, **REST API architecture**, **Role-Based Access Control (RBAC)**, **Database Indexing**, **Defensive Error Handling**, and **Automated Testing**.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + PostCSS
- **Routing**: React Router v7
- **Icons**: Lucide React
- **HTTP Client**: Axios with Bearer token interceptors
- **State Management**: React Context API (`AuthContext`)

### Backend
- **Runtime**: Node.js v24 (CommonJS + ESM test modules)
- **Framework**: Express v5
- **Database**: MongoDB + Mongoose v9
- **Authentication**: Stateless JSON Web Tokens (JWT) + bcryptjs password hashing
- **File Uploads**: Multer with file type validation & size boundaries
- **Security**: Helmet, CORS whitelist, sanitized queries, defensive input limits

### Testing
- **Framework**: Jest + Supertest
- **In-Memory Database**: `mongodb-memory-server` for isolated, zero-dependency testing

---

## 🏛 System Architecture & Data Flow

```
                      ┌─────────────────────────────────────────┐
                      │          React + Vite Frontend          │
                      │  (Pages, Context, Components, Axios)    │
                      └────────────────────┬────────────────────┘
                                           │ JSON / Multipart
                                           │ (JWT Bearer Auth)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          Express REST API (5000)        │
                      │  - CORS, Helmet, Request Parsers        │
                      │  - JWT Verification Middleware (protect) │
                      │  - Role Check Middleware (authorize)    │
                      │  - Multer Local Disk Storage Middleware │
                      │  - Centralized Error Handler            │
                      └────────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
     ┌─────────────────────────────────────┐     ┌────────────────────────┐
     │          MongoDB Database           │     │ Local File System      │
     │  - Users, Products, Offers          │     │ (backend/uploads/)     │
     │  - Messages, Notifications, Reports │     └────────────────────────┘
     └─────────────────────────────────────┘
```

---

## ✨ Main Features

### 1. Multi-Type Listing System
- Supports **Sell**, **Rent**, **Exchange**, and **Donate** (free giveaways).
- Image gallery uploads (up to 5 images per product) managed via Multer.
- Detailed attributes: category, condition, price, location, views, and active/sold statuses.

### 2. Search & Filter Engine
- **Search**: Title, description, category, and hostel location queries.
- **Filters**: Category, Condition (New, Like New, Good, Fair, Used), Listing Type, and Price Range (Min/Max).
- **Sorting**: Newest first, price ascending, price descending, and view count.
- **Pagination**: Configurable page boundaries with total count calculations.

### 3. Structured Offer & Negotiation System
- Buyers can propose price offers with an optional note.
- Sellers can **Accept**, **Decline**, or **Counter** with a revised price.
- Buyers can **Withdraw** pending offers.
- Ownership guards: Users cannot offer on their own listings; unauthorized parties cannot modify offers.

### 4. REST Messaging
- Threaded conversation inbox grouped by product and counterpart.
- Real-time polling with read/unread indicators.
- Seamless "Contact Seller" action from product detail views.

### 5. Persistent Event Notifications
- Triggered automatically on:
  - New chat messages
  - Offers received, accepted, rejected, or countered
  - Listing status changes
- Unread count pill in desktop and mobile navigation; mark individual or all notifications as read.

### 6. User Activity & Recommendations
- **Recently Viewed**: Automatically tracks up to 10 recently opened products without redundant duplicates.
- **Rule-Based Recommendations**: Recommends active campus items based on top categories from user favorites and view history.

### 7. Administrative Oversight (RBAC)
- **Dashboard**: Real-time aggregated statistics (total users, active listings, pending reports, category distributions, 7-day velocity).
- **User Moderation**: View all registered accounts and toggle account status (`active` / `suspended`).
- **Product Moderation**: View and delete inappropriate or duplicate listings.
- **Report Handling**: Review flagged listings and mark complaints as `resolved` or `dismissed`.

---

## 🗄 Database Models

| Model | Key Fields | Description |
|---|---|---|
| **User** | `name`, `email`, `password`, `college`, `phone`, `location`, `role`, `status`, `favorites`, `recentlyViewed` | Platform accounts with bcrypt encryption and personal bookmarks. |
| **Product** | `title`, `description`, `price`, `category`, `listingType`, `condition`, `images`, `seller`, `location`, `status`, `views` | Campus listings with text indexes and categorized tags. |
| **Offer** | `product`, `buyer`, `seller`, `amount`, `message`, `status`, `counterAmount`, `counterMessage` | Structured price proposals and counter offers. |
| **Message** | `sender`, `receiver`, `product`, `message`, `read` | Buyer-seller conversation messages. |
| **Notification** | `recipient`, `sender`, `type`, `title`, `message`, `relatedProduct`, `relatedOffer`, `read` | Persistent event notices. |
| **Report** | `reporter`, `product`, `reason`, `description`, `status` | Listing flags and moderation queue. |

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
- `POST /register` — Register a new account
- `POST /login` — Authenticate and receive JWT
- `GET /me` — Retrieve current authenticated user profile
- `POST /logout` — Invalidate session

### Products (`/api/products`)
- `GET /` — Browse products (supports `search`, `category`, `listingType`, `condition`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`)
- `POST /` — Create listing (multipart/form-data, max 5 images)
- `GET /:id` — Get product details and track user view
- `PUT /:id` — Update listing (seller only)
- `DELETE /:id` — Delete listing (seller or admin)
- `PATCH /:id/sold` — Mark listing as sold
- `POST /:id/favorite` — Save item to user favorites
- `DELETE /:id/favorite` — Remove item from favorites

### Offers (`/api/offers`)
- `POST /` — Create an offer
- `GET /` — Get user offers (`?role=buyer` or `?role=seller`)
- `PATCH /:id/accept` — Accept offer (seller only)
- `PATCH /:id/reject` — Reject offer (seller only)
- `PATCH /:id/counter` — Counter offer (seller only)
- `PATCH /:id/withdraw` — Withdraw pending offer (buyer only)

### Messages (`/api/messages`)
- `POST /` — Send message to seller/buyer
- `GET /` — Get all user conversation threads
- `GET /:productId/:otherUserId` — Get message history for product thread

### Notifications (`/api/notifications`)
- `GET /` — Get notifications and unread count
- `PATCH /:id/read` — Mark notification as read
- `PATCH /read-all` — Mark all notifications as read

### Users (`/api/users`)
- `GET /me/favorites` — Get user's saved products
- `GET /me/recently-viewed` — Get user's 10 most recently viewed items
- `GET /me/recommendations` — Get rule-based personalized product suggestions
- `GET /profile/:id` — Public profile details
- `PUT /profile` — Update current user profile

### Admin (`/api/admin`)
- `GET /stats` — Overall metrics and category distribution
- `GET /users` — View all registered users
- `PATCH /users/:id/status` — Toggle user status (`active` / `suspended`)
- `GET /products` — View all products
- `DELETE /products/:id` — Administrative removal of a product
- `GET /reports` — View user reports
- `PATCH /reports/:id` — Update report status (`resolved` / `dismissed`)

---

## 🚀 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/localcommunity.git
cd localcommunity
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Ensure MONGO_URI and JWT_SECRET are configured
```

### 3. Install Dependencies
```bash
# In backend/
npm install

# In frontend/
cd ../frontend
npm install
```

### 4. Seed Database (Optional but Recommended)
Populates realistic college users, products, categories, sample messages, and favorites:
```bash
cd ../backend
node seed.js
```

**Default Test Accounts:**
- **Student 1**: `arjun@college.edu` / `password123`
- **Student 2**: `priya@college.edu` / `password123`
- **Admin**: `admin@localcommunity.com` / `admin123`

### 5. Start Development Servers
```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm start

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

LocalCommunity includes **46 automated backend unit and integration tests** executing against an isolated, ephemeral in-memory MongoDB server.

```bash
cd backend
npm test
```

### Test Coverage Highlights
- **Auth (10 tests)**: Valid registration, duplicate email rejection, invalid email check, missing fields, valid login, wrong password rejection, protected routes without token, protected routes with token.
- **Products (10 tests)**: Authenticated creation with image upload, unauthenticated rejection, pagination limits, product by ID, 404 for missing items, seller updates, ownership guards, seller deletion, mark as sold.
- **Search & Filter (9 tests)**: Multi-field search, category filtering, condition filtering, price range boundaries, sequential sorting (newest, price ascending, price descending), pagination counts.
- **Authorization & RBAC (2 tests)**: Normal user rejected from admin APIs (403), admin allowed into admin APIs (200).
- **Tier 2 Suite (15 tests)**:
  - Listing types (Sell, Rent, Exchange, Donate validation and filtering).
  - Offers (creation, rejection of self-offers, positive price boundaries, seller accept/reject/counter flow, buyer withdraw, unauthorized tampering protection).
  - Notifications (creation on real events, mark as read, mark all read, unauthorized access guards).
  - Recently viewed (tracking viewed items, duplicate prevention).
  - Rule-based recommendations (active items returned based on category affinity).

---

## 🛡 Security Practices
- **Password Protection**: Passwords hashed using `bcryptjs` with salt factor 10; passwords explicitly excluded (`select: false`) on database queries.
- **Role-Based Authorization**: Route-level middleware (`protect` and `authorize('admin')`) verifying both token authenticity and user permissions.
- **Ownership Verification**: Database queries enforce that only the creator of a resource (or an administrator) can modify or delete listings and offers.
- **Suspension Enforcement**: Middleware rejects requests from accounts marked as `suspended`.
- **Injection Safety**: Parameterized queries via Mongoose; explicit casting of numeric query parameters (`minPrice`, `maxPrice`, `amount`).
