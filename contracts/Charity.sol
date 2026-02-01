// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Charity {
    string public title;
    uint256 public target;
    uint256 public deadline;
    uint256 public raised;
    address public owner;
    address[] public donors;

    struct Transaction {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool isWithdrawal;
    }
    
    Transaction[] public transactions;

    mapping(address => uint256) public contributions;
    mapping(address => bool) private hasDonated;

    event ContributionMade(address indexed donor, uint256 amount);
    event Withdrawn(uint256 amount);

    constructor(string memory _title, uint256 _target, uint256 _secondsUntilDeadline) {
        require(_target > 0, "Target must be > 0");
        require(_secondsUntilDeadline > 0, "Deadline must be > 0");
        title = _title;
        target = _target;
        deadline = block.timestamp + _secondsUntilDeadline;
        owner = msg.sender;
    }
    
    function contribute() public payable { 
        require(block.timestamp < deadline, "Campaign ended");
        require(raised < target, "Target already reached"); 
        require(msg.value > 0, "Must send ETH");

        if (!hasDonated[msg.sender]) {
            donors.push(msg.sender);
            hasDonated[msg.sender] = true;
        }

        contributions[msg.sender] += msg.value;
        raised += msg.value;
        
        transactions.push(Transaction({
            user: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isWithdrawal: false
        }));
        
        emit ContributionMade(msg.sender, msg.value);
    }
    
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        
        transactions.push(Transaction({
            user: msg.sender,
            amount: balance,
            timestamp: block.timestamp,
            isWithdrawal: true
        }));
        
        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(balance);
    }
    
    function getDonors() external view returns (address[] memory) {
        return donors;
    }
    
    function getDonorCount() external view returns (uint256) {
        return donors.length;
    }
    
    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }
    
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    receive() external payable {
        contribute();
    }
}