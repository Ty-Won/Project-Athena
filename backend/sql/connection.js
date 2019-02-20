const mysql = require('mysql');
const util = require('util');
require('dotenv').config();

const db_config = {
  connectionLimit: process.env.connectionLimit,
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  connectionTimeout: process.env.connectionTimeout,
  database: process.env.database
};

let pool = mysql.createPool(db_config);
async function getNewConnection() {
	try {
		pool.getConnection = util.promisify(pool.getConnection);
		conn = await pool.getConnection();
		conn.query = util.promisify(conn.query);
		conn.beginTransaction = util.promisify(conn.beginTransaction);
		return(conn);
	} catch (error) {
		console.error(error);
		throw new Error('Unable to connect to the database');
	}
}

module.exports = {pool, getNewConnection};
