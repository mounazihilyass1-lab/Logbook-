let flights = JSON.parse(localStorage.getItem("flights")) || [];
let airportDB = {};
let map;
let editIndex = null;

// ===== LOAD AIRPORTS =====
async function loadAirports(){
  const res = await fetch("https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat");
  const text = await res.text();

  text.split("\n").forEach(line=>{
    const p=line.split(",");
    const icao=p[5]?.replace(/"/g,"");
    const lat=parseFloat(p[6]);
    const lon=parseFloat(p[7]);

    if(icao && icao.length===4){
      airportDB[icao]=[lat,lon];
    }
  });
}

// ===== MAP =====
function initMap(){
  map=L.map('map').setView([30,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// ===== DRAW =====
function drawRoutes(){

  if(!map) return;

  flights.forEach(f=>{

    const dep=airportDB[f.from];
    const arr=airportDB[f.to];

    if(dep && arr){

      let curve=[];
      for(let i=0;i<=50;i++){
        let t=i/50;
        let lat=(1-t)*dep[0]+t*arr[0]+Math.sin(Math.PI*t)*2;
        let lon=(1-t)*dep[1]+t*arr[1];
        curve.push([lat,lon]);
      }

      L.polyline(curve,{color:"#3b82f6"})
        .bindPopup(`${f.from} → ${f.to}<br>${f.date}<br>${f.hours}h`)
        .addTo(map);
    }
  });
}

// ===== ADD / EDIT =====
function addFlight(){

  if(!date.value || !from.value || !to.value || !hours.value) return;

  const f={
    date:date.value,
    from:from.value.toUpperCase(),
    to:to.value.toUpperCase(),
    hours:parseFloat(hours.value),
    landings:parseInt(landings.value||0),
    type:type.value,
    rule:rule.value,
    night:night.value
  };

  if(editIndex!==null){
    flights[editIndex]=f;
    editIndex=null;
  } else {
    flights.unshift(f);
  }

  save();
  render();
}

// ===== EDIT BUTTON =====
function editFlight(i){
  const f=flights[i];

  date.value=f.date;
  from.value=f.from;
  to.value=f.to;
  hours.value=f.hours;
  landings.value=f.landings;
  type.value=f.type;
  rule.value=f.rule;
  night.value=f.night;

  editIndex=i;
}

// ===== DELETE =====
function deleteFlight(i){
  flights.splice(i,1);
  save();
  render();
}

// ===== SAVE =====
function save(){
  localStorage.setItem("flights",JSON.stringify(flights));
}

// ===== DISTANCE =====
function getDistance(a,b){
  const R=6371;
  const dLat=(b[0]-a[0])*Math.PI/180;
  const dLon=(b[1]-a[1])*Math.PI/180;

  const lat1=a[0]*Math.PI/180;
  const lat2=b[0]*Math.PI/180;

  const aVal=Math.sin(dLat/2)**2 +
    Math.sin(dLon/2)**2*Math.cos(lat1)*Math.cos(lat2);

  return R*2*Math.atan2(Math.sqrt(aVal),Math.sqrt(1-aVal));
}

// ===== RENDER =====
function render(){

  list.innerHTML="";
  let total=0,pic=0,ifr=0,land=0,dist=0;

  flights.forEach((f,i)=>{

    total+=f.hours;
    land+=f.landings;

    if(f.type==="PIC") pic+=f.hours;
    if(f.rule==="IFR") ifr+=f.hours;

    const dep=airportDB[f.from];
    const arr=airportDB[f.to];
    if(dep && arr) dist+=getDistance(dep,arr);

    list.innerHTML+=`
      <div class="flight">
        ${f.date} ${f.from}→${f.to}<br>
        ${f.hours}h ${f.type}
        <button onclick="editFlight(${i})">Edit</button>
        <button onclick="deleteFlight(${i})">Delete</button>
      </div>
    `;
  });

  total.textContent=total.toFixed(1);
  pic.textContent=pic.toFixed(1);
  ifr.textContent=ifr.toFixed(1);
  land.textContent=land;
  dist.textContent=Math.round(dist);

  if(map){
    map.eachLayer(l=>{
      if(l instanceof L.Polyline) map.removeLayer(l);
    });
    drawRoutes();
  }
}

// ===== EXPORT JSON =====
function exportJSON(){
  const blob=new Blob([JSON.stringify(flights,null,2)]);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="logbook.json";
  a.click();
}

// ===== IMPORT JSON =====
function importJSON(e){
  const file=e.target.files[0];
  const reader=new FileReader();

  reader.onload=function(){
    flights=JSON.parse(reader.result);
    save();
    render();
  };

  reader.readAsText(file);
}

// ===== PDF =====
function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc=new jsPDF();

  let y=10;
  doc.text("Pilot Logbook",80,y);
  y+=10;

  flights.forEach(f=>{
    doc.text(`${f.date} ${f.from}-${f.to} ${f.hours}h`,10,y);
    y+=7;
  });

  doc.save("logbook.pdf");
}

// ===== START =====
async function start(){
  await loadAirports();
  initMap();
  render();

  setTimeout(()=>map.invalidateSize(),500);
}

start();