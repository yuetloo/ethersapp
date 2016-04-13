/**
 * app.js
 *
 * This is the main entry point for user interface setup
 *
 */

var httpClient;
var wallet;
var global_abi;
var worker;

var txData = [
         {
            "name": "Sender Address",
            "type": "address",
            "id": "sender",
            "value": '',
            "placeholder": "Enter Sender Address",
            "transactionOnly": false
         },
         {
            "name": "Balance",
            "type": "ether",
            "id": "balance",
            "value": "",
            "placeholder": "Account balance",
            "transactionOnly": false
         },
         {
            "name": "Nonce",
            "type": "uint32",
            "id": "nonce",
            "value": "",
            "placeholder": "",
            "transactionOnly": true
         },
         {
            "name": "Gas Price",
            "type": "wei",
            "id": "gasPrice",
            "value": "",
            "placeholder": "",
            "transactionOnly": true
         },
         {
            "name": "Gas Limit",
            "type": "wei",
            "id": "gasLimit",
            "value": "",
            "placeholder": "",
            "transactionOnly": true
         },
         {
            "name": "Value to Send",
            "type": "wei",
            "id": "amountToSend",
            "value": "0",
            "placeholder": "",
            "transactionOnly": true
         }
       ]
    

$(document).ready(function(){
  wallet = new Wallet();
  var networkId = $("#networkid").val();
  httpClient = new HttpClient(networkId);
  if( networkId === "testnet" ){
    loadContracts();
    searchContract();
  } 
});


$('#networkid').on('change', function(){
  var networkId = $("#networkid");
  if( networkId.val() === "testnet") {
    console.log("testnet selected");
    networkId.addClass("testnet"); 
    $("#contractMainnet").hide();
    $("#contractTestnet").show();
    searchContract();

  } else {
    console.log("network changed to: " + networkId.val());
    $("#contractAddress").val("");
    networkId.removeClass("testnet"); 
    $("#contractMainnet").css('display', 'inline');
    $("#contractTestnet").hide();
    $(".searchResult").hide(); 
  }

  updateTxData('sender', '');
  updateTxData('nonce', '');
  httpClient.setUrl(networkId.val());
  wallet.clearPrivateKey();
});

function getGasPrice() 
{
  httpClient.getGasPrice( function(gasPrice) {
      updateTxData('gasPrice', gasPrice);
      $("#gasPrice").val(gasPrice);
    },
    function( msg, error ) {
       errorHandler(msg, error);
    });

  httpClient.getGasLimit( function(limit) {
    updateTxData('gasLimit', limit);
  });
}
 
function getNonce(callback) 
{
  accountAddress = $('#sender').val();
  if( !accountAddress ) {
    $('nonce').val('');
    return;
  }
     
  httpClient.getNonce(
    accountAddress, 
    function( nonce ) {
      $("#nonce").val(nonce);
      updateTxData('nonce', nonce);
      if( callback ) {
        callback(nonce);
      }
    },
    function( msg, error ) {
      errorHandler(msg, error);
    }
  );
}

function getBalance( )
{
  var accountAddress = $('#sender').val();
  if( !accountAddress ) {
    $('#balance').val('');
    return;
  }

  httpClient.getBalance(
    accountAddress, 
    function( bal ) {
      $("#balance").val(bal);
    }, 
    function(msg, error) {
      errorHandler(msg, error);
    });
}

function getSource( addr, callback )
{
  httpClient.getSource( 
    addr, 
    callback, 
    function(msg, error){
      callback();
    });
}

/**
 *  call the contract function or send a transaction to to the function
 */
function callFunction() {

  var types = [];
  var args = [];
  var addr = getContractAddress();
  var fromAddr = $('#sender').val();
  var name = $('#functionName').text();
  $("#error").text('');

  var fn = getFunctionAbi(global_abi.abi, name);
      
  if( !fn.constant && (!fromAddr || fromAddr.length == 0) )
  {
    $('#error').text('Sender Address is required. Click the wallet button to import a wallet.');
    return;
  }

  var argValue;
  for(i=0; i<fn.inputs.length; i++)
  {
    types.push(fn.inputs[i].type);
    argValue = $('#input' + i).val();
    args.push(argValue);
  }
  try {
    var functionData = encodeFunctionData(name, types, args);
  } catch (err) {
    errorHandler('Invalid input: ', err);
    return;
  }
        
  if( fn.constant)
  {
    httpClient.ethCall(
      addr, 
      functionData, 
      fromAddr, 
      function(response) {
        parseResponse(fn, response); 
      }, 
      function(message, error) {
        errorHandler(message, error);
      });
  }
  else 
  {
    getNonce(function(nonceValue){

      var nonce = nonceValue;
      var gasPrice = getInputValueInHex("#gasPrice");
      var gasLimit = getInputValueInHex("#gasLimit");
      var amountToSend = getInputValueInHex('#amountToSend');
  
      var txObject = {
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        to: addr,
        value: amountToSend,
        data: functionData
      }
  
      console.log("txObject: " + JSON.stringify(txObject));
      var signedTx = wallet.sign(txObject);
  
      httpClient.sendRawTransaction( 
        signedTx, 
        function(response) {
          parseResponse(fn, response);
        }, 
        function(msg, error) {
          errorHandler( msg, error); 
      });
    });
  }
  return false;
}

function contractError(msg, error) {
  var errorText = msg + ': ' + JSON.stringify(error);
  console.log(errorText);
  $(".contract.error").show();
}

function errorHandler(errorMessage, errorDetail) {
  var errorText = errorMessage + ': ' + JSON.stringify(errorDetail);
  console.log(errorText);
  $("#error").text(errorText);
}

function parseResponse(abi, response){
  var responseString = JSON.stringify(response);

  var parsed = '';

  if( response.result ) {
    parsed = parseRawResponse(abi, response.result);
  }

  var responses = ["<div><p>Raw Response:</p><p>", responseString, "</p>", parsed, "</div>"];
  var resp = document.getElementById("resp");
  resp.innerHTML = responses.join(""); 
}


/***
 * Get the hex value of an input field by the id
 *
 * @method getInputValueInHex
 * @param {String} id of the input element whose value to
 *                  to be converted to hex
 * @returns {string}
 */
function getInputValueInHex(id) {
  var rawValue = $(id).val();
  var result = Web3.prototype.fromDecimal(rawValue);
  return result;
}

function encodeFunctionData (functionName, types, args) {
  var fullName = functionName + '(' + types.join() + ')';
  var signature = ethUtil.sha3(fullName, 256).toString("hex").slice(0, 8);
  var dataHex = signature + coder.encodeParams(types, args);
  dataHex = ethUtil.addHexPrefix(dataHex);

  return dataHex;
}


function getContractAbi (addr, callback) {
  var networkid = $("#networkid").val();

  function matchesAddress(json) {
    return( json.address === addr );
  }
  if( networkid === "testnet") {
    var abi = abiList.filter(matchesAddress)[0];
    callback(abi);
  } else {
    getSource(addr, function(response){
      callback(response);
    });
  }
}

function getFunctionAbi (abi, functionName) {

  function matchesFunctionName(json) {
    return (json.name === functionName && json.type === 'function');
  }

  var funcJson = abi.filter(matchesFunctionName)[0];

  return (funcJson);
}

function getAbiTypes( abi ) {
   
  function getTypes(json) {
    return json.type;
  }

  return abi.map(getTypes);

}

function getTxDataValue(id)
{
  var itemValue = "";
  for( var i=0; i<txData.length; i++)
  {
    if( txData[i].id === id )
    {
      itemValue = txData[i].value;
      break;
    }
  }
  return itemValue;
}

function updateTxData(id, value)
{
  for( var i=0; i<txData.length; i++)
  {
    if( txData[i].id === id )
    {
      txData[i].value = value;
      break;
    }
  }
}

function getFunctionNames(abi, filterString) 
{
  function matchesFunctionType(json) 
  {
    if( filterString && filterString.length > 0 )
    {
      var filterLower = filterString.toLowerCase();
      return (json.type === 'function' && 
              json.name.toLowerCase().search(filterLower) >= 0);
    }
    else
    {
      return (json.type === 'function');
    }
  }

  function getNames(json) {
    return json.name;
  }

  var funcJson = abi.filter(matchesFunctionType);

  return funcJson.map(getNames); 
}

function parseRawResponse( abi, rawData ) {
         
  var result = [];

  if( abi.constant ){
    result.push("<p>Parsed Result:</p>");
    result.push("<table>");

    var types = getAbiTypes(abi.outputs); 
    var rawBytes = ethUtil.stripHexPrefix(rawData);
    console.log( 'parseRawResponse types', types, rawBytes);
    data = coder.decodeParams(types, rawBytes);
    for (i=0;i<abi.outputs.length;i++)
    {
      result.push("<tr>");
      buildOutputRow( result, abi.outputs[i], data[i] );
      result.push("</tr>");
    }
    result.push("</table>");
  } else {
    buildTxHashRow( result, rawData );
  } 
  return result.join("");
}
    
function setActiveElement( functionName ) {
  // remove old active
  var activeElements = document.getElementsByClassName('active');
  for( i = 0; i < activeElements.length; i++ )
  {
    activeElements[i].classList.remove('active');
  }
  document.getElementById(functionName).className += 'active';
}

function GetFunction( functionName )
{
  setActiveElement( functionName );
  $('#content').html('');

  var fn = getFunctionAbi(global_abi.abi, functionName);
            
  var content = [];
  $('#functionName').text(fn.name);
  content.push("<table>");
  for (i=0;i<fn.inputs.length;i++)
  {
    if( i == 0 )
    {
      content.push("<tr>"); 
      content.push('<td colspan="2">Function Parameters:</td>');
      content.push("</tr>"); 
    }
    buildInputRow( content, fn.inputs[i], i, fn.constant );
  }
  if( fn.inputs.length > 0 )
  {
    content.push('<tr><td colspan="2"><span><hr></span></td></tr>');
  }
  if( fn.constant ) 
  {
    $('a.tooltip').show();
    btnLabel = "Call Function";
  }
  else
  {
    $('a.tooltip').hide();
    getNonce();
    getGasPrice();
    btnLabel = "Send Transaction";
  }
  for (i=0;i<txData.length;i++)
  {
    if( fn.constant && txData[i].transactionOnly )
    {
      continue;
    }
    buildInputRow( content, txData[i], i, fn.constant );
  }
  content.push("</table>");
  content.push('<a class="btn" id="btnCall">')
  content.push( btnLabel + '</a>');
  content.push('<br><div id="resp" class="wrap"></div>');
  content.push('<br><div id="error"></div>');
      
  var contentElem = $("#content");
  contentElem.html(content.join(""));
  
  $('#openWallet').on('click', showWalletModal);
  $('#btnCall').on('click', callFunction);
  $('.txInput').on('change', inputIsValid);
  $("#functionDetail").show();
  getBalance();
  return false;
}

function buildTxHashRow( outputTable, txHash )
{
  var url = httpClient.getTxHashUrl(txHash);
  var hashTag = '<a href="'+ url +'" target="_blank">'+txHash+'</a>';
  var parType = '<span class="paramType">bytes</span>';
  outputTable.push('<div>txHash:</div>');
  outputTable.push('<div class="wrap">' + hashTag + '</div>');
}

function buildOutputRow( outputTable, abi, rawData )
{
  var fieldName = abi.name;
  if( fieldName.length == 0 )
  {
    fieldName = "result";
  }
  var fieldValue = rawData;
  var inputField = '<input type="text" value="' + fieldValue +'"/>';
  var parType = '<span class="paramType">' + abi.type + '</span>';
  outputTable.push("<td>" + fieldName + ":</td>");
  outputTable.push("<td>" + inputField + parType + "</td>");
}


function buildInputRow( inputTable, inputData, inputIndex, isConstant )
{
  var fieldName = inputData.name;
  var fieldId = "input" + inputIndex;  
  var fieldValue = "";
  var readOnlyAttr = '';
  if( inputData.id )
  {
     fieldId = inputData.id;
  }
  if( inputData.value )
  {
     fieldValue = inputData.value;
  } 

  var onchangeAttr='';
  if( fieldId === "sender" ) {
     if( !isConstant ) {
       fieldValue = wallet.getAddressFromPrivateKey();
       readOnlyAttr = 'readOnly'; 
     }
  }
   
  var inputField = '<input type="text" id="' + fieldId + 
                        '" value="' + fieldValue +'" ' + 
                        readOnlyAttr +' class="txInput"/>';
  var parType = '<span class="paramType">' + inputData.type + '</span>';
  inputTable.push("<tr>");
  inputTable.push("<td>" + fieldName + ":</td>");
  inputTable.push("<td>" + inputField + parType + "</td>");
  if( fieldId === "sender" )
  {
     inputTable.push('<td><a class="btn" id="openWallet">Wallet</a></td>');
  } 
  else if ( fieldId === 'balance' )
  {
     buildAddMoreTag(inputTable);
  }
  inputTable.push("</tr>");
}

function showWalletModal() {
  console.log('openModalButton clicked');
  updateProgress(0);
  $("#progressModal").hide();
  $("#openModal").show();
}

function searchContract() {
 
  var addr = getContractAddress();
  
  document.getElementById("filter").style.display = 'none';
  document.getElementById("filter").value = "";
  document.getElementById("functions").innerHTML = "";
  $(".contract.error").hide();
  $("#functionDetail").hide();
  
  console.log("addr = " + addr );
  if( !Web3.prototype.isAddress(addr) ) {
    $('.contract.error').text('Contract address is invalid!').show();
    $(".searchResult").show(); 
    return false;
  }
  
  
  getContractAbi (addr, function(response){
    if( response )
    {
       global_abi = response;
       buildContent();
    }
    else
    {
       $(".contract.error").text('Contract source is not available!').show();
    }
  
    $(".searchResult").show(); 
  });
  
  return false;
}

function buildContent()
{
  $(".contract.error").hide();
  var addr = getContractAddress();
  buildContractName( addr );

  $("#filter").show();
  var filterString = '';
  buildNav(filterString);
}
 
function buildContractName( addr ) {
  var networkid = $("#networkid").val();
  if( networkid === "testnet" ) {
    $("#contractPane").hide();
  } else {
    var sourceTag = buildSourceTag( addr );
    $("#contractName").text(global_abi.name);
    $("#contractSource").html(sourceTag);
    console.log("source tag: " + sourceTag);
    $("#contractPane").show();
  }
}
 
function buildSourceTag( addr ) {
  var sourceLink = 'https://etherchain.org/account/' + addr+'#code';
  var sourceTag = '(<a href="'+sourceLink+'" target="_blank">source</a>)';
  return sourceTag;
}


function buildNav(filterString) {
   var funcNames = getFunctionNames(global_abi.abi, filterString);
   funcNames.sort();
   
   functionNames = funcNames.map(buildMenuItem); 
   functionNames.unshift('<ul>');
   functionNames.push('</ul>');
   $("#functions").html( functionNames.join('') );

   $('.navItem').on('click', navItemClicked);
   
   if( funcNames.length > 0 ) GetFunction(funcNames[0]);
}

function buildMenuItem(item)
{
   return '<li><a class="navItem" id="'+item+'">' + item + '</a></li>';
}

$('#contractAddress').keypress(function(e){
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        $('.btnSearch').click();
        return false;
    }
    return true;
});

$('#importFile').on('change', function() {
  $('.alert').hide();
});

$('#sender').on('change', function() {
  senderHasChanged();
});

function senderHasChanged(){
  getBalance();
  getNonce();
}

function loadContracts() {
  var address;
  var name;
  for( var i = 0; i < abiList.length; i++ ) {
    address = abiList[i].address;
    name = abiList[i].name + ' @ ' + address;
    $("#contractTestnet").append('<option value="' + address + '">' + name  + '</option>');
  }
}

/**
 * close the import wallet modal dialog
 */
$('#closeModal').click(function(){
  closeModal();
});

function closeModal() {
  $('#password').val('');
  $('.alert').hide();
  $('.modalDialog').fadeOut(300);
}

function showProgress() {
  $('#progressModal').show();
  $('#openModal').hide();
}

function updateProgress( pct ) {
  $('.pctText').text(parseInt(pct));
  $('.fill').css('width', pct + '%');
}

/**
 * import the wallet from the JSON file
 */
$('#importWallet').click( function() {

  var address = '';
  var password = $('#password').val();
  

  var reader = new FileReader();
  reader.onload = function(evt) {
    var json = null;
    try {
      json = evt.target.result
    } catch (e) {
      console.log("Invalid JSON Wallet");
      return;
    }

    console.log("loaded JSON wallet file");
  
    if( !worker ) {
      setupWorker();
    }

    showProgress();
    worker.postMessage({
      action: 'import',
      json: json,
      password: password,
    });
  }
  reader.onerror = function (evt) {
    $('.alert').show().text("Error reading file.");
  }

  var file = document.getElementById('importFile').files[0];
  if( !file ) {
    $(".alert").text("Please select a file").show();    
  } else {
    reader.readAsText(file, "UTF-8");
  }
});

function setupWorker() {

  worker = new Worker('js/wallet-worker.js');
  worker.addEventListener('message', function (event) {
    var data = event.data;

    if (data.action === 'progress') {
      updateProgress(data.percent);

    } else if (data.action === 'error') {
      $('.alert').show().text(data.error);
      showWalletModal();
      console.log('error importing wallet');
    } else if (data.action === 'imported') {
      if (data.privateKey === null) {
        $('.alert').show().text('Incorrect password');
        showWalletModal();
        console.log('incorrect password');
      } else {
        console.log('completed wallet import');
        updateProgress('100');
        var address = wallet.importFromKey(data.privateKey);

        updateTxData('sender', address);
        $("#sender").val(address);
        senderHasChanged();
        setTimeout(function() {
          closeModal();
        }, 500 );
      }
    }
  });

  worker.addEventListener('error', function (event) {
    console.log('error event triggered: ', event);
    $('.alert').text('error: ' + event.message).show();
    showWalletModal();
  });
}

/**
 * filter the navigation function list as user types in the filter input box
 */
$('#filter').keyup(function() {
  buildNav(this.value);
});

/** 
 * search for the contract after user selected different contract from the dropdown list
 */
$('#contractTestnet').change(function() {
  searchContract();
});

/**
 * return the contract address based on the networkid selected
 */
function getContractAddress() {
  var address;
  var networkid = $('#networkid').val();
  if( networkid === 'mainnet') {
    address = $('#contractAddress').val();
  } else {
    address = $('#contractTestnet').val();
  }
  return address;
}

/**
 * Search the contract when the Search button is clicked
 */
$('#btnSearch').click(function() {
  searchContract();
});


function navItemClicked(event) {
  console.log('navItemClicked', event, event.target.text);
  GetFunction(event.target.text);
}


function inputIsValid(event) {
  var inputField = $('#' + event.target.id);
  var inputType = inputField.nextAll('span:first').text();
  var inputValue = inputField.val();
  console.log('inputIsValid', event.target.id, inputType);
  if( inputType === 'ether' || inputType === 'wei' ) {
    inputType = 'int256';
  }
  
  var valid = true;
  try {
   if( inputType === 'address' ) {
     if( inputValue.length > 0 ) {
       valid = Web3.prototype.isAddress(inputValue); 
     }
   } else {
     coder.encodeParam(inputType, inputValue);
   }
  } catch (err) {
    valid = false;
  }

  if( valid ) {
    // input value is valid, remove all previous error
    $('#error').text('');
    inputField.removeClass('invalid-input');
    $('#btnCall').removeClass('disabled');   
    
  } else {
    $('#error').text('Invalid input value');
    inputField.addClass('invalid-input');
    $('#btnCall').addClass('disabled');   
  }
}

/**
 *  Add the 'Add More' button to redirect to zerogox.com to get 
 *  some ethers
 */
function buildAddMoreTag(inputTable) {
  var networkid = $('#networkid').val();
  if( networkid === 'testnet' ) {
    var url = 'https://zerogox.com/ethereum/wei_faucet';
    inputTable.push('<td><a class="btn" target="_blank" href="'+ url +'">Add More</a></td>');
  }
}

