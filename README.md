# Finances

**Live App:** https://finances.lnks.info

A personal finance management platform for tracking expenses, monitoring account balances, organizing financial records, and visualizing financial history.

## Demos

- https://github.com/user-attachments/assets/d5305497-e3a4-4830-b83e-29300ea5460d

## Features

- **Secure Authentication**: Email-based sign-up and login via the shared `auth-service`
- **Expense Tracking**: Log and categorize expenses with a clean, intuitive interface; monthly breakdowns fit the screen width without horizontal scrolling
- **Bank Statement Parser**: Automatically parse and import expenses from bank statements (PDF, CSV, and text formats)
- **Custom Parsers**: Create and test custom statement parsers for your specific bank format
- **Account Management**: Manage multiple accounts and organize expenses by account
- **Spending Overview**: Visualize your spending patterns with summary views
- **User Profiles**: Manage profile settings and preferences; uploaded profile images retain their original bytes, format, and resolution (up to 15 MB), with a square thumbnail and a viewport-fitted full-resolution preview

## Design

- https://www.figma.com/design/eOK9yvd5c1FYMpAd6mEEFy/finance?m=auto&t=fuGGog7wU2nQXRPH-6

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast build and dev experience
- **React Router** for navigation
- **Custom auth client** for server-managed sessions via the shared `auth-service`
- **CSS Modules** for component-scoped styling

### Backend
- **Express.js** with TypeScript
- **Node.js** runtime
- **Express.js API** with Neon Postgres and custom auth
- **Python** integration for statement parsing

### Database
- **PostgreSQL** (Neon)
- SQL migrations for schema management
- Secure user authentication

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm 10+
- Python 3.8+ (for statement parsing features)
- A Neon Postgres database URL

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
	- Create `.env.development` from `.env.development.example`
	- Set `DATABASE_URL` and `JWT_SECRET` for auth-service + Neon

4. Start development:
```bash
pnpm dev
```

This runs both the client (port 5173) and server concurrently.
The Finances API defaults to port 3002. Set `PORT` in `.env.development` to change
it; Vite's `/api` proxy uses the same setting. Leave `VITE_API_BASE_URL` unset for
local development so API and auth requests use same-origin cookies. Restart
`pnpm dev` after changing environment settings.

If login succeeds but `/api/profile` returns `401 Unauthorized`, check that the
API port belongs to Finances, not another local app. Choose an unused `PORT`
rather than disabling authentication. Also ensure `JWT_SECRET`,
`AUTH_COOKIE_NAME`, and `DATABASE_URL` match the selected auth-service environment
(its database setting is `NEON_URI_FINANCES`).

### Build for Production

```bash
pnpm build
```

## Project Structure

```
├── frontend/               # Frontend React application
│   ├── app/               # App root component and routes
│   ├── components/        # Reusable React components
│   ├── screens/           # Full-page screens
│   │   ├── Auth/         # Authentication screens
│   │   ├── Expenses/     # Expense management screens
│   │   ├── Home/         # Home/dashboard screen
│   │   └── Profile/      # User profile screen
│   ├── lib/              # Utilities and API helpers
│   ├── primitives/       # Basic UI primitives (Button, Input)
│   └── styles/           # Global stylesheets
├── server/                # Express backend server
├── database/              # Database schema and migrations
├── package.json           # Project dependencies
└── vite.config.ts         # Vite configuration
```

## Development

### Available Scripts

```bash
# Start development (client + server)
pnpm dev

# Start only frontend
pnpm dev:client

# Start only backend
pnpm dev:server

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Development Workflow

This project follows a lightweight issue-driven workflow:

1. Ideas
2. Issues
3. Sub-issues (optional)
4. Branch
5. Development
6. Commit(s)
7. PR
8. Squash merge
9. Delete branch

Optional release step:

- Tag commits for release versions when needed.

### Authentication Flow

Authentication is delegated to the standalone `auth-service`:
- Users sign up or log in with email
- OTP verification via email
- HttpOnly JWT session cookie
- Authentication records stored in this app's Neon database via auth-service's `NEON_URI_FINANCES` connection; app profile details are managed separately by finances

See [frontend/screens/Auth/](frontend/screens/Auth/) for the authentication screens.

### App-Specific Profiles

Apply `database/migrations/2-add_app_profiles.sql` before deploying this version.
Username, display name, birthday, and profile image are stored by the finances
backend in `app_profiles` using `GET`/`PUT /api/profile`. Profile details are never
sent to or loaded from auth-service's profile endpoint. Auth-service handles sign-up,
sign-in, verification, sessions, sign-out, passwords, and account deletion only.
Sign-up collects email and password; set an optional username in Profile after
signing in. Usernames are app-local labels, not login credentials or globally unique
auth identities. Reads and writes require the user's session cookie, and account
deletion cascades to the app profile. Original raster
images up to 15 MB are stored without resizing or re-encoding; larger files are
rejected explicitly rather than silently compressed. HTTP(S) image URLs are also
supported. Base64 transport increases stored/request size but does not change the
image bytes. The existing 25 MB API request limit accommodates the upload limit.

The migration copies existing username, birthday, and photo values from the legacy
users table once, without overwriting existing app profiles on subsequent runs.
Previously compressed uploads cannot be restored automatically: re-upload the
original and save the profile. The small square thumbnail remains cropped for
layout, while clicking it displays the uncropped original fitted to the viewport.

Update Profile has two containers: Profile Details (read-only email, username,
display name, birthday, and a photo picker) and Session & Account (Sign Out and
Change Password). Save Profile Updates persists profile edits and the selected
photo only when that button is activated. Edits and selected photos remain drafts;
Identity shows the last successfully saved profile, not unsaved edits. A successful
save briefly fades and disables the save button with the label "Saved" for two
seconds instead of displaying a page-level success message. Pressing Enter in a
profile field does not save. Change Password opens a modal form with a Cancel button, requiring the
current password, a new password, and confirmation; the auth service verifies the
current password before updating it. Cancel or Escape dismisses the form and
clears the password fields without submitting.
The new password uses the same rules as sign-up: at least eight characters,
including lowercase, uppercase, a number, and a special character. Unmet
requirements appear in red only after typing begins and disappear as they are met.

## Expense Management

### Bank Statement Parser

The app includes a powerful expense parser that can extract transaction data from bank statements in multiple formats (PDF, CSV, text).

#### Testing Parsers In The UI

Use the built-in parser test flow in the Expenses screen:

1. Go to Expenses > Manage.
2. Select an account.
3. Open Parser.
4. Click Test Parser.
5. Upload a statement file and review the grouped results.

This uses the same frontend + backend execution path as normal statement parsing.
#### Testing Parsers In The UI

Use the built-in parser test flow in the Expenses screen:

1. Go to Expenses > Manage.
2. Select an account.
3. Open Parser.
4. Click Test Parser.
5. Upload a statement file and review the grouped results.

This uses the same frontend + backend execution path as normal statement parsing.

#### Creating a Custom Parser

Your parser must export a `parse_statement_text(statement_text)` function that returns a normalized expense structure compatible with the parser test modal and statement parsing endpoints.
Your parser must export a `parse_statement_text(statement_text)` function that returns a normalized expense structure compatible with the parser test modal and statement parsing endpoints.

### Supported Statement Formats

- **PDF**: Bank statement PDFs (parsed via backend)
- **CSV**: Comma-separated values
- **TXT**: Plain text or tab-separated formats
- **JSON**: Pre-structured expense data

## Database

Database schema and migrations are stored in the [database/](database/) directory. Run migrations as part of your deployment process.

## Contributing

This is a personal finance project. For contributions or issues, please follow the standard Git workflow with clear commit messages.

## License

ISC

- parse_statement_text(statement_text: str) -> dict

Expected result keys:

- month: string
- expense_count: integer
- total_expenses_amount: decimal string (example: "1234.56")
- expenses: list of
	- date: string
	- description: string
	- amount: decimal string
