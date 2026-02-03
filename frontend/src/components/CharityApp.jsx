import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import charityArtifact from "../contracts/CharityABI.json";
import "./CharityApp.css";
import imgCampaign1 from "../assets/CD1.jpg";
import imgCampaign2 from "../assets/CD2.jpg";
import imgCampaign3 from "../assets/CD3.jpg";

// Extract ABI from artifact
const abi = charityArtifact.abi || charityArtifact;

const CAMPAIGNS = [
  {
    id: 1,
    name: "CHUNG TAY VÌ TRẺ EM VÙNG CAO",
    address: "0xA4CCfcE965653d02b366A4dAe82273E961DB6584", // Sepolia
    image: imgCampaign1,
    description: "Ủng hộ trẻ em vùng cao vượt khó, xây trường học và hỗ trợ sách vở.",
  },
  {
    id: 2,
    name: "QUỸ PHẪU THUẬT TIM CHO TRẺ EM NGHÈO",
    address: "0x03fB8877Fe1f62CC5E108D6DEDd615CB4d588eac", // Sepolia
    image: imgCampaign2,
    description: "Gây quỹ phẫu thuật tim cho trẻ em nghèo trên toàn quốc.",
  },
  {
    id: 3,
    name: "HỖ TRỢ ĐỒNG BÀO LŨ LỤT MIỀN TRUNG",
    address: "0xf687a4F6Dd441117b7d17838f66D14b72Ed84A09", // Sepolia
    image: imgCampaign3,
    description: "Cứu trợ khẩn cấp và tái thiết sau thiên tai cho đồng bào miền Trung.",
  },
];

function CharityApp() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [raised, setRaised] = useState("0");
  const [target, setTarget] = useState("0");
  const [deadline, setDeadline] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(CAMPAIGNS[0]);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const isOwner = useMemo(() => {
    return (
      currentAccount &&
      ownerAddress &&
      currentAccount.toLowerCase() === ownerAddress.toLowerCase()
    );
  }, [currentAccount, ownerAddress]);

  const fetchLeaderboard = async (contract) => {
    try {
      const count = await contract.getDonorCount();
      const leaderboardData = [];

      for (let i = 0; i < Number(count); i++) {
        const donor = await contract.donors(i);
        const amount = await contract.contributions(donor);
        leaderboardData.push({
          address: donor,
          amount: ethers.formatEther(amount),
        });
      }

      leaderboardData.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      setLeaderboard(leaderboardData.slice(0, 10));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchTransactions = async (contract) => {
    try {
      const txs = await contract.getTransactions();
      const txData = txs
        .filter(tx => !tx.isWithdrawal)
        .map((tx) => ({
          from: tx.user,
          amount: ethers.formatEther(tx.amount),
          timestamp: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
        }));

      setTransactions(txData.reverse());
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const loadBlockchainData = async (contractAddress) => {
    try {
      if (!window.ethereum) {
        alert("⚠️ Vui lòng cài đặt MetaMask để sử dụng ứng dụng này!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // ✅ Check network
      const network = await provider.getNetwork();
      const allowedChainIds = [31337n, 11155111n]; // Hardhat, Sepolia
      if (!allowedChainIds.includes(network.chainId)) {
        alert(`⚠️ Sai network! Chain hiện tại: ${network.chainId}. Vui lòng chuyển đúng mạng.`);
        return;
      }

      // ✅ Check contract code
      const code = await provider.getCode(contractAddress);
      if (!code || code === "0x") {
        alert("⚠️ Address này không phải contract trên network hiện tại!");
        return;
      }

      const contract = new ethers.Contract(contractAddress, abi, provider);

      const totalRaised = await contract.raised();
      setRaised(ethers.formatEther(totalRaised));

      // Use getFunction to avoid conflict with contract.target property
      const getTarget = contract.getFunction("target");
      const campaignTarget = await getTarget();
      setTarget(ethers.formatEther(campaignTarget));

      const campaignDeadline = await contract.deadline();
      setDeadline(Number(campaignDeadline));

      const owner = await contract.owner();
      setOwnerAddress(owner);

      await fetchLeaderboard(contract);
      await fetchTransactions(contract);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      loadBlockchainData(selectedCampaign.address);
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setCurrentAccount(accounts[0] || "");
        if (accounts[0] && selectedCampaign) {
          loadBlockchainData(selectedCampaign.address);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [selectedCampaign]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("⚠️ Vui lòng cài đặt MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      await loadBlockchainData(selectedCampaign.address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("❌ Không thể kết nối ví!");
    }
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("⚠️ Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    if (!currentAccount) {
      alert("⚠️ Vui lòng kết nối ví trước!");
      return;
    }

    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      // ✅ Check network
      const network = await provider.getNetwork();
      const allowedChainIds = [31337n, 11155111n]; // Hardhat, Sepolia
      if (!allowedChainIds.includes(network.chainId)) {
        alert(`⚠️ Sai network! Chain hiện tại: ${network.chainId}. Vui lòng chuyển đúng mạng.`);
        return;
      }

      // ✅ Check contract code
      const code = await provider.getCode(selectedCampaign.address);
      if (!code || code === "0x") {
        alert("⚠️ Address này không phải contract trên network hiện tại!");
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedCampaign.address, abi, signer);

      const now = Math.floor(Date.now() / 1000);
      if (deadline && now > deadline) {
        alert("⏰ Chiến dịch đã kết thúc!");
        return;
      }

      const tx = await contract.contribute({
        value: ethers.parseEther(amount),
      });

      console.log("Tx Hash:", tx.hash);
      console.log("Contract Address:", selectedCampaign.address);

      await tx.wait();
      alert("✅ Donate thành công!");
      setAmount("");
      await loadBlockchainData(selectedCampaign.address);
    } catch (error) {
      console.error("Error donating:", error);
      alert("❌ Donate thất bại! Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isOwner) {
      alert("⚠️ Chỉ admin mới có thể rút tiền!");
      return;
    }

    if (parseFloat(raised) <= 0) {
      alert("⚠️ Không có tiền để rút!");
      return;
    }

    try {
      setWithdrawing(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      // ✅ Check network
      const network = await provider.getNetwork();
      const allowedChainIds = [31337n, 11155111n]; // Hardhat, Sepolia
      if (!allowedChainIds.includes(network.chainId)) {
        alert(`⚠️ Sai network! Chain hiện tại: ${network.chainId}. Vui lòng chuyển đúng mạng.`);
        return;
      }

      // ✅ Check contract code
      const code = await provider.getCode(selectedCampaign.address);
      if (!code || code === "0x") {
        alert("⚠️ Address này không phải contract trên network hiện tại!");
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedCampaign.address, abi, signer);

      const tx = await contract.withdraw();
      await tx.wait();

      alert("✅ Rút tiền thành công!");
      await loadBlockchainData(selectedCampaign.address);
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("❌ Rút tiền thất bại!");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const progress = useMemo(() => {
    if (!target || parseFloat(target) === 0) return 0;
    return Math.min((parseFloat(raised) / parseFloat(target)) * 100, 100);
  }, [raised, target]);

  return (
    <div className="charity-app">
      <header className="header">
        <h1>🌟 QUYÊN GÓP TỪ THIỆN</h1>
        {currentAccount ? (
          <div className="wallet-info">
            <span className="wallet-address">
              Ví: {formatAddress(currentAccount)}
            </span>
            {isOwner && <span className="admin-badge">👑 Admin</span>}
          </div>
        ) : (
          <button onClick={connectWallet} className="connect-btn">
            Kết nối ví
          </button>
        )}
      </header>

      <div className="campaign-selector">
        <h2>Chọn chiến dịch</h2>
        <div className="campaign-cards">
          {CAMPAIGNS.map((campaign) => (
            <div
              key={campaign.id}
              className={`campaign-card ${
                selectedCampaign.id === campaign.id ? "active" : ""
              }`}
              onClick={() => setSelectedCampaign(campaign)}
            >
              <img src={campaign.image} alt={campaign.name} />
              <h3>{campaign.name}</h3>
              <p>{campaign.description}</p>
              <button className="select-btn">
                {selectedCampaign.id === campaign.id
                  ? "Đang chọn"
                  : "Chọn chiến dịch"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <main className="main-content">
        <section className="campaign-detail">
          <div className="campaign-hero">
            <img
              src={selectedCampaign.image}
              alt={selectedCampaign.name}
              className="campaign-image"
            />
            <div className="campaign-info-overlay">
              <h2>{selectedCampaign.name}</h2>
              <p className="campaign-description">
                {selectedCampaign.description}
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>{parseFloat(raised).toFixed(4)} ETH</h3>
              <p>ĐÃ TĂNG</p>
            </div>
            <div className="stat-card">
              <h3>{parseFloat(target).toFixed(2)} ETH</h3>
              <p>MỤC TIÊU</p>
            </div>
            <div className="stat-card">
              <h3>{progress.toFixed(0)}%</h3>
              <p>TIẾN ĐỘ</p>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="donate-section">
            <input
              type="number"
              placeholder="Nhập số ETH (vd: 0.01)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="donate-input"
              step="0.0001"
              min="0"
            />
            <button
              onClick={handleDonate}
              disabled={loading || !currentAccount}
              className="donate-btn"
            >
              {loading ? "Processing..." : "💝 Quyên góp ngay"}
            </button>
          </div>

          {isOwner && (
            <div className="admin-section">
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="withdraw-btn"
              >
                {withdrawing ? "Đang rút..." : "💰 Rút tiền (Admin)"}
              </button>
            </div>
          )}
        </section>

        <aside className="sidebar">
          <section className="leaderboard">
            <h3>🏆 TOP ỦNG HỘ</h3>
            <div className="leaderboard-list">
              {leaderboard.length > 0 ? (
                leaderboard.map((donor, index) => (
                  <div key={index} className="leaderboard-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="address">{formatAddress(donor.address)}</span>
                    <span className="amount">{parseFloat(donor.amount).toFixed(4)} ETH</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">Chưa có người ủng hộ</p>
              )}
            </div>
          </section>

          <section className="transactions">
            <h3>📜 GIAO DỊCH GẦN ĐÂY</h3>
            <div className="transaction-list">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="transaction-item">
                    <div className="tx-header">
                      <span className="tx-from">{formatAddress(tx.from)}</span>
                      <span className="tx-amount">{parseFloat(tx.amount).toFixed(4)} ETH</span>
                    </div>
                    <div className="tx-time">{tx.timestamp}</div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Chưa có giao dịch</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default CharityApp;