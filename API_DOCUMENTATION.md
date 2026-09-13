# JECA Prep Hub API Documentation

## Overview

JECA Prep Hub provides a comprehensive REST API for managing exam preparation workflows, including authentication, question management, mock tests, and performance analytics.

**Base URL:** `http://localhost:4000/api`

**Authentication:** All protected endpoints require a valid JWT token in the `Authorization` header.

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation:**
- Name: 2-80 characters required
- Email: Valid email format required
- Password: Minimum 8 characters required

---

### Login User
**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Invalid email or password format
- `401`: Incorrect credentials

---

### Get Current User
**GET** `/auth/me`

Retrieve the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

---

## Questions Endpoints

### List Questions
**GET** `/questions`

Retrieve questions with filtering and pagination.

**Query Parameters:**
- `search` (optional): Search in question text and topic
- `subject` (optional): Filter by subject name
- `difficulty` (optional): "Easy", "Medium", "Hard", or "All"
- `sourceType` (optional): "PYQ", "MOCK", "PRACTICE", "PREDICTED", or "All"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 12, max: 50)

**Example:**
```
GET /questions?subject=C%20Programming&difficulty=Hard&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "question-uuid",
      "questionText": "What is a pointer in C?",
      "questionType": "SINGLE",
      "subject": "C Programming",
      "topic": "Pointers",
      "difficulty": "Medium",
      "options": [
        { "id": "A", "text": "A variable holding a memory address" },
        { "id": "B", "text": "A function parameter" },
        { "id": "C", "text": "A data structure" },
        { "id": "D", "text": "A reserved keyword" }
      ],
      "marks": 1,
      "sourceType": "PRACTICE",
      "year": null
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "subjects": ["C Programming", "Data Structures", "DBMS", ...]
}
```

---

### Get Single Question
**GET** `/questions/:id`

Retrieve a specific question by ID.

**Response:** `200 OK`
```json
{
  "id": "question-uuid",
  "questionText": "What is a pointer in C?",
  "questionType": "SINGLE",
  "subject": "C Programming",
  "topic": "Pointers",
  "difficulty": "Medium",
  "options": [...],
  "correctAnswers": ["A"],
  "explanation": "A pointer is a variable that stores a memory address...",
  "marks": 1,
  "negativeMarks": 0.25,
  "source": "JECA Prep Hub original practice question bank",
  "sourceType": "PRACTICE"
}
```

---

### Create Question (Admin Only)
**POST** `/questions`

Create a new question (requires ADMIN role).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "questionText": "What is encapsulation?",
  "questionType": "SINGLE",
  "subject": "Object-Oriented Programming",
  "topic": "OOP Concepts",
  "difficulty": "Easy",
  "options": [
    { "id": "A", "text": "Hiding internal implementation" },
    { "id": "B", "text": "Making code reusable" },
    { "id": "C", "text": "Creating classes" },
    { "id": "D", "text": "Defining methods" }
  ],
  "correctAnswers": ["A"],
  "explanation": "Encapsulation is the bundling of data and methods...",
  "marks": 1,
  "negativeMarks": 0.25,
  "sourceType": "PRACTICE",
  "source": "JECA Prep Hub original practice question bank"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-question-uuid",
  ...
}
```

---

## Mock Tests Endpoints

### List Available Mocks
**GET** `/mock-tests`

Retrieve available mock test configurations.

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "full-mock-1",
      "title": "Full Length Mock 01",
      "questionCount": 100,
      "durationMinutes": 120,
      "level": "Balanced"
    },
    {
      "id": "full-mock-2",
      "title": "Full Length Mock 02",
      "questionCount": 100,
      "durationMinutes": 120,
      "level": "Exam-ready"
    },
    {
      "id": "full-mock-3",
      "title": "Full Length Mock 03",
      "questionCount": 100,
      "durationMinutes": 120,
      "level": "Challenging"
    }
  ],
  "marking": {
    "single": "+1 / −0.25",
    "multiple": "+2 / partial +1 / −0.5"
  }
}
```

---

### Start Test Attempt
**POST** `/mock-tests/start`

Initiate a test attempt and receive questions.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "testId": "full-mock-1",
  "testName": "Full Length Mock 01",
  "count": 100,
  "durationMinutes": 120,
  "subject": null
}
```

Optional `subject` parameter filters questions to a specific subject.

**Response:** `201 Created`
```json
{
  "attemptId": "attempt-uuid",
  "testName": "Full Length Mock 01",
  "startedAt": "2025-08-31T10:00:00.000Z",
  "endAt": "2025-08-31T12:00:00.000Z",
  "questions": [
    {
      "id": "question-uuid",
      "questionText": "...",
      "questionType": "SINGLE",
      "subject": "C Programming",
      "topic": "Pointers",
      "difficulty": "Medium",
      "options": [...],
      "marks": 1
    },
    ...
  ]
}
```

---

### Save Answer
**POST** `/mock-tests/:attemptId/answer`

Save or update an answer for a question.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "questionId": "question-uuid",
  "selectedOptionIds": ["A"],
  "markedForReview": false,
  "timeSpentSeconds": 45
}
```

For MULTIPLE-type questions, `selectedOptionIds` can contain multiple values.

**Response:** `200 OK`
```json
{
  "saved": true,
  "savedAt": "2025-08-31T10:05:32.000Z"
}
```

---

### Submit Test Attempt
**POST** `/mock-tests/:attemptId/submit`

Submit a completed test and calculate the score.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "score": 76.5,
  "maximumScore": 100,
  "correct": 71,
  "incorrect": 18,
  "unattempted": 11,
  "partial": 3,
  "accuracy": 82.5,
  "subjectBreakdown": [
    {
      "subject": "C Programming",
      "correct": 8,
      "incorrect": 2,
      "unattempted": 0,
      "score": 9.5,
      "maximumScore": 10,
      "accuracy": 80
    },
    ...
  ],
  "questionScores": [
    {
      "questionId": "question-uuid",
      "status": "correct",
      "score": 1,
      "maximumScore": 1
    },
    ...
  ],
  "attempt": {
    "id": "attempt-uuid",
    "testName": "Full Length Mock 01",
    "startedAt": "2025-08-31T10:00:00.000Z",
    "submittedAt": "2025-08-31T11:58:00.000Z"
  },
  "review": [
    {
      "id": "question-uuid",
      "questionText": "...",
      "options": [...],
      "correctAnswers": ["A"],
      "selectedOptionIds": ["A"],
      "explanation": "...",
      "marksObtained": 1,
      "subject": "C Programming",
      "difficulty": "Medium"
    },
    ...
  ]
}
```

---

### Log Session Event
**POST** `/mock-tests/:attemptId/event`

Log session events (e.g., tab visibility changes).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "type": "visibility-change"
}
```

**Response:** `204 No Content`

---

## Previous Year Questions (PYQ) Endpoints

### List PYQ References
**GET** `/pyq`

Retrieve official paper references and PYQ policy information.

**Response:** `200 OK`
```json
{
  "papers": [
    {
      "year": 2025,
      "title": "JECA 2025 (Tentative)",
      "status": "Reference published; questions to be verified",
      "source": "WBJEEB"
    },
    {
      "year": 2024,
      "title": "JECA 2024",
      "status": "Questions and answer key available",
      "source": "WBJEEB"
    },
    ...
  ],
  "questions": [],
  "notice": "No questions are labelled PYQ in this starter data. Official text and answer keys must be verified before import."
}
```

---

### Get PYQ Reference by Year
**GET** `/pyq/:year`

Retrieve reference for a specific year.

**Example:** `GET /pyq/2024`

**Response:** `200 OK`
```json
{
  "paper": {
    "year": 2024,
    "title": "JECA 2024",
    "status": "Questions and answer key available",
    "source": "WBJEEB"
  },
  "questions": []
}
```

---

## User Data Endpoints

### Get Attempts
**GET** `/attempts`

Retrieve all test attempts for the authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "attempt-uuid",
      "testName": "Full Length Mock 01",
      "startedAt": "2025-08-31T10:00:00.000Z",
      "endAt": "2025-08-31T12:00:00.000Z",
      "submittedAt": "2025-08-31T11:58:00.000Z",
      "questionCount": 100,
      "result": {
        "score": 76.5,
        "maximumScore": 100,
        "correct": 71,
        "accuracy": 82.5
      }
    },
    ...
  ]
}
```

---

### Get Analytics
**GET** `/analytics`

Retrieve performance analytics for the authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "totalTests": 3,
  "averageScore": 74.25,
  "bestScore": 82,
  "averageAccuracy": 79.5,
  "questionsAttempted": 285,
  "correctAnswers": 227,
  "strongestSubject": "C Programming",
  "weakestSubject": "Machine Learning",
  "trend": [
    { "name": "Test 1", "score": 68, "date": "2025-08-29T14:00:00Z" },
    { "name": "Test 2", "score": 76.5, "date": "2025-08-31T10:00:00Z" },
    { "name": "Test 3", "score": 78, "date": "2025-09-02T09:00:00Z" }
  ]
}
```

---

### Get Bookmarks
**GET** `/bookmarks`

Retrieve all bookmarked questions.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "question-uuid",
      "questionText": "...",
      "options": [...],
      "subject": "C Programming",
      "topic": "Pointers",
      "difficulty": "Medium",
      "sourceType": "PRACTICE"
    },
    ...
  ]
}
```

---

### Add Bookmark
**POST** `/bookmarks`

Bookmark a question.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "questionId": "question-uuid"
}
```

**Response:** `201 Created`
```json
{
  "bookmarked": true
}
```

---

### Remove Bookmark
**DELETE** `/bookmarks/:questionId`

Remove a bookmark.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `204 No Content`

---

## Admin Endpoints

### Get Admin Overview
**GET** `/admin/overview`

Retrieve admin dashboard statistics (ADMIN only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "users": 42,
  "questions": 110,
  "attempts": 156,
  "storage": "in-memory development repository"
}
```

---

### Import Questions (Validation Only)
**POST** `/admin/questions/import`

Validate a batch of questions for import (ADMIN only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
[
  {
    "questionText": "What is deadlock?",
    "optionA": "A process waiting for a resource",
    "optionB": "Two or more processes waiting for each other",
    "optionC": "A system crash",
    "optionD": "A memory leak",
    "correctAnswers": "B",
    "questionType": "SINGLE",
    "subject": "Operating Systems",
    "topic": "Synchronization",
    "difficulty": "Medium",
    "marks": 1,
    "negativeMarks": 0.25,
    "sourceType": "PRACTICE",
    "explanation": "Deadlock occurs when two or more processes are blocked..."
  },
  ...
]
```

**Response:** `400` (Validation failure) or `501` (Validation success, persistence pending)
```json
{
  "message": "Validation succeeded. Persistent import is ready once the Prisma repository is enabled for your PostgreSQL instance.",
  "validated": 15
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "message": "Human-readable error message",
  "issues": {} // Optional validation issues
}
```

### Common HTTP Status Codes

- `200 OK`: Successful GET/POST/PUT request
- `201 Created`: Successful resource creation
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid input or validation failure
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User lacks required permissions (e.g., ADMIN role)
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Resource already exists (e.g., duplicate email)
- `501 Not Implemented`: Feature requires Prisma/PostgreSQL (persistent storage)

---

## Marking System

### Single-Correct Questions (CATEGORY_1)
- Correct answer: +1 mark
- Incorrect/Unattempted: -0.25 marks

### Multiple-Correct Questions (CATEGORY_2)
- Exact match (all correct): +2 marks
- Partial match (all selected are correct, but some missed): +1 mark
- Incorrect/Unattempted: -0.5 marks (or 0 if negative marking disabled)

---

## Rate Limiting

Authentication endpoints are rate-limited:
- **Limit:** 80 requests per 15 minutes
- **Window:** 15 minutes
- **Headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Supported Subjects

1. C Programming
2. Data Structures
3. Operating Systems
4. Database Management Systems (DBMS)
5. Computer Networks
6. Object-Oriented Programming (OOP)
7. Software Engineering
8. Unix / Shell
9. Introduction to Computers
10. Machine Learning

---

## Implementation Notes

### In-Memory Storage (Development)
The current API uses an in-memory data store for demonstration. All data is lost when the server restarts. For persistent storage, enable the Prisma PostgreSQL integration.

### JWT Token Expiry
Tokens expire after 7 days. Users must login again to receive a new token.

### CORS Configuration
The API is configured to accept requests from the frontend URL specified in the `FRONTEND_URL` environment variable.

### Security Features
- Passwords are hashed using bcryptjs (salt rounds: 12)
- JWT tokens are signed with a secret key
- Admin routes require both authentication and ADMIN role
- Input validation using Zod schema
- Helmet security headers enabled
- Rate limiting on auth endpoints
