# JECA Prep Hub - localStorage Guide

## Overview

JECA Prep Hub uses browser `localStorage` to persist critical user data locally, enabling features like:
- **Offline exam continuation:** If the browser refreshes or network drops, your test session is restored
- **Automatic session recovery:** Answers are preserved and the timer continues from where it left off
- **Bookmark persistence:** Your bookmarked questions survive browser restarts
- **Authentication persistence:** Your login session persists across browser sessions
- **Analytics persistence:** Performance data is retained locally

---

## What's Stored in localStorage

### 1. Session Data (`jeca-prep-session`)

**Stored by:** `AuthContext`

**Data:**
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "ADMIN";
  };
  token: string; // JWT token
  mode: "api" | "local"; // "api" = server-backed, "local" = demo mode
}
```

**Lifetime:** Until logout or manual cache clear

**Use Case:** Maintaining user authentication across page refreshes

---

### 2. Active Exam Session (`jeca-prep-active-exam`)

**Stored by:** `ExamContext`

**Data:**
```typescript
{
  attemptId: string;
  remote: boolean; // true if backed by API
  testId: string;
  title: string;
  questions: Question[];
  answers: {
    [questionId: string]: {
      questionId: string;
      selectedOptionIds: string[];
      markedForReview?: boolean;
      timeSpentSeconds?: number;
    };
  };
  currentIndex: number; // Current question being viewed
  startedAt: string; // ISO timestamp
  endAt: string; // ISO timestamp when test will expire
  submitted?: boolean;
}
```

**Lifetime:** Until test is submitted or manually discarded

**Use Case:** Test session recovery on page refresh or browser restart

---

### 3. Exam Results (`jeca-prep-last-result`)

**Stored by:** `ExamContext`

**Data:**
```typescript
{
  score: number;
  maximumScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  partial: number;
  accuracy: number;
  subjectBreakdown: Array<{
    subject: string;
    correct: number;
    incorrect: number;
    unattempted: number;
    score: number;
    maximumScore: number;
    accuracy: number;
  }>;
  questionScores: Array<{
    questionId: string;
    status: "correct" | "incorrect" | "unattempted" | "partial";
    score: number;
    maximumScore: number;
  }>;
  review: Array<{
    id: string;
    questionText: string;
    // ... full question data
    selectedOptionIds: string[];
    marksObtained: number;
  }>;
  submittedAt: string; // ISO timestamp
  testName: string;
}
```

**Lifetime:** Until next test is submitted

**Use Case:** Displaying results and review after test submission

---

### 4. Bookmarks (`jeca-prep-bookmarks`)

**Stored by:** `ExamContext`

**Data:**
```typescript
string[] // Array of question IDs
```

Example:
```json
["q-uuid-1", "q-uuid-2", "q-uuid-3"]
```

**Lifetime:** Until explicitly removed

**Use Case:** Quickly accessing frequently saved questions for revision

---

## How Recovery Works

### Scenario 1: Browser Refresh During Active Test

1. User is taking an exam
2. User accidentally refreshes the page (or closes browser tab and reopens)
3. React app loads and checks localStorage for `jeca-prep-active-exam`
4. `ExamContext` finds active session and restores:
   - All questions
   - All answers given so far
   - Current question index
   - Timer state (calculates remaining time from `endAt` timestamp)
5. User can continue where they left off

### Scenario 2: Network Disconnection

1. User is answering questions, answers are autosaved locally
2. Network connection drops
3. Browser shows "Offline — answers saved locally" message
4. User can continue answering (locally)
5. When connection is restored, answers sync to backend API
6. Even if browser closes, answers are preserved in localStorage

### Scenario 3: Session Expiry

1. Test timer reaches 00:00
2. Exam automatically submits (backend validates end time)
3. Results are calculated and stored in `jeca-prep-last-result`
4. User navigates to results page
5. Results are displayed from localStorage
6. User can review answers even if offline

---

## Storage Limits

### Browser Limits

| Browser | localStorage Limit |
|---------|-------------------|
| Chrome | ~10 MB |
| Firefox | ~10 MB |
| Safari | ~5 MB |
| Edge | ~10 MB |
| IE 11 | ~10 MB |

### JECA Prep Hub Usage

Typical data storage for one test attempt:
- **Questions (100 questions):** ~400 KB
- **Answers:** ~50 KB
- **Session metadata:** ~5 KB
- **Bookmarks:** ~10 KB
- **Results:** ~100 KB

**Total per test:** ~565 KB (well within limits)

**Storage for 10 tests:** ~5.65 MB (still well within limits)

---

## Clearing localStorage

### Manual Clearing

**In Browser Console:**
```javascript
// Clear all localStorage
localStorage.clear();

// Clear specific keys
localStorage.removeItem('jeca-prep-session');
localStorage.removeItem('jeca-prep-active-exam');
localStorage.removeItem('jeca-prep-last-result');
localStorage.removeItem('jeca-prep-bookmarks');
```

**In Browser Settings:**
1. Open DevTools (F12 or Cmd+Shift+I)
2. Go to "Application" tab
3. Click "Storage" → "Local Storage"
4. Right-click on the site and select "Clear"

**Or:**
1. Settings → Privacy & Security
2. Clear browsing data → "Cookies and other site data"
3. Select time range and clear

### Automatic Clearing

- **Session expires:** After 7 days (JWT token expiry)
- **No automatic cleanup:** Data persists unless manually cleared

---

## Offline Functionality

### What Works Offline

✅ **Local Demo Mode:**
- View questions
- Take tests with local question bank
- Get instant scoring
- Review answers
- View analytics
- Bookmark questions

✅ **During Active API Test:**
- Continue answering questions
- Save answers locally
- View question palette
- Get timer updates
- Mark for review

### What Requires Connection

❌ **Login/Register** - Need to connect to API
❌ **Syncing answers** - Requires API endpoint
❌ **Submitting test** - Final submission sent to API
❌ **Fetching questions** - Only when starting new test

### Offline Indicators

The app shows status in the exam header:
- **"Saved just now"** - Connected and synced
- **"Offline — answers saved locally"** - Disconnected but working
- **Connection error badge** - Connection lost (auto-retry enabled)

---

## localStorage vs. Session Storage

JECA Prep Hub uses `localStorage` (not `sessionStorage`) because:

| Feature | localStorage | sessionStorage |
|---------|--------------|-----------------|
| Persistence | Until cleared | Until tab closed |
| Scope | All tabs of same origin | Single tab only |
| Capacity | ~10 MB | ~5 MB |
| Use Case | Long-term data | Temporary data |

For exam recovery, `localStorage` is essential since users may close tabs/browsers.

---

## Security Considerations

### What's Stored Insecurely

⚠️ **Never store sensitive data in localStorage:**
- Passwords ✗ (we hash with bcrypt)
- API keys ✗ (stored in memory only)
- Payment info ✗ (not applicable)

### What We Store Safely

✅ **Safe to store:**
- Public user profile data
- Exam questions (public data)
- Test answers (user's own data)
- Bookmarks (user's own data)
- JWT token (short-lived, signed)

### Security Recommendations

1. **HTTPS Only:** Always use HTTPS in production
2. **Token Rotation:** Tokens expire after 7 days
3. **Clear Cache:** Clear localStorage when logging out
4. **Don't Share Devices:** Public computers should not store session
5. **Content Security Policy:** Enables strong CSP headers

---

## Troubleshooting

### Issue: "localStorage quota exceeded"

**Problem:** Browser's storage limit exceeded (rare for this app)

**Solution:**
```javascript
// Check usage
console.log(localStorage.length);
console.log(JSON.stringify(localStorage).length);

// Clear old data
localStorage.removeItem('jeca-prep-last-result');
```

### Issue: "localStorage is not available"

**Causes:**
- Private/Incognito mode (some browsers limit localStorage)
- Cookies/storage disabled in browser settings
- localStorage blocked by browser extension

**Solution:**
1. Disable browser extensions
2. Enable localStorage in browser settings
3. Use normal browsing mode instead of private
4. Try different browser

### Issue: "Test not restored after refresh"

**Possible Causes:**
- localStorage was cleared
- Test already submitted
- Using private browsing (data cleared on close)

**Check:**
```javascript
// Check if data exists
console.log(localStorage.getItem('jeca-prep-active-exam'));
```

### Issue: "Answers lost after crash"

**Why:**
- Browser crash before autosave completed
- localStorage corrupted
- Cache was cleared

**Prevention:**
- Regular autosave (implemented: every answer change)
- Use stable browser version
- Check storage before crash: Press F12, check "Application" → "Storage"

---

## Developer Information

### Adding New localStorage Items

```typescript
// Define constants
const KEY = "jeca-prep-my-feature";

// Write
localStorage.setItem(KEY, JSON.stringify(data));

// Read with error handling
try {
  const stored = localStorage.getItem(KEY);
  return stored ? JSON.parse(stored) : null;
} catch {
  return null; // Corrupted data
}

// Delete
localStorage.removeItem(KEY);
```

### Best Practices

```typescript
// ✅ DO: Handle parsing errors
const read = <T>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
};

// ✅ DO: Use context/hooks for access
export function useMyData() {
  const [data, setData] = useState(() => read<MyData>("key"));
  useEffect(() => {
    localStorage.setItem("key", JSON.stringify(data));
  }, [data]);
  return [data, setData];
}

// ❌ DON'T: Access directly in components
// localStorage.setItem(...) // Use hook instead

// ❌ DON'T: Store large objects without cleanup
// Large arrays should be paginated
```

### Testing localStorage

```typescript
// Jest/Vitest mock
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(Storage.prototype, "getItem");
  jest.spyOn(Storage.prototype, "setItem");
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Test persistence
it("persists data", () => {
  sessionStorage.setItem("test", "value");
  expect(localStorage.getItem("test")).toBe("value");
});
```

---

## FAQ

**Q: Is my data encrypted in localStorage?**
A: No, localStorage is plaintext. Always use HTTPS. Never store passwords.

**Q: Can I access localStorage across domains?**
A: No, each domain has its own isolated localStorage.

**Q: Will localStorage work on mobile?**
A: Yes, all modern browsers (iOS Safari, Chrome Mobile, etc.) support localStorage with 5-10 MB limits.

**Q: Can a website access another website's localStorage?**
A: No, browsers enforce same-origin policy for security.

**Q: How do I know if my browser supports localStorage?**
```javascript
console.log(typeof localStorage !== "undefined"); // true if supported
```

**Q: Is localStorage suitable for production?**
A: Yes, when used correctly for non-sensitive data. Use secure authentication for sensitive operations.

---

## Related Documentation

- [API Documentation](API_DOCUMENTATION.md) - Backend endpoints
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production setup
- [README](README.md) - Project overview
