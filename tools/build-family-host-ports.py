"""Reproduce one immutable host-port package from an explicit committed source."""
import argparse,gzip,hashlib,io,json,re,subprocess,tarfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if not re.fullmatch('[a-f0-9]{40}',a.commit):raise SystemExit('Full source commit required')
r=Path(__file__).resolve().parents[1];prefix='packages/family-host-ports/'
def blob(name):return subprocess.check_output(['git','show',a.commit+':'+name],cwd=r)
names=subprocess.check_output(['git','ls-tree','-r','--name-only',a.commit,'--',prefix],cwd=r,text=True).splitlines();files={n[len(prefix):]:blob(n) for n in names}
if files['src/module-registry.json']!=blob('src/main/module-registry.json'):raise SystemExit('Module contract snapshot drift')
pkg=json.loads(files['package.json']);meta={'sourceRepository':'SteffenBandholt/BBM-Produktiv','sourceCommit':a.commit,'packageName':pkg['name'],'version':pkg['version'],'status':'isolated-integration-not-approved'}
files['src/provenance.json']=(json.dumps(meta,indent=2)+'\n').encode();b=io.BytesIO()
with tarfile.open(fileobj=b,mode='w',format=tarfile.USTAR_FORMAT) as t:
 for name,data in sorted(files.items()):
  m=tarfile.TarInfo('package/'+name);m.size=len(data);m.mode=0o644;m.mtime=0;t.addfile(m,io.BytesIO(data))
z=io.BytesIO()
with gzip.GzipFile(fileobj=z,mode='wb',filename='',mtime=0) as archive:archive.write(b.getvalue())
data=z.getvalue();a.output.mkdir(parents=True,exist_ok=True);target=a.output/f'bbm-family-host-ports-{pkg["version"]}.tgz'
if target.exists() and target.read_bytes()!=data:raise SystemExit('Refusing to replace an immutable version with different bytes')
target.write_bytes(data);meta.update(artifact=target.name,artifactSha256=hashlib.sha256(data).hexdigest());Path(str(target)+'.provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
