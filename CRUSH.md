# CRUSH Development Guidelines

## Build Commands
- Development: `npm run dev`
- Production build: `npm run build`
- Start production: `npm run start`

## Linting
- Lint code: `npm run lint`

## Testing
- No test command specified in package.json
- To run a single test, you would typically use: `npm test -- <test-file>`

## Code Style Guidelines

### Imports
- Use ES6 import/export syntax
- Organize imports in logical groups (external, internal, components, etc.)
- Use absolute paths when possible for internal modules

### Formatting
- Use 4 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Place opening braces on the same line as the statement

### Types
- Use PropTypes for component prop validation
- Prefer functional components with hooks over class components
- Use TypeScript for new components when possible (refer to types/database.ts)

### Naming Conventions
- Component files: PascalCase (e.g., StudentDashboard.js)
- Component names: PascalCase
- Variables and functions: camelCase
- Constants: UPPER_SNAKE_CASE
- API routes: kebab-case (e.g., /api/user/profile)

### Error Handling
- Use try/catch blocks for async operations
- Implement consistent error messaging in Arabic for UI
- Log errors appropriately for debugging
- Use the errorHandler utility when available

### Component Structure
- Use functional components with React hooks
- Implement component composition over inheritance
- Use CSS-in-JS (styled-jsx) for component styling
- Follow mobile-first responsive design principles

### Database
- Use the db.js utility for database connections
- Implement proper SQL injection prevention with parameterized queries
- Follow the existing schema patterns in schema.sql

### Authentication
- Use the withAuth.js higher-order component for protected routes
- Implement role-based access control using user.role
- Use proper session management with cookies

### API Design
- Follow RESTful principles where applicable
- Use consistent response formats
- Implement proper HTTP status codes
- Include error handling in all API endpoints

### Internationalization
- Keep user-facing text in Arabic
- Use appropriate RTL styling
- Consider cultural context in UI design

## Git Ignore
- node_modules
- .next
- .env.local
- .env
- .crush