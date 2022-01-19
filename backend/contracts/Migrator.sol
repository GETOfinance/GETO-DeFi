pragma solidity 0.6.12;

import "./getoswapv2/interfaces/IGetoswapV2Pair.sol";
import "./getoswapv2/interfaces/IGetoswapV2Factory.sol";


contract Migrator {
    address public reserve;
    address public oldFactory;
    IGetoswapV2Factory public factory;
    uint256 public notBeforeBlock;
    uint256 public desiredLiquidity = uint256(-1);

    constructor(
        address _reserve,
        address _oldFactory,
        IGetoswapV2Factory _factory,
        uint256 _notBeforeBlock
    ) public {
        reserve = _reserve;
        oldFactory = _oldFactory;
        factory = _factory;
        notBeforeBlock = _notBeforeBlock;
    }

    function migrate(IGetoswapV2Pair orig) public returns (IGetoswapV2Pair) {
        require(msg.sender == reserve, "not from getoreserve");
        require(block.number >= notBeforeBlock, "too early to migrate");
        require(orig.factory() == oldFactory, "not from old factory");
        address token0 = orig.token0();
        address token1 = orig.token1();
        IGetoswapV2Pair pair = IGetoswapV2Pair(factory.getPair(token0, token1));
        if (pair == IGetoswapV2Pair(address(0))) {
            pair = IGetoswapV2Pair(factory.createPair(token0, token1));
        }
        uint256 lp = orig.balanceOf(msg.sender);
        if (lp == 0) return pair;
        desiredLiquidity = lp;
        orig.transferFrom(msg.sender, address(orig), lp);
        orig.burn(address(pair));
        pair.mint(msg.sender);
        desiredLiquidity = uint256(-1);
        return pair;
    }
}