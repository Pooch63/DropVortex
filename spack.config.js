const { config } = require("@swc/core/spack");

module.exports = config({
  entry: {
    connect4: __dirname + "/src/connect4.ts",
  },
  output: {
    path: __dirname + "/lib",
  },
});
