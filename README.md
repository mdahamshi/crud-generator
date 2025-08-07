
# crud-generator

A simple CLI tool to **generate CRUD boilerplate code** for a given model with customizable fields.

## ✨ Features

- Quickly scaffold CRUD files for any model
- Define fields dynamically with types
- Generates:
  - SQL schema
  - Prisma model (optional)
  - Controller and route files (Express-compatible)
  - EJS-based code templates
- Fast, clean, and developer-friendly

---

## 🛠 Installation

```bash
npm install -g sb-crud-gen
````

> If you’re developing locally, use:
>
> ```bash
> npm link
> ```

---

## 🚀 Usage

```bash
sb-crud-gen create <ModelName> [fields...]
```

### 📌 Examples

```bash
sb-crud-gen create Author name:string age:int
sb-crud-gen create Post title:string content:text published:boolean
```

---

## 📂 Output

This will generate a folder structure like:

```
src/
├── controllers/
│   └── authorController.js
├── routes/
│   └── authorRoutes.js
└── db/
    └── queries/
        └── author.js
```

---
## Full Example
To create author, we run `sb-crud-gen create author name:string bio:string`

Result: db/queries/author.js


```javascript
const queries = {
  getAll: 'SELECT * FROM authors ORDER BY id ASC',
  getById: 'SELECT * FROM authors WHERE id = $1',
  create: 'INSERT INTO authors (name, bio) VALUES ($1,$2) RETURNING *',
  update: 'UPDATE authors SET name = $1, bio = $2 WHERE id = $3 RETURNING *',
  delete: 'DELETE FROM authors WHERE id = $1',
};

const author = {
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
    const res = await query(queries.update, params);
    return res.rows[0];
  },
  delete: async (params = []) => {
    await query(queries.delete, params);
    return { deleted: params[0] };
  },
};

export default author;

```

Route: routes/authors.js (registered automaticly at routes/index.js)

```javascript
import express from 'express';
import {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authorController.js';

const router = express.Router();

router.get('/', getAllAuthors);
router.get('/:id', getAuthorById);
router.post('/', createAuthor);
router.put('/:id', updateAuthor);
router.delete('/:id', deleteAuthor);

export default router;

```


Controller:  controllers/authorController.js

```javascript
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
    const { name, bio } = req.body;
    const newItem = await db.author.create([name, bio]);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const updateAuthor = async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    const { name, bio } = req.body;
    const updatedItem = await db.author.update([name, bio, id]);
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

```

## 🔧 Field Types

Supported field types include (but are not limited to):

* `string`
* `int` / `integer`
* `text`
* `boolean`
* `float`
* `date`
* `timestamp`

> You can easily customize the field-to-type mapping in the source code.

---

## 📄 License


This project is open-source and available under the [MIT License](https://mit-license.org/).


Feel free to explore either tool to boost your backend or frontend development speed!
