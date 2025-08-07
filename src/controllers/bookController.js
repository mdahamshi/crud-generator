import db from '../db/db.js';

export const getAllBooks = async (req, res, next) => {
  try {
    const items = await db.book.getAll();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    const item = await db.book.getById([id]);
    if (!item) return res.status(404).json({ error: 'Book not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const { {  } } = req.body;
    const newItem = await db.book.create([]);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    const { {  } } = req.body;
    const updatedItem = await db.book.update([, id]);
    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};


export const deleteBook = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    await db.book.delete([id]);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    next(error);
  }
};
