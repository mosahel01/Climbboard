# Build a Full-Stack Real-Time Leaderboard Application

Build a complete, polished, production-style **real-time leaderboard application**.

The application should allow users to register, log in, submit scores for different games/activities, view live leaderboards, see their own ranking, and view historical score information.

The project should be clean, well-structured, easy to understand, and actually functional end-to-end.

Do not build only a backend API. Build both:

- **Frontend:** React.js
- **Backend:** Node.js + Express.js
- **Database / caching / leaderboard engine:** Redis
- **Authentication:** JWT-based authentication
- **Real-time updates:** WebSockets using Socket.IO

The primary technical focus of this project is learning how Redis Sorted Sets can be used to efficiently implement real-time leaderboards.

---

# 1. Overall Goal

Create an imaginary platform called **BazariRank**.

BazariRank is a platform where users compete in different games or activities and earn scores.

Users should be able to:

1. Create an account.
2. Log in and log out.
3. Browse available games.
4. Select a game.
5. Submit a score.
6. View the leaderboard for that game.
7. See their current rank.
8. See the top players.
9. See their score history.
10. See their personal statistics.
11. See leaderboard changes in real time without refreshing the page.
12. View reports for top-performing players over a selected period.

The application should feel like a real product rather than a demo consisting of disconnected API endpoints.

---

# 2. Technology Stack

## Frontend

Use:

- React.js
- Vite
- React Router
- JavaScript or TypeScript
- CSS / modern styling solution
- Socket.IO client
- Fetch or Axios for API requests

Keep the frontend clean and component-based.

Suggested structure:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

Use reusable components rather than putting everything into one large component.

---

# 3. Backend

Use:

- Node.js
- Express.js
- Redis
- Socket.IO
- JWT
- bcrypt/bcryptjs
- dotenv
- CORS
- appropriate validation middleware

Suggested structure:

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── sockets/
│   ├── models/
│   ├── app.js
│   └── server.js
├── package.json
└── .env.example
```

Separate:

- Routes
- Controllers
- Business logic
- Redis operations
- Authentication
- Socket.IO logic

Do not put the entire backend into one `server.js` file.

---

# 4. Redis

Redis is the most important part of this project.

Use **Redis Sorted Sets (ZSETs)** as the primary mechanism for leaderboard ranking.

A leaderboard should NOT be implemented by fetching every user and sorting them in JavaScript.

Use Redis commands such as:

```text
ZADD
ZINCRBY
ZREVRANGE
ZREVRANK
ZSCORE
ZCARD
ZREMRANGEBYRANK
```

Use the appropriate modern Redis Node.js client.

---

# 5. Redis Data Model

Design a clear Redis key structure.

For example:

```text
leaderboard:{gameId}
user:{userId}
user:{userId}:scores
game:{gameId}
```

You may improve this structure if there is a better design.

## Leaderboard

Each game should have its own sorted set:

```text
leaderboard:game-1
```

Members:

```text
userId
```

Scores:

```text
numeric score
```

Example:

```text
leaderboard:game-1

user_123 -> 9500
user_456 -> 8700
user_789 -> 7200
```

Redis should automatically maintain the ordering.

---

# 6. Users

Users should have at least:

```text
id
username
email
passwordHash
createdAt
```

Never store plaintext passwords.

Passwords must be hashed using bcrypt/bcryptjs.

Do not return password hashes to the frontend.

---

# 7. Authentication

Implement:

## Registration

Endpoint:

```http
POST /api/auth/register
```

Request:

```json
{
  "username": "sahil",
  "email": "sahil@example.com",
  "password": "password123"
}
```

Validate:

- Username is required.
- Email is valid.
- Password meets minimum requirements.
- Email cannot already exist.
- Username cannot already exist.

Return an appropriate success response.

---

## Login

Endpoint:

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "sahil@example.com",
  "password": "password123"
}
```

Verify credentials and issue a JWT.

The frontend should store authentication appropriately and send the token with protected requests.

---

## Authentication Middleware

Create reusable authentication middleware.

For protected routes:

```text
Authorization: Bearer <token>
```

The middleware should:

1. Extract the token.
2. Verify the JWT.
3. Identify the user.
4. Attach the authenticated user to the request.
5. Reject invalid/expired tokens.

---

# 8. Games

Create multiple games/activities so the application demonstrates multiple leaderboards.

For example:

```text
Speed Run
Puzzle Master
Math Challenge
Word Rush
Memory Challenge
```

Each game should have:

```text
id
name
description
createdAt
```

You can seed the application with several games and sample users/scores.

---

# 9. Score Submission

Authenticated users should be able to submit scores.

Endpoint:

```http
POST /api/games/:gameId/scores
```

Example:

```json
{
  "score": 9500
}
```

Validate:

- User is authenticated.
- Game exists.
- Score is numeric.
- Score is within a reasonable range.
- Invalid scores are rejected.

When a score is submitted:

1. Validate the request.
2. Store the score/history entry.
3. Update the Redis Sorted Set.
4. Determine the user's new rank.
5. Emit a real-time leaderboard update through Socket.IO.
6. Return the updated score/rank information.

---

# 10. Important Score Behavior

Decide and document how multiple score submissions work.

Use this behavior:

**A user's leaderboard score should represent their highest score for that game.**

For example:

```text
Current score: 500

Submit: 700
→ leaderboard becomes 700

Submit: 600
→ leaderboard remains 700

Submit: 900
→ leaderboard becomes 900
```

However, every submission should still be recorded in score history.

This gives us both:

- Current best score
- Historical attempts

Use Redis to efficiently compare/update the leaderboard score.

Do not allow a lower score submission to decrease a user's best leaderboard score.

---

# 11. Leaderboard API

Create:

```http
GET /api/games/:gameId/leaderboard
```

Support pagination.

Example:

```http
GET /api/games/game-1/leaderboard?page=1&limit=20
```

Return:

```json
{
  "game": {
    "id": "game-1",
    "name": "Speed Run"
  },
  "entries": [
    {
      "rank": 1,
      "userId": "user-1",
      "username": "PlayerOne",
      "score": 9500
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Use Redis ranking commands rather than sorting data in application memory.

---

# 12. User Rank

Create:

```http
GET /api/games/:gameId/rank
```

Return something like:

```json
{
  "gameId": "game-1",
  "userId": "user-123",
  "score": 8500,
  "rank": 7
}
```

Use:

```text
ZREVRANK
ZSCORE
```

or equivalent Redis operations.

Remember that Redis ranks are zero-indexed, so convert them into a human-friendly rank beginning at 1.

---

# 13. Global Leaderboard

The application should also have a global leaderboard.

The global leaderboard should represent the overall performance of users across games.

Design a sensible scoring mechanism.

For example, maintain a global Redis Sorted Set:

```text
leaderboard:global
```

When a user's score improves in a game, update their global score according to a clearly defined rule.

For example:

```text
global score = sum of each user's best score across games
```

Document this decision in the README.

Provide:

```http
GET /api/leaderboard/global
```

with pagination.

---

# 14. Real-Time Updates

This is a core requirement.

Use:

```text
Socket.IO
```

When a user submits a score that changes the leaderboard, the backend should emit an event.

For example:

```text
leaderboard:update
```

The event should contain enough information for connected clients to update their UI.

Example:

```json
{
  "gameId": "game-1",
  "updatedUser": {
    "userId": "user-123",
    "username": "sahil",
    "score": 9500,
    "rank": 3
  }
}
```

The frontend should listen for this event and update the leaderboard automatically.

Do NOT require the user to refresh the browser.

---

# 15. Socket.IO Rooms

Use Socket.IO rooms so users can subscribe to a specific game's leaderboard.

For example:

```text
leaderboard:game-1
leaderboard:game-2
```

When a user opens a game's leaderboard:

```text
join game leaderboard room
```

When they leave:

```text
leave game leaderboard room
```

Only users watching the relevant leaderboard should receive that game's update events.

---

# 16. Score History

Create an API:

```http
GET /api/users/me/scores
```

Allow users to view their previous score submissions.

Each entry should contain:

```text
game
score
submittedAt
```

Support pagination.

Example:

```json
{
  "scores": [
    {
      "gameId": "game-1",
      "gameName": "Speed Run",
      "score": 9500,
      "submittedAt": "2026-09-12T10:00:00Z"
    }
  ]
}
```

---

# 17. User Dashboard

Create a dashboard for authenticated users.

Display:

- Username
- Total games played
- Best scores
- Current rankings
- Recent submissions
- Overall/global rank
- Number of games participated in

The dashboard should feel useful and polished.

---

# 18. Top Players Report

Implement reporting for top-performing players.

Endpoint:

```http
GET /api/reports/top-players
```

Support a time range.

Example:

```http
GET /api/reports/top-players?from=2026-09-01&to=2026-09-12
```

The report should identify the top players during the selected period.

Include information such as:

```text
rank
username
totalScore
numberOfSubmissions
bestScore
gamesPlayed
```

Do not pretend Redis Sorted Sets automatically provide arbitrary historical time-range analytics.

Use score history data to calculate period-based reports.

Document the tradeoff in the README.

---

# 19. Frontend Pages

Create these pages:

## Landing Page

A clean introduction to BazariRank.

Include:

- Product description
- Featured games
- Top players preview
- Login/register buttons

---

## Login Page

Fields:

```text
Email
Password
```

Include:

- Validation
- Loading state
- Error messages
- Successful redirect

---

## Registration Page

Fields:

```text
Username
Email
Password
Confirm Password
```

Include proper validation.

---

## Dashboard

Show the logged-in user's:

- Global rank
- Best scores
- Recent scores
- Games
- Statistics

---

## Games Page

Display all available games.

Each game should have:

- Name
- Description
- User's current score
- User's current rank
- View leaderboard button
- Submit score button

---

## Game Leaderboard Page

This is one of the most important pages.

Display:

```text
Game name

Your score
Your rank

#1 Player
#2 Player
#3 Player

Remaining leaderboard entries
```

Make the top three visually distinct.

Include:

- Pagination
- Real-time updates
- Loading state
- Empty state
- Error state

When another user submits a better score, the leaderboard should update automatically.

---

## Score History Page

Show:

```text
Game
Score
Date
```

Add pagination.

---

## Reports Page

Allow the user to select:

```text
Today
Last 7 days
Last 30 days
Custom range
```

Display the top players for that period.

Use tables and simple visualizations where appropriate.

---

# 20. UI / UX Requirements

The frontend should look polished.

Do NOT create a generic page with plain HTML elements everywhere.

Use a consistent design system.

The application should have:

- Responsive layout
- Navigation bar
- Sidebar or dashboard navigation where appropriate
- Cards
- Tables
- Ranking badges
- Loading indicators
- Empty states
- Error states
- Toast notifications
- Form validation
- Responsive mobile layout
- Clear typography
- Consistent spacing
- Accessible buttons and forms

Keep the design modern but not excessively complicated.

Prioritize usability over flashy animations.

---

# 21. Leaderboard Visual Design

The leaderboard should clearly communicate ranking.

Example:

```text
🥇  1   PlayerOne        12,450
🥈  2   PlayerTwo        11,980
🥉  3   PlayerThree      11,420

    4   PlayerFour       10,900
    5   PlayerFive       10,400
```

The current logged-in user's row should be visually identifiable.

If the user is outside the current page of rankings, show their rank separately.

---

# 22. API Structure

Use clean REST API conventions.

Suggested routes:

```text
/api/auth/register
/api/auth/login
/api/auth/me

/api/games
/api/games/:gameId

/api/games/:gameId/scores
/api/games/:gameId/leaderboard
/api/games/:gameId/rank

/api/users/me
/api/users/me/scores
/api/users/me/stats

/api/leaderboard/global

/api/reports/top-players
```

Use appropriate HTTP status codes.

For example:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

---

# 23. Error Handling

Create centralized backend error handling.

Do not expose raw stack traces to clients in production responses.

Use consistent API responses.

For example:

```json
{
  "success": false,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "The requested game does not exist."
  }
}
```

Successful responses can follow:

```json
{
  "success": true,
  "data": {}
}
```

Keep response structures consistent.

---

# 24. Validation

Validate all user-controlled input.

At minimum:

- Email
- Username
- Password
- Score
- Game ID
- Pagination parameters
- Date ranges

Reject malformed requests gracefully.

Do not trust frontend validation alone.

Backend validation is mandatory.

---

# 25. Security

Implement basic production-minded security practices.

Include:

- Password hashing
- JWT authentication
- Input validation
- CORS configuration
- Environment variables
- No hardcoded secrets
- Safe error messages
- Authentication middleware
- Reasonable score validation

Do not commit secrets.

Provide:

```text
.env.example
```

---

# 26. Environment Variables

Use environment variables such as:

```env
PORT=5000
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
CLIENT_URL=http://localhost:5173
```

Do not hardcode these values throughout the application.

---

# 27. Seed Data

Create a seed script that populates Redis with:

- Several users
- Several games
- Sample scores
- Leaderboard data
- Score history

This should make the application immediately interesting when launched locally.

Include enough sample data to demonstrate:

- Different rankings
- Different scores
- Multiple games
- Score history
- Global leaderboard

Clearly document how to run the seed script.

---

# 28. Redis Initialization

The backend should:

1. Connect to Redis on startup.
2. Handle connection errors gracefully.
3. Log connection status.
4. Avoid silently continuing when Redis is required but unavailable.
5. Close the Redis connection gracefully when the server shuts down.

Create a dedicated Redis configuration/service module.

---

# 29. Database Decision

For this project, Redis should be the primary data store.

However, structure the application so that data-access logic is separated from controllers and business logic.

If persistent relational/database storage is necessary for certain historical/reporting requirements, explain the reason clearly and use an appropriate lightweight database.

Do NOT unnecessarily introduce multiple databases just for complexity.

The main educational goal is Redis Sorted Sets.

---

# 30. Performance

The leaderboard system should take advantage of Redis's strengths.

Avoid:

```javascript
// BAD
const users = await getAllUsers();
users.sort((a, b) => b.score - a.score);
```

Prefer Redis operations such as:

```text
ZADD
ZREVRANGE
ZREVRANK
ZSCORE
ZCARD
```

Leaderboard retrieval should remain efficient even with a large number of users.

Pagination should happen through Redis rather than retrieving the entire leaderboard.

---

# 31. Architecture

Use a clean architecture similar to:

```text
React Frontend
       |
       | HTTP / REST
       |
       v
Express API
       |
       +------ Authentication
       |
       +------ Game Service
       |
       +------ Score Service
       |
       +------ Leaderboard Service
       |
       +------ Report Service
       |
       v
     Redis
       |
       +------ Users
       +------ Games
       +------ Score History
       +------ Sorted Sets
       +------ Global Leaderboard

Express
   |
   +---- Socket.IO
           |
           v
      Connected Clients
```

Keep responsibilities separated.

---

# 32. Real-Time Flow

Implement this flow:

```text
User submits score
        ↓
POST /api/games/:gameId/scores
        ↓
Authenticate user
        ↓
Validate score
        ↓
Check current best score
        ↓
If new best:
        ↓
Update Redis Sorted Set
        ↓
Calculate new rank
        ↓
Update global leaderboard
        ↓
Save score history
        ↓
Emit Socket.IO event
        ↓
Connected clients receive update
        ↓
React updates leaderboard
```

If the submitted score is not a new personal best, still save it to score history but do not unnecessarily update the leaderboard.

---

# 33. Testing

Add meaningful tests.

At minimum test:

### Authentication

- Registration
- Duplicate email
- Duplicate username
- Login
- Invalid password
- Protected route

### Scores

- Valid score submission
- Invalid score
- Higher score replaces leaderboard score
- Lower score does not replace leaderboard score
- Score history is recorded

### Leaderboards

- Correct ordering
- Correct rank
- Pagination
- Empty leaderboard
- Global leaderboard

### Reports

- Date filtering
- Correct top players
- Invalid date range

Focus on testing business logic rather than only testing trivial getters.

---

# 34. README

Create a detailed `README.md`.

It should explain:

1. What the project does.
2. Technology stack.
3. Architecture.
4. Redis data model.
5. Why Redis Sorted Sets are used.
6. How rankings work.
7. How real-time updates work.
8. Authentication flow.
9. API endpoints.
10. Environment variables.
11. Local setup.
12. How to start Redis.
13. How to seed the application.
14. How to start backend.
15. How to start frontend.
16. How to run tests.
17. Example API requests.
18. Important design decisions/tradeoffs.

Include a section explaining Redis commands used by the application.

For example:

```text
ZADD
ZREVRANGE
ZREVRANK
ZSCORE
ZCARD
```

Explain what each command does and why it is useful.

---

# 35. Docker

If practical, add Docker support.

Provide a:

```text
docker-compose.yml
```

that can start:

```text
Redis
Backend
Frontend
```

If Docker makes the project unnecessarily complicated, at minimum provide a simple Redis Docker configuration.

The application should also be runnable without Docker if possible.

---

# 36. Project Scripts

Create sensible npm scripts.

For example:

```json
{
  "scripts": {
    "dev": "...",
    "start": "...",
    "test": "...",
    "seed": "..."
  }
}
```

Make sure the commands actually work.

---

# 37. Code Quality

The code should be:

- Clean
- Readable
- Modular
- Consistent
- Properly named
- Easy for a beginner/intermediate developer to understand

Avoid unnecessary abstractions.

Do not create huge files.

Do not duplicate business logic.

Do not use clever code when straightforward code is clearer.

Add comments only where they provide useful context.

---

# 38. Important Development Instructions

Before writing code:

1. Inspect the existing project structure.
2. Read any provided project specification completely.
3. Do not overwrite existing files blindly.
4. Determine what already exists.
5. Create a clear implementation plan.
6. Then implement the project incrementally.

Before considering the project complete:

1. Run the backend.
2. Run the frontend.
3. Verify Redis connection.
4. Test registration.
5. Test login.
6. Test score submission.
7. Test leaderboard retrieval.
8. Test rank retrieval.
9. Test score history.
10. Test real-time leaderboard updates.
11. Test reports.
12. Test error cases.
13. Fix any runtime/build errors.
14. Verify that all npm scripts work.
15. Verify the README instructions are accurate.

Do not claim something works without actually testing it.

---

# 39. Final User Experience

When the project is finished, I should be able to:

```text
Open the application
        ↓
Register
        ↓
Log in
        ↓
See dashboard
        ↓
Choose a game
        ↓
Submit a score
        ↓
See my new rank
        ↓
Open leaderboard
        ↓
See my position
        ↓
Open another browser/tab
        ↓
Submit a score as another user
        ↓
Watch the leaderboard update automatically
        ↓
View score history
        ↓
View reports
```

Everything should work as one coherent application.

---

# 40. Definition of Done

The project is complete only when all of the following are true:

- [ ] React frontend works.
- [ ] Express backend works.
- [ ] Redis connection works.
- [ ] User registration works.
- [ ] User login works.
- [ ] JWT authentication works.
- [ ] Passwords are hashed.
- [ ] Multiple games exist.
- [ ] Users can submit scores.
- [ ] Score history is stored.
- [ ] Personal best scores are maintained.
- [ ] Redis Sorted Sets power the leaderboards.
- [ ] Individual game leaderboards work.
- [ ] Global leaderboard works.
- [ ] User rankings work.
- [ ] Leaderboards support pagination.
- [ ] Socket.IO real-time updates work.
- [ ] Users can see their own statistics.
- [ ] Top player reports work.
- [ ] Date filtering works.
- [ ] Input validation works.
- [ ] Error handling works.
- [ ] Loading and empty states exist.
- [ ] Responsive UI exists.
- [ ] Seed data exists.
- [ ] `.env.example` exists.
- [ ] README is complete.
- [ ] Tests exist and pass.
- [ ] No secrets are committed.
- [ ] No major console errors exist.
- [ ] No major runtime errors exist.
- [ ] Frontend and backend build successfully.

---

# Final Instruction

Prioritize **correctness, clean architecture, usability, and a polished experience** over adding unnecessary features.

The application should demonstrate a real understanding of:

- Express.js
- React.js
- REST APIs
- JWT authentication
- Redis
- Redis Sorted Sets
- Real-time communication
- Socket.IO
- Score/rank calculations
- Pagination
- Historical data
- Backend validation
- Full-stack application architecture

Most importantly, the leaderboard must genuinely be powered by **Redis Sorted Sets**, and the frontend must genuinely receive **real-time leaderboard updates** through Socket.IO.

Build the project in a way that a developer can read the code and clearly understand how the entire system works.