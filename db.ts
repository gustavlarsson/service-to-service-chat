import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres", // Change if needed
  host: "localhost",
  database: "chat",
  password: "", 
  port: 5432,
});

export default pool;