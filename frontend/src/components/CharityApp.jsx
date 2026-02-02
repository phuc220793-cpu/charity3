import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import abi from "../contracts/CharityABI.json";
import "./LiquidGlass.css";
import heroImage from "./Gemini_Generated_Image_4mjgpl4mjgpl4mjg.png";


// Mock campaign data (replace with real data from contract if available)
const CAMPAIGNS = [
  {
    id: 1,
    name: "Chung tay cùng miền núi",
    address: "0xA4CCfcE965653d02b366A4dAe82273E961DB6584",
    image: heroImage,
    description: "Ủng hộ trẻ em vùng cao vượt khó, xây trường học và hỗ trợ sách vở.",
  },
  {
    id: 2,
    name: "Quỹ Trái Tim Việt Nam",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    image: heroImage,
    description: "Gây quỹ phẫu thuật tim cho trẻ em nghèo trên toàn quốc.",
  },
  {
    id: 3,
    name: "Hỗ trợ đồng bào lũ lụt miền Trung",
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    image: heroImage,
    description: "Cứu trợ khẩn cấp và tái thiết sau thiên tai cho đồng bào miền Trung.",
  },
];


function CharityApp() {
  // Campaign selection state
  const [selectedCampaign, setSelectedCampaign] = useState(CAMPAIGNS[0]);
  const [raised, setRaised] = useState("0");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [target, setTarget] = useState("0");
  const [deadline, setDeadline] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  // Add state and filter for user's transactions
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const filteredTransactions = useMemo(() => {
    if (!showOnlyMine || !currentAccount) return transactions;
    return transactions.filter(
      (tx) => tx.user && tx.user.toLowerCase() === currentAccount.toLowerCase()
    );
  }, [showOnlyMine, transactions, currentAccount]);

  const isOwner = useMemo(() => {
    if (!currentAccount || !ownerAddress) return false;
    return currentAccount.toLowerCase() === ownerAddress.toLowerCase();
  }, [currentAccount, ownerAddress]);


  useEffect(() => {
    if (selectedCampaign) {
      loadBlockchainData(selectedCampaign.address);
    }
    // eslint-disable-next-line
  }, [selectedCampaign]);

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
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);

      const totalRaised = await contract.getFunction("raised")();
      setRaised(ethers.formatEther(totalRaised));

      const campaignTarget = await contract.getFunction("target")();
      setTarget(ethers.formatEther(campaignTarget));

      const campaignDeadline = await contract.getFunction("deadline")();
      setDeadline(Number(campaignDeadline));

      const owner = await contract.getFunction("owner")();
      setOwnerAddress(owner);

      await fetchLeaderboard(contract);
      await fetchTransactions(contract);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  };

  const fetchLeaderboard = async (contract) => {
    try {
      const donorAddresses = await contract.getDonors();
      const donorData = [];

      for (let i = 0; i < donorAddresses.length; i++) {
        const addr = donorAddresses[i];
        const contribution = await contract.getFunction("contributions")(addr);
        donorData.push({
          address: addr,
          amount: ethers.formatEther(contribution),
        });
      }

      donorData.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      setLeaderboard(donorData.slice(0, 10));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchTransactions = async (contract) => {
    try {
      const txs = await contract.getTransactions();
      const formattedTxs = txs.map((tx) => ({
        user: tx.user,
        amount: ethers.formatEther(tx.amount),
        timestamp: Number(tx.timestamp),
        isWithdrawal: tx.isWithdrawal,
      }));
      setTransactions(formattedTxs.reverse());
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

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
      await loadBlockchainData();
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
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedCampaign.address, abi.abi, signer);

      const now = Math.floor(Date.now() / 1000);
      if (deadline && now > deadline) {
        alert("⏰ Chiến dịch đã kết thúc!");
        setLoading(false);
        return;
      }

      const tx = await contract.contribute({
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      alert("✅ Donate thành công!");
      setAmount("");
      await loadBlockchainData();
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
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedCampaign.address, abi.abi, signer);

      const tx = await contract.withdraw();
      await tx.wait();

      alert("✅ Rút tiền thành công!");
      await loadBlockchainData();
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("vi-VN");
  };

  const progress = useMemo(() => {
    if (parseFloat(target) === 0) return 0;
    return Math.min((parseFloat(raised) / parseFloat(target)) * 100, 100);
  }, [raised, target]);

  return (
    <div className="min-h-screen charcoal-bg">
      {/* Navigation */}
      <nav className="glass-panel border-b border-white/5 pt-4">
        <div className="container mx-auto px-6 lg:px-12 py-5">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-thin tracking-[0.2em] text-offwhite">
              CHARITY
            </div>
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveSection("home")}
                className={`text-sm font-light tracking-wide transition-all duration-300 ${
                  activeSection === "home"
                    ? "text-mutedgold"
                    : "text-offwhite/70 hover:text-offwhite"
                }`}
              >
                HOME
              </button>
              <button
                onClick={() => setActiveSection("leaderboard")}
                className={`text-sm font-light tracking-wide transition-all duration-300 ${
                  activeSection === "leaderboard"
                    ? "text-mutedgold"
                    : "text-offwhite/70 hover:text-offwhite"
                }`}
              >
                LEADERBOARD
              </button>
              <button
                onClick={() => setActiveSection("transactions")}
                className={`text-sm font-light tracking-wide transition-all duration-300 ${
                  activeSection === "transactions"
                    ? "text-mutedgold"
                    : "text-offwhite/70 hover:text-offwhite"
                }`}
              >
                TRANSACTIONS
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Campaign List Section */}
      {activeSection === "home" && (
        <section className="w-full min-h-[40vh] flex flex-col justify-center items-center px-6 lg:px-12 pt-8 pb-2 bg-black/70">
          <div className="max-w-5xl w-full flex flex-col items-center">
            <h2 className="text-4xl font-bold text-yellow-300 mb-8 text-center tracking-wide drop-shadow">DỰ ÁN QUYÊN GÓP</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full justify-items-center">
              {CAMPAIGNS.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer bg-white/10 backdrop-blur-md p-5 flex flex-col items-center hover:scale-105 ${selectedCampaign.id === c.id ? "border-yellow-400" : "border-transparent"}`}
                  onClick={() => setSelectedCampaign(c)}
                >
                  <img src={c.image} alt={c.name} className="w-full h-32 object-cover rounded-xl mb-4" />
                  <div className="font-bold text-lg text-white mb-2 text-center">{c.name}</div>
                  <div className="text-sm text-white/80 mb-2 text-center min-h-[48px]">{c.description}</div>
                  <div className="text-xs text-white/50 font-mono break-all">{c.address}</div>
                  {selectedCampaign.id === c.id && (
                    <div className="mt-2 px-3 py-1 bg-yellow-300 text-black text-xs rounded-full font-bold">Đang chọn</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section - Redesigned for selected campaign */}
      {activeSection === "home" && selectedCampaign && (
        <section
          className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-black"
          style={{
            backgroundImage: `linear-gradient(rgba(10,10,11,0.7),rgba(10,10,11,0.8)), url(${selectedCampaign.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0B]/80 via-[#0A0A0B]/60 to-[#1a1a1a]/80"></div>
          <div className="relative z-10 text-center px-6 space-y-8 max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-400 drop-shadow-lg animate-fadein">
              {selectedCampaign.name}
            </h1>
            <p className="text-lg font-light text-white/90 tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow">
              {selectedCampaign.description}
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center mt-8">
              <div className="rounded-xl bg-white/10 backdrop-blur-md px-8 py-6 shadow-lg border border-yellow-200 flex flex-col items-center min-w-[140px]">
                <span className="text-4xl font-bold text-yellow-300 drop-shadow">
                  {parseFloat(raised).toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-white/80 mt-1 tracking-widest">ETH RAISED</span>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md px-8 py-6 shadow-lg border border-white/20 flex flex-col items-center min-w-[140px]">
                <span className="text-4xl font-bold text-white drop-shadow">
                  {parseFloat(target).toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-white/60 mt-1 tracking-widest">TARGET</span>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md px-8 py-6 shadow-lg border border-yellow-200 flex flex-col items-center min-w-[140px]">
                <span className="text-4xl font-bold text-yellow-300 drop-shadow">
                  {progress.toFixed(0)}%
                </span>
                <span className="text-xs font-semibold text-white/80 mt-1 tracking-widest">PROGRESS</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full max-w-xl mx-auto mt-8">
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            {/* Donate Form */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-10">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount in ETH"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="px-6 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-300 w-56 text-lg shadow"
                disabled={loading}
              />
              <button
                onClick={handleDonate}
                disabled={loading}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Processing..." : "DONATE NOW"}
              </button>
              {isOwner && (
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-gray-700 via-gray-900 to-black text-yellow-300 font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 border border-yellow-300"
                >
                  {withdrawing ? "Withdrawing..." : "WITHDRAW"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Section */}
      {activeSection === "leaderboard" && (
        <section className="container mx-auto px-6 lg:px-12 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-thin tracking-[0.15em] text-offwhite mb-12 text-center">
              TOP DONORS
            </h2>
            <div className="glass-panel p-8">
              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((donor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-5 bg-white/5 rounded-lg border border-white/10 hover:border-mutedgold/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-thin text-mutedgold w-8">
                          {index + 1}
                        </div>
                        <div className="text-sm font-mono text-offwhite/80">
                          {formatAddress(donor.address)}
                        </div>
                      </div>
                      <div className="text-lg font-light text-offwhite">
                        {parseFloat(donor.amount).toFixed(4)} ETH
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-offwhite/50 py-12">
                    No donations yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Transactions Section */}
      {activeSection === "transactions" && (
        <section className="container mx-auto px-6 lg:px-12 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-thin tracking-[0.15em] text-offwhite mb-12 text-center">
              TRANSACTION HISTORY
            </h2>
            <div className="flex justify-end mb-4">
              <label className="flex items-center gap-2 text-offwhite/80 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnlyMine}
                  onChange={() => setShowOnlyMine((v) => !v)}
                  className="accent-yellow-400 w-4 h-4"
                />
                Chỉ hiện giao dịch của tôi
              </label>
            </div>
            <div className="glass-panel p-8">
              <div className="transaction-list">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className={`transaction-row ${
                        tx.isWithdrawal ? "withdrawal" : "donation"
                      } ${currentAccount && tx.user.toLowerCase() === currentAccount.toLowerCase() ? "bg-yellow-100/10 border-l-4 border-yellow-300" : ""}`}
                    >
                      <div className="tx-left">
                        <div className="tx-type">
                          {tx.isWithdrawal ? "🔽 WITHDRAW" : "🔼 DONATE"}
                        </div>
                        <div className="tx-address">{formatAddress(tx.user)}</div>
                      </div>
                      <div className="tx-right">
                        <div
                          className={`tx-amount ${
                            tx.isWithdrawal ? "negative" : "positive"
                          }`}
                        >
                          {tx.isWithdrawal ? "-" : "+"}
                          {parseFloat(tx.amount).toFixed(4)} ETH
                        </div>
                        <div className="tx-time">{formatTimestamp(tx.timestamp)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-offwhite/50 py-12">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default CharityApp;
