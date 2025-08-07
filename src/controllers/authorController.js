import db from '../db/db.js';

export const getAllAuthors = async (req, res, next) => {
  try {
    const items = await db.author.getAll();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const getAuthorById = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    const item = await db.author.getById([id]);
    if (!item) return res.status(404).json({ error: 'Author not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createAuthor = async (req, res, next) => {
  try {
    const { name, age } = req.body;
    const newItem = await db.author.create([name, age]);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const updateAuthor = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    const { name, age } = req.body;
    const updatedItem = await db.author.update([name, age, id]);
    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};


export const deleteAuthor = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    await db.author.delete([id]);
    res.json({ message: 'Author deleted' });
  } catch (error) {
    next(error);
  }
};
