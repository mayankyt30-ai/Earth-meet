# 🚀 Smart Meet - Professional Video Conferencing

Smart Meet is a modern, high-performance video conferencing application built with the MERN stack and Agora. It features a premium, animated UI with real-time communication capabilities.

## ✨ Features

- **High-Quality Video/Audio**: Powered by Agora RTC SDK.
- **Real-Time Messaging**: In-meet chat powered by Socket.io.
- **Premium UI/UX**: Built with React, Framer Motion, and Glassmorphism design principles.
- **Instant & Scheduled Meets**: Create meetings for now or later.
- **Secure Authentication**: JWT-based login and registration.
- **Interactive Controls**: Toggle camera/mic, screen sharing, and participant management.

## 🛠️ Technology Stack

- **Frontend**: React.js, Framer Motion, Bootstrap, Material UI
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io, Agora RTC/RTM
- **Database**: MongoDB (Mongoose)
- **Styling**: Vanilla CSS with Modern Aesthetics

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB Atlas account
- Agora Developer account (for App ID)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mayankyt30-ai/smart-meet.git
   cd smart-meet
   ```

2. **Setup Server**:
   ```bash
   cd server
   npm install
   # Create a .env file with:
   # PORT=5000
   # MONGO_URI=your_mongodb_uri
   # JWT_SECRET=your_secret
   # AGORA_APP_ID=your_agora_id
   # AGORA_APP_CERTIFICATE=your_agora_cert
   npm start
   ```

3. **Setup Client**:
   ```bash
   cd ../client
   npm install
   npm start
   ```

## 📸 Screenshots

*(Add screenshots of your premium UI here)*

## 📄 License

Distributed under the MIT License.
