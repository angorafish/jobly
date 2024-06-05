const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL query string and values for a partial update
 * 
 * @param {Object} dataToUpdate - The data to update, where keys are column names and values are new values.
 * @param {Object} jsToSql - Mapping from JS-style data fields to database column names.
 * @returns {Object} - An object containing the SQL set clause and the array of values.
 * @throws {BadRequestError} - If no data is provided to update
 * 
 * @exampleconst dataToUpdate = { firstName: 'Aliya', age: 32 };
 * const jsToSql = { firstName: 'first_name };
 * const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 * // result: {
 * // setCols: '"first_name"=$1, "age"=$2',
 * // values: ['Aliya', 32]
 * // }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
