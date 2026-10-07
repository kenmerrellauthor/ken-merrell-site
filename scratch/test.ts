const text = '"Molean," said I, low but steady, "I have told you before. You cannot tend the fires with the babe at your breast.';
const parts = text.split(/([.!?]+[”"’']?\s*)/);
const sentences = [];
for (let i = 0; i < parts.length; i += 2) {
  if (parts[i]) {
    sentences.push(parts[i] + (parts[i+1] || ''));
  }
}
console.log(sentences);
