import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TITLE = "Hỗ Trợ Đông Bảo Lũ Lụt Miền Trung";
const TARGET = BigInt("100000000000000000"); // 0.1 ETH
const SECONDS = 30 * 24 * 60 * 60; // 30 ngày

const HopTroLuLut = buildModule("HopTroLuLut", (m) => {
  const charity = m.contract("Charity", [TITLE, TARGET, SECONDS]);
  return { charity };
});

export default HopTroLuLut;