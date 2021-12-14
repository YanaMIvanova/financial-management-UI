# syntax=docker/dockerfile:1

# Stage 1 - the build process
FROM node:16.13 as build-deps
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", ".npmrc", "./"]
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.21-alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
