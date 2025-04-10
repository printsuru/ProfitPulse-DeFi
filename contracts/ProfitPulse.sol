// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Simplified ReentrancyGuard implementation
contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// Simplified Ownable implementation
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// Simplified IERC20 interface
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title ProfitPulse
 * @dev A DeFi investment platform on BSC with tiered investment plans and referral system
 */
contract ProfitPulse is ReentrancyGuard, Ownable {
    // BUSD token interface
    IERC20 public busdToken;
    
    // Minimum deposit amount (10 BUSD)
    uint256 public constant MIN_DEPOSIT = 10 * 1e18;
    
    // Investment tiers
    uint256 public constant TIER1_MAX = 500 * 1e18;  // < $500
    uint256 public constant TIER2_MAX = 1000 * 1e18; // < $1,000
    uint256 public constant TIER3_MAX = 2000 * 1e18; // < $2,000
    // TIER4 is >= $2,000
    
    // Profit rates (in basis points, 100 = 1%)
    uint256 public tier1Rate = 200;  // 2%
    uint256 public tier2Rate = 300;  // 3%
    uint256 public tier3Rate = 350;  // 3.5%
    uint256 public tier4Rate = 400;  // 4%
    
    // Referral rates (in basis points)
    uint256 public level1RefRate = 1000; // 10%
    uint256 public level2RefRate = 300;  // 3%
    uint256 public level3RefRate = 200;  // 2%
    
    // Platform state
    bool public paused = false;
    uint256 public totalDeposits = 0;
    uint256 public userCount = 0;
    uint256 public withdrawalCap = 0; // 0 means no cap
    
    // User struct
    struct User {
        uint256 investment;
        uint256 profits;
        uint256 lastProfitUpdate;
        address referrer;
        address[] referrals;
        uint256 referralRewards;
        bool exists;
    }
    
    // Mapping of user addresses to their data
    mapping(address => User) public users;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event ProfitCredited(address indexed user, uint256 amount, uint256 timestamp);
    event ReferralReward(address indexed referrer, address indexed referee, uint256 level, uint256 amount);
    event AdminAction(string action, uint256 timestamp, address admin);
    
    /**
     * @dev Constructor sets the BUSD token address and transfers ownership
     * @param _busdToken Address of the BUSD token contract
     * @param _multiSigWallet Address of the multi-signature wallet for admin actions
     */
    constructor(address _busdToken, address _multiSigWallet) Ownable(msg.sender) {
        require(_busdToken != address(0), "Invalid BUSD token address");
        require(_multiSigWallet != address(0), "Invalid multi-sig wallet address");
        
        busdToken = IERC20(_busdToken);
        transferOwnership(_multiSigWallet);
        
        emit AdminAction("Contract Deployed", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Modifier to check if the contract is not paused
     */
    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    /**
     * @dev Deposit BUSD into the contract
     * @param _referrer Address of the referrer (optional, can be address(0))
     */
    function deposit(address _referrer) external nonReentrant notPaused {
        require(msg.sender != _referrer, "Cannot refer yourself");
        
        // Get user's current balance
        uint256 userBalance = busdToken.balanceOf(msg.sender);
        require(userBalance >= MIN_DEPOSIT, "Insufficient BUSD balance");
        
        // Transfer BUSD from user to contract
        require(busdToken.transferFrom(msg.sender, address(this), userBalance), "BUSD transfer failed");
        
        // Update user data
        if (!users[msg.sender].exists) {
            users[msg.sender].exists = true;
            users[msg.sender].lastProfitUpdate = block.timestamp;
            userCount++;
        } else {
            // Calculate pending profits before updating investment
            calculateProfit(msg.sender);
        }
        
        // Update user's investment
        users[msg.sender].investment += userBalance;
        totalDeposits += userBalance;
        
        // Handle referral if provided and valid
        if (_referrer != address(0) && users[_referrer].exists) {
            // If this is user's first deposit, set referrer
            if (users[msg.sender].referrer == address(0)) {
                users[msg.sender].referrer = _referrer;
                users[_referrer].referrals.push(msg.sender);
            }
            
            // Distribute referral rewards
            distributeReferrals(_referrer, userBalance);
        }
        
        emit Deposit(msg.sender, userBalance, block.timestamp);
    }
    
    /**
     * @dev Distribute referral rewards to upline
     * @param _referrer Address of the direct referrer
     * @param _amount Amount of the deposit
     */
    function distributeReferrals(address _referrer, uint256 _amount) internal {
        // Level 1 referral (direct)
        uint256 level1Reward = (_amount * level1RefRate) / 10000;
        users[_referrer].referralRewards += level1Reward;
        users[_referrer].profits += level1Reward;
        emit ReferralReward(_referrer, msg.sender, 1, level1Reward);
        
        // Level 2 referral (referrer's referrer)
        address level2Referrer = users[_referrer].referrer;
        if (level2Referrer != address(0) && users[level2Referrer].exists) {
            uint256 level2Reward = (_amount * level2RefRate) / 10000;
            users[level2Referrer].referralRewards += level2Reward;
            users[level2Referrer].profits += level2Reward;
            emit ReferralReward(level2Referrer, msg.sender, 2, level2Reward);
            
            // Level 3 referral (referrer's referrer's referrer)
            address level3Referrer = users[level2Referrer].referrer;
            if (level3Referrer != address(0) && users[level3Referrer].exists) {
                uint256 level3Reward = (_amount * level3RefRate) / 10000;
                users[level3Referrer].referralRewards += level3Reward;
                users[level3Referrer].profits += level3Reward;
                emit ReferralReward(level3Referrer, msg.sender, 3, level3Reward);
            }
        }
    }
    
    /**
     * @dev Calculate and credit profit based on investment tier
     * @param _user Address of the user
     */
    function calculateProfit(address _user) public {
        User storage user = users[_user];
        require(user.exists, "User does not exist");
        
        // Skip if no time has passed since last update
        if (block.timestamp <= user.lastProfitUpdate) {
            return;
        }
        
        // Calculate days passed (in seconds)
        uint256 timePassed = block.timestamp - user.lastProfitUpdate;
        
        // Determine profit rate based on investment tier
        uint256 profitRate;
        if (user.investment < TIER1_MAX) {
            profitRate = tier1Rate;
        } else if (user.investment < TIER2_MAX) {
            profitRate = tier2Rate;
        } else if (user.investment < TIER3_MAX) {
            profitRate = tier3Rate;
        } else {
            profitRate = tier4Rate;
        }
        
        // Calculate daily profit (rate / 10000 = percentage, / 86400 = seconds in a day)
        uint256 profitPerSecond = (user.investment * profitRate) / 10000 / 86400;
        uint256 profit = profitPerSecond * timePassed;
        
        // Credit profit to user
        user.profits += profit;
        user.lastProfitUpdate = block.timestamp;
        
        emit ProfitCredited(_user, profit, block.timestamp);
    }
    
    /**
     * @dev Withdraw profits or full balance
     * @param _amount Amount to withdraw (0 for all available balance)
     */
    function withdraw(uint256 _amount) external nonReentrant notPaused {
        User storage user = users[msg.sender];
        require(user.exists, "User does not exist");
        
        // Calculate latest profits
        calculateProfit(msg.sender);
        
        // Determine withdrawal amount
        uint256 availableBalance = user.profits;
        uint256 withdrawAmount = _amount;
        
        if (_amount == 0) {
            // Withdraw all profits
            withdrawAmount = availableBalance;
        } else if (_amount > availableBalance) {
            // If trying to withdraw more than profits, include investment
            uint256 extraAmount = _amount - availableBalance;
            require(extraAmount <= user.investment, "Insufficient balance");
            
            // Reduce investment
            user.investment -= extraAmount;
            totalDeposits -= extraAmount;
        }
        
        require(withdrawAmount > 0, "Nothing to withdraw");
        
        // Check withdrawal cap if set
        if (withdrawalCap > 0) {
            require(withdrawAmount <= withdrawalCap, "Exceeds withdrawal cap");
        }
        
        // Check contract balance
        require(busdToken.balanceOf(address(this)) >= withdrawAmount, "Insufficient contract balance");
        
        // Reduce user's profits
        if (withdrawAmount <= user.profits) {
            user.profits -= withdrawAmount;
        } else {
            user.profits = 0;
        }
        
        // Transfer BUSD to user
        require(busdToken.transfer(msg.sender, withdrawAmount), "BUSD transfer failed");
        
        emit Withdrawal(msg.sender, withdrawAmount, block.timestamp);
    }
    
    /**
     * @dev Withdraw full balance (profits + investment)
     */
    function withdrawAll() external nonReentrant notPaused {
        User storage user = users[msg.sender];
        require(user.exists, "User does not exist");
        
        // Calculate latest profits
        calculateProfit(msg.sender);
        
        // Get total balance
        uint256 totalBalance = user.profits + user.investment;
        require(totalBalance > 0, "Nothing to withdraw");
        
        // Check withdrawal cap if set
        if (withdrawalCap > 0) {
            require(totalBalance <= withdrawalCap, "Exceeds withdrawal cap");
        }
        
        // Check contract balance
        require(busdToken.balanceOf(address(this)) >= totalBalance, "Insufficient contract balance");
        
        // Reset user's profits and investment
        user.profits = 0;
        totalDeposits -= user.investment;
        user.investment = 0;
        
        // Transfer BUSD to user
        require(busdToken.transfer(msg.sender, totalBalance), "BUSD transfer failed");
        
        emit Withdrawal(msg.sender, totalBalance, block.timestamp);
    }
    
    /**
     * @dev Get user's investment details
     * @param _user Address of the user
     * @return investment User's total investment amount
     * @return profits User's accumulated profits
     * @return tier User's current investment tier (1-4)
     * @return referrer User's referrer address
     * @return referralCount Number of user's direct referrals
     * @return referralRewards Total rewards earned from referrals
     */
    function getUserDetails(address _user) external view returns (
        uint256 investment,
        uint256 profits,
        uint256 tier,
        address referrer,
        uint256 referralCount,
        uint256 referralRewards
    ) {
        User storage user = users[_user];
        
        // Calculate current tier
        uint256 userTier;
        if (user.investment < TIER1_MAX) {
            userTier = 1;
        } else if (user.investment < TIER2_MAX) {
            userTier = 2;
        } else if (user.investment < TIER3_MAX) {
            userTier = 3;
        } else {
            userTier = 4;
        }
        
        // Calculate current profits
        uint256 currentProfits = user.profits;
        if (user.exists && block.timestamp > user.lastProfitUpdate) {
            uint256 timePassed = block.timestamp - user.lastProfitUpdate;
            
            // Determine profit rate based on investment tier
            uint256 profitRate;
            if (user.investment < TIER1_MAX) {
                profitRate = tier1Rate;
            } else if (user.investment < TIER2_MAX) {
                profitRate = tier2Rate;
            } else if (user.investment < TIER3_MAX) {
                profitRate = tier3Rate;
            } else {
                profitRate = tier4Rate;
            }
            
            // Calculate profit
            uint256 profitPerSecond = (user.investment * profitRate) / 10000 / 86400;
            uint256 pendingProfit = profitPerSecond * timePassed;
            currentProfits += pendingProfit;
        }
        
        return (
            user.investment,
            currentProfits,
            userTier,
            user.referrer,
            user.referrals.length,
            user.referralRewards
        );
    }
    
    /**
     * @dev Get user's referrals
     * @param _user Address of the user
     * @return Array of referral addresses
     */
    function getUserReferrals(address _user) external view returns (address[] memory) {
        return users[_user].referrals;
    }
    
    // Admin functions (only callable by owner/multi-sig wallet)
    
    /**
     * @dev Add liquidity to the contract
     */
    function addLiquidity(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(busdToken.transferFrom(msg.sender, address(this), _amount), "BUSD transfer failed");
        
        emit AdminAction("Liquidity Added", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Set withdrawal cap
     * @param _cap New withdrawal cap (0 for no cap)
     */
    function setWithdrawalCap(uint256 _cap) external onlyOwner {
        withdrawalCap = _cap;
        
        emit AdminAction("Withdrawal Cap Updated", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Update profit rate for a tier
     * @param _tier Tier number (1-4)
     * @param _rate New rate in basis points (100 = 1%)
     */
    function updateProfitRate(uint256 _tier, uint256 _rate) external onlyOwner {
        require(_tier >= 1 && _tier <= 4, "Invalid tier");
        require(_rate > 0 && _rate <= 1000, "Rate must be between 0 and 10%");
        
        if (_tier == 1) {
            tier1Rate = _rate;
        } else if (_tier == 2) {
            tier2Rate = _rate;
        } else if (_tier == 3) {
            tier3Rate = _rate;
        } else if (_tier == 4) {
            tier4Rate = _rate;
        }
        
        emit AdminAction("Profit Rate Updated", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Update referral rate for a level
     * @param _level Level number (1-3)
     * @param _rate New rate in basis points (100 = 1%)
     */
    function updateReferralRate(uint256 _level, uint256 _rate) external onlyOwner {
        require(_level >= 1 && _level <= 3, "Invalid level");
        require(_rate > 0 && _rate <= 2000, "Rate must be between 0 and 20%");
        
        if (_level == 1) {
            level1RefRate = _rate;
        } else if (_level == 2) {
            level2RefRate = _rate;
        } else if (_level == 3) {
            level3RefRate = _rate;
        }
        
        emit AdminAction("Referral Rate Updated", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Pause or unpause the contract
     * @param _status New pause status
     */
    function pause(bool _status) external onlyOwner {
        paused = _status;
        
        emit AdminAction(_status ? "Contract Paused" : "Contract Unpaused", block.timestamp, msg.sender);
    }
    
    /**
     * @dev Emergency withdraw tokens (only for tokens other than BUSD)
     * @param _token Address of the token to withdraw
     */
    function emergencyWithdraw(address _token) external onlyOwner {
        require(_token != address(busdToken), "Cannot withdraw BUSD");
        
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        require(token.transfer(owner(), balance), "Token transfer failed");
        
        emit AdminAction("Emergency Withdrawal", block.timestamp, msg.sender);
    }
}
