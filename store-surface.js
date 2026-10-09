(() => {
 document.querySelectorAll('.store-icon-orbit canvas').forEach(c=>window.NUC_DOTS?.mount(c));
 if(new URLSearchParams(location.search).get('preview')==='1')for(const link of document.querySelectorAll('.registry-store-hero a[href]')){const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname.endsWith('.html')){url.searchParams.set('preview','1');link.href=url.pathname+url.search+url.hash;}}
})();
