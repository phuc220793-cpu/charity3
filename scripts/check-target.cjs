const hre = require("hardhat");

async function main() {
  const addresses = [
    "0xA4CCfcE965653d02b366A4dAe82273E961DB6584",
    "0x03fB8877Fe1f62CC5E108D6DEDd615CB4d588eac",
    "0xf687a4F6Dd441117b7d17838f66D14b72Ed84A09",
  ];

  console.log("\n🔍 Checking targets on Sepolia...\n");

  for (const address of addresses) {
    try {
      const charity = await hre.ethers.getContractAt("Charity", address);
      const target = await charity.target();
      const targetETH = hre.ethers.formatEther(target);
      console.log(`✅ ${address}`);
      console.log(`   Target: ${targetETH} ETH\n`);
    } catch (error) {
      console.log(`❌ ${address}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
