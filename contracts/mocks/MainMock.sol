// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../escrow/interfaces/IEscrow.sol";
import "../tokens/ERC20/interfaces/IMGT.sol";

contract MainMock {
    IEscrow public escrow;
    IMGT public MGT;
    constructor(IEscrow _escrow, IMGT _MGT) {
        escrow = _escrow;
        MGT = _MGT;
    }

    function send(address user, uint256 tokenId, uint256 paidAmount) public {
        MGT.transferFrom(user, address(escrow), paidAmount);
        escrow.sendFundsToSupplier(user, tokenId, paidAmount);
    }
}
