// Loaded before paint so the saved palette also applies on direct product links.
const palettes={olive:'باغ زیتون',clay:'خاک و دارچین',sea:'آبی دریا',plum:'آلو و یاس'};
try{const savedTheme=localStorage.getItem('boghche-theme');if(Object.hasOwn(palettes,savedTheme))document.documentElement.dataset.theme=savedTheme;}catch{}

// File URLs may isolate localStorage per file; carry only the palette in the auth link.
if(location.protocol==='file:'&&location.pathname.endsWith('/auth.html')){const linkedTheme=new URLSearchParams(location.search).get('theme');if(Object.hasOwn(palettes,linkedTheme))document.documentElement.dataset.theme=linkedTheme;}
