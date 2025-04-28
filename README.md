# Skilio Intern CRUD with Node.js

## Project Overview
Mapala Logistics CRUD is a simple web-based application designed for managing logistics data with user authentication. The app allows users to register, log in, and perform CRUD (Create, Read, Update, Delete) operations on logistics items such as product names, quantities, and descriptions. The application is built using Node.js, Express, and SQLite3, and it implements secure password storage using bcrypt.

## Installation
To set up the Mapala Logistics CRUD application locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dimasjuniorseven/Skilio-Intern-of-Singapore.git
   cd Skilio-Intern-of-Singapore
   ```

2. **Install dependencies**:
   Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed. Then run:
   ```bash
   pnpm install
   ```

3. **Set up the SQLite database**:
   The application will automatically create the necessary database file (`mapala.db`) and tables when it starts.

4. **Run the application**:
   To start the server, run:
   ```bash
   pnpm start
   ```
   The server will be running on [http://localhost:3000](http://localhost:3000).

## Usage
- **Register a new user**: Send a POST request to `/register` with a JSON body containing `username` and `password`.
- **Login**: Send a POST request to `/login` with `username` and `password`, upon successful login a session will start.
- **Logout**: Send a POST request to `/logout` to terminate the session.
- **CRUD on Logistics Items**:
  - **Create**: Send a POST request to `/logistics` with JSON data for `item_name`, `quantity`, and `description`.
  - **Read**: Send a GET request to `/logistics` to retrieve all logistics items.
  - **Update**: Send a PUT request to `/logistics/{id}` with updated logistics data.
  - **Delete**: Send a DELETE request to `/logistics/{id}` to remove a logistics item.

## Features
- User registration and authentication.
- Secure password handling with bcrypt.
- SQLite database for data persistence.
- RESTful API for managing logistics items.
- Responds to unauthorized access attempts.

## Dependencies
The project uses the following dependencies:
- [bcrypt](https://www.npmjs.com/package/bcrypt): For password hashing.
- [express](https://www.npmjs.com/package/express): Web framework for Node.js.
- [express-session](https://www.npmjs.com/package/express-session): Middleware for managing sessions.
- [sqlite3](https://www.npmjs.com/package/sqlite3): For SQLite database support.

You can install all dependencies using:
```bash
npm install
```

## Project Structure
The project is organized as follows:

```
Skilio-Intern-of-Singapore/
│
├── node_modules/           # Node.js modules (dependencies)
├── public/                 # Static files (HTML, CSS, JS and Photos)
├── package.json            # Project metadata and dependencies
├── package-lock.json       # Dependency versions
└── server.js               # Main server file
```

Feel free to contribute to this project or raise any issues.
