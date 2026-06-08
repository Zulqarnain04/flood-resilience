# Flood Resilience Backend

Spring Boot service for the flood-response demo: AI triage, help requests, resources, assignments, map pins, danger zones.

## Required environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `DB_URL` | JDBC URL for MySQL | `jdbc:mysql://localhost:3306/siaga` |
| `DB_USERNAME` | DB user | `root` |
| `DB_PASSWORD` | DB password — **no default**, must be set | `s3cret` |
| `OLLAMA_API_URL` | Ollama chat endpoint | `http://localhost:11434/api/chat` |
| `OLLAMA_MODEL` | Model id | `llama3.2:3b` |
| `OLLAMA_TIMEOUT_SECONDS` | Connect+read timeout for the Ollama call | `30` |

## Running locally

```
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

The `dev` profile enables SQL logging. Without it, Hibernate is quiet.

Seed demo data (dev/demo profiles only):

```
POST /api/demo/generate
```

## Key endpoints

- `POST /api/requests` — submit a help request (AI triage + urgency scoring)
- `GET  /api/requests` — list (paged)
- `GET  /api/map/pins` — map pins (requests + resources, with urgency level)
- `GET  /api/zones` — danger-zone overlays
- `GET  /api/dashboard/summary` — coordinator dashboard counts
