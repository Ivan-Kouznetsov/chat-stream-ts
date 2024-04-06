/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const dependencies = Object.values(packageJson.dependencies);
const devDependencies = Object.values(packageJson.devDependencies);

const allDependencies = dependencies.concat(devDependencies);

allDependencies.forEach((version) => {
    if (version.startsWith('^')) {
        console.error(`Version string "${version}" starts with a caret (^). Please use exact version numbers.`);
        process.exit(1);
    }
});

console.info('All version strings are exact.');
