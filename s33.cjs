const fs=require('fs');
function edit(p,fn){let s=fs.readFileSync(p,'utf8');const c=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');s=fn(s);fs.writeFileSync(p,c?s.replace(/\n/g,'\r\n'):s);}
// Ajedrez: padding en style
edit('src/games/ajedrez/Ajedrez.tsx',s=>{
 const m=/style=\{\{ width: '(min\([^']+\))', padding: '4\.6%'/.exec(s); if(!m)throw new Error('ajedrez');
 return s.replace(m[0],()=>`style={{ width: '${m[1]}', padding: 'calc(${m[1]} * 0.046)'`);});
for(const [p,pct] of [['src/games/damas/Damas.tsx','1.8'],['src/games/parchis/Parchis.tsx','1.6']]){
 edit(p,s=>{
  const re=new RegExp(`className="rounded-\[14px\] p-\[${pct.replace('.','\.')}%\]" style=\{\{ width: '(min\([^']+\))'`);
  const m=re.exec(s); if(!m)throw new Error(p);
  return s.replace(m[0],()=>`className="rounded-[14px]" style={{ width: '${m[1]}', padding: 'calc(${m[1]} * ${(Number(pct)/100).toFixed(3)})'`);});
}
