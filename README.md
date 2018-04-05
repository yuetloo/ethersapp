# ethersapp 
[ethersapp](https://yuetloo.github.io/ethersapp/) is an open source, javascript, client-side tool for exploring the Ethereum smart contracts on testnet and mainnet.  The contract ABI is maintained in the js/abi.js file. Users can add and delete contract ABI manually using the add/delete buttons and the ABI added manaully will be stored in the local storage. The wallet is managed by [ethers.io] (https://github.com/ethers-io/ethers.io).  With the recent support for Metamask, the wallet interface in ethers.io can access/use the account managed in Metamask from Google Chrome.

To access mainnet, use the following URL: 
[https://ethers.io/#!/app-link/yuetloo.github.io/ethersapp/](https://ethers.io/#!/app-link/yuetloo.github.io/ethersapp/)

To access ropsten (testnet) , use the following URL: 
[https://ropsten.ethers.io/#!/app-link/yuetloo.github.io/ethersapp/](https://ropsten.ethers.io/#!/app-link/yuetloo.github.io/ethersapp/)

# Purpose
ethersapp was created to help me learn about ethereum contracts.  I was inspired to create this tool after attending a few ethereum contract introduction meetup sessions by [Ledger Labs] (https://ledgerlabs.io).

# Security
Please note that ethersapp has not been through a comprehensive security review. It is an experimental software intended for small amount of Ether to be used to experiment with Ethereum smart contracts. 

# Usage
1. Select the contract from the drop down list

   The dropdown list is initialized with the list in abi.js. There ABI loaded from abi.js cannot be deleted. Lists of verified contracts and their ABI can be obtained from blockchain explorers like [https://etherscan.io/contractsVerified/](https://etherscan.io/contractsVerified/) and [https://etherchain.org/contracts](https://etherchain.org/contracts).

2. Select a function to work with from the left hand side panel 

3. Fill in function input parameter values

4. Click the 'Run' button to run the function

5. If the funciton is a setter function (a function that requires ether to run), you will be prompted to access your wallet to sign the transaction


# License
MIT License.

