import * as fs from "fs";
import { TMP_DIR } from "./";

export default async function () {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmdirSync(TMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TMP_DIR);
}
