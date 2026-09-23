const { openCustomerDatabase, resolveCustomerDbPath, DEFAULT_FILENAME } = require("./database");
const { CustomerRepository } = require("./repository");
const {
  CustomerService,
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCE_CODES,
} = require("./service");
const { SCHEMA_VERSION, ensureCustomerSchema } = require("./schema");

function createCustomerCore(options = {}) {
  const connection = openCustomerDatabase(options);
  const repository = new CustomerRepository({ db: connection.db });
  const service = new CustomerService({ repository });
  return {
    ...connection,
    repository,
    service,
  };
}

module.exports = {
  createCustomerCore,
  openCustomerDatabase,
  resolveCustomerDbPath,
  DEFAULT_FILENAME,
  CustomerRepository,
  CustomerService,
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCE_CODES,
  SCHEMA_VERSION,
  ensureCustomerSchema,
};
