const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// Execute the exact simple production helper; remove its two type annotations only.
const line=fs.readFileSync('client/src/components/ShareButton.tsx','utf8').match(/export const buildShareText[^\n]+/)[0];
const f=vm.runInNewContext(line.replace('export ','').replace('(text: string, url: string)','(text, url)')+';buildShareText');
for(const text of ['本文  \n','【サバサバ】通常 / 生存時間 10:00 / スコア 12,345','Text & symbols 😀']){
const result=f(text,'https://example.com/');assert.equal(result,text.trim()+'\n#サバサバ #ゲーム制作\nhttps://example.com/');assert.equal(result.includes('\\n'),false);assert.equal(result.split('\n').length,3);
}
console.log('production buildShareText 3 cases: real LF, body preserved, exact tags, URL last PASS');
