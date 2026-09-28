# LifelineX — Deployment Guide

## Production Build
```bash
npm run build
```
This performs full TypeScript compilation and produces the optimized static bundle in `dist/`.

## Deployment Targets
- **Vercel / Netlify / Cloudflare Pages**: Connect repository and set root directory to `.` and output directory to `dist`.
- **Docker**:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
