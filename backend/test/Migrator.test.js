const { expectRevert, time } = require('@openzeppelin/test-helpers');
const GetoToken = artifacts.require('GetoToken');
const GetoReserve = artifacts.require('GetoReserve');
const MockBEP20 = artifacts.require('MockBEP20');
const GetoswapV2Pair = artifacts.require('GetoswapV2Pair');
const GetoswapV2Factory = artifacts.require('GetoswapV2Factory');
const Migrator = artifacts.require('Migrator');

contract('Migrator', ([alice, bob, dev, minter]) => {
    beforeEach(async () => {
        this.factory1 = await GetoswapV2Factory.new(alice, { from: alice });
        this.factory2 = await GetoswapV2Factory.new(alice, { from: alice });
        this.geto = await GetoToken.new({ from: alice });
        this.wbnb = await MockBEP20.new('WBNB', 'WBNB', '100000000', { from: minter });
        this.token = await MockBEP20.new('TOKEN', 'TOKEN', '100000000', { from: minter });
        this.lp1 = await GetoswapV2Pair.at((await this.factory1.createPair(this.wbnb.address, this.token.address)).logs[0].args.pair);
        this.lp2 = await GetoswapV2Pair.at((await this.factory2.createPair(this.wbnb.address, this.token.address)).logs[0].args.pair);
        this.reserve = await GetoReserve.new(this.geto.address, dev, '1000', '0', '100000', { from: alice });
        this.migrator = await Migrator.new(this.reserve.address, this.factory1.address, this.factory2.address, '0');
        await this.geto.transferOwnership(this.reserve.address, { from: alice });
        await this.reserve.add('100', this.lp1.address, true, { from: alice });
    });

    it('should do the migration successfully', async () => {
        await this.token.transfer(this.lp1.address, '10000000', { from: minter });
        await this.wbnb.transfer(this.lp1.address, '500000', { from: minter });
        await this.lp1.mint(minter);
        assert.equal((await this.lp1.balanceOf(minter)).valueOf(), '2235067');
        // Add some fake revenue
        await this.token.transfer(this.lp1.address, '100000', { from: minter });
        await this.wbnb.transfer(this.lp1.address, '5000', { from: minter });
        await this.lp1.sync();
        await this.lp1.approve(this.reserve.address, '100000000000', { from: minter });
        await this.reserve.deposit('0', '2000000', { from: minter });
        assert.equal((await this.lp1.balanceOf(this.reserve.address)).valueOf(), '2000000');
        await expectRevert(this.reserve.migrate(0), 'migrate: no migrator');
        await this.reserve.setMigrator(this.migrator.address, { from: alice });
        await expectRevert(this.reserve.migrate(0), 'migrate: bad');
        await this.factory2.setMigrator(this.migrator.address, { from: alice });
        await this.reserve.migrate(0);
        assert.equal((await this.lp1.balanceOf(this.reserve.address)).valueOf(), '0');
        assert.equal((await this.lp2.balanceOf(this.reserve.address)).valueOf(), '2000000');
        await this.reserve.withdraw('0', '2000000', { from: minter });
        await this.lp2.transfer(this.lp2.address, '2000000', { from: minter });
        await this.lp2.burn(bob);
        assert.equal((await this.token.balanceOf(bob)).valueOf(), '9033718');
        assert.equal((await this.wbnb.balanceOf(bob)).valueOf(), '451685');
    });

    it('should allow first minting from public only after migrator is gone', async () => {
        await this.factory2.setMigrator(this.migrator.address, { from: alice });
        this.tokenx = await MockBEP20.new('TOKENX', 'TOKENX', '100000000', { from: minter });
        this.lpx = await GetoswapV2Pair.at((await this.factory2.createPair(this.wbnb.address, this.tokenx.address)).logs[0].args.pair);
        await this.wbnb.transfer(this.lpx.address, '10000000', { from: minter });
        await this.tokenx.transfer(this.lpx.address, '500000', { from: minter });
        await expectRevert(this.lpx.mint(minter), 'Must not have migrator');
        await this.factory2.setMigrator('0x0000000000000000000000000000000000000000', { from: alice });
        await this.lpx.mint(minter);
    });
});