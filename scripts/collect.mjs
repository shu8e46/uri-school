// 컴시간 알리미 시간표를 받아서 comci/<나이스 학교코드>/<r>.json 으로 저장해요.
// 브라우저(웹 앱)는 컴시간 서버에 직접 접속할 수 없어서(CORS),
// GitHub Actions 가 주기적으로 이 스크립트를 돌려 정적 파일로 올려둬요.
//
//   node scripts/collect.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ORIGIN = 'http://comci.net:4082';

async function get(path) {
  const res = await fetch(ORIGIN + path, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// 알리미 페이지에서 요청 경로와 접두어를 찾아요 (가끔 바뀌어서 매번 읽어요).
async function paths() {
  const html = (await get('/st')).toString('latin1');
  const prefix = html.match(/sc_data\('(\d+_)',sc,1,'0'\)/);
  const data = html.match(/var sc3='\.(\/\d+)\?'/);
  if (!prefix || !data) throw new Error('알리미 페이지 구조가 바뀌었어요');
  return { prefix: prefix[1], data: data[1] };
}

// 응답 끝에 붙는 NUL 등을 잘라내고 JSON 만 남겨요.
function json(buf) {
  const s = buf.toString('utf8');
  return JSON.parse(s.slice(0, s.lastIndexOf('}') + 1));
}

const schools = JSON.parse(await readFile(new URL('./schools.json', import.meta.url), 'utf8'));
const p = await paths();
let failed = 0;

for (const s of schools) {
  try {
    const week = async (r) => {
      const q = Buffer.from(`${p.prefix}${s.comci}_0_${r}`).toString('base64');
      return json(await get(`${p.data}?${q}`));
    };
    const first = await week(1);
    const weeks = (first['일자자료'] ?? []).map((e) => e[0]);
    await mkdir(`comci/${s.neis}`, { recursive: true });
    for (const r of weeks.length ? weeks : [1]) {
      const d = r === 1 ? first : await week(r);
      await writeFile(`comci/${s.neis}/${r}.json`, JSON.stringify(d));
    }
    console.log(`${s.name}: ${weeks.length}주 저장 (수정일 ${first['자료244']})`);
  } catch (e) {
    failed++;
    console.error(`${s.name}: 실패 - ${e.message}`);
  }
}

if (failed === schools.length) process.exit(1);
