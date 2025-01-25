import Tesseract from 'tesseract.js';

export const handleOCR = async (file: File): Promise<string[]> => {
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};