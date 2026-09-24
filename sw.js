/* Guarda la app entera en el movil para que abra sin cobertura.
   Al tocar la app hay que subir este numero, si no los moviles ya
   instalados siguen viendo la version vieja.                      */
var CACHE = "fichaje-vicky-v14";
var ASSETS = ["./", "./index.html", "./manifest.json",
              "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function guarda(req, res){
  if(res && res.ok && res.type === "basic"){
    var copia = res.clone();
    caches.open(CACHE).then(function(c){ c.put(req, copia); });
  }
  return res;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || req.url.indexOf("http") !== 0) return;

  /* La pagina: primero la red (asi ve los cambios al momento), y si no hay
     cobertura o tarda mas de 2,5 s, lo guardado. */
  if(req.mode === "navigate"){
    e.respondWith(new Promise(function(resolve){
      var listo = false;
      var t = setTimeout(function(){
        if(listo) return;
        caches.match("./index.html", {ignoreSearch:true}).then(function(hit){
          if(!listo && hit){ listo = true; resolve(hit); }
        });
      }, 2500);
      fetch(req).then(function(res){
        clearTimeout(t);
        if(listo) return;
        listo = true; resolve(guarda(req, res));
      }).catch(function(){
        clearTimeout(t);
        if(listo) return;
        caches.match("./index.html", {ignoreSearch:true}).then(function(hit){
          if(listo) return;
          listo = true; resolve(hit || Response.error());
        });
      });
    }));
    return;
  }

  /* Todo lo demas (iconos, manifest): lo guardado va primero, y se refresca de fondo. */
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      var red = fetch(req).then(function(res){ return guarda(req, res); })
                          .catch(function(){ return hit || Response.error(); });
      return hit || red;
    })
  );
});
