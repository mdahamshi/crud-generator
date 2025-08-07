import { query } from '../pool.js';

const queries = {
  getAll: 'SELECT * FROM books ORDER BY id ASC',
  getById: 'SELECT * FROM books WHERE id = $1',
  create: 'INSERT INTO books () VALUES () RETURNING *',
  update: 'UPDATE books SET  WHERE id = $1 RETURNING *',
  delete: 'DELETE FROM books WHERE id = $1'
};

const book = {
  getAll: async (params = []) => {
    const res = await query(queries.getAll, params);
    return res.rows;
  },
  getById: async (params = []) => {
    const res = await query(queries.getById, params);
    return res.rows[0];
  },
  create: async (params = []) => {
    const res = await query(queries.create, params);
    return res.rows[0];
  },
  update: async (params = []) => {
    const res = await update(queries.create, params);
    return res.rows[0];
  },
  delete: async (params = []) => {
    await query(queries.delete, params);
    return { deleted: params[0] };
  }
};

export default book;
