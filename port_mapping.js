const fs = require("fs");

module.exports.PORT = JSON.parse(fs.readFileSync(__dirname + "/port_mapping.json", "utf-8"));
module.exports.saveToFile = (portMaps) => fs.writeFileSync(__dirname + "/port_mapping.json", JSON.stringify(portMaps));  