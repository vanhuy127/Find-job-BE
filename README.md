# 🚀 Node.js Express TypeScript Starter

Hệ thống khởi đầu mạnh mẽ kết hợp **Node.js + Express + TypeScript + Prisma + MySQL**

Đây là một dự án Node.js mẫu được xây dựng dựa trên sự kết hợp hoàn hảo của Express, TypeScript, Prisma ORM và MySQL. Dự án cung cấp nền tảng vững chắc để phát triển các API RESTful có khả năng mở rộng cao với các phương pháp phát triển hiện đại.

## ✨ Tính năng nổi bật

- 🚀 **TypeScript**: Đảm bảo phát triển an toàn về kiểu dữ liệu (type-safe), giảm thiểu lỗi trong quá trình phát triển
- 🧩 **ExpressJS**: Framework web mạnh mẽ và linh hoạt để xây dựng API
- 🗃️ **Prisma ORM**: Công cụ ORM hiện đại, giúp tương tác với cơ sở dữ liệu một cách trực quan và an toàn
- 🐬 **MySQL**: Cơ sở dữ liệu quan hệ được lựa chọn để lưu trữ dữ liệu
- 🔐 **Xác thực JWT**: Tích hợp middleware xác thực bằng JSON Web Token để bảo vệ API
- 📧 **Email Integration**: Tích hợp gửi email thông qua API
- 🌍 **Environment Management**: Quản lý biến môi trường với dotenv

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)
- **Environment**: dotenv

## 📁 Cấu trúc thư mục

```
src/
├── config/         # Cấu hình môi trường, Prisma client và schema
├── constants/      # Định nghĩa các hằng số
├── controllers/    # Xử lý các yêu cầu route của Express
├── middlewares/    # Middleware tùy chỉnh (xác thực, xử lý lỗi, etc.)
├── routes/         # Định nghĩa các tuyến đường API
├── services/       # Logic nghiệp vụ
├── utils/          # Các hàm tiện ích và hỗ trợ
├── types/          # Kiểu dữ liệu tùy chỉnh của TypeScript
└── index.ts        # Điểm khởi chạy của ứng dụng
```

## ⚙️ Hướng dẫn cài đặt

### 1. Sao chép dự án

```bash
git clone https://github.com/your-username/your-project.git
cd your-project
```

### 2. Cài đặt dependencies

Sử dụng Yarn hoặc npm:

```bash
# Với Yarn
yarn install

# Với npm
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc và cấu hình:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/dbname"

# JWT Secrets
ACCESS_TOKEN_KEY="your_access_secret_key"
REFRESH_TOKEN_KEY="your_refresh_secret_key"

# Server
PORT=5000

# Email Configuration
MAIL_API_KEY="your_mail_api_key"
MY_EMAIL="your-email@example.com"
```

> **Lưu ý**: Thay thế các giá trị placeholder bằng thông tin thực tế của bạn.

### 4. Thiết lập Prisma và Database

Tạo cơ sở dữ liệu MySQL trước, sau đó chạy các lệnh:

```bash
# Tạo Prisma client
npx prisma generate

# Thực thi migration (cho production)
npx prisma migrate dev --name init

# Hoặc đẩy schema lên DB (cho development)
npx prisma db push

# Định dạng Prisma schema
npx prisma format

# Thêm dữ liệu mẫu (nếu có file seed)
npx prisma db seed

yarn lint         # Kiểm tra lỗi ESLint
yarn lint:fix     # Tự động sửa lỗi ESLint nếu có thể
yarn format       # Format code toàn bộ dự án
```

### 5. Khởi động server

**Development mode:**

```bash
# Với Yarn
yarn dev

# Với npm
npm run dev
```

**Production mode:**

```bash
# Build project
yarn build   # hoặc npm run build

# Start production server
yarn start   # hoặc npm start
```

Server sẽ chạy tại `http://localhost:5000` (hoặc PORT được cấu hình trong .env)

## 📚 Scripts có sẵn

```bash
# Development
npm run dev          # Chạy server ở chế độ development với hot reload

# Production
npm run build        # Build TypeScript thành JavaScript
npm start           # Chạy server production

# Database
npm run db:generate  # Tạo Prisma client
npm run db:migrate   # Chạy database migrations
npm run db:push      # Đẩy schema changes lên database
npm run db:seed      # Thêm dữ liệu mẫu
```

## 🔧 Prisma Commands

```bash
# Xem database trong browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

## 📖 API Documentation

Sau khi khởi động server, bạn có thể truy cập:

- **Base URL**: `http://localhost:5000`
- **Health Check**: `GET /health`
- **API Routes**: Xem trong thư mục `src/routes/`

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

⭐ **Nếu dự án này hữu ích, đừng quên star repository!**
