module.exports = async function (context, req) {
  context.res = {
    status: 200,
    body: JSON.stringify({ 
      message: "Azure Functions are working!", 
      timestamp: new Date().toISOString() 
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
};
