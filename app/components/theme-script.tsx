import {
  ACCENTS,
  ACCENT_STORAGE,
  DARK_TOKENS,
  LEGACY_ACCENT_STORAGE,
  LEGACY_THEME_STORAGE,
  LIGHT_TOKENS,
  THEME_STORAGE,
} from "./theme";

const DEFAULT_ACCENT = ACCENTS[0].id;

// Inline bootstrap that applies the saved theme/accent BEFORE first paint, so
// there is no flash of the default light theme. Runs from localStorage; the
// constants are serialized from the single source in theme.ts. Rendered as the
// first node in <body> in the root layout.
export function ThemeScript() {
  const js = `(function(){try{
function m(o,n){try{var v=localStorage.getItem(o);if(v!=null&&localStorage.getItem(n)==null)localStorage.setItem(n,v);if(v!=null)localStorage.removeItem(o);}catch(e){}}
m(${JSON.stringify(LEGACY_THEME_STORAGE)},${JSON.stringify(THEME_STORAGE)});
m(${JSON.stringify(LEGACY_ACCENT_STORAGE)},${JSON.stringify(ACCENT_STORAGE)});
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE)})||'dark';
var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE)})||${JSON.stringify(DEFAULT_ACCENT)};
var L=${JSON.stringify(LIGHT_TOKENS)},D=${JSON.stringify(DARK_TOKENS)},A=${JSON.stringify(ACCENTS)};
var r=document.documentElement;r.setAttribute('data-theme',t);
var tk=t==='dark'?D:L;for(var k in tk){r.style.setProperty('--color-'+k,tk[k]);}
var ac=A.filter(function(x){return x.id===a;})[0]||A[0];
var dk=t==='dark';
r.style.setProperty('--color-accent',ac.value);
r.style.setProperty('--color-accent-deep',ac.deep);
r.style.setProperty('--color-accent-soft',dk?ac.darkSoft:ac.soft);
r.style.setProperty('--color-accent-ink',dk?ac.darkInk:ac.ink);
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
