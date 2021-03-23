const DeProne = artifacts.require("./DeProne.sol");

module.exports = function(deployer) {
    const _tokenName = "DEP Token";
    const _tokenSymbol = "DEP";
    deployer.deploy(DeProne, _tokenName, _tokenSymbol);
};