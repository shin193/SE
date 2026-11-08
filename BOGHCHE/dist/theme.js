// Loaded before paint so the saved palette also applies on direct product links.
const palettes={olive:'باغ زیتون',clay:'خاک و دارچین',sea:'آبی دریا',plum:'آلو و یاس'};
try{const savedTheme=localStorage.getItem('boghche-theme');if(Object.hasOwn(palettes,savedTheme))document.documentElement.dataset.theme=savedTheme;}catch{}
