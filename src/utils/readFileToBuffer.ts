/** Kept as a module so the suites can mock the read without a real `File`. */
export async function readFileToBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
