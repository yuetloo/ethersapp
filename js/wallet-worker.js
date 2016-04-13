/**
 *  Web worker for importing wallet
 *  FIXME: currently only supports v3 wallet
 */

onmessage = function(e) {
  var data = e.data;
  if( data.action === 'import' ){
    var json = data.json;
    var password = data.password;
   
    if( !json ) {
      postMessage({action: 'error', error:'Missing json: ' + JSON.stringify(data)});
      return;
    }
    if( !password ) {
      postMessage({action: 'error', error:'Missing password: ' + JSON.stringify(data)});
      return;
    }

    try {
      json = JSON.parse(json);
    } catch( err ) {
      postMessage({action: 'error', error:'Unable to parse json: ' + JSON.stringify(data)});
      return;
    }

    importScripts('buffer.js', 'aes.js', 'scryptsy.js', 
                  'web3.min.js', 'ethereumjs-tx.js', 'wallet.js' ); 
    var wallet = new Wallet();
    var privateKey = wallet.importFromJson( json, password, function(progress) {
      postMessage({
        action:'progress', 
        percent: progress
      });  
    }); 
    if( privateKey ) {
      postMessage({
        action: 'imported',
        privateKey: privateKey.toString('hex')
      });
    } else {
      postMessage( {
        action: 'error',
        error: 'Incorrect password' 
      });
    }
    
  } else {
    postMessage({action: 'error', error:'Invalid action: ' + data.action});
  }
  close();
}
