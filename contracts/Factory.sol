// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {MultiSig} from "./MultiSig.sol";

contract MultiSigFactory {
    event CreatedMultisigWallet(address indexed, uint256 _quorum, address[] _validSigners);

    MultiSig[] multiSigClones;

    function createMultisigWallet(uint8 _quorum, address[] memory _validSigners)
        external
        returns (MultiSig newMulSig_, uint256 length_)
    {
        newMulSig_ = new MultiSig(_quorum, _validSigners);

        multiSigClones.push(newMulSig_);

        length_ = multiSigClones.length;

        emit CreatedMultisigWallet(msg.sender, _quorum, _validSigners);
    }

    function getMultiSigClones() external view returns (MultiSig[] memory) {
        return multiSigClones;
    }
}
