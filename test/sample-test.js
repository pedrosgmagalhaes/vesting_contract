const { expect } = require("chai");

describe("Vesting Contract", function () {

  let startTimestamp, Vesting, vesting, owner, addr1, addr2, addr3;
  let cliffDuration, vestingDuration

  beforeEach(async function () {

    startTimestamp = await ethers.provider.getBlock().then(({ timestamp }) => timestamp + 10);
    cliffDuration = 7200;  // one hour
    vestingDuration = 86400; // one day

    Vesting = await ethers.getContractFactory("VestingContract");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    vesting = await Vesting.deploy(owner.address, startTimestamp, cliffDuration, vestingDuration);
  })

  describe("Creating vesting", function () {
    it('Initial setup', async function () {
      expect(await vesting.beneficiary()).to.be.equal(owner.address);
      expect(await vesting.start()).to.be.equal(startTimestamp);
      expect(await vesting.cliff()).to.be.equal(cliffDuration + vestingDuration);
      expect(await vesting.duration()).to.be.equal(vestingDuration);
    });
  })

  describe("Delegations", function () {

    it("beneficiary and the owner should be the same", async function () {

      const walletFromSmartContract = await vesting.beneficiary();

      expect(owner.address).to.equal(walletFromSmartContract)
    });

  })

  describe("Vesting", function () {

    let ERC20Mock, erc20, value

    beforeEach(async function () {
      value = await ethers.utils.parseEther('1');
      ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      erc20 = await ERC20Mock.deploy();
      vestinAddress = await vesting.address;
      ownerAddress = await owner.address;
      await erc20.mint(vestinAddress, value)
    });


    it("release to various owners", async function () {
      await network.provider.send('evm_setNextBlockTimestamp', [startTimestamp]);

      // not early release
      expect(await vesting['release(address)'](await erc20.address))
        .to.emit(erc20, 'Transfer').withArgs(vesting.address, owner, '0');

      await network.provider.send('evm_increaseTime', [3600]);

      // release before cliff (1h)
      expect(await vesting['release(address)'](erc20.address))
        .to.emit(erc20, 'Transfer').withArgs(vesting.address, owner.address, '0');

      await network.provider.send('evm_increaseTime', [3600]);

      // release after cliff (2h)
      expect(await vesting['release(address)'](erc20.address))
        .to.emit(erc20, 'Transfer').withArgs(vesting.address, owner.address, value.mul(2));

      await network.provider.send('evm_increaseTime', [3600]);
      await erc20.connect(owner).transfer(addr2.address, 1);

      // // release after owner change
      expect(await vesting['release(address)'](erc20.address))
        .to.emit(erc20, 'Transfer').withArgs(vesting.address, addr2.address, value.mul(1));

      // release after owner change
      expect(await vesting['release(address)'](erc20.address))
        .to.emit(erc20, 'Transfer').withArgs(vesting.address, addr3.address, value.mul(1));
    });
  })

})
