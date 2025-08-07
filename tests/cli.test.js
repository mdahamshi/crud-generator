const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);


const tempDir = path.join(process.cwd(), 'test-temp');

beforeAll(async () => {
  // Create temp directory for tests
  await fs.mkdir(tempDir, { recursive: true });
});

afterAll(async () => {
  // Cleanup after tests
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('CRUD Generator CLI', () => {
  const cliPath = path.join(process.cwd(), 'index.js');

  test('create command generates files', async () => {
    const modelName = 'TestModel';
    const cwd = tempDir;

    // Run create command
    await execAsync(`node ${cliPath} create ${modelName}`, { cwd });

    // Check if files are created
    const routesExists = await fileExists(path.join(cwd, 'src/routes/testmodels.js'));
    const controllerExists = await fileExists(path.join(cwd, 'src/controllers/testmodelController.js'));
    const queryExists = await fileExists(path.join(cwd, 'src/db/queries/testmodel.js'));

    expect(routesExists).toBe(true);
    expect(controllerExists).toBe(true);
    expect(queryExists).toBe(true);
  });

  test('remove command deletes files', async () => {
    const modelName = 'TestModel';
    const cwd = tempDir;

    // Run remove command, simulate yes answer by echo 'y' to stdin
    await execAsync(`echo y | node ${cliPath} remove ${modelName}`, { cwd });

    // Check if files are deleted
    const routesExists = await fileExists(path.join(cwd, 'src/routes/testmodels.js'));
    const controllerExists = await fileExists(path.join(cwd, 'src/controllers/testmodelController.js'));
    const queryExists = await fileExists(path.join(cwd, 'src/db/queries/testmodel.js'));

    expect(routesExists).toBe(false);
    expect(controllerExists).toBe(false);
    expect(queryExists).toBe(false);
  });
});

// Helper to check file existence
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
