var InputStructure,OutputStructure,Structure,extend=function(t,r){function e(){this.constructor=t}for(var u in r)hasProp.call(r,u)&&(t[u]=r[u]);return e.prototype=r.prototype,t.prototype=new e,t.__super__=r.prototype,t},hasProp={}.hasOwnProperty;"undefined"!=typeof require&&null!==require?(Structure=require("./structure").Structure,InputStructure=require("./input-structure").InputStructure):"undefined"!=typeof WorkerGlobalScope&&null!==WorkerGlobalScope?null==WorkerGlobalScope.Structure&&(importScripts("structure.js"),importScripts("input-structure.js")):null!=("undefined"!=typeof self&&null!==self?self.importScripts:void 0)&&null==self.Structure&&(importScripts("release/structure.js"),importScripts("release/input-structure.js")),OutputStructure=function(t){function r(){var t,e,u;r.__super__.constructor.apply(this,arguments),this.markDirty(),(e=null!=(u=(t=Structure.prototype.subclasses.InputStructure).prototype.instancesBeingInterpreted)?u.length:void 0)&&(this.origin=t.prototype.instancesBeingInterpreted[e-1])}return extend(r,Structure),r.prototype.className=Structure.addSubclass("OutputStructure",r),r.prototype.markDirty=function(t){return null==t&&(t=!0),this.dirty=t},r.prototype.addConnectionOrigin=function(t,e,u){var n,o,p;if(n=Structure.prototype.subclasses.InputStructure,e instanceof r&&(o=null!=(p=n.prototype.instancesBeingInterpreted)?p.length:void 0))return u._origin=n.prototype.instancesBeingInterpreted[o-1].id()},r.prototype.feedback=function(t){var r;return null!=(r=this.origin)?r.feedback(t):void 0},r.prototype.hasLabel=function(t){return!1},r.lookupIn=function(t,r){var e,u,n,o;for(u=0,n=(o=r.slice(0).reverse()).length;u<n;u++)if((e=o[u]).hasLabel(t))return e;return null},r.prototype.lookup=function(t){return this.firstAccessible(function(r){return r.hasLabel(t)})},r}(),"undefined"!=typeof exports&&null!==exports&&(exports.OutputStructure=OutputStructure);
//# sourceMappingURL=output-structure.js.map