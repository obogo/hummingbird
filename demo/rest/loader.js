!function(){function a(a){for(var d=a.split(" "),e=function(a){return function(){var c=Array.prototype.slice.call(arguments);return c.unshift(a),b.push(c),b}},f=0;f<d.length;f++){var g=d[f];b[g]=e(g)}var h=document.getElementsByTagName("script")[0];h.parentNode.insertBefore(c,h),window.hb=b}var b=[],c=document.createElement("script");c.type="text/javascript",c.async=!0,c.onload=c.onerror=function(){setTimeout(function(){var a,c;for(a=0,c=b.length,a;c>a;a++){var d=b[a],e=d.shift();if(b.hasOwnProperty(e))try{b[e].apply(b,d)}catch(f){console.warn(f.message)}}b.length=0})},c.src="hb.js",a("init on")}();