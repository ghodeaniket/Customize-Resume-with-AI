# Resume Customizer

AI-powered resume customization tool that helps you tailor your resume for specific job applications.

## Overview

Resume Customizer is a web application that uses AI to analyze job descriptions and customize resumes to maximize relevance and match rate. The application helps job seekers:

- Extract key requirements and skills from job descriptions
- Highlight relevant experience and skills in their resumes
- Optimize resume language for applicant tracking systems (ATS)
- Create targeted versions of resumes for each job application

## Features

### Phase 1 (Current Implementation)

- **Resume Management**: Upload, parse, and manage PDF and DOCX resumes
- **Job Description Analysis**: Extract key skills, requirements, and responsibilities from job descriptions
- **AI Customization**: Tailor resumes to specific job descriptions with adjustable customization levels
- **Document Generation**: Download customized resumes in editable formats

## Tech Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI/Anthropic API
- **Document Processing**: PDF/DOCX parsing and generation
- **Containerization**: Docker and Docker Compose

## Getting Started

### Using Docker (Recommended)

This method uses Docker to set up the entire development environment, including the database.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/ghodeaniket/ResumeCustomiser.git
   cd ResumeCustomiser
   ```

2. Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your-openai-api-key  # Optional for testing
   ```

3. Run the setup script:
   ```bash
   ./setup-and-test.sh
   ```

4. Access the application at http://localhost:3000

#### Manual Docker Commands

Alternatively, you can run the Docker commands manually:

```bash
# Build the Docker images
npm run docker:build

# Start the containers
npm run docker:up

# Run database migrations
npm run docker:prisma

# View logs
npm run docker:logs

# Access the app container shell
npm run docker:shell

# Stop the containers
npm run docker:down
```

### Traditional Setup (Without Docker)

If you prefer not to use Docker, you can set up the project traditionally:

#### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- PostgreSQL database

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ghodeaniket/ResumeCustomiser.git
   cd ResumeCustomiser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/resume_customizer"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="your-openai-api-key"  # Optional for testing
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:3000

## Testing the Application

With the application running, you can test the following features:

1. **Home Page**: Visit http://localhost:3000 to see the landing page

2. **Resume Management**:
   - Go to http://localhost:3000/resumes
   - Upload a resume (PDF or DOCX file)
   - View resume details

3. **Job Descriptions**:
   - Go to http://localhost:3000/job-descriptions
   - Add a new job description
   - View job details and analysis

4. **Customization**:
   - Go to http://localhost:3000/customize?resumeId=1&jobId=1
   - Configure customization settings
   - Generate a customized resume

## Development

### Project Structure

```
resume-customizer/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable UI components
│   └── utils/            # Utility functions
├── prisma/               # Database schema
├── public/               # Static assets
└── docker-compose.yml    # Docker configuration
```

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint

## License

This project is licensed under the MIT License.
