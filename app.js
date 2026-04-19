let flights = JSON.parse(localStorage.getItem("flights")) || [];
let filtered = null;

// =====================
// ADD FLIGHT
// =====================
function addFlight(){

  if(!date.value || !from.value || !to.value || !hours.value){
    return;
  }

  flights.unshift({
    date:date.value,
    from:from.value.toUpperCase(),
    to:to.value.toUpperCase(),
    hours:parseFloat(hours.value),
    landings:parseInt(landings.value || 0),
    type:type.value,
    rule:rule.value,
    night:night.value
  });

  save();
  render();

  date.value="";
  from.value="";
  to.value="";
  hours.value="";
  landings.value="";
}

// =====================
// SAVE LOCAL STORAGE
// =====================
function save(){
  localStorage.setItem("flights", JSON.stringify(flights));
}

// =====================
// RENDER LIST
// =====================
function render(data = flights){

  const list = document.getElementById("list");
  list.innerHTML = "";

  let total = 0;
  let pic = 0;
  let ifr = 0;
  let land = 0;

  data.forEach((f,i)=>{

    total += f.hours;
    land += f.landings;

    if(f.type === "PIC") pic += f.hours;
    if(f.rule === "IFR") ifr += f.hours;

    list.innerHTML += `
      <div class="flight">
        ${f.date} | ${f.from} → ${f.to}<br>
        ${f.hours}h | ${f.type} | ${f.rule} | ${f.night}<br>
        Landings: ${f.landings}

        <button onclick="editFlight(${i})" style="background:#f59e0b;margin-top:5px;">Edit</button>
        <button onclick="deleteFlight(${i})" style="background:#ef4444;margin-top:5px;">Delete</button>
      </div>
    `;
  });

  document.getElementById("total").textContent = total.toFixed(1);
  document.getElementById("pic").textContent = pic.toFixed(1);
  document.getElementById("ifr").textContent = ifr.toFixed(1);
  document.getElementById("land").textContent = land;
}

// =====================
// DELETE
// =====================
function deleteFlight(i){
  flights.splice(i,1);
  save();
  render();
}

// =====================
// EDIT
// =====================
function editFlight(i){
  const f = flights[i];

  date.value = f.date;
  from.value = f.from;
  to.value = f.to;
  hours.value = f.hours;
  landings.value = f.landings;
  type.value = f.type;
  rule.value = f.rule;
  night.value = f.night;

  flights.splice(i,1);
  save();
  render();
}

// =====================
// FILTER
// =====================
function applyFilter(){
  const val = filterMonth.value;
  filtered = flights.filter(f => f.date.startsWith(val));
  render(filtered);
}

function resetFilter(){
  filtered = null;
  filterMonth.value = "";
  render();
}

// =====================
// EXPORT JSON
// =====================
function exportJSON(){
  const blob = new Blob([JSON.stringify(flights,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "logbook.json";
  a.click();
}

// =====================
// EXPORT PDF (REAL FIX)
// =====================
function exportPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica");
  doc.setFontSize(12);

  doc.text("PILOT LOGBOOK", 10, 10);

  let y = 20;

  flights.forEach(f => {
    doc.text(
      `${f.date} ${f.from}-${f.to} ${f.hours}h ${f.type} ${f.rule}`,
      10,
      y
    );
    y += 8;

    if(y > 280){
      doc.addPage();
      y = 10;
    }
  });

  doc.save("pilot_logbook.pdf");
}

// =====================
// IMPORT JSON
// =====================
fileInput.onchange = e => {
  const reader = new FileReader();

  reader.onload = ev => {
    flights = JSON.parse(ev.target.result);
    save();
    render();
  };

  reader.readAsText(e.target.files[0]);
};

// INIT
render();