// Simple local invoker for the Netlify function handler
const path = require('path');

async function main(){
  const fn = require(path.join('..','netlify','functions','api-auth-callback.js'));
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { code: 'TEST' },
    body: null
  };

  try{
    const res = await fn.handler(event, {});
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', res.body);
  }catch(err){
    console.error('Invocation error:', err);
    process.exitCode = 1;
  }
}

main();
