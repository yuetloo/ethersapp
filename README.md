# ethersapp 
ethersapp is an open source, javascript, client-side tool for exploring the Ethereum smart contracts on testnet and mainnet.  The contract ABI is maintained in the js/abi.js file. Users can add and delete contract ABI manually using the add/edit/delete buttons and the ABI will be stored in the local storage of the user browser. The wallet is managed by [ethers.io](https://github.com/ethers-io/ethers.io).  With ethers.io support for Metamask, the app can access the account stored in Metamask from Google Chrome browser.

To access mainnet, use the following URL: 
[https://ethers.io/#!/app-link/yuetloo.github.io/ethersapp/](https://ethers.io/#!/app-link/yuetloo.github.io/ethersapp/)

To access ropsten (testnet) , use the following URL: 
[https://ropsten.ethers.io/#!/app-link/yuetloo.github.io/ethersapp/](https://ropsten.ethers.io/#!/app-link/yuetloo.github.io/ethersapp/)

# Purpose
ethersapp was created to help me learn about ethereum contracts.  

# Security
Please note that ethersapp has not been through a comprehensive security review. It is an experimental software intended for small amount of Ether to be used to experiment with Ethereum smart contracts. 

# Usage
1. Select the contract from the drop down list

   The dropdown list is initialized with the list in abi.js. User can add/edit/delete the contracts in the dropdown list.  The modified list is saved in the user's local storage.

2. Select a function to work with from the left hand side panel 

3. Fill in function input parameter values

4. Click the 'Run' button to run the function

5. If the funciton is a setter function (a function that requires ether to run), you will be prompted to access your wallet to sign the transaction


# License
MIT License.

