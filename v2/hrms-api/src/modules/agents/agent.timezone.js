const pad = value => String(value).padStart(2,'0');
const keyParts = value => { const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '')); return match ? match.slice(1).map(Number) : null; };
export const isValidTimeZone = value => { try { if (!value || typeof value !== 'string') return false; new Intl.DateTimeFormat('en-US',{timeZone:value}).format(new Date()); return true; } catch { return false; } };
const partsAt = (date,timeZone) => Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
export const toDateKeyInTimeZone = (value,timeZone) => { if (keyParts(value)) return String(value); const p=partsAt(value instanceof Date ? value : new Date(value),timeZone); return `${p.year}-${pad(p.month)}-${pad(p.day)}`; };
const zonedStart = (key,timeZone) => {
  const [year,month,day]=keyParts(key) || [];
  if (!year) return null;
  const target=Date.UTC(year,month-1,day);
  let timestamp=target;
  for(let i=0;i<5;i+=1){const p=partsAt(new Date(timestamp),timeZone);const observed=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=target-observed;if(!delta)break;timestamp+=delta;}
  return new Date(timestamp);
};
export const startOfDayInTimeZone = (value,timeZone) => zonedStart(keyParts(value)?String(value):toDateKeyInTimeZone(value,timeZone),timeZone);
export const endOfDayInTimeZone = (value,timeZone) => { const key=keyParts(value)?String(value):toDateKeyInTimeZone(value,timeZone);const [year,month,day]=keyParts(key)||[];if(!year)return null;const next=new Date(Date.UTC(year,month-1,day+1));const nextKey=`${next.getUTCFullYear()}-${pad(next.getUTCMonth()+1)}-${pad(next.getUTCDate())}`;return new Date(zonedStart(nextKey,timeZone).getTime()-1); };
