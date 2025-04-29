// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

contract ContractsBase {
    /// @dev Main contract
    address internal _main;

    /// @dev Throws if passed address 0 as parameter
    /// @param account The address to check
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }

        _;
    }

    constructor(address main_) {
        _main = main_;
    }

    /// @dev Changes `main` address to the `_main` address.
    /// @param main_ The address of the new main contract
    function changeMain(address main_) public virtual zeroAddressCheck(main_) {
        _main = main_;
    }
}
