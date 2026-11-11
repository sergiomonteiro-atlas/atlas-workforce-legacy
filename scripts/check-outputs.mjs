#!/usr/bin/env node
// Run the preserved upstream strict YAML/TOML/output invariants without a Bash
// process per field. The checks themselves remain the upstream Python program.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseAgent} from './convert-atlas.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dirs=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'divisions.json'),'utf8')).divisions);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()&&e.name.endsWith('.md')?[path.join(d,e.name)]:[]);
const agents=dirs.flatMap(d=>walk(path.join(root,d))).map(f=>parseAgent(fs.readFileSync(f,'utf8'),path.relative(root,f).replaceAll(path.sep,'/'))).filter(Boolean);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-output-check-'));
try{
 const bash=fs.readFileSync(path.join(root,'scripts/test-convert-outputs.sh'),'utf8');
 const start=bash.indexOf("python3 - <<'PY'\n");if(start<0)throw Error('Cannot locate preserved upstream verifier');
 const program=bash.slice(start+"python3 - <<'PY'\n".length).replace(/\nPY\s*$/,'');
 fs.writeFileSync(path.join(temp,'checks.py'),program);
 fs.writeFileSync(path.join(temp,'sources.tsv'),agents.map(a=>[a.slug,a.description,a.name,a.relative].join('\t')).join('\n')+'\n');
 const result=spawnSync(process.env.ATLAS_PYTHON||(process.platform==='win32'?'python':'python3'),[path.join(temp,'checks.py')],{encoding:'utf8',maxBuffer:5*1024*1024,env:{...process.env,PYTHONUTF8:'1',REPO_ROOT:root,OUT:path.join(root,'integrations'),SOURCES:path.join(temp,'sources.tsv'),N:String(agents.length),MANIFEST:path.join(root,'scripts/convert-outputs.sha256'),UPDATE:String(process.argv.includes('--update')),DIFF:'false',DRIFT:process.argv.includes('--advisory')?'advisory':'strict',TOOLS:'antigravity gemini-cli opencode cursor aider windsurf openclaw qwen zcode kimi codex osaurus hermes vibe dsh'}});
 if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{fs.rmSync(temp,{recursive:true,force:true})}
