import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TITLE = "Quỹ Phẫu Thuật Tim Cho Trẻ Em Nghèo";
const TARGET = BigInt("100000000000000000"); // 0.1 ETH
const SECONDS = 30 * 24 * 60 * 60; // 30 ngày

const QuyPhauthuat = buildModule("QuyPhauthuat", (m) => {
  const charity = m.contract("Charity", [TITLE, TARGET, SECONDS]);
  return { charity };
});

export default QuyPhauthuat;