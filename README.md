# Queue Service

## 1. Run with Docker

```bash
docker-compose up
```

Then open:

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api

By default, the app runs with RabbitMQ, to swap provider update value of QUEUE_PROVIDER in docker-compose.yml file

To stop:

```bash
docker-compose down
```

---

## 2. Run locally with npm

### 2.1 Install dependencies

```bash
npm install
```

### 2.2 Set environment

```bash
cp .env.example .env
```

Edit `.env` to choose a provider:

```env
# Options: rabbitmq | sqs | both
QUEUE_PROVIDER=rabbitmq
```

### 2.3 Start infrastructure (RabbitMQ + LocalStack)

```bash
docker-compose up rabbitmq localstack
```

### 2.4 Start the NestJS app

```bash
npm run start:dev
```

The API will be available at:

- http://localhost:3000
- Swagger: http://localhost:3000/api

---

## 3. Run locally with yarn

### 3.1 Install dependencies

```bash
yarn
```

### 3.2 Set environment

```bash
cp .env.example .env
```

Edit `.env` as needed:

```env
QUEUE_PROVIDER=rabbitmq
```

### 3.3 Start infrastructure (RabbitMQ + LocalStack)

```bash
docker-compose up rabbitmq localstack
```

### 3.4 Start the NestJS app

```bash
yarn start:dev
```

---

## 4. Test the API

### Publish a message

```bash
curl -X POST http://localhost:3000/messages/publish \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "Hello, World!"}}'
```

### Check active providers

```bash
curl http://localhost:3000/messages/active-providers
```

---

## 5. Environment Variables

 - check .env.example file for variables
 - To swap between Queue provider update QUEUE_PROVIDER in .env file
