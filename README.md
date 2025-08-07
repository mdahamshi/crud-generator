Here’s a simple `README.md` for your CLI tool `crud-gen` that dynamically generates CRUD files using custom fields:

---

````md
# crud-gen

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
npm install -g crud-gen
````

> If you’re developing locally, use:
>
> ```bash
> npm link
> ```

---

## 🚀 Usage

```bash
crud-gen create <ModelName> [fields...]
```

### 📌 Examples

```bash
crud-gen create Author name:string age:int
crud-gen create Post title:string content:text published:boolean
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
        └── author.sql
```

---

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

MIT © YourName

```

---

Would you like to add sections for contributing, Prisma integration, or custom templates?
```
