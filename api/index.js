// This file is required by Azure Functions Core Tools v4
// The actual functions are in their respective folders
module.exports = async function (context, req) {
  context.res = {
    status: 200,
    body: "Azure Functions API is running. Access functions via their specific routes."
  };
};

