// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ProfitPulse.sol";

/**
 * @title MultiSigWallet
 * @dev A multi-signature wallet for secure admin operations
 */
contract MultiSigWallet {
    // Events
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Revocation(address indexed sender, uint256 indexed transactionId);
    event Submission(uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    event ExecutionFailure(uint256 indexed transactionId);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint256 required);

    // Transaction struct
    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
    }

    // State variables
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public required;
    uint256 public transactionCount;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(transactions[transactionId].destination != address(0), "Transaction does not exist");
        _;
    }

    modifier confirmed(uint256 transactionId, address owner) {
        require(confirmations[transactionId][owner], "Transaction not confirmed by owner");
        _;
    }

    modifier notConfirmed(uint256 transactionId, address owner) {
        require(!confirmations[transactionId][owner], "Transaction already confirmed by owner");
        _;
    }

    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    /**
     * @dev Constructor sets initial owners and required confirmations
     * @param _owners List of initial owners
     * @param _required Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number of owners");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    /**
     * @dev Allows an owner to submit and confirm a transaction
     * @param destination Transaction target address
     * @param value Transaction ether value
     * @param data Transaction data payload
     * @return transactionId ID of the transaction
     */
    function submitTransaction(address destination, uint256 value, bytes memory data)
        public
        onlyOwner
        returns (uint256 transactionId)
    {
        transactionId = addTransaction(destination, value, data);
        confirmTransaction(transactionId);
    }

    /**
     * @dev Allows an owner to confirm a transaction
     * @param transactionId Transaction ID
     */
    function confirmTransaction(uint256 transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    /**
     * @dev Allows an owner to revoke a confirmation for a transaction
     * @param transactionId Transaction ID
     */
    function revokeConfirmation(uint256 transactionId)
        public
        onlyOwner
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    /**
     * @dev Allows anyone to execute a confirmed transaction
     * @param transactionId Transaction ID
     */
    function executeTransaction(uint256 transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            (bool success, ) = txn.destination.call{value: txn.value}(txn.data);
            if (success)
                emit Execution(transactionId);
            else {
                emit ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }

    /**
     * @dev Returns the confirmation status of a transaction
     * @param transactionId Transaction ID
     * @return Confirmation status
     */
    function isConfirmed(uint256 transactionId) public view returns (bool) {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]])
                count += 1;
            if (count == required)
                return true;
        }
        return false;
    }

    /**
     * @dev Adds a new transaction to the transaction mapping
     * @param destination Transaction target address
     * @param value Transaction ether value
     * @param data Transaction data payload
     * @return transactionId ID of the transaction
     */
    function addTransaction(address destination, uint256 value, bytes memory data)
        internal
        returns (uint256 transactionId)
    {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });
        transactionCount += 1;
        emit Submission(transactionId);
    }

    /**
     * @dev Returns number of confirmations of a transaction
     * @param transactionId Transaction ID
     * @return count Number of confirmations
     */
    function getConfirmationCount(uint256 transactionId) public view returns (uint256 count) {
        for (uint256 i = 0; i < owners.length; i++)
            if (confirmations[transactionId][owners[i]])
                count += 1;
    }

    /**
     * @dev Returns total number of transactions
     * @return count Total number of transactions
     */
    function getTransactionCount() public view returns (uint256 count) {
        count = transactionCount;
    }

    /**
     * @dev Returns list of owners
     * @return List of owner addresses
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Returns array with owner addresses, which confirmed transaction
     * @param transactionId Transaction ID
     * @return _confirmations Array of owner addresses
     */
    function getConfirmations(uint256 transactionId) public view returns (address[] memory _confirmations) {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < owners.length; i++)
            if (confirmations[transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        
        _confirmations = new address[](count);
        for (i = 0; i < count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }

    /**
     * @dev Returns list of transaction IDs in defined range
     * @param from Index start position of transaction array
     * @param to Index end position of transaction array
     * @param pending Include pending transactions
     * @param executed Include executed transactions
     * @return _transactionIds Array of transaction IDs
     */
    function getTransactionIds(uint256 from, uint256 to, bool pending, bool executed)
        public
        view
        returns (uint256[] memory _transactionIds)
    {
        uint256[] memory transactionIdsTemp = new uint256[](transactionCount);
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < transactionCount; i++)
            if ((pending && !transactions[i].executed) || (executed && transactions[i].executed)) {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        
        _transactionIds = new uint256[](count);
        for (i = 0; i < count; i++)
            _transactionIds[i] = transactionIdsTemp[i];
    }
}
