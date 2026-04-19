let flights = JSON.parse(localStorage.getItem("flights")) || [];
let airports = {};
let map;
let editIndex = null;

// LOAD AIRPORT DATABASE
async function loadAirports(){
  const res = await fetch("https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat");
  const data = await res.text();

  data.split("\n").forEach(l=>{
    const p=l.split(",");
    const icao=p[5]?.replace(/"/g,"");
    const lat=parseFloat(p[6]);
    const lon=parseFloat(p[7]);

    if(icao && icao.length===4){
      airports[icao]=[lat,lon];
    }
  });
}

// INIT MAP
function initMap(){
  map = L.map("map").setView([25,0],2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:""
  }).addTo(map);
}

// DISTANCE
function dist(a,b){
  const R=6371;
  const dLat=(b[0]-a[0])*Math.PI/180;
  const dLon=(b[1]-a[1])*Math.PI/180;

  const x=
    Math.sin(dLat/2)**2 +
    Math.cos(a[0]*Math.PI/180)*
    Math.cos(b[0]*Math.PI/180)*
    Math.sin(dLon/2)**2;

  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

// ADD / EDIT
function addFlight(){

  const f={
    date:date.value,
    from:from.value.toUpperCase(),
    to:to.value.toUpperCase(),
    hours:+hours.value,
    landings:+landings.value||0,
    type:type.value,
    rule:rule.value
  };

  if(editIndex!==null){
    flights[editIndex]=f;
    editIndex=null;
  } else flights.unshift(f);

  save();
  render();
}

// DELETE
function del(i){
  flights.splice(i,1);
  save();
  render();
}

// EDIT
function edit(i){
  const f=flights[i];
  date.value=f.date;
  from.value=f.from;
  to.value=f.to;
  hours.value=f.hours;
  landings.value=f.landings;
  type.value=f.type;
  rule.value=f.rule;
  editIndex=i;
}

// SAVE
function save(){
  localStorage.setItem("flights",JSON.stringify(flights));
}

// RENDER
function render(){

  list.innerHTML="";

  let total=0,pic=0,ifr=0,land=0,km=0;

  flights.forEach((f,i)=>{

    total+=f.hours;
    land+=f.landings;

    if(f.type==="PIC") pic+=f.hours;
    if(f.rule==="IFR") ifr+=f.hours;

    const a=airports[f.from];
    const b=airports[f.to];
    if(a&&b) km+=dist(a,b);

    list.innerHTML+=`
      <div class="flight">
        ✈ ${f.date} ${f.from} → ${f.to}<br>
        ⏱ ${f.hours}h | 🧑‍✈️ ${f.type}
        <br>
        <button onclick="edit(${i})">✏</button>
        <button onclick="del(${i})">❌</button>
      </div>
    `;
  });

  document.getElementById("total").textContent=total.toFixed(1);
  document.getElementById("pic").textContent=pic.toFixed(1);
  document.getElementById("ifr").textContent=ifr.toFixed(1);
  document.getElementById("land").textContent=land;
  document.getElementById("dist").textContent=Math.round(km);

  draw();
}

// MAP DRAW
function draw(){
  if(!map) return;

  map.eachLayer(l=>{
    if(l instanceof L.Polyline) map.removeLayer(l);
  });

  flights.forEach(f=>{
    const a=airports[f.from];
    const b=airports[f.to];
    if(!a||!b) return;

    L.polyline([a,b],{color:"#2dd4bf"}).addTo(map);
  });
}

// PDF
function exportPDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF();

  let y=10;
  doc.text("AVIATION LOGBOOK",10,y);
  y+=10;

  flights.forEach(f=>{
    doc.text(`${f.date} ${f.from} → ${f.to} ${f.hours}h`,10,y);
    y+=8;
  });

  doc.save("logbook.pdf");
}

// JSON EXPORT
function exportJSON(){
  const blob=new Blob([JSON.stringify(flights,null,2)]);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="logbook.json";
  a.click();
}

// IMPORT
function importJSON(e){
  const r=new FileReader();
  r.onload=function(){
    flights=JSON.parse(r.result);
    save();
    render();
  };
  r.readAsText(e.target.files[0]);
}

// START
async function start(){
  await loadAirports();
  initMap();
  render();
}

start();