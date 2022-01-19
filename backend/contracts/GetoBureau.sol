pragma solidity 0.6.12;

import "./openzeppelin/contracts/token/BEP20/IBEP20.sol";
import "./openzeppelin/contracts/token/BEP20/SafeBEP20.sol";
import "./openzeppelin/contracts/math/SafeMath.sol";
import "./getoswapv2/interfaces/IGetoswapV2BEP20.sol";
import "./getoswapv2/interfaces/IGetoswapV2Pair.sol";
import "./getoswapv2/interfaces/IGetoswapV2Factory.sol";


contract GetoBureau {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    IGetoswapV2Factory public factory;
    address public bank;
    address public geto;
    address public wbnb;

    constructor(IGetoswapV2Factory _factory, address _bank, address _geto, address _wbnb) public {
        factory = _factory;
        geto = _geto;
        bank = _bank;
        wbnb = _wbnb;
    }

    function convert(address token0, address token1) public {
        // At least we try to make front-running harder to do.
        require(msg.sender == tx.origin, "do not convert from contract");
        IGetoswapV2Pair pair = IGetoswapV2Pair(factory.getPair(token0, token1));
        pair.transfer(address(pair), pair.balanceOf(address(this)));
        pair.burn(address(this));
        uint256 wbnbAmount = _toWBNB(token0) + _toWBNB(token1);
        _toGETO(wbnbAmount);
    }

    function _toWBNB(address token) internal returns (uint256) {
        if (token == geto) {
            uint amount = IBEP20(token).balanceOf(address(this));
            _safeTransfer(token, bank, amount);
            return 0;
        }
        if (token == wbnb) {
            uint amount = IBEP20(token).balanceOf(address(this));
            _safeTransfer(token, factory.getPair(wbnb, geto), amount);
            return amount;
        }
        IGetoswapV2Pair pair = IGetoswapV2Pair(factory.getPair(token, wbnb));
        if (address(pair) == address(0)) {
            return 0;
        }
        (uint reserve0, uint reserve1,) = pair.getReserves();
        address token0 = pair.token0();
        (uint reserveIn, uint reserveOut) = token0 == token ? (reserve0, reserve1) : (reserve1, reserve0);
        uint amountIn = IBEP20(token).balanceOf(address(this));
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        uint amountOut = numerator / denominator;
        (uint amount0Out, uint amount1Out) = token0 == token ? (uint(0), amountOut) : (amountOut, uint(0));
        _safeTransfer(token, address(pair), amountIn);
        pair.swap(amount0Out, amount1Out, factory.getPair(wbnb, geto), new bytes(0));
        return amountOut;
    }

    function _toGETO(uint256 amountIn) internal {
        IGetoswapV2Pair pair = IGetoswapV2Pair(factory.getPair(wbnb, geto));
        (uint reserve0, uint reserve1,) = pair.getReserves();
        address token0 = pair.token0();
        (uint reserveIn, uint reserveOut) = token0 == wbnb ? (reserve0, reserve1) : (reserve1, reserve0);
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        uint amountOut = numerator / denominator;
        (uint amount0Out, uint amount1Out) = token0 == wbnb ? (uint(0), amountOut) : (amountOut, uint(0));
        pair.swap(amount0Out, amount1Out, bank, new bytes(0));
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        IBEP20(token).safeTransfer(to, amount);
    }
}
