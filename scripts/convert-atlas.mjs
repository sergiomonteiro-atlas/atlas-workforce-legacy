#!/usr/bin/env node
/** Atlas portable converter. Original formats are documented in convert.sh. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const divisions=JSON.parse(fs.readFileSync(path.join(repo,'divisions.json'),'utf8')).divisions;
const tools=JSON.parse(fs.readFileSync(path.join(repo,'tools.json'),'utf8')).tools;
export const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
export function parseAgent(raw,relative) {
 const source=raw.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 const m=source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);if(!m)return null;
 const fields={};let current;
 for(const line of m[1].split('\n')) {const field=line.match(/^([a-z_]+):\s*(.*)$/i);if(field){current=field[1];let value=field[2].trim();if(value.startsWith('"')){try{value=JSON.parse(value)}catch{value=value.replace(/^"|"$/g,'')}}else if(value.startsWith("'"))value=value.replace(/^'|'$/g,'').replaceAll("''","'");fields[current]=value}else if(current&&/^\s+\S/.test(line))fields[current]+=' '+line.trim();}
 if(!fields.name)return null;
 return {...fields,source,relative,sourceSlug:path.basename(relative,'.md'),slug:slugify(fields.name),body:source.slice(m[0].length).replace(/^\n+/,'').replace(/\n+$/,'')};
}
export function splitSoul(body){const result={soul:'',agents:''};let target='agents',marker='',length=0;for(const line of body.split('\n')){const fence=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);if(marker){result[target]+=line+'\n';if(fence&&fence[1][0]===marker&&fence[1].length>=length&&!fence[2].trim())marker='';continue}if(fence){marker=fence[1][0];length=fence[1].length;}else if(/^##\s/.test(line))target=/identity|learning.*memory|communication|style|critical.rule|rules.you.must.follow/i.test(line)?'soul':'agents';result[target]+=line+'\n'}return result;}
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.md')?[path.join(dir,e.name)]:[]);
export function safeDirectory(dir,io=fs){const absolute=path.resolve(dir);let probe=path.parse(absolute).root;for(const segment of absolute.slice(probe.length).split(path.sep).filter(Boolean)){probe=path.join(probe,segment);if(io.existsSync(probe)&&io.lstatSync(probe).isSymbolicLink())throw Error('Refusing symlinked output ancestor: '+probe);}io.mkdirSync(absolute,{recursive:true});return absolute;}
const colors={cyan:'#00FFFF',blue:'#3498DB',green:'#2ECC71',red:'#E74C3C',purple:'#9B59B6',orange:'#F39C12',teal:'#008080',indigo:'#6366F1',pink:'#E84393',gold:'#EAB308',amber:'#F59E0B','neon-green':'#10B981','neon-cyan':'#06B6D4','metallic-blue':'#3B82F6',yellow:'#EAB308',violet:'#8B5CF6',rose:'#F43F5E',lime:'#84CC16',gray:'#6B7280',fuchsia:'#D946EF',slate:'#64748B',navy:'#000080'};
const qwenMap={Read:'read_file',Write:'write_file',Edit:'edit',MultiEdit:'edit',Bash:'run_shell_command',Grep:'grep_search',Glob:'glob',LS:'list_directory',WebFetch:'web_fetch',WebSearch:'web_search',TodoWrite:'todo_write',NotebookEdit:'notebook_edit',Task:'agent'};
export function render(tool,a){const f=(fields)=>'---\n'+Object.entries(fields).map(([k,v])=>`${k}: ${quote(v)}`).join('\n')+'\n---\n'+a.body+'\n';const rel={};const put=(p,s)=>rel[p]=s;
 switch(tool){
 case 'atlas-agent':put('agents/'+a.relative,a.source);break;
 case 'claude-code':case 'copilot':case 'openbot':put('agents/'+path.basename(a.relative),a.source);break;
 case 'antigravity':case 'osaurus':case 'dsh':put('agency-'+a.slug+'/SKILL.md',f({name:'agency-'+a.slug,description:a.description||''}));break;
 case 'gemini-cli':put('agents/'+a.slug+'.md',f({name:a.slug,description:a.description||''}));break;
 case 'codex':put('agents/'+a.slug+'.toml',`name = ${JSON.stringify(a.name)}\ndescription = ${JSON.stringify(a.description||'')}\ndeveloper_instructions = ${JSON.stringify(a.body)}\n`);break;
 case 'cursor':put('rules/'+a.slug+'.mdc',`---\ndescription: ${quote(a.description||'')}\nglobs: ""\nalwaysApply: false\n---\n${a.body}\n`);break;
 case 'openclaw':{const split=splitSoul(a.body);put(a.slug+'/SOUL.md',split.soul+'\n');put(a.slug+'/AGENTS.md',split.agents+'\n');put(a.slug+'/IDENTITY.md',`# ${a.emoji&&a.vibe?a.emoji+' ':''}${a.name}\n${a.emoji&&a.vibe?a.vibe:a.description||''}\n`);break;}
 case 'opencode':{const c=(a.color||'').toLowerCase();const hex=colors[c]||(/^#?[a-f0-9]{6}$/.test(c)?'#'+c.replace('#','').toUpperCase():'#6B7280');put('agents/'+a.slug+'.md',`---\nname: ${quote(a.name)}\ndescription: ${quote(a.description||'')}\nmode: subagent\ncolor: '${hex}'\n---\n${a.body}\n`);break;}
 case 'qwen':case 'zcode':{const fields={name:a.slug,description:a.description||''};if(a.tools)fields.tools=tool==='qwen'?[...new Set(a.tools.split(',').map(s=>s.trim()).filter(Boolean).map(s=>qwenMap[s]||s))].join(', '):a.tools;put('agents/'+a.slug+'.md',f(fields));break;}
 case 'kimi':put(a.slug+'/agent.yaml',`version: 1\nagent:\n  name: ${a.slug}\n  extend: default\n  system_prompt_path: ./system.md\n`);put(a.slug+'/system.md',`# ${a.name}\n\n${a.description||''}\n\n${a.body}\n`);break;
 case 'vibe':put('agents/'+a.slug+'.toml',`agent_type = "agent"\nsystem_prompt_id = "${a.slug}"\n`);put('prompts/'+a.slug+'.md',`# ${a.name}\n\n${a.description||''}\n\n${a.body}\n`);break;
 default:throw Error('No per-agent renderer: '+tool);
 }return rel;}
function usage(){return 'Usage: convert.sh [--tool <name>] [--out <dir>] [--parallel] [--jobs N]\n\n  --tool <name>    Convert one registered tool, or all (default).\n  --out <dir>      Write integrations beneath this directory.\n  --parallel       Accept parallel-compatible conversion requests.\n  --jobs N         Accept an integer worker-count hint.\n  --help           Show this help.\n\nTools: '+Object.keys(tools).join(', ')+'\n';}\nexport function main(args=process.argv.slice(2)){let tool='all',out=path.join(repo,'integrations');for(let i=0;i<args.length;i++){if(args[i]==='--tool'){if(!args[i+1])throw Error('--tool requires a value');tool=args[++i]}else if(args[i]==='--out'){if(!args[i+1])throw Error('--out requires a value');out=path.resolve(args[++i])}else if(args[i]==='--parallel'){}else if(args[i]==='--jobs'){if(!/^\d+$/.test(args[++i]||''))throw Error('--jobs requires a number')}else if(['--help','-h'].includes(args[i])){console.log(usage());return}else throw Error('Unknown option: '+args[i]);}
 if(tool!=='all'&&!tools[tool])throw Error('Unknown tool: '+tool);
 const agents=Object.keys(divisions).sort().flatMap(d=>walk(path.join(repo,d)).sort().map(file=>parseAgent(fs.readFileSync(file,'utf8'),path.relative(repo,file).split(path.sep).join('/'))).filter(Boolean));
 const seen=new Map();for(const a of agents){if(!a.slug)throw Error('Empty normalized agent slug '+a.relative);if(seen.has(a.slug))throw Error('Duplicate agent slug '+a.slug+': '+seen.get(a.slug)+' and '+a.relative);seen.set(a.slug,a.relative);}
 const output=safeDirectory(out),selected=tool==='all'?Object.keys(tools):[tool];let count=0;
 for(const t of selected){const dir=safeDirectory(path.join(output,t));for(const entry of fs.readdirSync(dir)){if(entry==='README.md')continue;const target=path.join(dir,entry);if(fs.lstatSync(target).isSymbolicLink())throw Error('Refusing symlinked output: '+target);fs.rmSync(target,{recursive:true,force:true});}
 const write=(p,s)=>{const target=path.join(dir,p);if(!target.startsWith(dir+path.sep))throw Error('Output escape');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,s,'utf8');};
 if(t==='hermes'){const python=process.env.ATLAS_PYTHON||(process.platform==='win32'?'python':'python3');const child=spawnSync(python,[path.join(repo,'scripts/build-hermes-plugin.py'),'--repo-root',repo,'--out',dir],{encoding:'utf8'});if(child.error||child.status!==0)throw Error('Hermes build failed: '+(child.error||child.stderr||child.stdout));}
 else if(t==='aider')write('CONVENTIONS.md','# Atlas Workforce — Agent Conventions\n\n'+agents.map(a=>`## ${a.name}\n\n> ${a.description||''}\n\nDivision: ${a.relative.split('/')[0]}\nFull instructions: ${a.relative}\n`).join('\n---\n\n'));
 else if(t==='windsurf')write('.windsurfrules','# Atlas Workforce\n\n'+agents.map(a=>`## ${a.name}\n${a.description||''}\n\n${a.body}\n`).join('\n'));
 else for(const a of agents)for(const [p,s]of Object.entries(render(t,a)))write(p,s);
 count+=agents.length;console.log(`[OK] ${t}: ${agents.length} agents`);
 }console.log(JSON.stringify({agents:agents.length,tools:selected.length,conversions:count,output}));return {agents:agents.length,tools:selected.length,conversions:count,output};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main()}catch(e){console.error('[ERROR] '+e.message);console.error(usage());process.exitCode=1;}}
