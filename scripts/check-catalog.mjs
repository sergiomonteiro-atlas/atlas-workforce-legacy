#!/usr/bin/env node
/** Portable metadata and registration check; Bash checks remain available. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {parseAgent} from './convert-atlas.mjs';
const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
const divisions=JSON.parse(read('divisions.json')).divisions,tools=JSON.parse(read('tools.json')).tools;
const walk=p=>fs.readdirSync(path.join(repo,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):e.isFile()?[p+'/'+e.name]:[]);
const canonical=Object.keys(divisions).sort();
const array=(text,name)=>{const m=text.match(new RegExp(name+'=\\(([\\s\\S]*?)\\)'));assert.ok(m,`missing ${name}`);return m[1].replaceAll('"','').split(/\s+/).filter(Boolean).sort()};
for(const p of ['scripts/convert.sh','scripts/lint-agents.sh'])assert.deepEqual(array(read(p),'AGENT_DIRS'),canonical,`${p} divisions drift`);
assert.deepEqual(array(read('scripts/install.sh'),'ALL_TOOLS'),Object.keys(tools).sort(),'installer tools drift');
assert.deepEqual(array(read('scripts/convert.sh'),'valid_tools').filter(k=>k!=='all'),Object.keys(tools).sort(),'converter tools drift');
const ignored=new Set(['examples','scripts','integrations','strategy','vault-starter','docs','tests','node_modules']);
const directories=fs.readdirSync(repo,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('.')&&!ignored.has(e.name)).map(e=>e.name).sort();
assert.deepEqual(directories,canonical,'actual divisions drift');
const slugSet=new Map();let count=0;
for(const d of canonical){for(const k of ['label','icon','color'])assert.ok(divisions[d][k],`${d} missing ${k}`);assert.ok(read('.github/workflows/lint-agents.yml').includes(`"${d}/**"`),`${d} missing CI filter`);let divisionCount=0;for(const p of walk(d).filter(f=>f.endsWith('.md'))){const source=read(p);if(!source.startsWith('---\n'))continue;assert.ok(!source.includes('\r'),`${p} CRLF`);const a=parseAgent(source,p);assert.ok(a,`${p} invalid frontmatter`);for(const k of ['name','description','color'])assert.ok(a[k]?.trim(),`${p} missing ${k}`);assert.ok(a.body.length>100,`${p} empty instructions`);assert.ok(!slugSet.has(a.slug),`${p} duplicate slug with ${slugSet.get(a.slug)}`);slugSet.set(a.slug,p);divisionCount++;count++;}assert.ok(divisionCount>0,`${d} has no agents`);}
for(const [name,t]of Object.entries(tools)){assert.equal(t.kebab,name);for(const k of ['id','label','format','installKind','dest'])assert.ok(t[k],`${name} missing ${k}`);}
console.log(JSON.stringify({status:'passed',agents:count,divisions:canonical.length,tools:Object.keys(tools).length,checks:['frontmatter','LF','unique slugs','nonempty bodies','division arrays','tool arrays','CI division filters','tool metadata']}));
