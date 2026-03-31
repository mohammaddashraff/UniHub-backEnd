# UniHub Back-End API

A Node.js + Express REST API for a university learning platform.

UniHub supports user authentication, course management, tasks, course materials, posts, comments, voting, profile/course image uploads, and AI-assisted endpoints.

## Why This Project

This backend is built as the core service layer for an LMS-like system where students and instructors can collaborate around courses, announcements, materials, and discussions.

## Core Features

- Authentication and authorization with JWT
- User profile management and photo upload
- Course listing, registration, search, rating, and instructor analytics
- Task management per authenticated user
- Course material upload/edit/delete with cloud storage integration
- Posts and announcements per course
- Comment system with AI-generated comment support
- Upvote/downvote system on posts
- Admin endpoints for course and user management
- Health-check endpoint for deployment monitoring

## Tech Stack

- Node.js
- Express.js
- MySQL / MySQL2
- Firebase Admin SDK (storage)
- Multer + Sharp (uploads and image processing)
- JWT (`jsonwebtoken`)
- Nodemailer (OTP email flow)
- OpenAI API (AI endpoints)

## Project Structure

```text
UniHub-backEnd/
├── Controllers/
├── Services/
├── Utils/
├── app.js
├── routes.js
├── package.json
└── README.md
```

## API Overview

### Auth & User

- `POST /signUp`
- `POST /signIn`
- `DELETE /deleteUser`
- `PUT /editUser`
- `GET /getUserData`
- `POST /forgetPassword`
- `POST /checkOTP`
- `PUT /changePassword`
- `POST /upload-photo`
- `GET /get-photo`
- `GET /user/:userId`

### Courses

- `GET /courses`
- `POST /courses/register`
- `GET /courses/registered`
- `GET /courses/search`
- `GET /courses/:courseID`
- `GET /courses/:courseId/status`
- `PUT /courses/:courseId/archive`
- `POST /course/:courseId/rate`
- `GET /course/:courseId/viewrate`
- `GET /course/:courseId/rating`
- `GET /course/:courseId/registered`
- `GET /course/userstatistics`
- `GET /course/instructor`
- `GET /search-courses`
- `GET /instructor-courses-count`
- `GET /instructor-user-count`
- `POST /upload-course-photo`
- `GET /course-photo/:courseId`

### Tasks

- `POST /createTasks`
- `DELETE /deleteTasks`
- `GET /listTasks`
- `PUT /markTaskAsCompleted`

### Materials

- `POST /material/upload`
- `GET /material/course/:courseId`
- `PUT /material/edit`
- `PUT /material/:materialId/editDescription`
- `DELETE /material/delete/:materialId`

### Posts & Comments

- `POST /post/create/:courseId`
- `PUT /post/edit/:postId`
- `DELETE /post/delete/:postId`
- `GET /post/course/:courseId`
- `GET /posts`
- `GET /announcements/recent`
- `GET /posts/:courseId/tag/:tag`
- `POST /post/:postId/addcomment`
- `PUT /comment/:commentId`
- `DELETE /comment/:commentId`
- `GET /post/:postId/comments`
- `POST /posts/:postId/comment`

### Voting

- `POST /upvote/:postId`
- `POST /downvote/:postId`
- `GET /votes/:postId`
- `DELETE /votes/remove/:postId`

### Admin

- `POST /admin/create`
- `DELETE /admin/delete`
- `PUT /admin/edit/:courseId`
- `GET /users`
- `DELETE /deleteUser/:userId`

### AI & System

- `POST /chatGpt`
- `GET /health`

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mohammaddashraff/UniHub-backEnd.git
cd UniHub-backEnd
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Update `.env` with your database, JWT secret, SMTP credentials, Firebase settings, and OpenAI key.

### 4. Run the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API runs on `http://localhost:4000` by default.

## Available Scripts

- `npm run dev` - Start with Nodemon
- `npm start` - Start with Node.js
- `npm test` - Placeholder script (no automated tests yet)

## Author

Mohammad Ashraf

---
