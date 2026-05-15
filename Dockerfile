FROM node:20-bookworm AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Ensure production environment variables are used during build
COPY .env.production .env.production

RUN npm run build

FROM nginx:alpine

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
