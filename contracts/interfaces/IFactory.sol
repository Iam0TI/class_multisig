// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IMultiSig} from "./IMultiSig.sol";

interface IMultiSigFactory {
    event CreatedMultisigWallet(
        address indexed,
        uint256 quorum,
        address[] validSigners
    );

    function createMultisigWallet(
        uint8 quorum,
        address[] memory validSigners
    ) external returns (IMultiSig newMulSig_, uint256 length_);

    function getMultiSigClones() external view returns (IMultiSig[] memory);
}
