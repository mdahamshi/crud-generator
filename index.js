#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import readline from 'readline';

function parseFields(fieldArgs) {
  return fieldArgs.map(fld => {
    const [name, type = 'string'] = fld.split(':');
    return { name, type };
  });
}

async function createModel(modelNameRaw, fieldArgs = []) {
  const modelName = modelNameRaw.toLowerCase();
  const ModelName = modelNameRaw[0].toUpperCase() + modelNameRaw.slice(1);
  const modelPlural = modelName + 's';
  const fields = parseFields(fieldArgs);

  const baseDir = process.cwd();

  const paths = {
    routes: path.join(baseDir, 'src/routes', `${modelPlural}.js`),
    controller: path.join(baseDir, 'src/controllers', `${modelName}Controller.js`),
    query: path.join(baseDir, 'src/db/queries', `${modelName}.js`),
    db: path.join(baseDir, 'src/db/db.js'),
    indexRoutes: path.join(baseDir, 'src/routes/index.js'),
    pool: path.join(baseDir, 'src/db/pool.js'),
  };

  for (const filePath of [paths.routes, paths.controller, paths.query]) {
    try {
      await fs.access(filePath);
      console.error(`❌ File already exists: ${filePath}`);
      process.exit(1);
    } catch { }
  }

  for (const dir of Object.values(paths).map(p => path.dirname(p))) {
    await fs.mkdir(dir, { recursive: true });
  }

  async function renderTemplate(templateName, data) {
    const templatePath = path.join(new URL(import.meta.url).pathname, '..', 'templates', templateName);
    const template = await fs.readFile(templatePath, 'utf-8');
    return ejs.render(template, data);
  }

  try {
    await fs.access(paths.pool);
  } catch {
    const poolTemplate = `
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}`;
    await fs.writeFile(paths.pool, poolTemplate.trim());
    console.log(`✔ Created pool.js`);
  }

  const fieldNames = fields.map(f => f.name).join(', ');
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const updateSets = fields.map((f, i) => `${f.name} = $${i + 1}`).join(', ');
  const updateIndex = fields.length + 1;
  const controllerDestruct = `{ ${fields.map(f => f.name).join(', ')} }`;
  const fieldList = fieldNames.split(',').map(f => f.trim());


  const data = {
    modelName,
    ModelName,
    modelPlural,
    fieldNames,
    placeholders,
    updateSets,
    updateIndex,
    fieldList,
    controllerDestruct
  };

  await fs.writeFile(paths.query, await renderTemplate('query.ejs', data));
  console.log(`✔ Created query file`);

  await fs.writeFile(paths.controller, await renderTemplate('controller.ejs', data));
  console.log(`✔ Created controller file`);

  await fs.writeFile(paths.routes, await renderTemplate('routes.ejs', data));
  console.log(`✔ Created routes file`);

  try {
    let dbContent = await fs.readFile(paths.db, 'utf-8');
    if (!dbContent.includes(`import ${modelName} from './queries/${modelName}.js'`)) {
      dbContent = `import ${modelName} from './queries/${modelName}.js';\n` + dbContent;
    }
    if (!dbContent.includes(`${modelName},`)) {
      dbContent = dbContent.replace(/const db = \{/, `const db = {\n  ${modelName},`);
    }
    if (!dbContent.includes('export default db;')) {
      dbContent += `\nexport default db;\n`;
    }
    await fs.writeFile(paths.db, dbContent);
    console.log(`✔ Updated db.js`);
  } catch {
    const dbContent = `import ${modelName} from './queries/${modelName}.js';\n\nconst db = {\n  ${modelName},\n};\n\nexport default db;\n`;
    await fs.writeFile(paths.db, dbContent);
    console.log(`✔ Created db.js`);
  }

  try {
    let indexContent = await fs.readFile(paths.indexRoutes, 'utf-8');
    const importLine = `import ${modelPlural}Routes from './${modelPlural}.js';`;
    const routeLine = `  app.use(\`/api/\${apiV}/${modelPlural}\`, ${modelPlural}Routes);`;

    if (!indexContent.includes(importLine)) {
      indexContent = importLine + '\n' + indexContent;
    }
    if (!indexContent.includes(routeLine)) {
      indexContent = indexContent.replace(/function registerRoutes\(app, apiV\) \{/, `function registerRoutes(app, apiV) {\n${routeLine}`);
    }
    if (!indexContent.includes('export default registerRoutes;')) {
      indexContent += `\nexport default registerRoutes;\n`;
    }
    await fs.writeFile(paths.indexRoutes, indexContent);
    console.log(`✔ Updated routes/index.js`);
  } catch {
    const indexContent = `import ${modelPlural}Routes from './${modelPlural}.js';\n\nfunction registerRoutes(app, apiV) {\n  app.use(\`/api/\${apiV}/${modelPlural}\`, ${modelPlural}Routes);\n}\n\nexport default registerRoutes;\n`;
    await fs.writeFile(paths.indexRoutes, indexContent);
    console.log(`✔ Created routes/index.js`);
  }

  console.log(`✅ CRUD for model "${ModelName}" generated successfully!`);
}

program
  .name('crud-gen')
  .description('CRUD generator CLI tool')
  .version('1.0.0');

program
  .command('create <modelName> [fields...]')
  .description('Generate CRUD files for a model\n\nExample:\n  create author name:string age:int\n')
  .action((modelNameRaw, fieldsArgs) => {
    if (!fieldsArgs || fieldsArgs.length === 0) {
      console.error('❌ Error: You must provide at least one field. Example: create author name:string age:int');
      process.exit(1);
    }
    createModel(modelNameRaw, fieldsArgs).catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
  });


async function promptYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function removeModel(modelNameRaw) {
  const modelName = modelNameRaw.toLowerCase();
  const ModelName = modelNameRaw[0].toUpperCase() + modelNameRaw.slice(1);
  const modelPlural = modelName + 's';

  const baseDir = process.cwd();

  // Paths to delete
  const paths = {
    routes: path.join(baseDir, 'src/routes', `${modelPlural}.js`),
    controller: path.join(baseDir, 'src/controllers', `${modelName}Controller.js`),
    query: path.join(baseDir, 'src/db/queries', `${modelName}.js`),
    db: path.join(baseDir, 'src/db/db.js'),
    indexRoutes: path.join(baseDir, 'src/routes/index.js'),
  };

  // Confirm deletion
  const confirmed = await promptYesNo(`🗑 Are you sure you want to delete model "${ModelName}" and all related files? (y/N): `);
  if (!confirmed) {
    console.log('❌ Cancelled.');
    process.exit(0);
  }

  // Delete files if they exist
  for (const [key, filePath] of Object.entries(paths)) {
    if (key === 'db' || key === 'indexRoutes') continue; // handled below
    try {
      await fs.unlink(filePath);
      console.log(`✔ Deleted ${filePath}`);
    } catch {
      console.log(`⚠ File not found (skipped): ${filePath}`);
    }
  }

  // Remove from db.js
  try {
    let dbContent = await fs.readFile(paths.db, 'utf-8');
    // Remove import line
    const importRegex = new RegExp(`import\\s+${modelName}\\s+from\\s+'.\\/queries\\/${modelName}\\.js';?\\n`, 'g');
    dbContent = dbContent.replace(importRegex, '');

    // Remove registration line inside db object
    const registrationRegex = new RegExp(`\\s*${modelName},?\\n`, 'g');
    dbContent = dbContent.replace(registrationRegex, '');

    await fs.writeFile(paths.db, dbContent);
    console.log(`✔ Updated ${paths.db}`);
  } catch {
    console.log(`⚠ ${paths.db} not found or could not update.`);
  }

  // Remove from routes/index.js
  try {
    let indexContent = await fs.readFile(paths.indexRoutes, 'utf-8');
    // Remove import
    const importRegex = new RegExp(`import\\s+${modelPlural}Routes\\s+from\\s+'.\\/${modelPlural}\\.js';?\\n`, 'g');
    indexContent = indexContent.replace(importRegex, '');

    // Remove route registration line
    const routeRegex = new RegExp(`\\s*app\\.use\\(\\\`\\/api\\/\\$\\{apiV\\}\\/\\${modelPlural}\\\`,\\s*${modelPlural}Routes\\);?\\n`, 'g');
    indexContent = indexContent.replace(routeRegex, '');

    await fs.writeFile(paths.indexRoutes, indexContent);
    console.log(`✔ Updated ${paths.indexRoutes}`);
  } catch {
    console.log(`⚠ ${paths.indexRoutes} not found or could not update.`);
  }

  console.log(`✅ Model "${ModelName}" and related files removed.`);
}

program
  .command('remove <modelName>')
  .description('Remove generated CRUD files and references for a model')
  .action((modelNameRaw) => {
    removeModel(modelNameRaw).catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
  });


program.parse(process.argv);
