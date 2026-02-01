# Charity DApp - Ứng dụng từ thiện trên Blockchain

Ứng dụng từ thiện phi tập trung (DApp) được xây dựng trên Ethereum blockchain, cho phép người dùng quyên góp và theo dõi các khoản đóng góp một cách minh bạch.

## 🚀 Tính năng

- ✅ Quyên góp ETH cho chiến dịch từ thiện
- ✅ Theo dõi tiến độ chiến dịch real-time
- ✅ Bảng xếp hạng top donors
- ✅ Lịch sử giao dịch đầy đủ
- ✅ Chức năng rút tiền cho admin
- ✅ Giao diện đẹp với hiệu ứng glass morphism

## 📋 Yêu cầu hệ thống

- Node.js (v18 trở lên)
- npm hoặc yarn
- MetaMask extension
- Git

## 🛠️ Công nghệ sử dụng

### Backend (Smart Contract)
- Solidity ^0.8.20
- Hardhat
- Ethers.js v6

### Frontend
- React 18
- Vite
- TailwindCSS
- Ethers.js v6

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd Charity
```

### 2. Cài đặt dependencies

#### Backend (Root folder)
```bash
npm install
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

## 🚀 Chạy ứng dụng

### Bước 1: Khởi động Hardhat Node (Terminal 1)

```bash
npx hardhat node
```

> Lệnh này sẽ khởi động một blockchain local trên `http://localhost:8545` và tạo 20 accounts test với 10000 ETH mỗi account.

### Bước 2: Deploy Smart Contract (Terminal 2)

```bash
npx hardhat ignition deploy .\ignition\modules\charity.ts --network localhost
```

> Copy địa chỉ contract được deploy (ví dụ: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`)

### Bước 3: Cập nhật địa chỉ contract trong Frontend

Mở file `frontend/src/components/CharityApp.jsx` và cập nhật:

```javascript
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Địa chỉ contract của bạn
```

### Bước 4: Copy ABI sang Frontend

```bash
Copy-Item -Path ".\artifacts\contracts\Charity.sol\Charity.json" -Destination ".\frontend\src\contracts\CharityABI.json" -Force
```

### Bước 5: Khởi động Frontend (Terminal 3)

```bash
cd frontend
npm run dev
```

> Ứng dụng sẽ chạy tại `http://localhost:5173`

## 🔧 Cấu hình MetaMask

### 1. Thêm Hardhat Network

- Mở MetaMask
- Networks → Add Network → Add a network manually
- Điền thông tin:
  - **Network Name**: Hardhat Local
  - **RPC URL**: http://localhost:8545
  - **Chain ID**: 31337
  - **Currency Symbol**: ETH

### 2. Import Test Account

Copy private key từ terminal Hardhat Node và import vào MetaMask:

- MetaMask → Account → Import Account
- Paste private key
- Import

## 📝 Cấu trúc thư mục

```
Charity/
├── contracts/              # Smart contracts
│   └── Charity.sol
├── ignition/              # Deployment scripts
│   └── modules/
│       └── charity.ts
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── CharityApp.jsx
│   │   ├── contracts/     # ABI files
│   │   └── assets/
│   └── package.json
├── test/                  # Contract tests
├── hardhat.config.ts      # Hardhat configuration
└── package.json
```

## 🎯 Sử dụng ứng dụng

### 1. Kết nối ví

- Click nút **CONNECT** ở góc trên phải
- Chọn account trong MetaMask
- Approve connection

### 2. Donate

- Nhập số lượng ETH muốn donate
- Click **DONATE NOW**
- Confirm transaction trong MetaMask

### 3. Xem thông tin

- **HOME**: Xem tiến độ chiến dịch và donate
- **LEADERBOARD**: Top 10 donors
- **TRANSACTIONS**: Lịch sử giao dịch

### 4. Rút tiền (Owner only)

- Nếu bạn là owner của contract, nút **WITHDRAW** sẽ xuất hiện
- Click **WITHDRAW** để rút toàn bộ tiền về ví

## 🔄 Deploy lại Contract (nếu cần)

Nếu muốn deploy lại với tham số mới:

### 1. Chỉnh sửa tham số

Mở `ignition/modules/charity.ts`:

```typescript
const TITLE = "Quỹ Hỗ Trợ Sinh Viên Nam Cần Thơ";
const TARGET = 10000000000000000000n; // 10 ETH
const SECONDS = 30 * 24 * 60 * 60; // 30 ngày
```

### 2. Deploy lại

```bash
npx hardhat ignition deploy .\ignition\modules\charity.ts --network localhost --reset
```

### 3. Cập nhật địa chỉ contract mới trong frontend

## 🧪 Chạy Tests

```bash
npx hardhat test
```

## 📊 Compile Contract

```bash
npx hardhat compile
```

## 🐛 Troubleshooting

### Lỗi: "Port 5173 is in use"

Vite sẽ tự động chọn port khác (5174, 5175...). Kiểm tra output để biết port đang dùng.

### Lỗi: "Cannot find module"

Chạy lại `npm install` trong cả root folder và frontend folder.

### Lỗi MetaMask: "Invalid Chain ID"

Đảm bảo Hardhat node đang chạy và Chain ID trong MetaMask là 31337.

### Lỗi: "Nonce too high"

Reset MetaMask account:
- Settings → Advanced → Clear activity tab data

### Dữ liệu không hiển thị

1. Kiểm tra đã connect MetaMask chưa
2. Kiểm tra contract address đúng chưa
3. Kiểm tra Hardhat node có đang chạy không
4. Refresh trang (F5)

## 📄 License

MIT

## 👥 Author

Charity DApp Project

---

**Lưu ý**: Đây là project demo cho mục đích học tập. Không sử dụng cho production mà không có audit bảo mật đầy đủ.

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
