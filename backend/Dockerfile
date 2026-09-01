FROM node:22-alpine

WORKDIR /app

# Copy workspace-level files first so Docker can cache the npm install layer
# separately from your actual source code changes.
COPY package.json package-lock.json ./
COPY shared-types ./shared-types
COPY backend/package.json ./backend/package.json

RUN npm install --workspace=backend --workspace=shared-types

# Now copy the actual source code.
COPY backend ./backend

# Build shared-types (backend imports its compiled output).
RUN npm run build --workspace=shared-types

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=backend"]