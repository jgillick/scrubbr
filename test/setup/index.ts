import * as fs from "fs";
import { tmpNameSync } from "tmp";

export const TMP_DIR = "./tmp";

/**
 * Write a file to the temp directory
 */
export const writeFile = (content: string, extension?: string) => {
  let filename = tmpNameSync({ tmpdir: TMP_DIR });
  if (extension) {
    filename = `${filename}.${extension}`;
  }
  fs.writeFileSync(filename, content);
  return filename;
};

export const writeTS = (content: string) => writeFile(content, "ts");
