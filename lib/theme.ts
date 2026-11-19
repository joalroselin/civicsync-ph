export const THEME_KEY = "civicsync:theme";
export const LIGHT_THEME_COLOR = "#FBF8F0";
export const DARK_THEME_COLOR = "#16181B";

// Apply opt-in dark mode before the page paints.
export const themeScript = `(function(){try{var c=localStorage.getItem("${THEME_KEY}");var d=c==="dark"||(c==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?"${DARK_THEME_COLOR}":"${LIGHT_THEME_COLOR}"}catch(e){}})()`;
