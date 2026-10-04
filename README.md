# 🔧 ProFix — Home Services Marketplace

**ProFix** is a full-stack web application that connects homeowners with verified local service professionals (plumbers, electricians, carpenters, and housekeepers). Users can browse providers, book appointments, chat in real time, and pay securely — all from a single platform.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [User Roles](#user-roles)
- [Page-by-Page Walkthrough](#page-by-page-walkthrough)
  - [Landing Page](#1-landing-page-)
  - [Sign Up](#2-sign-up-signup)
  - [Login](#3-login-login)
  - [Forgot Password Flow](#4-forgot-password-flow)
  - [User Dashboard](#5-user-dashboard-user_dashboard)
  - [Service Directory Pages](#6-service-directory-pages)
  - [Booking Page](#7-booking-page-booking)
  - [My Requests](#8-my-requests-my_requests)
  - [Chat System](#9-real-time-chat-chat)
  - [Provider Dashboard](#10-provider-dashboard-provider_dashboard)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Overview

ProFix solves the problem of finding trustworthy home service professionals. It acts as a two-sided marketplace:

| Side | Description |
|------|-------------|
| **Users (Homeowners)** | Search for service providers by category, view profiles, book appointments with calendar-based scheduling, chat with providers, and make payments via Razorpay. |
| **Service Providers** | Register their expertise, receive booking requests, accept/decline jobs, chat with clients, and manage their schedule from a dedicated dashboard. |

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🏠 **Service Categories** | Plumbing, Electrical, Carpentry, Housekeeping |
| 📅 **Smart Booking** | Calendar date picker + time slot selection with real-time availability checks |
| 💬 **Real-Time Chat** | WebSocket-powered messaging (Socket.io) with online/offline status indicators |
| 💳 **Secure Payments** | Razorpay integration with HMAC-SHA256 signature verification |
| 🔐 **Authentication** | Session-based auth with bcrypt password hashing and role-based route guards |
| 📧 **Email OTP** | Brevo SMTP-powered OTP verification for password resets (4-digit, 10-min expiry) |
| 🔔 **Notifications** | Bell icon dropdown showing recent booking updates |
| 👤 **Profile Management** | Users can view and update their profile details |
| 🛡️ **Protected Routes** | Frontend route guards that verify session + role before rendering |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI component library |
| **Vite 8** | Build tool and dev server |
| **React Router v7** | Client-side routing |
| **Socket.io Client** | Real-time WebSocket communication |
| **Lucide React** | Icon library |
| **React Scroll** | Smooth scrolling for landing page sections |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express 5** | REST API server |
| **MySQL 2** | Relational database |
| **Socket.io** | Real-time bi-directional messaging |
| **bcrypt** | Password hashing (10 salt rounds) |
| **express-session** | Server-side session management |
| **Razorpay SDK** | Payment gateway integration |
| **Nodemailer + Brevo SMTP** | Transactional email (OTP delivery) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│              React + Vite (Port 5173)                    │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Landing  │ │  Auth    │ │  User    │ │ Provider │   │
│  │  Page    │ │  Pages   │ │Dashboard │ │Dashboard │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │          │
│       └─────────────┴────────┬───┴─────────────┘          │
│                              │                            │
│                   Socket.io Client                        │
└──────────────────────────────┬────────────────────────────┘
                               │
                    HTTP (REST) + WebSocket
                               │
┌──────────────────────────────┴────────────────────────────┐
│                      BACKEND                              │
│           Node.js + Express (Port 8009)                   │
│                                                           │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐             │
│  │  REST API │ │ Socket.io │ │  Sessions  │             │
│  │ Endpoints │ │  Server   │ │  (Cookie)  │             │
│  └─────┬─────┘ └─────┬─────┘ └─────┬──────┘             │
│        │              │             │                     │
│        └──────────────┴──────┬──────┘                     │
│                              │                            │
│  ┌───────────┐ ┌─────────────┴──┐ ┌──────────────┐      │
│  │ Razorpay  │ │     MySQL      │ │ Brevo SMTP   │      │
│  │ Gateway   │ │   Database     │ │ (Email OTP)  │      │
│  └───────────┘ └────────────────┘ └──────────────┘      │
└───────────────────────────────────────────────────────────┘
```

---

## User Roles

ProFix supports two distinct user roles, each with its own registration flow, dashboard, and permissions:

### 👤 User (Homeowner)
- Registers with: Name, Email, Password, Phone, Address
- Can: Browse providers → Book services → Chat → Pay → Track bookings

### 🔧 Service Provider
- Registers with: Name, Email, Password, Phone, Service Type, Experience (years), City
- Can: Receive booking requests → Accept/Decline → Chat with clients → View earnings

---

## Page-by-Page Walkthrough

### 1. Landing Page (`/`)

The public homepage introduces ProFix to new visitors. It consists of four sections stacked vertically:

| Section | What It Shows |
|---------|--------------|
| **Navbar** | Logo + navigation links (Why Choose Us, Services, How It Works) with Sign Up / Login buttons |
| **Hero Section** | Headline ("Expert Help at Your Doorstep"), tagline, and a hero image |
| **Why Choose Us** | Three value propositions — Verified Pros, Transparent Pricing, Guaranteed Work — each with an icon and description |
| **Explore Services** | A 4-card grid showcasing the service categories (Plumbing, Housekeeping, Carpentry, Electrical) with images and descriptions |
| **How It Works** | A step-by-step visual guide: Search → Compare Pros → Book & Relax |

> **No login required** to view this page.

---

### 2. Sign Up (`/signup`)

A dynamic registration form that adapts based on the selected role:

**Common fields (both roles):**
- Full Name
- Email Address
- Phone Number (with +91 prefix)
- Password

**User-specific field:**
- Full Address

**Service Provider-specific fields:**
- Primary Expertise (dropdown: Plumbing, Carpentry, Housekeeping, Electrician)
- Years of Experience
- Operating City

**Behaviour:**
- On successful signup → A success modal appears → Auto-redirects to `/login` after 3 seconds
- Duplicate email → Error toast: "User with this email already exists"
- Passwords are hashed with bcrypt (10 rounds) before database storage

---

### 3. Login (`/login`)

A login form requiring:
- **User Type** selection (User or Service Provider)
- Email
- Password

**Behaviour:**
- Credentials are verified against the correct database table based on the selected role
- On success → Creates a server-side session → Redirects to the appropriate dashboard:
  - Users → `/User_dashboard`
  - Service Providers → `/Provider_dashboard`
- Invalid credentials → Error toast
- Includes a "Forgot Password?" link

---

### 4. Forgot Password Flow

A 3-step password reset process:

| Step | Route | What Happens |
|------|-------|-------------|
| **1. Verify Email** | `/verifyemail` | User enters their email. The system checks both `User_data` and `Service_Provider_data` tables. If found, a 4-digit OTP is generated and emailed via Brevo SMTP. |
| **2. Enter OTP** | `/otp` | User enters the 4-digit code. OTP expires after **10 minutes**. A "Resend OTP" button generates a fresh code. |
| **3. New Password** | `/newpassword` | User sets a new password. Only accessible if OTP was verified (`isOtpVerified` flag). Password is bcrypt-hashed and saved. Session reset data is then cleared. |

---

### 5. User Dashboard (`/User_dashboard`)

> **Protected route** — requires login as a "User".

The main hub for logged-in homeowners, featuring:

| Element | Description |
|---------|-------------|
| **Welcome Banner** | Personalized greeting: "Welcome back, {userName}!" |
| **Service Cards** | 4 quick-access cards (Plumbing, Electrical, Carpentry, Housekeeping) — each navigates to the respective service directory |
| **Notification Bell** | 🔔 Dropdown showing the 5 most recent booking status updates |
| **Sidebar Navigation** | Links to Dashboard, My Requests, Chat, and Profile |
| **Profile Popup** | Clicking the profile icon opens a slide-over panel showing user details with an "Edit Profile" option |
| **Logout** | Destroys the server session and clears the cookie |

---

### 6. Service Directory Pages

> **Protected routes** — require login as a "User".

| Route | Service |
|-------|---------|
| `/Service_Plumbing` | Plumbing providers |
| `/Service_Electrician` | Electrician providers |
| `/Service_Carpentry` | Carpentry providers |
| `/Service_HouseKeeping` | Housekeeping providers |

Each page fetches all registered service providers for that category from the database and displays them as **provider cards** containing:

- Provider Name
- City / Location
- Years of Experience
- **"Book Now"** button → navigates to `/booking` with the provider's data
- **"Chat"** button → navigates to `/chat` with the provider's data

---

### 7. Booking Page (`/booking`)

> **Protected route** — requires login as a "User".

A 3-step booking wizard that guides users through scheduling a service:

#### Step 1: Select a Date
- Full interactive **calendar widget** with month navigation
- Past dates are greyed out and disabled
- Selected date is highlighted with a visual indicator
- Shows the selected date in a sidebar display (e.g., "Friday, Oct 3")

#### Step 2: Preferred Time Slot
- **Morning slots**: 08:00 AM, 09:30 AM, 11:00 AM, 11:30 AM
- **Afternoon slots**: 02:00 PM, 03:30 PM, 05:00 PM
- **Real-time availability**: The system queries the backend (`/available_slots`) to check which slots are already booked for the selected provider on the selected date. Booked slots appear as unavailable (greyed out, unclickable).
- Selecting a new date automatically resets the time slot selection and re-fetches availability.

#### Step 3: Job Details
- **Text area** to describe the problem (e.g., "Kitchen sink pipe leaking at the joint")
- **File upload** for photos (PNG/JPG, max 5MB per file)
- Uploaded files can be previewed and removed

**On submission:**
- Booking is saved to the `Bookings` table with status `"Pending"`
- A success confirmation screen shows the booking ID (e.g., `#PRFX-0012`)
- Auto-redirects to `/my_requests` after 4 seconds

---

### 8. My Requests (`/my_requests`)

> **Protected route** — requires login as a "User".

A filterable list of all bookings made by the logged-in user:

| Feature | Description |
|---------|-------------|
| **Tab Filters** | All, Pending, Accepted, Completed, Declined |
| **Booking Cards** | Each card shows: Provider name, Service type, Date, Time slot, Description, Status badge |
| **Status Badges** | Colour-coded: 🟡 Pending, 🟢 Accepted, 🔵 Completed, 🔴 Declined |
| **Empty State** | Friendly message if no bookings exist for the selected filter |

---

### 9. Real-Time Chat (`/chat`)

The chat system supports two views:

#### Chat List View
When navigating to `/chat` without a provider in the route state, users see:
- A list of **all active conversations** fetched from the database
- Each conversation shows: Contact name, last message preview, timestamp
- Clicking a conversation opens the chat view

#### Chat View
When a specific provider/user is selected:
- **Message history** is loaded from the database (`/chat_history` endpoint)
- **Real-time messaging** via Socket.io — messages appear instantly without page refresh
- **Online/Offline status** — A green/grey dot next to the contact's name, powered by Socket.io events (`user_online` / `user_offline`)
- **Price negotiation** — Lock/Propose price buttons for service cost discussion
- **Back button** to return to the chat list

**How Socket.io works in ProFix:**

```
1. User logs in → Frontend connects to Socket.io server
2. Frontend emits "register_user" with the user's email
3. Server tracks online users via a Map (socketId → email)
4. When opening a chat, both users join a shared "room"
5. Messages are:
   a. Saved to the MySQL "Messages" table
   b. Broadcast to the room via socket.emit
6. On disconnect, server broadcasts "user_offline"
```

---

### 10. Provider Dashboard (`/Provider_dashboard`)

> **Protected route** — requires login as a "Service Provider".

A comprehensive management panel for service professionals:

| Section | Description |
|---------|-------------|
| **Sidebar Navigation** | Dashboard, My Bookings, Inbox (Chat), Earnings, Settings, Help, Logout |
| **Dashboard Overview** | Statistics cards (Total bookings, Pending, Completed, Earnings) |
| **Incoming Bookings** | List of booking requests from users, each showing: Client name, phone, service type, date, time, description, status |
| **Accept/Decline Actions** | Providers can accept or decline pending bookings — updates are saved to the database via `PUT /booking_status` |
| **Notification Bell** | Shows count of new pending bookings |
| **Profile Section** | Displays provider details: Name, Email, Phone, Service Type, Experience, City |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/signup` | Register a new user or service provider |
| `POST` | `/login` | Authenticate and create a session |
| `GET` | `/session-check` | Verify if a session is active (returns role + user info) |
| `POST` | `/logout` | Destroy session and clear cookie |

### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/verifyemail` | Send OTP to the registered email |
| `POST` | `/resend-otp` | Resend a new OTP |
| `POST` | `/otp` | Validate the entered OTP |
| `PUT` | `/newpassword` | Set a new password (requires verified OTP) |

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user_profile` | Fetch logged-in user's profile |
| `PUT` | `/userprofile_update` | Update user profile details |
| `GET` | `/User_dashboard` | Get user's display name |
| `GET` | `/provider_profile` | Fetch logged-in provider's profile |

### Service Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/Service_Plumbing` | List all plumbing providers |
| `GET` | `/Service_Electrician` | List all electrician providers |
| `GET` | `/Service_Carpentry` | List all carpentry providers |
| `GET` | `/Service_HouseKeeping` | List all housekeeping providers |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/booking` | Create a new booking |
| `GET` | `/my_bookings` | Get all bookings for the logged-in user |
| `GET` | `/provider_bookings` | Get all bookings for the logged-in provider |
| `PUT` | `/booking_status` | Accept or decline a booking (provider only) |
| `GET` | `/available_slots` | Get unavailable time slots for a provider on a specific date |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chat_history` | Fetch message history between two users |
| `GET` | `/my_chats` | List all active conversations for the logged-in user |

### Payments (Razorpay)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payment/create-order` | Create a Razorpay order |
| `POST` | `/payment/verify` | Verify payment signature (HMAC-SHA256) |
| `GET` | `/payment/status/:orderId` | Check payment status |

---

## Database Schema

The application uses a MySQL database named `RESUME_PROJECT1` with the following tables:

### `User_data`
| Column | Type | Description |
|--------|------|-------------|
| UserName | VARCHAR | Full name |
| Email | VARCHAR (PK) | Email address |
| Password | VARCHAR | bcrypt-hashed password |
| phoneNumber | VARCHAR | Phone number |
| Address | VARCHAR | Full address |

### `Service_Provider_data`
| Column | Type | Description |
|--------|------|-------------|
| UserName | VARCHAR | Full name |
| Email | VARCHAR (PK) | Email address |
| Password | VARCHAR | bcrypt-hashed password |
| phoneNumber | VARCHAR | Phone number |
| serviceType | VARCHAR | Plumbing / Carpentry / HouseKeeping / Electrician |
| Experience | INT | Years of experience |
| City | VARCHAR | Operating city |

### `Bookings`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AI) | Booking ID |
| userEmail | VARCHAR | Customer's email |
| providerEmail | VARCHAR | Provider's email |
| serviceType | VARCHAR | Type of service |
| bookingDate | DATE | Scheduled date |
| timeSlot | VARCHAR | Selected time slot |
| description | TEXT | Job description |
| status | VARCHAR | Pending / Accepted / Completed / Declined |
| createdAt | TIMESTAMP | Creation timestamp |

### `Messages` (auto-created on startup)
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AI) | Message ID |
| senderEmail | VARCHAR | Sender's email |
| receiverEmail | VARCHAR | Receiver's email |
| message | TEXT | Message content |
| timestamp | DATETIME | Sent timestamp |

### `Payments` (auto-created on startup)
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AI) | Payment ID |
| orderId | VARCHAR (UNIQUE) | Razorpay order ID |
| paymentId | VARCHAR | Razorpay payment ID |
| userEmail | VARCHAR | Payer's email |
| providerEmail | VARCHAR | Payee's email |
| serviceType | VARCHAR | Service category |
| amount | INT | Amount in paise |
| currency | VARCHAR | Currency code (INR) |
| status | VARCHAR | created / paid / failed |
| createdAt | TIMESTAMP | Creation timestamp |

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds — passwords are never stored in plain text |
| **Session Management** | `express-session` with HTTP-only, SameSite cookies (24-hour lifetime) |
| **Route Guards** | Frontend `ProtectedRoute` component checks `/session-check` before rendering protected pages |
| **CORS** | Restricted to `localhost:5173` and `localhost:5174` with credentials support |
| **Payment Verification** | Razorpay signature verified with HMAC-SHA256 using `crypto.timingSafeEqual` to prevent timing attacks |
| **OTP Expiry** | OTPs expire after 10 minutes; `isOtpVerified` flag prevents password reset without OTP |
| **Self-Payment Prevention** | Backend blocks users from paying themselves |
| **Double-Payment Prevention** | Backend checks for existing paid orders before creating new ones |

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later recommended)
- **MySQL** server running locally
- A **Razorpay** test account (for payment features)
- A **Brevo** account (for email OTP delivery)

### 1. Clone the repository

```bash
git clone <repository-url>
cd resume_project
```

### 2. Set up the database

Create the MySQL database and the required tables:

```sql
CREATE DATABASE RESUME_PROJECT1;
USE RESUME_PROJECT1;

CREATE TABLE User_data (
    UserName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20),
    Address TEXT
);

CREATE TABLE Service_Provider_data (
    UserName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20),
    serviceType VARCHAR(100),
    Experience INT,
    City VARCHAR(100)
);

CREATE TABLE Bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(255),
    providerEmail VARCHAR(255),
    serviceType VARCHAR(100),
    bookingDate DATE,
    timeSlot VARCHAR(20),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **Note:** The `Messages` and `Payments` tables are auto-created by the backend on startup.

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
PORT=8009
SECRET_KEY=your_session_secret
DATABASE_PASSWORD=your_mysql_password
SMTP_KEY=your_brevo_smtp_key
SMTP_USER=your_brevo_login_email
FROM_EMAIL=your_sender_email
RAZOR_API=your_razorpay_key_id
RAZOR_SECRET=your_razorpay_key_secret
```

### 4. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Start the application

```bash
# Terminal 1 — Start the backend server
cd backend
node server.js
# → Server running on port 8009

# Terminal 2 — Start the frontend dev server
cd frontend
npm run dev
# → App available at http://localhost:5173
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: `8009`) |
| `SECRET_KEY` | Secret for signing session cookies |
| `DATABASE_PASSWORD` | MySQL root password |
| `SMTP_KEY` | Brevo SMTP API key |
| `SMTP_USER` | Brevo account email |
| `FROM_EMAIL` | "From" address for outgoing emails |
| `RAZOR_API` | Razorpay Key ID (public) |
| `RAZOR_SECRET` | Razorpay Key Secret (private — never exposed to frontend) |

---

## Project Structure

```
resume_project/
├── backend/
│   ├── .env                    # Environment variables (do NOT commit)
│   ├── package.json            # Backend dependencies
│   └── server.js               # Express server — all routes, Socket.io, and DB logic
│
├── frontend/
│   ├── index.html              # Vite entry point
│   ├── vite.config.js          # Vite configuration
│   ├── package.json            # Frontend dependencies
│   ├── public/                 # Static assets (images)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Router configuration
│       ├── App.css             # Global styles
│       ├── index.css           # Base/reset styles
│       │
│       ├── # ── Landing Page ──
│       ├── first_page.jsx      # Landing page layout
│       ├── navbar_landing.jsx  # Landing page navbar
│       ├── Why_choose_us.jsx   # Value propositions section
│       ├── Services.jsx        # Service categories grid
│       ├── HowItWorks.jsx      # Step-by-step guide
│       │
│       ├── # ── Authentication ──
│       ├── SignUp.jsx           # Registration form (User + Provider)
│       ├── Login.jsx            # Login form
│       ├── VerifyEmail.jsx      # Password reset — Step 1
│       ├── OTP.jsx              # Password reset — Step 2
│       ├── NewPassword.jsx      # Password reset — Step 3
│       ├── ProtectedRoute.jsx   # Route guard (session + role check)
│       ├── SignUpSucess.jsx     # Success modal after registration
│       ├── LoginSuccess.jsx     # Success modal after login
│       │
│       ├── # ── User Pages ──
│       ├── User_dashboard.jsx   # User's main dashboard
│       ├── User_profile.jsx     # Profile popup component
│       ├── UpdateProfile.jsx    # Edit profile form
│       ├── MyRequests.jsx       # Booking history with filters
│       │
│       ├── # ── Service Directories ──
│       ├── Service_Plumbing.jsx     # Plumbing provider listings
│       ├── Service_Electrician.jsx  # Electrician provider listings
│       ├── Service_Carpentry.jsx    # Carpentry provider listings
│       ├── Service_Housekeeping.jsx # Housekeeping provider listings
│       │
│       ├── # ── Booking & Payments ──
│       ├── Booking.jsx          # 3-step booking wizard
│       │
│       ├── # ── Communication ──
│       ├── Chat.jsx             # Real-time chat (Socket.io)
│       │
│       ├── # ── Provider Pages ──
│       ├── Provider_dashboard.jsx  # Provider's management panel
│       │
│       ├── # ── Shared Components ──
│       ├── Toast.jsx            # Global toast notification system
│       └── assets/              # Static assets used by components
│
└── README.md
```

---

## Typical User Journey

```
┌─────────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────────┐
│   Landing   │───▶│  Sign Up │───▶│    Login      │───▶│  Dashboard   │
│    Page     │    │   Form   │    │    Form       │    │   (User)     │
└─────────────┘    └──────────┘    └───────────────┘    └──────┬───────┘
                                                               │
                    ┌──────────────────────────────────────────┘
                    ▼
        ┌───────────────────┐    ┌───────────────┐    ┌──────────────┐
        │ Service Directory │───▶│  Booking Page │───▶│  My Requests │
        │  (e.g. Plumbing)  │    │  (Calendar +  │    │  (Track &    │
        │  Browse providers │    │   Time slots) │    │   Filter)    │
        └────────┬──────────┘    └───────────────┘    └──────────────┘
                 │
                 ▼
        ┌───────────────────┐    ┌───────────────┐
        │   Chat with       │───▶│   Make        │
        │   Provider        │    │   Payment     │
        │  (Real-time)      │    │  (Razorpay)   │
        └───────────────────┘    └───────────────┘
```

---

## License

This project is intended for educational and portfolio purposes.
