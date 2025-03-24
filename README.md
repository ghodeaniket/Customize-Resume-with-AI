# Resume Customizer with AI

## An AI-powered resume customization system

Resume Customizer is a comprehensive application that helps job seekers tailor their resumes for specific job postings using advanced AI models. The system analyzes both the resume and job description, then generates a customized version that highlights relevant skills and experiences, increasing your chances of getting past ATS systems and making a strong impression on recruiters.

## Architecture

The application follows a modern microservices architecture:

- **Backend API**: Node.js/Express with robust error handling and modular design
- **Frontend**: Next.js-based responsive web application
- **Worker Services**: Dedicated services for resume processing and formatting
- **Database**: PostgreSQL for data persistence
- **Queue**: Redis for job processing and caching
- **Proxy**: Nginx for SSL termination and routing
- **Monitoring**: Prometheus and Grafana for system monitoring

![System Architecture](https://raw.githubusercontent.com/ghodeaniket/Customize-Resume-with-AI/main/system-architecture-3.mermaid)

## Key Features

- **Multi-format Support**: Upload resumes in various formats (PDF, DOCX, HTML, JSON, Text)
- **Job Description Analysis**: Input job descriptions directly or via URL (LinkedIn, Indeed, Glassdoor)
- **AI Processing Pipeline**: 
  - Step 1: Profile analysis extracts professional profile from your resume
  - Step 2: Job research analyzes the requirements and keywords
  - Step 3: Resume customization tailors your resume to the job
- **ATS Optimization**: Ensures resumes are ATS-friendly with appropriate keywords
- **Fact Verification**: AI fact-checking to maintain accuracy of all credentials
- **Multiple Output Formats**: Generate customized resumes in Text, Markdown, HTML, or PDF
- **Secure API**: RESTful API with authentication for integration with other services
- **Docker Support**: Full containerization for easy deployment in any environment

## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to set up the entire application stack is with Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/ghodeaniket/Customize-Resume-with-AI.git
   cd Customize-Resume-with-AI
   ```

2. Run the start script (first time setup):
   ```bash
   ./start-services.sh --rebuild
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8080
   - API Documentation: http://localhost:8080/api/v1 

See [Docker README](DOCKER-README.md) for detailed Docker instructions.

### Manual Setup

#### Backend API

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration values, especially:
   - Database credentials
   - Redis connection
   - OpenRouter API key (sign up at https://openrouter.ai/)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the worker (in a separate terminal):
   ```bash
   npm run worker
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

Full API documentation is available at `/api/v1` when the server is running.

### Key Endpoints

- `POST /api/v1/resume/customize`: Submit a resume for customization
- `GET /api/v1/resume/status/:jobId`: Check job status
- `GET /api/v1/resume/history`: Get job history
- `GET /api/v1/health`: System health check

## Project Structure

```
├── backend/                 # Backend API service
│   ├── config/              # Configuration management
│   ├── controllers/         # Request handlers
│   ├── jobs/                # Background job processing logic
│   ├── middleware/          # Express middleware
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── services/            # Business logic services
│   ├── tests/               # Automated tests
│   ├── utils/               # Utility functions
│   └── workers/             # Worker processes
├── frontend/                # Frontend Next.js application
├── nginx/                   # Nginx configuration
├── prometheus/              # Monitoring configuration
└── docker-compose.yml       # Docker Compose configuration
```

## Advanced Configuration

See the [Configuration Guide](backend/config/README.md) for details on advanced configuration options.

## Development

### Testing

```bash
cd backend
npm test
```

### Linting

```bash
cd backend
npm run lint
```

## Monitoring

The application includes Prometheus and Grafana for monitoring. Access Grafana at http://localhost:3001 (default credentials: admin/admin).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
