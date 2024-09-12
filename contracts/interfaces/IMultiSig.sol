// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMultiSig {
    /* ========== EVENTS ========== */
    event ProposedTransfer(
        address indexed proposer,
        uint256 amount,
        uint256 transactionID
    );
    event ProposeQuorumUpdate(
        address indexed proposer,
        uint256 _newQuorum,
        uint256 transactionID
    );
    event ApprovedTransaction(address indexed approver, uint256 transactionID);

    /* ========== STRUCTS ========== */
    enum TransactionType {
        TokenTransfer,
        UpdateQuorum
    }

    struct Transaction {
        uint256 id;
        uint256 amount;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address tokenAddress;
        address[] transactionSigners;
        TransactionType txType;
        uint8 newQuorum;
    }

    /* ========== ERRORS ========== */
    error InvalidSigner(address);
    error InvalidQuorum(uint256);
    error ZeroAddress();
    error SignerExist(address);
    error InsufficientFunds();
    error ZeroAmount();
    error InvalidTransactionID();
    error IdOutOfBound();
    error ApprovalReached();
    error TransactionCompleted();

    /* ========== FUNCTIONS ========== */
    function quorum() external view returns (uint8);
    function noOfValidSigners() external view returns (uint8);
    function txCount() external view returns (uint256);

    function returnTransaction(
        uint256 _txId
    ) external view returns (Transaction memory);

    function proposeTransfer(
        uint256 _amount,
        address _recipient,
        address _tokenAddress
    ) external;
    function proposeQuorumUpdate(uint8 _newQuorum) external;
    function approveTransaction(uint256 _txId) external;
}
