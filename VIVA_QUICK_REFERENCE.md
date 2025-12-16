# OneChat - Viva Quick Reference Guide

## 🎯 Project in One Sentence
**OneChat** is a full-stack social communication platform built with Laravel 12 and React 18, featuring real-time messaging, WebRTC voice/video calling, blood donation management, and emergency services.

---

## 📊 Quick Stats

- **Backend:** Laravel 12 (PHP 8.2+)
- **Frontend:** React 18.2.0
- **SPA Framework:** Inertia.js 2.0
- **Database:** SQLite/MySQL
- **Styling:** Tailwind CSS 4.1.0
- **Build Tool:** Vite 7.0.7
- **Total Models:** 10+ (User, Message, BloodDonor, BloodRequest, EmergencyRequest, FriendRequest, Call, Notification, etc.)
- **Total Controllers:** 15+
- **Total React Pages:** 20+

---

## 🔑 Core Features (5 Main Features)

### 1. **Real-time Messaging**
- One-on-one chat between friends
- Read/unread status
- Auto-polling every 2 seconds
- Conversation list sorted by last message

### 2. **WebRTC Voice/Video Calling**
- Peer-to-peer audio/video calls
- WebRTC signaling via server
- ICE candidate exchange
- Friend-only calling

### 3. **Blood Donation Management**
- Donor registration and search
- Blood request creation
- Hospital integration (Bangladesh hospitals)
- Request management workflow
- Location-based donor finding

### 4. **Emergency Request System**
- Multiple emergency types (fire, medical, accident, etc.)
- GPS location sharing
- Priority levels (1-4)
- Friend visibility only
- Google Maps integration

### 5. **Friend Request System**
- Send/accept/reject friend requests
- Friend list management
- User search functionality
- Friend-only messaging/calling

---

## 🗄️ Database Tables (Key Tables)

1. **users** - User accounts and profiles
2. **messages** - Chat messages
3. **friend_requests** - Friend relationships
4. **blood_donors** - Donor registrations
5. **blood_requests** - Blood donation requests
6. **emergency_requests** - Emergency situations
7. **calls** - Call records and WebRTC data
8. **notifications** - System notifications
9. **system_settings** - App configuration

---

## 🔄 Key API Endpoints

### Messaging
- `POST /api/messages/send` - Send message
- `GET /api/messages/{userId}` - Get messages

### Calling
- `POST /api/calls/initiate` - Start call
- `POST /api/calls/{id}/accept` - Accept call
- `POST /api/calls/{id}/end` - End call
- `POST /api/calls/{id}/offer` - Store WebRTC offer
- `POST /api/calls/{id}/answer` - Store WebRTC answer

### Blood Donation
- `GET /api/blood-donors` - List donors
- `POST /api/blood-donors` - Register as donor
- `POST /api/blood-donors/request` - Create blood request
- `GET /api/blood-donors/requests` - Get requests

### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/send` - Send friend request
- `POST /api/friends/{id}/accept` - Accept request

---

## 🏗️ Architecture Highlights

### Why Laravel?
- Robust backend framework
- Built-in authentication (Sanctum)
- Eloquent ORM for database
- MVC architecture
- Security features (CSRF, XSS protection)

### Why React?
- Component-based architecture
- Virtual DOM for performance
- Rich ecosystem
- Modern JavaScript features

### Why Inertia.js?
- Combines Laravel + React seamlessly
- Server-side routing
- No need for separate API
- Full-stack framework benefits

### Why WebRTC?
- Peer-to-peer communication
- Low latency
- No server media processing
- Direct browser-to-browser connection

---

## 🔒 Security Features

1. **Authentication:** Laravel Sanctum
2. **CSRF Protection:** Laravel middleware
3. **Input Validation:** Server-side validation
4. **Authorization:** Role-based (admin, manager, user)
5. **Friend-Only Access:** Users can only interact with friends
6. **SQL Injection Protection:** Eloquent ORM
7. **XSS Protection:** React's built-in protection
8. **Password Hashing:** Bcrypt

---

## ⚡ Performance Optimizations

1. **Database Indexes:** On frequently queried columns
2. **Query Optimization:** Eager loading, bulk queries
3. **React Memoization:** useMemo, useCallback
4. **Polling Intervals:** Configurable (2 seconds for messages)
5. **Asset Optimization:** Vite for fast builds

---

## 🎨 UI/UX Features

- **Responsive Design:** Mobile-first approach
- **Modern UI:** Tailwind CSS styling
- **Real-time Updates:** Live status indicators
- **Intuitive Navigation:** Easy-to-use interface
- **Loading States:** User feedback during operations
- **Error Handling:** Graceful error messages

---

## 📱 User Roles

1. **Admin:**
   - Full system access
   - User management
   - Manager management
   - System settings
   - All user features

2. **Manager:**
   - Manage blood requests
   - View all emergencies
   - All user features

3. **User:**
   - Messaging
   - Calling
   - Friend requests
   - Blood donation
   - Emergency requests

---

## 🔄 Data Flow Examples

### Message Sending Flow
```
User types message → Optimistic UI update → 
POST /api/messages/send → Server saves → 
Polling fetches new message → UI updates
```

### Call Flow
```
User clicks call → POST /api/calls/initiate → 
Server creates call record → Receiver polls → 
WebRTC offer/answer exchange → ICE candidates → 
Peer connection → Media streams → Call active
```

### Blood Request Flow
```
User creates request → Status: pending → 
Manager manages → Status: in_progress → 
Requester confirms → Status: completed
```

---

## 💡 Key Technical Decisions

1. **Polling vs WebSockets:** Chose polling for simplicity (can upgrade to WebSockets later)
2. **SQLite for Development:** Easy setup, can switch to MySQL for production
3. **Inertia.js:** Avoids building separate REST API
4. **WebRTC:** Direct peer-to-peer for better performance
5. **Friend-Only System:** Privacy and security consideration

---

## 🐛 Challenges Solved

1. **Real-time Updates:** Implemented polling mechanism
2. **WebRTC Signaling:** Server-based SDP exchange
3. **Friend Relationships:** Bidirectional friend checking
4. **Blood Request Workflow:** Multi-step approval system
5. **Location Services:** GPS integration for emergencies
6. **Performance:** Optimized database queries

---

## 📈 Scalability Considerations

1. **Database:** Can migrate from SQLite to MySQL/PostgreSQL
2. **Caching:** Can add Redis for session/cache
3. **WebSockets:** Can replace polling with Laravel Echo + Pusher
4. **CDN:** Can add for static assets
5. **Load Balancing:** Can scale horizontally
6. **Queue System:** Laravel queues for background jobs

---

## 🎓 What Makes This Project Stand Out

1. **Full-Stack Integration:** Seamless Laravel + React integration
2. **Real-time Features:** WebRTC calling, live messaging
3. **Complex Business Logic:** Blood donation workflow, emergency management
4. **Modern Tech Stack:** Latest versions of Laravel and React
5. **Complete Feature Set:** Multiple integrated features
6. **Production-Ready:** Security, validation, error handling

---

## ❓ Common Viva Questions & Answers

### Q: Why did you choose Laravel?
**A:** Laravel provides robust backend features, built-in authentication, Eloquent ORM, and follows MVC architecture. It's perfect for rapid development with security best practices.

### Q: How does WebRTC work in your project?
**A:** When a user initiates a call, we create a peer connection, generate an SDP offer, and exchange it via the server. ICE candidates are exchanged for NAT traversal, and then media streams are directly exchanged between browsers.

### Q: How do you handle real-time updates?
**A:** Currently using polling (every 2 seconds) for messages and status. This can be upgraded to WebSockets for true real-time updates, but polling works well for the current scale.

### Q: What's the difference between admin and manager?
**A:** Admin has full system control (user management, settings, etc.). Manager can manage blood requests and view emergencies but cannot manage users or system settings.

### Q: How do you ensure users can only message friends?
**A:** Server-side validation checks friend relationship before allowing message sending. The frontend also checks, but server validation is the security layer.

### Q: How does the blood request management work?
**A:** Users create requests (pending) → Managers can manage them (in_progress) → Requester confirms management → Request completed/cancelled.

### Q: What security measures did you implement?
**A:** CSRF protection, input validation, role-based authorization, friend-only access, SQL injection prevention via Eloquent, XSS protection via React, and password hashing.

### Q: How would you scale this application?
**A:** Migrate to MySQL/PostgreSQL, add Redis caching, implement WebSockets, use CDN for assets, implement queue system for background jobs, and add load balancing.

---

## 🚀 Demo Flow (Suggested)

1. **Login** - Show authentication
2. **Friend Request** - Send and accept friend request
3. **Messaging** - Send messages, show real-time updates
4. **Calling** - Initiate and accept a call
5. **Blood Donation** - Register as donor, create request
6. **Emergency** - Create emergency request
7. **Admin Panel** - Show admin features (if admin account)

---

## 📚 Technologies Used (Complete List)

### Backend
- Laravel 12
- PHP 8.2+
- Laravel Sanctum
- Eloquent ORM
- SQLite/MySQL

### Frontend
- React 18.2.0
- Inertia.js 2.0
- Tailwind CSS 4.1.0
- Axios 1.11.0
- Headless UI 2.0
- Vite 7.0.7

### Communication
- WebRTC (for calling)
- REST API
- Polling mechanism

### Development Tools
- Composer
- NPM
- Git

---

## ✅ Project Completion Status

- ✅ User Authentication & Authorization
- ✅ Real-time Messaging
- ✅ Voice/Video Calling (WebRTC)
- ✅ Friend Request System
- ✅ Blood Donation Management
- ✅ Emergency Request System
- ✅ Admin Panel
- ✅ Notification System
- ✅ Profile Management
- ✅ Responsive UI Design

---

**Good luck with your viva! 🎓**

Remember to:
- Be confident
- Explain your technical decisions
- Show enthusiasm about your project
- Be ready to discuss improvements
- Demonstrate the application if possible


