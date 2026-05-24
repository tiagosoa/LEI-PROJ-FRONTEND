# Frontend for DEI Private Cloud

## Overview

This project replaces the legacy PHP-based interface of the DEI Private Cloud with a modern, scalable solution. The new system addresses performance bottlenecks and provides an improved user experience.

### Key Features

- **Authentication**: LDAP integration with JWT tokens
- **Virtual Server Management**: Create, start, stop, delete VS
- **Template System**: Create VS from pre-defined templates
- **Access Management**: Enable/disable SSH, VNC, HTTP/HTTPS access
- **Credit System**: Track and manage user credits
- **DTR (Days To Run)**: Monitor remaining execution time
- **Real-time Updates**: Automatic UI refresh with polling optimization

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.x | REST API framework |
| LDAPjs | 3.x | LDAP authentication |
| JSON Web Token | 9.x | Session management |
| Jest | 29.x | Testing framework |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21.x | SPA framework |
| TypeScript | 5.x | Type-safe development |
| Cypress | 13.x | E2E testing |
| RxJS | 7.x | Reactive programming |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| NFS | Shared storage for VS/VST |
| LDAP | User authentication |
| PM2 | Process management |
| Let's Encrypt | SSL/TLS certificates |

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                    (Angular SPA)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Controllers │  │  Services   │  │  Command Executor   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │   LDAP   │   │   NFS    │   │   Cluster    │
    │  Server  │   │ /vs_cloud│   │   Nodes      │
    └──────────┘   └──────────┘   └──────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+
- Access to DEI VPN (for LDAP and NFS access)
- SSH key for deployment server

### Local Setup

# Clone repository
```
git clone [repository-url]
cd (rootFolder)
```
# Backend setup
```
cd backend
npm install
```
# Frontend setup
```
cd ../frontend
npm install
```
### Configuration Files

#### Backend `.env`
```
PORT=80
NODE_ENV=production
BASE_FOLDER=/vs_cloud
LDAP_URL=ldap://192.168.62.4
LDAP_BASE_DN=ou=users,dc=dei,dc=isep,dc=ipp,dc=pt
LDAP_USER_ATTR=uid
JWT_SECRET=dei-cloud-secret-key-2026
JWT_EXPIRES_IN=8h
LOG_LEVEL=info
```
#### Frontend Environment

```
export const environment = {
    production: false,
    apiUrl: '/api'
};
```
## Deployment

### Prerequisites

1. Connect to DEI VPN (SoftEther)
2. Ensure SSH key is available

### Deploy Script

# Windows
```
.\deploy.bat
```
### Manual Deployment

# Backend
```
scp -i cloud.pem -P 922 -r backend/* root@cloud.dei.isep.ipp.pt:/opt/dei-backend/
```
# Frontend
```
cd frontend
ng build --prod
scp -i cloud.pem -P 922 -r dist/frontend/browser/* root@cloud.dei.isep.ipp.pt:/var/www/html/
```
# Restart backend
```
pm2 restart dei-backend
```

## Testing

### Backend Tests
```
cd backend
```
# Unit tests
```
npm run test:unit
```
# Integration tests
```
npm run test:integration
```
# Security tests
```
npm run test:security
```
# All tests
```
npm test
```
**Coverage**: ~65% (services core)

### Frontend E2E Tests
```
cd frontend
```
# Open Cypress dashboard
```
npx cypress open
```
# Run headless
```
npx cypress run
```
**Test Coverage**: E2E tests covering all user stories

## Project Structure

```
projeto/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation
│   │   ├── utils/           # Helpers (commandExecutor)
│   │   └── config/          # Configuration files
│   ├── tests/
│   │   ├── unit/            # Unit tests (jest)
│   │   ├── integration/     # API integration tests
│   │   └── security/        # Security tests
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Angular components
│   │   │   ├── services/    # API services
│   │   │   ├── models/      # TypeScript interfaces
│   │   │   ├── guards/      # Route guards
│   │   │   └── interceptors/# HTTP interceptors
│   │   └── index.html
│   ├── cypress/
│   │   └── e2e/            # E2E tests
│   └── angular.json
└── docs/                    # Documentation
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User authentication | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/vs` | List user VS | Yes |
| GET | `/api/vs/:folderName` | VS details | Yes |
| POST | `/api/vs/create` | Create VS from template | Yes |
| POST | `/api/vs/:folderName/start` | Start VS | Yes |
| POST | `/api/vs/:folderName/stop` | Stop VS | Yes |
| DELETE | `/api/vs/:folderName` | Delete VS | Yes |
| PUT | `/api/vs/:folderName/attribute` | Update attribute | Yes |
| GET | `/api/vst` | List templates | Yes |
| GET | `/api/vs/credit` | Get user credit | Yes |

## User Stories Implemented

| ID | Description | Status |
|----|-------------|--------|
| US1 | LDAP Authentication | ✅ |
| US2 | List user VS | ✅ |
| US3 | VS details view | ✅ |
| US4 | List VST templates | ✅ |
| US5 | Create VS from VST | ✅ |
| US6 | Start VS | ✅ |
| US7 | Stop VS | ✅ |
| US8 | Delete VS | ✅ |
| US9 | Edit VS attributes | ✅ |
| US10 | Enable/disable access methods | ✅ |
| US11 | View DTR | ✅ |
| US12 | Auto-refresh UI | ✅ |

## Troubleshooting

### LDAP Connection Failed

1. Verify VPN connection is active
2. Check LDAP server reachability: `telnet 192.168.62.4 389`
3. Validate credentials

### Frontend Build Fails

# Clear cache and rebuild
```
rm -rf node_modules package-lock.json
npm install
ng build --prod
```
## Contributors

| Name | Role | Contact |
|------|------|---------|
| Tiago Pinto Soares | Developer | 1231246@isep.ipp.pt |
| André Moreira (ASC) | Supervisor | ISEP/DEI |

## License

Academic project - Instituto Superior de Engenharia do Porto (ISEP)

---

**Note**: This project requires access to the DEI internal network. External access requires VPN connection to the ISEP network.
