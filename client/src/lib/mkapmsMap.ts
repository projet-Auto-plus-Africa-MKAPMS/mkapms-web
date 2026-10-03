export type MkapmsMapMode="car"|"motorcycle"|"truck";
const DEFAULT_MAP_ORIGIN="https://mkapms-carte-api-production.up.railway.app";
export function mkapmsMapUrl(query:string,mode:MkapmsMapMode="car"){
 const base=(import.meta.env.VITE_MKAPMS_MAP_URL as string|undefined)?.trim()||DEFAULT_MAP_ORIGIN;
 const url=new URL(base);
 url.searchParams.set("q",query.trim());
 url.searchParams.set("mode",mode);
 return url.toString();
}
