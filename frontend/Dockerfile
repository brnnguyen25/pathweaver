# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared-types ./shared-types
COPY frontend/package.json ./frontend/package.json

RUN npm install --workspace=frontend --workspace=shared-types

COPY frontend ./frontend

RUN npm run build --workspace=frontend

# Stage 2: Serve the built static files with a lightweight web server
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]