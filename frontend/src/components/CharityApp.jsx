import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import abi from "../contracts/CharityABI.json";
import "./LiquidGlass.css";
import heroImage from "./Gemini_Generated_Image_4mjgpl4mjgpl4mjg.png";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

function CharityApp() {
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

  const isOwner = useMemo(() => {
    if (!currentAccount || !ownerAddress) return false;
    return currentAccount.toLowerCase() === ownerAddress.toLowerCase();
  }, [currentAccount, ownerAddress]);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);

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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

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
      <nav className="glass-panel border-b border-white/5">
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
              {currentAccount ? (
                <div className="glass-button px-5 py-2.5 cursor-default">
                  {formatAddress(currentAccount)}
                </div>
              ) : (
                <button onClick={connectWallet} className="glass-button px-5 py-2.5">
                  CONNECT
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {activeSection === "home" && (
        <>
          <section
            className="relative h-[75vh] flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/60 via-[#0A0A0B]/80 to-[#0A0A0B]"></div>
            <div className="relative z-10 text-center px-6 space-y-6 max-w-4xl">
              <h1 className="text-7xl font-thin tracking-[0.15em] text-offwhite leading-tight">
                MAKE A DIFFERENCE
              </h1>
              <p className="text-xl font-light text-offwhite/80 tracking-wide max-w-2xl mx-auto leading-relaxed">
                Every contribution brings us closer to a better tomorrow.
              </p>
            </div>
          </section>

          {/* Campaign Stats */}
          <section className="w-full px-6 lg:px-12 py-20">
            <div className="glass-panel p-12 max-w-5xl mx-auto">
              <div className="flex justify-center items-center gap-24 mb-12">
                <div className="text-center min-w-[150px]">
                  <div className="text-5xl font-thin text-mutedgold mb-2">
                    {parseFloat(raised).toFixed(2)}
                  </div>
                  <div className="text-sm font-light tracking-widest text-offwhite/60">
                    ETH RAISED
                  </div>
                </div>
                <div className="text-center min-w-[150px]">
                  <div className="text-5xl font-thin text-offwhite mb-2">
                    {parseFloat(target).toFixed(2)}
                  </div>
                  <div className="text-sm font-light tracking-widest text-offwhite/60">
                    TARGET
                  </div>
                </div>
                <div className="text-center min-w-[150px]">
                  <div className="text-5xl font-thin text-offwhite mb-2">
                    {progress.toFixed(0)}%
                  </div>
                  <div className="text-sm font-light tracking-widest text-offwhite/60">
                    PROGRESS
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-12">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-mutedgold to-mutedgold/70 transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Donate Form */}
              <div className="space-y-6">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-offwhite placeholder-offwhite/40 focus:outline-none focus:border-mutedgold/50 transition-all text-lg font-light tracking-wide backdrop-blur-sm"
                  disabled={loading}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleDonate}
                    disabled={loading}
                    className="flex-1 glass-button px-8 py-4 text-lg disabled:opacity-50"
                  >
                    {loading ? "PROCESSING..." : "DONATE NOW"}
                  </button>
                  {isOwner && (
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="flex-1 glass-button px-8 py-4 text-lg disabled:opacity-50 border-mutedgold/30 hover:border-mutedgold"
                    >
                      {withdrawing ? "WITHDRAWING..." : "WITHDRAW"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
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
            <div className="glass-panel p-8">
              <div className="transaction-list">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div
                      key={index}
                      className={`transaction-row ${
                        tx.isWithdrawal ? "withdrawal" : "donation"
                      }`}
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
