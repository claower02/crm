# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Stage 3: Final image
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/main .
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/data.json .

# Create a sounds directory if it exists in public
RUN mkdir -p dist/sounds
COPY --from=frontend-builder /app/public/sounds ./dist/sounds

EXPOSE 3000
CMD ["./main"]
