const hre = require("hardhat");

async function main() {
  const campaigns = [
    { title: "CHUNG TAY VÌ TRẺ EM VÙNG CAO", target: "10", days: 30 },
    { title: "QUỸ PHẪU THUẬT TIM CHO TRẺ EM NGHÈO", target: "20", days: 45 },
    { title: "HỖ TRỢ ĐỒNG BÀO LŨ LỤT MIỀN TRUNG", target: "15", days: 60 },
  ];

  console.log("\n🚀 Bắt đầu deploy 3 chiến dịch lên Sepolia...\n");

  for (const campaign of campaigns) {
    const Charity = await hre.ethers.getContractFactory("Charity");
    const targetInWei = hre.ethers.parseEther(campaign.target);
    const durationInSeconds = campaign.days * 24 * 60 * 60;

    console.log(`📌 Deploying: ${campaign.title}...`);
    const charity = await Charity.deploy(
      campaign.title,
      targetInWei,
      durationInSeconds
    );
    await charity.waitForDeployment();

    const address = await charity.getAddress();
    console.log(`✅ ${campaign.title}`);
    console.log(`   Address: ${address}\n`);
  }

  console.log("🎉 Deploy hoàn tất!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});