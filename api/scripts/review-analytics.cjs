const { chromium, expect } = require("playwright/test");
const { spawn } = require("node:child_process");
const path = require("node:path");
const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");
const root = path.resolve(__dirname, "../../web");
const base = "http://127.0.0.1:5282";
const album = { _id: "635000000000000000000001", title: "Prueba", artistName: "Caribe", format: "ep", cover: {url:"/favicon.png"}, listenUrl:"https://open.spotify.com/album/example" };
const concert = { _id: "x", slug: "concierto-qa", date: "2099-10-10", artistName: "Caribe", venue: "Sala", ticketUrl: "https://entradium.com/events/example" };
const fakeTag = `
  if (!/^https?:$/.test(location.protocol)) throw Error('El documento de medición debe usar HTTP(S)');
  if (!dataLayer.some(args => args[0] === 'set' && args[1] === 'send_page_view' && args[2] === false)) throw Error('Falta desactivar la vista automática');
  document.cookie = '_ga=qa; Path=/';
  document.cookie = '_ga_TEST000001=qa; Path=/';
  function processCommand(args) {
    if (args[0] === 'event') new Image().src = 'https://www.google-analytics.com/g/collect?event=' +
      encodeURIComponent(JSON.stringify([args[1],args[2]]));
  }
  dataLayer.forEach(processCommand);
  dataLayer.push = processCommand;`;

async function main() {
  const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", "5282", "--strictPort"], {cwd:root,stdio:"inherit"});
  let browser;
  try {
    for (let i=0; i<60; i++) {
      if (await fetch(base).then(r=>r.ok).catch(()=>false)) break;
      if (server.exitCode !== null) throw Error("Vite no arrancó");
      await delay(200);
    }
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport:{width:390,height:844},hasTouch:true,isMobile:true });
    const p = await ctx.newPage();
    let scripts=0, blocked=false;
    const events=[];
    await ctx.route("**/*", async r=>{
      const u=new URL(r.request().url());
      if (u.hostname === "www.googletagmanager.com") {
        scripts++;
        assert.equal(u.searchParams.get("id"),"G-TEST000001");
        return blocked ? r.abort() : r.fulfill({contentType:"application/javascript",body:fakeTag});
      }
      if (u.hostname === "www.google-analytics.com") {
        events.push(JSON.parse(u.searchParams.get("event"))); return r.fulfill({status:204});
      }
      if(u.hostname !== "127.0.0.1") return r.fulfill({contentType:"text/html",body:"Destino de prueba"});
      if(!u.pathname.startsWith("/api/")) return r.continue();
      const routes={
        "/sessions/current":{role:"admin"}, "/banners/active":{_id:"qa",title:"Anuncio de prueba",updatedAt:"1"},
        "/events":{data:[concert],totalPages:1}, "/releases":[album], ["/releases/"+album._id]:album
      };
      return r.fulfill({json:routes[u.pathname.replace("/api/v1","")] ?? []});
    });
    const views=()=>events.filter(e=>e[0]==="page_view").map(e=>new URL(e[1].page_location).pathname);
    const gaCookies=async()=> (await ctx.cookies(base)).filter(c=>c.name.startsWith("_ga"));
    const legal=p.getByRole("link",{name:"Información legal",exact:true});
    const prefs=p.getByRole("button",{name:"Preferencias de cookies"});
    const reject=p.getByRole("button",{name:"Rechazar",exact:true});
    const accept=p.getByRole("button",{name:"Aceptar",exact:true});
    await p.goto(base+"/?token=must_never_leave#private");
    await expect(accept).toBeVisible(); await expect(reject).toBeVisible();
    assert.equal(scripts,0); assert.deepEqual(await gaCookies(),[]); assert.deepEqual(events,[]);
    await reject.click(); await p.getByRole("button",{name:"Cerrar anuncio"}).click();
    await p.reload(); await expect(legal).toBeVisible(); await expect(accept).toHaveCount(0);
    assert.equal(scripts,0); assert.deepEqual(events,[]); assert.deepEqual(await gaCookies(),[]);
    await legal.click(); await prefs.click(); await accept.click();
    await expect.poll(views).toEqual(["/legal"]);
    await p.goBack(); await expect.poll(views).toEqual(["/legal","/"]);
    await expect.poll(async()=>(await gaCookies()).length).toBe(2);
    const visitEvents=p.getByRole("link",{name:/Eventos 04/});
    await visitEvents.click(); await expect.poll(views).toEqual(["/legal","/","/eventos"]);
    const pop=async loc=>{ const opened=ctx.waitForEvent("page"); await loc.click();const dest=await opened;await dest.waitForLoadState();const host=new URL(dest.url()).hostname;await dest.close();return host; };
    const tickets=p.getByRole("link",{name:/Entradas/i}).first();
    assert.equal(await pop(tickets),"entradium.com");
    await expect.poll(()=>events.filter(e=>e[0]==="ticket_click").length).toBe(1);
    await p.goBack();await p.goForward();await expect.poll(views).toEqual(["/legal","/","/eventos","/","/eventos"]);
    await p.goBack();await expect.poll(()=>views().length).toBe(6);
    assert.equal(await pop(p.getByRole("link",{name:/Tienda 05/})),"cariberecords.bigcartel.com");
    await expect.poll(()=>events.filter(e=>e[0]==="shop_click").length).toBe(1);
    await p.getByRole("link",{name:/Catálogo 02/}).click();
    assert.equal(await pop(p.getByRole("link",{name:"Escuchar Prueba"}).first()),"open.spotify.com");
    await expect.poll(()=>events.filter(e=>e[0]==="listen_click").length).toBe(1);
    await p.getByRole("link",{name:"Prueba",exact:true}).first().click();
    await expect.poll(()=>views().at(-1)).toBe("/releases/"+album._id);
    assert.equal(events.filter(e=>e[0]==="page_view").at(-1)[1].content_slug,"caribe-prueba");
    await p.goto(base);await expect.poll(()=>views().at(-1)).toBe("/");
    const before=events.length;await p.getByRole("link",{name:/Panel/}).first().click();
    await expect(p).toHaveURL(/\/admin$/);await expect(p.locator('iframe[title="Medición de audiencia"]')).toHaveCount(0);
    const beforeScripts=scripts;
    for(const route of ["/admin/login","/admin/recuperar?token=must_never_leave","/admin/activar?token=must_never_leave"]) await p.goto(base+route);
    assert.equal(events.length,before);assert.equal(scripts,beforeScripts);
    await p.goto(base);await expect.poll(()=>scripts).toBe(beforeScripts+1);
    await legal.click();await prefs.click();await reject.click();assert.deepEqual(await gaCookies(),[]);
    await p.reload();await expect(prefs).toBeVisible();await expect(accept).toHaveCount(0);
    await p.goto(base);
    const stopped=events.length;const prevScripts=scripts;
    await p.getByRole("link",{name:/Eventos 04/}).click();assert.equal(await pop(tickets),"entradium.com");
    assert.equal(scripts,prevScripts);assert.equal(events.length,stopped);
    blocked=true;await legal.click();await prefs.click();await accept.click();await p.goBack(); assert.equal(await pop(tickets),"entradium.com");
    await p.goto(base+"/releases");assert.equal(await pop(p.getByRole("link",{name:"Escuchar Prueba"}).first()),"open.spotify.com");
    assert.ok(!JSON.stringify(events).includes("must_never_leave"));
    console.log("Consentimiento, cookies, navegación, tres tipos de salida, bloqueo y rutas privadas verificados.");
  } finally {if(browser) await browser.close(); server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
