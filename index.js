var Sequelize = require('sequelize');

var dialect = 'mysql';
/**
 * @param {string} newDialect
 * @returns {*}
 */
function setDialect(newDialect) {
	if (['mysql', 'mariadb', 'sqlite', 'postgres', 'mssql'].indexOf(newDialect) === -1) {
		throw new Error('Unknown sequalize dialect');
	}
	dialect = newDialect;
}

/**
 *
 * @param {Object|string} swaggerPropertySchema
 * @returns {*}
 */
function getSequalizeType(swaggerPropertySchema) {
	if (typeof swaggerPropertySchema === 'string') {
		swaggerPropertySchema = {
			type: swaggerPropertySchema
		}
	}

	if (swaggerPropertySchema.properties) {
		console.log('Warning: encountered', JSON.stringify(swaggerPropertySchema.properties));
		console.log('Cannot handle complex subschemas (yet?), falling back to blob');
		return Sequelize.BLOB
	}

	if (swaggerPropertySchema.$ref) {
		console.log('Warning: encountered', JSON.stringify(swaggerPropertySchema.$ref));
		console.log('Cannot handle $ref (yet?), falling back to blob');
		return Sequelize.BLOB
	}

	switch ((typeof swaggerPropertySchema === 'string') ? swaggerPropertySchema : swaggerPropertySchema.type) {
		case 'byte':
		case 'binary':
			return Sequelize.STRING.BINARY;

		case 'date':
		case 'dateTime':
			return Sequelize.DATE;

		case 'password':
		case 'string':
			return Sequelize.STRING;

		case 'array':
			if (dialect === 'postgres') {
				return Sequelize.ARRAY(getSequalizeType(swaggerPropertySchema.items));
			}
			console.log('Warning: encountered', JSON.stringify(swaggerPropertySchema));
			console.log('Can only handle array for postgres (yet?), see http://docs.sequelizejs.com/en/latest/api/datatypes/#array, falling back to blob');
			return Sequelize.BLOB;

		case 'boolean':
			return Sequelize.BOOLEAN;

		case 'integer':
			return Sequelize.INTEGER;

		case 'long':
			return Sequelize.BIGINT;

		case 'number':
		case 'float':
			return Sequelize.FLOAT;

		case 'double':
			return Sequelize.DOUBLE;

		default:
			console.log('Warning: encountered', JSON.stringify(swaggerPropertySchema));
			console.log('Unknown data type, falling back to blob');
			return Sequelize.BLOB;
	}
}

function generate (schema) {
	//poor mans deep-clone
	var result = JSON.parse(JSON.stringify(schema.properties));

	Object.keys(result).forEach((propertyName) => {
		var propertySchema = result[propertyName];
		propertySchema.type = getSequalizeType(propertySchema);
	});

	return result;
}

module.exports = { setDialect, generate };