const GetoToken = artifacts.require('GetoToken');
const GetoBureau = artifacts.require('GetoBureau');
const MockBEP20 = artifacts.require('MockBEP20');
const GetoswapV2Pair = artifacts.require('GetoswapV2Pair');
const GetoswapV2Factory = artifacts.require('GetoswapV2Factory');

contract('GetoBureau', ([alice, bank, minter]) => {
    beforeEach(async () => {
        this.factory = await GetoswapV2Factory.new(alice, { from: alice });
        this.geto = await GetoToken.new({ from: alice });
        await this.geto.mint(minter, '100000000', { from: alice });
        this.wbnb = await MockBEP20.new('WBNB', 'WBNB', '100000000', { from: minter });
        this.token1 = await MockBEP20.new('TOKEN1', 'TOKEN', '100000000', { from: minter });
        this.token2 = await MockBEP20.new('TOKEN2', 'TOKEN2', '100000000', { from: minter });
        this.bureau = await GetoBureau.new(this.factory.address, bank, this.geto.address, this.wbnb.address);
        this.getoWBNB = await GetoswapV2Pair.at((await this.factory.createPair(this.wbnb.address, this.geto.address)).logs[0].args.pair);
        this.wbnbToken1 = await GetoswapV2Pair.at((await this.factory.createPair(this.wbnb.address, this.token1.address)).logs[0].args.pair);
        this.wbnbToken2 = await GetoswapV2Pair.at((await this.factory.createPair(this.wbnb.address, this.token2.address)).logs[0].args.pair);
        this.token1Token2 = await GetoswapV2Pair.at((await this.factory.createPair(this.token1.address, this.token2.address)).logs[0].args.pair);
    });

    it('should make GETO successfully', async () => {
        await this.factory.setFeeTo(this.bureau.address, { from: alice });
        await this.wbnb.transfer(this.getoWBNB.address, '10000000', { from: minter });
        await this.geto.transfer(this.getoWBNB.address, '10000000', { from: minter });
        await this.getoWBNB.mint(minter);
        await this.wbnb.transfer(this.wbnbToken1.address, '10000000', { from: minter });
        await this.token1.transfer(this.wbnbToken1.address, '10000000', { from: minter });
        await this.wbnbToken1.mint(minter);
        await this.wbnb.transfer(this.wbnbToken2.address, '10000000', { from: minter });
        await this.token2.transfer(this.wbnbToken2.address, '10000000', { from: minter });
        await this.wbnbToken2.mint(minter);
        await this.token1.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token1Token2.mint(minter);
        // Fake some revenue
        await this.token1.transfer(this.token1Token2.address, '100000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '100000', { from: minter });
        await this.token1Token2.sync();
        await this.token1.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token1Token2.mint(minter);
        // Maker should have the LP now
        assert.equal((await this.token1Token2.balanceOf(this.bureau.address)).valueOf(), '16528');
        // After calling convert, bank should have GETO value at ~1/6 of revenue
        await this.bureau.convert(this.token1.address, this.token2.address);
        assert.equal((await this.geto.balanceOf(bank)).valueOf(), '32965');
        assert.equal((await this.token1Token2.balanceOf(this.bureau.address)).valueOf(), '0');
        // Should also work for GETO-BNB pair
        await this.geto.transfer(this.getoWBNB.address, '100000', { from: minter });
        await this.wbnb.transfer(this.getoWBNB.address, '100000', { from: minter });
        await this.getoWBNB.sync();
        await this.geto.transfer(this.getoWBNB.address, '10000000', { from: minter });
        await this.wbnb.transfer(this.getoWBNB.address, '10000000', { from: minter });
        await this.getoWBNB.mint(minter);
        assert.equal((await this.getoWBNB.balanceOf(this.bureau.address)).valueOf(), '16537');
        await this.bureau.convert(this.geto.address, this.wbnb.address);
        assert.equal((await this.geto.balanceOf(bank)).valueOf(), '66249');
        assert.equal((await this.getoWBNB.balanceOf(this.bureau.address)).valueOf(), '0');
    });
});