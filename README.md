
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
        └── author..js
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


This project is open-source and available under the [MIT License](https://mit-license.org/).


Feel free to explore either tool to boost your backend or frontend development speed!
