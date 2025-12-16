# OneChat - Comprehensive Project Summary for Viva

## 📋 Project Overview

**Project Name:** OneChat  
**Type:** Full-Stack Web Application  
**Technology Stack:** Laravel 12 (Backend) + React 18 (Frontend) + Inertia.js (SPA Framework)  
**Database:** SQLite/MySQL  
**Purpose:** A comprehensive social communication platform with integrated blood donation management and emergency services

---

## 🎯 Project Objectives

1. **Real-time Communication:** Provide instant messaging and voice/video calling capabilities
2. **Blood Donation Management:** Connect blood donors with recipients efficiently
3. **Emergency Services:** Enable users to request and respond to emergency situations
4. **Social Networking:** Friend request system for building connections
5. **Admin Management:** Comprehensive admin panel for system management

---

## 🏗️ Architecture & Technology Stack

### Backend (Laravel 12)
- **Framework:** Laravel 12 (PHP 8.2+)
- **Authentication:** Laravel Sanctum
- **API:** RESTful API endpoints
- **Database:** Eloquent ORM with SQLite/MySQL
- **Real-time:** Polling-based message updates
- **File Storage:** Local filesystem for user images

### Frontend (React 18)
- **Framework:** React 18.2.0
- **SPA Framework:** Inertia.js 2.0 (Server-side routing with React components)
- **Styling:** Tailwind CSS 4.1.0
- **HTTP Client:** Axios 1.11.0
- **Build Tool:** Vite 7.0.7
- **UI Components:** Headless UI 2.0

### Key Features
- **WebRTC:** Peer-to-peer audio/video calling
- **Real-time Updates:** Polling mechanism for messages and status
- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Progressive Enhancement:** Works without JavaScript for basic functionality

---

## 📊 Database Schema

### Core Tables

1. **users**
   - User authentication and profile information
   - Fields: name, email, phone, image, address, city, state, blood_group, role, last_seen_at
   - Roles: admin, manager, user

2. **messages**
   - Chat messages between users
   - Fields: sender_id, receiver_id, message, read, timestamps
   - Indexes: (sender_id, receiver_id), (receiver_id, created_at)

3. **friend_requests**
   - Friend request management
   - Fields: sender_id, receiver_id, status (pending/accepted/rejected), accepted_at
   - Status tracking for friend relationships

4. **blood_donors**
   - Blood donor registration
   - Fields: user_id, blood_group, last_donation_date, next_available_date, contact_phone, address, city, state, is_available
   - Indexes: (blood_group, is_available), (city, state)

5. **blood_requests**
   - Blood donation requests
   - Fields: user_id, blood_group, units_needed, urgency, patient_name, hospital_name, hospital_address, latitude, longitude, status, managed_by
   - Status: pending, in_progress, completed, cancelled
   - Management workflow: request → management → confirmation

6. **emergency_requests**
   - Emergency situation reporting
   - Fields: user_id, type (fire, harassment, medical, accident, crime, natural_disaster, other), title, description, latitude, longitude, address, status, priority
   - Status: active, resolved, cancelled
   - Priority: 1 (low) to 4 (critical)

7. **calls**
   - Voice/video call management
   - Fields: caller_id, receiver_id, status, type (audio/video), offer_sdp, answer_sdp, started_at, ended_at
   - WebRTC signaling data storage

8. **notifications**
   - System notifications
   - Fields: user_id, type, title, message, data, read, read_at

9. **system_settings**
   - Application-wide settings
   - Fields: key, value, description

---

## 🔑 Core Features & Functionality

### 1. User Authentication & Profile Management
- **Registration & Login:** Email/password authentication
- **Profile Management:** Update personal information, profile picture
- **User Roles:** Admin, Manager, Regular User
- **Online Status:** Real-time online/offline status tracking (last_seen_at)

### 2. Real-time Messaging System
- **One-on-One Chat:** Private messaging between friends
- **Message Status:** Read/unread indicators
- **Message Polling:** Automatic message fetching every 2 seconds
- **Conversation List:** Sorted by last message time
- **Unread Count:** Badge showing unread messages per conversation
- **Friend-Only Messaging:** Users can only message their friends

### 3. Voice & Video Calling (WebRTC)
- **Audio Calls:** Peer-to-peer audio communication
- **Video Calls:** Peer-to-peer video communication
- **Call Management:** Initiate, accept, reject, end calls
- **WebRTC Signaling:** SDP offer/answer exchange via server
- **ICE Candidates:** Network traversal for NAT/firewall handling
- **Call Status:** Ringing, active, ended
- **Friend-Only Calls:** Only friends can call each other

### 4. Friend Request System
- **Send Friend Requests:** Request to connect with other users
- **Accept/Reject:** Manage incoming friend requests
- **Friend List:** View all accepted friends
- **Pending Requests:** Track sent and received pending requests
- **User Search:** Search users by name/email
- **Friend Status Check:** Real-time friend relationship status

### 5. Blood Donation Management

#### Donor Registration
- **Donor Profile:** Register as blood donor with details
- **Availability Status:** Mark availability for donation
- **Donation History:** Track last donation date
- **Next Available Date:** Set when next available
- **Location:** Address, city, state for location-based search

#### Blood Request System
- **Create Requests:** Request blood with detailed information
- **Hospital Integration:** Comprehensive list of Bangladesh hospitals
- **Location Services:** GPS coordinates and address
- **Urgency Levels:** Normal, urgent, critical
- **Request Management:** Managers can manage requests
- **Confirmation System:** Requesters confirm management
- **Status Tracking:** pending → in_progress → completed/cancelled

#### Find Donors
- **Search Filters:** By blood group, city, state
- **Availability Check:** Only show available donors
- **Location-Based:** Find nearby donors
- **Contact Information:** Direct contact details

### 6. Emergency Request System
- **Emergency Types:** Fire, harassment, medical, accident, crime, natural disaster, other
- **Location Sharing:** GPS coordinates and address
- **Priority Levels:** 1 (low) to 4 (critical)
- **Status Management:** Active, resolved, cancelled
- **Friend Visibility:** Only friends can see each other's emergencies
- **Google Maps Integration:** Direct links to emergency location
- **Real-time Updates:** Active emergency tracking

### 7. Admin Panel

#### Dashboard
- **Statistics:** Total users, messages, conversations, unread messages
- **Notifications:** System-wide notifications
- **Quick Actions:** Access to all admin features

#### User Management
- **View All Users:** List all registered users
- **Remove Users:** Delete user accounts
- **User Details:** View user information

#### Manager Management
- **Add Managers:** Promote users to manager role
- **Remove Managers:** Demote managers to regular users
- **Manager List:** View all managers

#### Notification Management
- **Send Notifications:** Broadcast notifications to all users
- **Notification History:** View sent notifications

#### Emergency Management
- **View All Emergencies:** Monitor all emergency requests
- **Send Emergency Alerts:** Broadcast emergency alerts

#### System Settings
- **Maintenance Mode:** Toggle maintenance mode
- **System Configuration:** Manage application settings

### 8. Notification System
- **Real-time Notifications:** In-app notification system
- **Notification Types:** Friend requests, blood requests, emergency alerts, system messages
- **Read/Unread Status:** Track notification status
- **Notification Center:** Centralized notification management
- **Mark as Read:** Individual and bulk read operations

---

## 🔄 Data Flow & User Interactions

### Messaging Flow
1. User selects friend from conversation list
2. Messages are fetched via API (`/api/messages/{userId}`)
3. New messages polled every 2 seconds
4. Send message via POST `/api/messages/send`
5. Optimistic UI updates for instant feedback
6. Server confirms and updates message status

### Calling Flow
1. User initiates call → POST `/api/calls/initiate`
2. Server creates call record with "ringing" status
3. Receiver polls for active calls
4. WebRTC offer created and stored
5. Receiver accepts → POST `/api/calls/{id}/accept`
6. Answer SDP stored
7. ICE candidates exchanged
8. Peer connection established
9. Media streams exchanged
10. Call ends → POST `/api/calls/{id}/end`

### Blood Request Flow
1. User creates blood request with details
2. Request saved with "pending" status
3. Managers can view and manage requests
4. Manager assigns themselves → status "in_progress"
5. Requester confirms management
6. Request completed/cancelled → final status

### Friend Request Flow
1. User searches for other users
2. Sends friend request → POST `/api/friends/send`
3. Receiver sees pending request
4. Accept/reject → POST `/api/friends/{id}/accept` or `/reject`
5. Status updated to "accepted" or "rejected"
6. Friends can now message and call each other

---

## 🎨 User Interface Features

### Design Principles
- **Modern UI:** Clean, minimalist design with Tailwind CSS
- **Responsive:** Mobile-first responsive design
- **Accessibility:** Semantic HTML and ARIA labels
- **User Experience:** Intuitive navigation and interactions

### Key UI Components
- **Chat Interface:** Split-screen chat with conversation list
- **Call Modal:** Full-screen call interface with controls
- **Emergency Panel:** Quick access emergency request form
- **Notification Bar:** Real-time notification display
- **Admin Dashboard:** Comprehensive admin interface
- **Blood Donation Forms:** Multi-step forms with validation
- **Search Functionality:** Real-time search with suggestions

---

## 🔒 Security Features

1. **Authentication:** Laravel Sanctum for API authentication
2. **CSRF Protection:** Laravel's built-in CSRF protection
3. **Input Validation:** Server-side validation for all inputs
4. **Authorization:** Role-based access control (RBAC)
5. **Friend-Only Access:** Users can only interact with friends
6. **SQL Injection Protection:** Eloquent ORM prevents SQL injection
7. **XSS Protection:** React's built-in XSS protection
8. **Password Hashing:** Bcrypt password hashing

---

## 📈 Performance Optimizations

1. **Database Indexing:** Strategic indexes on frequently queried columns
2. **Query Optimization:** Optimized queries with eager loading
3. **Bulk Operations:** Batch operations for unread counts
4. **Polling Intervals:** Configurable polling intervals
5. **Memoization:** React memo and useMemo for expensive computations
6. **Lazy Loading:** Code splitting for better initial load
7. **Asset Optimization:** Vite for fast HMR and optimized builds

---

## 🧪 Testing

- **PHPUnit:** Backend unit and feature tests
- **Test Coverage:** Controllers, models, and API endpoints
- **Test Files:** Located in `tests/` directory

---

## 📦 Project Structure

```
Onechat/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # All application controllers
│   │   ├── Middleware/         # Custom middleware
│   │   └── Requests/           # Form request validation
│   ├── Models/                 # Eloquent models
│   └── Observers/              # Model observers
├── database/
│   ├── migrations/             # Database migrations
│   └── seeders/                # Database seeders
├── resources/
│   ├── js/
│   │   ├── Pages/              # React page components
│   │   ├── Components/         # Reusable React components
│   │   ├── Layouts/            # Layout components
│   │   └── services/           # Service classes (WebRTC)
│   └── css/                    # Stylesheets
├── routes/
│   ├── web.php                 # Web routes
│   └── api.php                 # API routes
└── public/                     # Public assets
```

---

## 🚀 Deployment & Setup

### Requirements
- PHP 8.2+
- Node.js 18+
- Composer
- SQLite or MySQL

### Setup Steps
1. `composer install` - Install PHP dependencies
2. `npm install` - Install Node dependencies
3. `composer run setup` - Automated setup (creates DB, runs migrations, seeds admin)
4. `php artisan serve` - Start Laravel server
5. `npm run dev` - Start Vite dev server

### Default Admin Credentials
- Email: `admin@gmail.com`
- Password: `12345678`

---

## 🎓 Key Learning Points for Viva

### Technical Skills Demonstrated
1. **Full-Stack Development:** Laravel backend + React frontend
2. **SPA Architecture:** Inertia.js for seamless SPA experience
3. **Real-time Communication:** WebRTC for peer-to-peer calling
4. **Database Design:** Normalized schema with proper relationships
5. **API Design:** RESTful API architecture
6. **State Management:** React hooks and state management
7. **Authentication & Authorization:** Role-based access control
8. **File Handling:** Image upload and storage
9. **Location Services:** GPS integration for emergency/blood requests
10. **Responsive Design:** Mobile-first responsive UI

### Problem-Solving Skills
1. **Real-time Updates:** Implemented polling mechanism for real-time feel
2. **WebRTC Integration:** Complex peer-to-peer communication setup
3. **Friend System:** Bidirectional friend relationship management
4. **Blood Request Workflow:** Multi-step approval and confirmation system
5. **Emergency Management:** Location-based emergency sharing
6. **Performance:** Optimized queries and database indexes

### Business Logic Understanding
1. **Blood Donation System:** Complete workflow from request to completion
2. **Emergency Response:** Priority-based emergency management
3. **Social Networking:** Friend request and messaging system
4. **Admin Management:** Comprehensive admin panel for system control
5. **User Experience:** Intuitive UI/UX design

---

## 🔮 Future Enhancements (Potential Discussion Points)

1. **WebSocket Integration:** Replace polling with WebSockets for true real-time
2. **Push Notifications:** Browser push notifications for offline users
3. **Group Chat:** Multi-user chat rooms
4. **File Sharing:** Image and document sharing in chats
5. **Message Encryption:** End-to-end encryption for privacy
6. **Video Recording:** Record and save video calls
7. **Analytics Dashboard:** User activity and system analytics
8. **Mobile App:** React Native mobile application
9. **AI Integration:** Chatbot for blood donation queries
10. **Blockchain:** Transparent blood donation tracking

---

## 📝 Conclusion

OneChat is a comprehensive social communication platform that demonstrates:
- Full-stack web development skills
- Modern web technologies (Laravel, React, WebRTC)
- Complex business logic implementation
- Real-time communication features
- Database design and optimization
- User experience design
- Security best practices

The project successfully integrates multiple features (chat, calling, blood donation, emergency services) into a cohesive platform, showcasing both technical proficiency and understanding of real-world application requirements.

---

## 📞 Contact & Support

For questions during viva, be prepared to discuss:
- Why you chose Laravel + React + Inertia.js
- How WebRTC signaling works
- Database design decisions
- Security considerations
- Performance optimizations
- Future scalability plans

**Good luck with your viva! 🎓**


