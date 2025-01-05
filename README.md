# Keells API Client - WIP

A Node.js client for interacting with the Keells Sri Lanka Supermarket API.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env.local` file with your credentials:
```
KEELS_USERNAME=your_username
KEELS_PASSWORD=your_password
```

## Available APIs

The client provides several API modules:

- `authApi`: Handle authentication (guest/credential login, session management)
- `accountApi`: Manage user account details and shipping information
- `cartApi`: Handle shopping cart operations
- `webApi`: Get store data and product information
- `orderApi`: Process and manage orders

## Usage Example

```javascript
import { authApi, webApi } from './api.js';

// Login
const loginResponse = await authApi.credentialLogin(username, password);

// Get store data
const branchCode = "YOUR_BRANCH_CODE";
const initialData = await webApi.getInitialData(branchCode, 0);
```

## Features

- Cookie-based authentication
- Session management
- Automatic cookie handling
- Comprehensive API coverage for Keells Supermarket operations