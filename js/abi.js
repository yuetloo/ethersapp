var abiList = [{
  "address" : "0x19d185c4945900e69314bf40bf8fe0e8b6e0a1fc",
  "name" : "Incrementer",
  "donotdelete" : true,
  "abi" : [{"constant":true,"inputs":[],"name":"x","outputs":[{"name":"","type":"uint256"}],"type":"function"}]
},
{
  "address" : "0x5b48fb88fe2a0755b7ae6c3fa863177bb4255e70",
  "name" : "StorageCounter",
  "donotdelete" : true,
  "abi" : [{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"}]
},
{
  "address" : "0xbf4efacebda7d75f980dc8a21ee750c1679f3c90",
  "name" : "SetValueContract",
  "donotdelete" : true,
  "abi" : [ {"constant":true,"inputs":[],"name":"getValue", "outputs":[{"name":"value","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"store","type":"string"}],"name":"setValue","outputs":[],"type":"function"}]
}
];
