#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import readline from 'readline';


async function createModel(modelNameRaw) {
  const modelName = modelNameRaw.toLowerCase();
  const ModelName = modelNameRaw[0].toUpperCase() + modelNameRaw.slice(1);
  const modelPlural = modelName + 's';

  const baseDir = process.cwd();

  // Paths for output files
  const paths = {
    routes: path.join(baseDir, 'src/routes', `${modelPlural}.js`),
    controller: path.join(baseDir, 'src/controllers', `${modelName}Controller.js`),
    query: path.join(baseDir, 'src/db/queries', `${modelName}.js`),
    db: path.join(baseDir, 'src/db/db.js'),
    indexRoutes: path.join(baseDir, 'src/routes/index.js'),
    pool: path.join(baseDir, 'src/db/pool.js'),
  };

  // Check if files already exist
  for (const filePath of [paths.routes, paths.controller, paths.query]) {
    try {
      await fs.access(filePath);
      console.error(`❌ File already exists: ${filePath}`);
      process.exit(1);
    } catch {
      // file does not exist, OK
    }
  }

  // Make sure directories exist
  for (const dir of [path.dirname(paths.routes), path.dirname(paths.controller), path.dirname(paths.query), path.dirname(paths.db), path.dirname(paths.pool)]) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Load templates and render them
  async function renderTemplate(templateName, data) {
    const templatePath = path.join(new URL(import.meta.url).pathname, '..', 'templates', templateName);
    const template = await fs.readFile(templatePath, 'utf-8');
    return ejs.render(template, data);
  }

  // Create pool.js if missing
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
}
`;
    await fs.writeFile(paths.pool, poolTemplate.trim());
    console.log(`✔ Created pool.js`);
  }

  // Render and write query file
  const queryContent = await renderTemplate('query.ejs', { modelName, ModelName, modelPlural });
  await fs.writeFile(paths.query, queryContent);
  console.log(`✔ Created query file`);

  // Render and write controller file
  const controllerContent = await renderTemplate('controller.ejs', { modelName, ModelName, modelPlural });
  await fs.writeFile(paths.controller, controllerContent);
  console.log(`✔ Created controller file`);

  // Render and write routes file
  const routesContent = await renderTemplate('routes.ejs', { modelName, ModelName, modelPlural });
  await fs.writeFile(paths.routes, routesContent);
  console.log(`✔ Created routes file`);

  // Update or create db.js
  let dbContent = '';
  try {
    dbContent = await fs.readFile(paths.db, 'utf-8');
  } catch {
    dbContent = '';
  }

  if (!dbContent.includes(`import ${modelName} from './queries/${modelName}.js'`)) {
    dbContent = `import ${modelName} from './queries/${modelName}.js';\n` + dbContent;
  }

  if (!dbContent.includes(`${modelName},`)) {
    if (dbContent.includes('const db = {')) {
      dbContent = dbContent.replace(/const db = \{/, `const db = {\n  ${modelName},`);
    } else {
      dbContent += `\nconst db = {\n  ${modelName},\n};\n\nexport default db;\n`;
    }
  }

  if (!dbContent.includes('export default db;')) {
    dbContent += `\nexport default db;\n`;
  }

  await fs.writeFile(paths.db, dbContent);
  console.log(`✔ Updated db.js`);

  // Update routes index.js
  let indexContent = '';
  try {
    indexContent = await fs.readFile(paths.indexRoutes, 'utf-8');
  } catch {
    indexContent = '';
  }

  const importLine = `import ${modelPlural}Routes from './${modelPlural}.js';`;
  const routeLine = `  app.use(\`/api/\${apiV}/${modelPlural}\`, ${modelPlural}Routes);`;

  if (!indexContent.includes(importLine)) {
    indexContent = importLine + '\n' + indexContent;
  }

  if (!indexContent.includes(routeLine)) {
    if (indexContent.includes('function registerRoutes(app, apiV) {')) {
      indexContent = indexContent.replace(/function registerRoutes\(app, apiV\) \{/, `function registerRoutes(app, apiV) {\n${routeLine}`);
    } else {
      indexContent += `\nfunction registerRoutes(app, apiV) {\n${routeLine}\n}\n\nexport default registerRoutes;\n`;
    }
  }

  if (!indexContent.includes('export default registerRoutes;')) {
    indexContent += `\nexport default registerRoutes;\n`;
  }

  await fs.writeFile(paths.indexRoutes, indexContent);
  console.log(`✔ Updated routes/index.js`);

  console.log(`✅ CRUD for model "${ModelName}" generated successfully!`);
}

program
  .name('crud-gen')
  .description('CRUD generator CLI tool')
  .version('1.0.0');

program
  .command('create <modelName>')
  .description('Generate CRUD files for a model')
  .action((modelNameRaw) => {
    createModel(modelNameRaw).catch(err => {
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
