# External Visitor Safari Booking System - Implementation Guide

## ✅ What Has Been Set Up

### Backend Infrastructure

- **Database Models:**
  - `VisitorBooking` - Stores visitor safari bookings with token generation
  - `IndividualToken` - Stores individual tokens (1a, 1b, etc.) for group members

### API Endpoints Created

#### Public Endpoints (No Authentication Required)

1. **Create Booking** - `POST /api/bookings`

   - Submits external visitor form
   - Generates unique token per group
   - Time slots: 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00
   - 60 seats per slot
   - 15-minute payment timer
   - Example: 10 adults + 2 children = Token #1

2. **Get Available Slots** - `GET /api/bookings/available-slots?safariDate=2026-01-15&totalSeats=12`

   - Check slot availability for specific date

3. **Get Booking by Token** - `GET /api/bookings/:token/:safariDate`
   - Retrieve booking details using token number

#### Admin Endpoints (Will need authentication)

4. **Assign Individual Tokens** - `POST /api/bookings/:bookingId/assign-tokens`
   - Assigns individual tokens to group members
   - Example: Token 1 → 1a, 1b, 1c... up to 1l (for 12 people)
5. **Confirm Payment** - `PUT /api/bookings/:bookingId/confirm-payment`

   - Mark booking as paid

6. **Get All Bookings** - `GET /api/bookings?safariDate=2026-01-15`
   - List all bookings with filters

### Frontend Updates

- External Visitor form now submits to backend API
- Time slots updated to 10 AM - 6 PM range
- Shows token number after submission
- Error handling for failed submissions

## 🚀 How to Run

### Start Backend

```bash
cd BackEnd
npm run dev
```

Backend runs on: http://localhost:5000

### Start Frontend

```bash
cd FrontEnd
npm run dev
```

Frontend runs on: http://localhost:5173

## 📝 Database Setup Required

**Important:** Make sure you have:

1. PostgreSQL installed and running
2. Created database named `safari_management`
3. Updated `.env` file in BackEnd folder with your database credentials

## 🎯 How It Works

### Step 1: Visitor Submits Form

- Visitor fills out the external visitor form
- Selects date, time slot, number of adults/children
- System generates unique token (e.g., Token #1)
- Payment timer starts (15 minutes)

### Step 2: Token Assignment (Via Login/Admin)

When visitor comes to reception with Token #1 (for 10 adults + 2 children):

- Admin/Staff can assign individual tokens:
  - 1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h, 1i, 1j (adults)
  - 1k, 1l (children)

**API Call Example:**

```javascript
POST /api/bookings/5/assign-tokens
{
  "tokens": [
    {"personName": "John Doe", "personType": "adult"},
    {"personName": "Jane Doe", "personType": "adult"},
    // ... 10 more entries
  ]
}
```

### Step 3: Payment Confirmation

```javascript
PUT /api/bookings/5/confirm-payment
{
  "paymentMode": "cash"
}
```

## 🔄 Token System

### Group Token

- Generated when form is submitted
- Example: Token #1, #2, #3... (incremental per date)

### Individual Tokens

- Assigned later via admin system
- Format: {groupToken}{letter}
- Example: 1a, 1b, 1c, 1d... (up to 1z if needed)
- One token per person in the group

## 📊 Database Tables

### visitor_bookings

Stores main booking information:

- token (group token number)
- name, phone, email
- safariDate, timeSlot
- adults, children, totalSeats
- paymentAmount, paymentDone, paymentMode
- expiryTime, expired
- safariStatus (pending/confirmed/completed/cancelled)

### individual_tokens

Stores individual person tokens:

- bookingId (references visitor_bookings)
- groupToken (e.g., 1)
- individualToken (e.g., 1a, 1b, 1c)
- personName, personType (adult/child)
- assignedBy (staff who assigned it)

## 🔐 Next Steps

1. **Authentication System** - You'll need to implement login for:

   - Reception staff (to assign individual tokens)
   - Gate staff (to verify tokens)
   - Manager (to view all bookings)

2. **Payment Integration** - Optional payment gateway integration

3. **Token Assignment UI** - Create admin interface to assign individual tokens

4. **Reporting** - Dashboard for viewing bookings, revenue, etc.

## 🧪 Testing the API

You can test using tools like Postman or curl:

```bash
# Create a booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "safariDate": "2026-01-20",
    "timeSlot": "10:00 - 12:00",
    "adults": 10,
    "children": 2
  }'

# Check available slots
curl "http://localhost:5000/api/bookings/available-slots?safariDate=2026-01-20&totalSeats=12"
```

## 📁 File Structure

```
BackEnd/
├── src/
│   ├── config/
│   │   └── database.js              # PostgreSQL configuration
│   ├── models/
│   │   ├── VisitorBooking.js        # Booking model
│   │   ├── IndividualToken.js       # Individual tokens model
│   │   └── index.js                 # Model associations
│   ├── controllers/
│   │   └── bookingController.js     # Business logic
│   ├── routes/
│   │   └── bookingRoutes.js         # API endpoints
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── errorHandler.js          # Error handling
│   └── server.js                    # Main app entry
└── .env                             # Environment variables
```

Your backend is now ready to accept safari bookings! 🎉
