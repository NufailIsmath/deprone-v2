var IPFSHash = artifacts.require("./IPFSHash.sol");

module.exports = function(deployer) {
    deployer.deploy(IPFSHash);
};