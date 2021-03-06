const HDWalletProvider = require("@truffle/hdwallet-provider")
const infuraKey = "4c679fe9cb45428294b78bb898aabe9a"

const fs = require("fs")
const mnemonic = fs.readFileSync(".secret").toString().trim()

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*" // Match any network id
        },

        ropsten: {
            provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraKey}`),
            network_id: 3, // Ropsten's id
            gas: 5500000, // Ropsten has a lower block limit than mainnet
            confirmations: 2, // # of confs to wait between deployments. (default: 0)
            timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: true // Skip dry run before migrations? (default: false for public nets )
        },

        develop: {
            port: 8545
        }
    },

    compilers: {
        solc: {
            version: "0.6.0", // Fetch exact version from solc-bin (default: truffle's version)
        }
    }
};