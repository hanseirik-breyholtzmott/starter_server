# Starter Server for REST API Server with Express.js and MongoDB

This project is designed to help you rapidly develop your startup ideas by providing the essential components that most applications require. My goal is to save you countless hours, allowing you to concentrate on what truly matters: creating innovative and groundbreaking tools.

## Overview

This project is a REST API server developed using Node.js, Express.js, and MongoDB. It serves as the backend for a client application, offering endpoints to facilitate CRUD (Create, Read, Update, Delete) operations. The API is capable of handling user authentication, data validation, and other essential functionalities.

Key features of this project include:

- User authentication
- Integration with MongoDB
- RESTful API design

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Technologies Used](#technologies-used)
5. [Project Structure](#project-structure)
6. [API Endpoints](#api-endpoints)
7. [Youtube tutorials](#youtube-tutorials)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- MongoDB (v4.x or higher) installed and running

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/Hans-Breyholtz/starter_server.git
   ```

2. Navigate to the project directory:

   ```
   cd starter_server
   ```

3. Install the required dependencies:

   ```
   npm install
   ```

## Environment Variables

[.env.sample](https://github.com/Hans-Breyholtz/starter_server/blob/main/.env.sample)

## Technologies Used

- [Express.js](https://expressjs.com) Express is a lightweight and flexible routing framework with minimal core features meant to be augmented through the use of Express middleware modules.
- [MongoDB](https://www.mongodb.com) MongoDB is a NoSQL database that stores data in flexible, JSON-like documents, allowing for scalability, high performance, and schema flexibility.
- [Resend](https://resend.com) Resend is an email API platform designed to simplify sending, receiving, and tracking emails programmatically for developers.

## Project structure

```
.
├── src             # Source folder
│ ├── auth          # Authentication module
│ ├── config        # Configuration files
│ ├── controllers   # Controllers for handling routes
│ ├── db            # Database connection and queries
│ ├── emails        # Email templates and functions
│ ├── library       # Utility libraries
│ ├── logs          # Logging setup and logs
│ ├── middleware    # Express middleware
│ ├── models        # Database models
│ ├── public        # Public assets
│ ├── router        # Routing configuration
│ ├── service       # Service layer logic
│ ├── types         # Type definitions
│ └── utils         # Utility functions
├── .env.template   # Sample environment variables file
├── .gitignore      # Git ignore rules
├── nodemon.json    # Nodemon configuration
├── README.md       # README file
└── tsconfig.json   # TypeScript configuration
```

## API Endpoints

## Youtube Tutorials
