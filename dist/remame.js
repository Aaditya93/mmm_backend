import * as fs from "fs";
import * as path from "path";
function normalizeFilename(filename) {
    const { name, ext } = path.parse(filename);
    const cleanName = name
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/\(sy\)/gi, "")
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    return `${cleanName}${ext.toLowerCase()}`;
}
function renameImages(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory not found: ${directory}`);
        return;
    }
    try {
        const files = fs.readdirSync(directory);
        for (const filename of files) {
            const oldPath = path.join(directory, filename);
            if (!fs.statSync(oldPath).isFile()) {
                continue;
            }
            const newFilename = normalizeFilename(filename);
            const newPath = path.join(directory, newFilename);
            if (oldPath !== newPath) {
                try {
                    fs.renameSync(oldPath, newPath);
                    console.log(`Renamed: '${filename}' -> '${newFilename}'`);
                }
                catch (e) {
                    console.error(`Error renaming '${filename}': ${e}`);
                }
            }
        }
    }
    catch (err) {
        console.error(`Error reading directory: ${err}`);
    }
}
const targetDirectory = "/Users/aadityashewale/Downloads/Airlines";
renameImages(targetDirectory);
