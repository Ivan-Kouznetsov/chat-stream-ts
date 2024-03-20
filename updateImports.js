/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';



function readDirectory(directoryPath) {
    return fs.readdirSync(directoryPath);
}

function updateImportStatements(content) {
    const regex = /import\s+(?:[^'"]+\s+from\s+)?['"](\.+\/[^'"]+)['"]/g;
    return content.replace(regex, (match, p1) => {
        if (!p1.endsWith('.js')) {
            console.log(`Updating import statement: ${p1}`);
            return match.replace(p1, `${p1}.js`);
        }
        return match;
    });
}

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = updateImportStatements(content);
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated file: ${filePath}`);
}

function updateFilesInDirectory(directoryPath) {
    const files = readDirectory(directoryPath);
    files.forEach(function (file) {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('test')){
            updateFilesInDirectory(filePath); // Recursively update files in subdirectories
        } else if (path.extname(file) === '.js') {
            console.log(`Found JS file: ${filePath}`);
            updateFile(filePath);
        }
    });
}

if (process.argv[1].includes('updateImports.js')) {
    const directoryPath = process.argv[2] ?? './dist';
    console.log(`Directory path: ${directoryPath}`);
    console.log(fs.existsSync(directoryPath) ? 'Directory exists' : 'Directory does not exist');

    if (directoryPath) {
        updateFilesInDirectory(directoryPath);
    } else {
        console.log('Please provide the directory path as a command line argument.');
    }
}

export {
    readDirectory,
    updateImportStatements,
    updateFile,
    updateFilesInDirectory
};
