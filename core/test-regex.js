const source = "kire:|x-";
const regex = new RegExp(`<(?:((?:${source})[a-zA-Z0-9_\-:]*)([^>]*?)\/>|((?:${source})[a-zA-Z0-9_\-:]*)([^>]*?)>([\s\S]*?)<\/\3>)`, 'g');

const test1 = '<kire:if cond="true">Yes</kire:if>';
const match = regex.exec(test1);
console.log('Match:', !!match);
if (match) {
    console.log('0 (outer):', match[0]);
    console.log('1 (selfTag):', match[1]);
    console.log('2 (selfAttr):', match[2]);
    console.log('3 (pairTag):', match[3]);
    console.log('4 (pairAttr):', match[4]);
    console.log('5 (inner):', match[5]);
}
