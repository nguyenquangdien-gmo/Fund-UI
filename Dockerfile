# Sử dụng image Node.js để build dự án
FROM node:18 AS build-stage
WORKDIR /app

# Copy file package.json và package-lock.json để cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Build ứng dụng Vue
RUN npm run build

# Sử dụng Nginx để chạy Vue sau khi build xong
FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx (nếu có)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 để truy cập ứng dụng
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]
