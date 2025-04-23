import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("pekerja.js loaded");

while (true) {
  try {
    // read file bahan.txt
    const bahan = fs.readFileSync(path.join(__dirname, "bahan.txt"), "utf-8");
    const result = eval(bahan);
    console.log(result);
  } catch (error) {
    console.log(error);
    //
  }
}
