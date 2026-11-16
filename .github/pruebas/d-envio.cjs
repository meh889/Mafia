/* Laboratorio · el envío del aviso, sin red */
/* Prueba del envío sin red: arma el pedido como lo haría el workflow y lo descifra como lo haría el celular. */
const crypto=require("crypto"),webpush=require("web-push"),ece=require("http_ece");
const A=require("../scripts/aviso.cjs");
const par=webpush.generateVAPIDKeys();const llaves={publica:par.publicKey,privada:par.privateKey};   /* llaves de prueba: la privada de verdad es un secret */
let ok=0,mal=0;const ch=(n,c,x)=>{if(c){ok++;console.log("  ✓ "+n);}else{mal++;console.log("  ✗ "+n,x===undefined?"":JSON.stringify(x));}};
// "celular": par de llaves y secreto de autenticación, como los genera el navegador al suscribirse
const cel=crypto.createECDH("prime256v1");cel.generateKeys();const auth=crypto.randomBytes(16);
const sub={endpoint:"https://web.push.apple.com/QHxyzABC123",keys:{p256dh:cel.getPublicKey().toString("base64url"),auth:auth.toString("base64url")}};
// el código que mandaría la app y su lectura en el script
const codigo="MAFIAPUSH1:"+Buffer.from(JSON.stringify({e:sub.endpoint,p:sub.keys.p256dh,a:sub.keys.auth})).toString("base64url");
const leidas=A.suscripciones("basura\n"+codigo+" , MAFIAPUSH1:rotoooo\n"+codigo);
ch("el script lee los códigos de la app e ignora lo que no sirve",leidas.length===2&&leidas[0].endpoint===sub.endpoint&&leidas[0].keys.auth===sub.keys.auth,leidas);
ch("el script trae una llave pública con forma de llave",/^[A-Za-z0-9_-]{87}$/.test(A.PUBLICA)&&Buffer.from(A.PUBLICA,"base64url").length===65);
const cuerpo=A.carga("MafiApp","Ya está la hoja de hoy.");
const det=webpush.generateRequestDetails(leidas[0],cuerpo,{vapidDetails:{subject:"https://meh889.github.io/Mafia/",publicKey:llaves.publica,privateKey:llaves.privada},TTL:43200,urgency:"normal",topic:"mafiapp-hoja"});
ch("el pedido va al servicio de Apple con cifrado aes128gcm, TTL y topic",det.endpoint===sub.endpoint&&det.method==="POST"&&det.headers["Content-Encoding"]==="aes128gcm"&&String(det.headers.TTL)==="43200"&&det.headers.Topic==="mafiapp-hoja"&&det.headers.Urgency==="normal",det.headers);
// la firma VAPID: JWT ES256 verificable con la llave pública
const m=/^vapid t=([^,]+), k=(.+)$/.exec(det.headers.Authorization||"");
let jwtOk=false,claims=null;
if(m){const [h,p,s]=m[1].split(".");claims=JSON.parse(Buffer.from(p,"base64url"));
  const pub=Buffer.from(m[2],"base64url");
  const jwk={kty:"EC",crv:"P-256",x:pub.subarray(1,33).toString("base64url"),y:pub.subarray(33).toString("base64url")};
  jwtOk=crypto.verify("sha256",Buffer.from(h+"."+p),{key:crypto.createPublicKey({key:jwk,format:"jwk"}),dsaEncoding:"ieee-p1363"},Buffer.from(s,"base64url"));}
ch("la firma VAPID es válida para la llave pública del par",jwtOk&&m[2]===llaves.publica);
ch("la firma dice a quién va y quién manda",claims&&claims.aud==="https://web.push.apple.com"&&claims.sub==="https://meh889.github.io/Mafia/"&&claims.exp>Date.now()/1000,claims);
// el "celular" descifra lo que le llega
const claro=ece.decrypt(det.body,{version:"aes128gcm",privateKey:cel,authSecret:sub.keys.auth}).toString("utf8");
let j=null;try{j=JSON.parse(claro);}catch(e){}
ch("el celular puede descifrar el aviso",!!j,claro.slice(0,80));
ch("el aviso viene en formato declarativo, con título, texto y a dónde abre",j&&j.web_push===8030&&j.notification.title==="MafiApp"&&j.notification.body==="Ya está la hoja de hoy."&&j.notification.navigate==="https://meh889.github.io/Mafia/",j);
ch("pesa menos que el límite de un push (4 KB)",det.body.length<4000,det.body.length);
console.log("\n"+ok+" bien, "+mal+" mal");process.exit(mal?1:0);
