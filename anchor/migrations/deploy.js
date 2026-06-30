// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the root workspace of the Anchor project.

const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  anchor.setProvider(provider);
};
