import{ Pool } from 'pg'
import config from '../config/config'
export const pool = new Pool({
    connectionString: config.db_connection_str
})

const initDB = async () => {
  
};

export default initDB;