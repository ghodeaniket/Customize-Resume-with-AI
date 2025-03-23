# Resume Customizer

## An AI-powered resume customization tool

Resume Customizer is an application that helps job seekers tailor their resumes for specific job descriptions using AI. The system analyzes both the resume and job description, then generates a customized version of the resume that highlights relevant skills and experiences.

## Architecture

The application consists of a backend API and a frontend user interface:

- **Backend**: Node.js/Express API with PostgreSQL database and Redis for job queue
- **Frontend**: React-based web application

![System Architecture](system-architecture-3.mermaid)

## Features

- Upload resume in multiple formats (PDF, DOCX, HTML, JSON, Text)
- Input job descriptions directly or via URL (LinkedIn, Indeed, Glassdoor, etc.)
- AI-powered resume analysis and customization
- Background processing with job queue
- RESTful API for integration with other services

## Backend Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/ghodeaniket/Customize-Resume-with-AI.git
   cd Customize-Resume-with-AI
   ```

2. Install dependencies:
   ```
   cd backend
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values, especially:
   - Database credentials
   - Redis connection
   - OpenRouter API key (sign up at https://openrouter.ai/ to get a key)

   > **IMPORTANT**: Never commit your `.env` file or API keys to version control!

5. Start the development server:
   ```
   npm run dev
   ```

6. Start the worker (in a separate terminal):
   ```
   npm run worker
   ```

### Running with Docker

1. Make sure Docker and Docker Compose are installed
2. Set your environment variables in `.env` file
3. Run:
   ```
   docker-compose up
   ```

## API Endpoints

See [API Documentation](backend/api-docs.md) for detailed endpoint information.

### Resume Customization

- `POST /api/v1/resume/customize`: Submit a resume for customization
- `GET /api/v1/resume/status/:jobId`: Check job status
- `GET /api/v1/resume/history`: Get job history

## Frontend

The frontend application is built with React and provides a user-friendly interface for resume customization.

### Installation

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## License

MIT
