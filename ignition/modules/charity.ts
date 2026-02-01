import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Các tham số cho constructor của bạn
const TITLE = "Quỹ Hỗ Trợ Sinh Viên Nam Cần Thơ";
const TARGET = 10000000000000000000n; // 10 ETH (tính bằng Wei)
const SECONDS = 30 * 24 * 60 * 60; // 30 ngày

const CharityModule = buildModule("CharityModule", (m) => {
  const charity = m.contract("Charity", [TITLE, TARGET, SECONDS]);

  return { charity };
});

export default CharityModule;