self.addEventListener("message",function(t){var a,e;if(t.data.hasOwnProperty("install")){e={type:"installed",filename:t.data.install};try{importScripts(t.data.install),e.success=!0}catch(t){a=t,e.error=a}return self.postMessage(e)}});
//# sourceMappingURL=worker-internal.js.map
