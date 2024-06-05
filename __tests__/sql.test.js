const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("generates proper SQL query and values", function () {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };
        const jsToSql = { firstName: 'first_name' };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32]
        });
    });

    test("throws BadRequestError if no data provided", function () {
        try {
            sqlForPartialUpdate({}, {});
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("works with no jsToSql mappings", function () {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };

        const result = sqlForPartialUpdate(dataToUpdate, {});

        expect(result).toEqual({
            setCols: '"firstName"=$1, "age"=$2',
            values: ['Aliya', 32]
        });
    });

    test("throws BadRequestError if no dataToUpdate provided", function () {
        try {
            sqlForPartialUpdate({}, { firstName: 'first_name' });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});
