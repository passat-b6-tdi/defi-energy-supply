// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMGT interface of MGT contract
 * Can be used as staking reward token, or rewards for Energy Oracle makers.
 * Equals to 1 kW.
 * @author Bohdan
 */
interface IMGT {
    /**
     * @dev Mints `to` address some `amount` of tokens
     * Requirements:
     * - only `MINTER_ROLE`
     *
     * @param to address to mint
     * @param amount of tokens to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burns `from` address some `amount` of tokens
     * Requirements:
     * - only `BURNER_ROLE`
     *
     * @param from address to mint
     * @param amount of tokens to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
}
