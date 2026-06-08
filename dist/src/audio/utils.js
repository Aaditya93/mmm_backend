import { writeFile } from "fs";
export function saveBinaryFile(fileName, content) {
    return new Promise((resolve, reject) => {
        writeFile(fileName, content, (err) => {
            if (err) {
                console.error(`Error writing file ${fileName}:`, err);
                reject(err);
                return;
            }
            resolve();
        });
    });
}
