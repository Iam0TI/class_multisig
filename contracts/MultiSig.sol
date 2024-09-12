// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiSig {
    /* ========== ERROR  ========== */

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

    /* ========== UDV ========== */
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
        TransactionType txType; //type enum
        uint8 newQuorum; // Only used for UpdateQuorum transactions
    }

    /* ========== State Variable ========== */
    uint8 public quorum;
    uint8 public noOfValidSigners;
    uint256 public txCount;

    mapping(address => bool) isValidSigner;
    mapping(uint256 => Transaction) transactions; // txId -> Transaction
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) hasSigned;

    /* ========== CONSTRUCTOR ========== */
    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        // _checkQuorum(_quorum);
        quorum = _quorum;

        for (uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), ZeroAddress());

            require(
                !isValidSigner[_validSigners[i]],
                SignerExist(_validSigners[i])
            );

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = uint8(_validSigners.length);

        if (!isValidSigner[msg.sender]) {
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }
    }

    /* ========== View Function ========== */

    function returnTransaction(
        uint256 _txId
    ) external view returns (Transaction memory) {
        require(_txId > 0 && _txId <= txCount, InvalidTransactionID());
        return transactions[_txId];
    }

    /* ========== External Function ========== */
    function proposeTransfer(
        uint256 _amount,
        address _recipient,
        address _tokenAddress
    ) external {
        _checkAddressZero();
        _onlyVaildSigner();

        require(_amount > 0, ZeroAmount());
        require(_recipient != address(0), ZeroAddress());
        require(_tokenAddress != address(0), ZeroAddress());
        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            InsufficientFunds()
        );

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];

        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval = 1;
        trx.transactionSigners.push(msg.sender);
        trx.txType = TransactionType.TokenTransfer;
        hasSigned[msg.sender][_txId] = true;
        txCount += 1;

        emit ProposedTransfer(msg.sender, _amount, _txId);
    }

    function proposeQuorumUpdate(uint8 _newQuorum) external {
        _checkAddressZero();
        _onlyVaildSigner();
        //  _checkQuorum(_newQuorum);

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];

        trx.id = _txId;
        trx.amount = 0;
        trx.recipient = address(0);
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = address(0);
        trx.noOfApproval = 1;
        trx.transactionSigners.push(msg.sender);
        trx.txType = TransactionType.UpdateQuorum;
        hasSigned[msg.sender][_txId] = true;
        txCount += 1;

        emit ProposeQuorumUpdate(msg.sender, _newQuorum, _txId);
    }

    function approveTransaction(uint256 _txId) external {
        _onlyVaildSigner();
        require(_txId <= txCount, IdOutOfBound());

        Transaction storage trx = transactions[_txId];

        require(trx.id != 0, InvalidTransactionID());

        require(!trx.isCompleted, TransactionCompleted());
        require(trx.noOfApproval < quorum, ApprovalReached());

        if (trx.txType == TransactionType.TokenTransfer) {
            require(
                IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount,
                InsufficientFunds()
            );
        }

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        // there is no need for an update quorum functions
        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            if (trx.txType == TransactionType.TokenTransfer) {
                IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
                // there is no need for an update quorum functions
            } else if (trx.txType == TransactionType.UpdateQuorum) {
                quorum = trx.newQuorum;
            }
        }

        emit ApprovedTransaction(msg.sender, _txId);
    }

    /* ========== Private Function ========== */
    function _onlyVaildSigner() private view {
        require(isValidSigner[msg.sender], InvalidSigner(msg.sender));
    }

    function _checkAddressZero() private view {
        require(msg.sender != address(0), ZeroAddress());
    }

    // must quorum greater than 1 but less than the number of valid signer"
    // function _checkQuorum(uint256 _quorum) private view {
    //     require(
    //         _quorum > 1 && _quorum < noOfValidSigners,
    //         InvalidQuorum(_quorum)
    //     );
}
//}//
