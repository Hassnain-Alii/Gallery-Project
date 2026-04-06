# 🚀 GalleryPro Enterprise Edition (MERN)

A visually stunning, high-performance, and enterprise-grade modern Portfolio & Image Hub. This application features a highly polished design system employing glassmorphism, fluid micro-animations, and robust security mechanisms, making it a state-of-the-art MERN deployment.

**Frontend Live:** [https://gallery-project-frontend.vercel.app]
---

## 💫 App Capabilities & Features

### 🖥️ Frontend (Vite + React)
- **Stunning UI/UX**: Built with an advanced custom design system utilizing glassmorphism, dynamic gradients, and smooth animations.
- **Drag & Drop (DnD)**: Modern, intuitive file movement for image uploads with smooth drag-over animations and instant previews.
- **Image Optimization (Sharp)**: Automatically resizes and converts uploads to **WebP** for ultra-fast loading times.
- **Advanced Filtering & Search**: Instant search by author across the entire collection with smart debounce logic and animated loading feedback.
- **Favorites & Collections**: One-click persistent "Favorite" system to curate your personal digital collection.
- **One-Click Downloads**: High-speed downloads for all images with real-time progress indicators.
- **Micro-Animations**: Uses modern CSS transitions and Lucide-react for an interactive, premium feel.

### ⚙️ Backend (Node.js + Express)
- **Redis Caching**: Accelerated performance for frequent data queries (like author listing) using an in-memory Redis cluster.
- **Response Compression**: All API responses are compressed via gzip to reduce bandwidth and speed up page loads.
- **Supabase Storage**: Cloud-native file storage integrated for high performance and "forever free" production hosting.
- **Enterprise SSO Verification**: Server-side verification of Google ID tokens for maximum authentication security.
- **JWT Authentication**: Secure, stateful session management with short-lived tokens and strict server-side validation.
- **Silent Refresh Tokens**: Automatic background session renewal to maintain workflow without interruption.

---

## 🛡️ Security Architecture

We prioritize the safety of your data with an enterprise-grade security stack.

### 1. **`Helmet.js`**
- **What is it?**: A security-focused middleware for Express.
- **Why we use it?**: It automatically sets 15+ HTTP security headers, protecting against common attacks like Clickjacking, Cross-Site Scripting (XSS), and MIME-sniffing.

### 2. **`HPP (HTTP Parameter Pollution)`**
- **What is it?**: A security middleware that scans the endpoint URL parameters.
- **Why we use it?**: To prevent attackers from confusing the server with multiple parameters of the same name, which could potentially bypass input validation or logic checks.

### 3. **`Pino-HTTP Logging`**
- **What is it?**: An extremely high-performance logging library for the JSON logs.
- **Why we use it?**: To provide a robust audit trail of all server interactions. For security teams, it provides detailed, structured data to monitor for anomalies without sacrificing performance.

### 4. **`Express Rate Limiting`**
- **What is it?**: A mechanism to limit the volume of requests a single IP can make.
- **Why we use it?**: We apply two levels of protection:
    - **General API Limiting**: Prevents DDoS and resource exhaustion.
    - **Auth-Specific Limiting**: Places strict limits on login/signup attempts to mitigate brute-force and credential stuffing attacks.

### 5. **`Advanced Session Management`**
- **Short-Lived Access Tokens**: JWTs expire in **"15 minutes"** to minimize the impact of token leakage.
- **Silent Refresh**: As long as you are actively using the application, your session is automatically extended.
- **Auto-Logout**: For your security, the application automatically logs you out after **"15 minutes of inactivity"**.

### 6. **`Input Validation (Express Validator)`**
- **What is it?**: A powerful set of validation and sanitization tools.
- **Why we use it?**: Every piece of user input (emails, passwords, profile updates) is strictly validated and sanitized (escaped) to prevent **SQL/NoSQL Injection** and **Stored XSS**.

### 7. **`CORS (cors)`**
- **What it does?**: Cross-Origin Resource Sharing.
- **How it protects?**: Strictly limits which frontends can communicate with the backend. Ensuring malicious websites cannot interact with your APIs on behalf of authenticated users via cross-origin requests.

### 8. **`Compression (compression)`**
- **What it does?**: Compresses outbound HTTP responses (GZIP/Deflate).
- **How it protects?**: While primarily a performance enhancement, it mitigates bandwidth-exhaustion attacks by maximizing data throughput efficiency.

### 9. **`Secured Data Handling`**
- **Bcryptjs**: All passwords are salted and hashed 10 times, meaning they are mathematically impossible to reverse-engineer.
- **Owner-Only Authorization**: Every sensitive operation (delete, favorites, profile) is protected by a strict ownership check, ensuring users can only edit their own data.

### 10. **`Google OAuth 2.0 (SSO)`**
- **What is it?**: A modern, industry-standard authentication protocol.
- **Why we use it?**: It provides a premium "One-Tap" login experience while offloading password security to Google's world-class infrastructure. We verify ID tokens on the server to ensures account integrity and prevent credential theft.

---

## 🏗️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Object Storage**: Supabase Storage
- **Caching**: Redis
- **Authentication**: JWT, Google OAuth 2.0
- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS (Tailwind Modern Utilities)
- **DevOps**: Docker, Docker Compose

---

## 🏗️ Infrastructure Components

### 1. **Docker & Docker Compose**
Ensures the application runs identically on any machine. Our `docker-compose.yml` orchestrates the entire stack (Node, Mongo, Redis) in isolated, secure networks, making deployment as simple as one command.

### 2. **Redis In-Memory Data Store**
Reduces database load and speeds up data retrieval. By caching metadata in Redis, we achieve near-instant response times for returning users.

### 3. **Supabase Cloud Storage**
Handles high-performance file storage (like user images and avatars) with a "forever free" tier, ensuring a cost-effective and enterprise-grade production environment.

---

## 🐳 Quick Start (Docker Orchestration)

To spin up the local development cluster quickly:

```bash
# Start all core services in detached mode
docker-compose up -d
```

*Open `http://localhost:5175` and enjoy the product!*
