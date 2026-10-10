# VeriFlow
### Trusted Data. Transparent Verification.

A Background Verification Management Platform

VeriFlow is a full-stack web application designed to simplify background verification management through a centralized dashboard, secure role-based access, and organized verification records.

I developed this project as part of a software development challenge to explore how frontend applications, backend APIs, authentication, and role-based authorization work together in a practical business application.

The main goal was to build an application that is easy to use, secure by design, and structured so that its features can be maintained and extended.

---

## About the Project

Managing verification records requires clear access permissions, organized information, and a reliable way to track verification progress.

VeriFlow addresses these needs through a dashboard where users can view authorized verification records while administrators can manage users and access a broader set of records.

The application separates the frontend and backend responsibilities, uses reusable Angular services, and communicates through REST APIs.

The interface was designed with a clean enterprise dashboard layout, consistent status indicators, responsive components, and loading states to make the application easier to navigate.

## Key Features

### Authentication and Access Control
- Login using User ID and password.
- Separate Admin and General User roles.
- Password hashing for stored credentials.
- Protected application routes.
- Backend authentication and authorization checks.
- Logout functionality.

### Verification Management
- View verification records in a structured table.
- Search records by candidate name or verification ID.
- Filter records by status and verification type.
- Sort records and navigate through paginated results.
- View record details.
- Display verification status using visual indicators.

### Role-Based Dashboard

**General User**
- View personal profile information.
- Access records assigned to the user.
- View relevant dashboard information.
- Access only the features permitted for the assigned role.

**Admin**
- View verification records across users.
- Access user management.
- Create and edit user information.
- Activate or deactivate user accounts.
- View user roles and account status.

Access permissions are enforced by the backend rather than relying only on the frontend interface.

### Asynchronous Data Loading
- Retrieve dashboard information through API requests.
- Display loading indicators while requests are processing.
- Handle API errors with appropriate feedback.
- Simulate API latency to demonstrate asynchronous processing.
- Load dashboard information through reusable Angular services.

### User Interface
- Custom VeriFlow branding.
- Enterprise-style dashboard.
- Sidebar navigation.
- Dashboard summary cards.
- Searchable and filterable data tables.
- Status badges and notifications.
- Responsive layouts for different screen sizes.

---

## Technology Stack

### Frontend
- Angular 17
- TypeScript
- HTML5
- SCSS
- Angular Router
- Reactive Forms
- Angular HttpClient
- RxJS

### Backend
- Node.js
- Express.js
- REST APIs
- JSON-based demo data storage
- JWT authentication
- bcrypt password hashing

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm

---

## Application Architecture

VeriFlow follows a frontend-backend architecture.

The Angular frontend manages the user interface, navigation, forms, and API communication.

The Node.js and Express backend handles authentication, data access, verification records, and role-based permissions.

The application uses HTTP requests to communicate between the frontend and backend.

```text
                 VeriFlow Application
                         |
             +-----------+-----------+
             |                       |
       Angular Frontend         Express Backend
             |                       |
       Angular Services          REST API Routes
             |                       |
       HTTP Requests          Authentication and
             |                Authorization
             |                       |
             +----------+------------+
                        |
                 JSON Demo Storage