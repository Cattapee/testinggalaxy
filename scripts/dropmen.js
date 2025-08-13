//toggles the dropdown menu
function toggleMenu(menuId) {
  // Close all dropdowns first
  let dropdowns = document.getElementsByClassName("dropdown-content");
  let buttons = document.getElementsByClassName("dropbtn");

  for (let i = 0; i < dropdowns.length; i++) {
    if (dropdowns[i].id !== menuId) {
      dropdowns[i].classList.remove("show");
      buttons[i].classList.remove("active");
    }
  }

  // Toggle the requested dropdown and button
  let menu = document.getElementById(menuId);
  let button = menu.previousElementSibling;
  menu.classList.toggle("show");
  button.classList.toggle("active");
}

// Close dropdowns if clicking outside
window.onclick = function (event) {
  if (!event.target.closest(".dropdown")) {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    let buttons = document.getElementsByClassName("dropbtn");

    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove("show");
      buttons[i].classList.remove("active");
    }
  }
};


window.onload = () => {
  //stars default 3500
  const stars = document.getElementById("stars");
  stars.value = 3500;

  //core x dist 33
  const corex = document.getElementById("corex");
  corex.value = 33;

  //core y dist 33
  const corey = document.getElementById("corey");
  corey.value = 33;

  //outer core x dist 169
  const outcorex = document.getElementById("outcorex");
  outcorex.value = 169;

  //outer core y dist 169
  const outcorey = document.getElementById("outcorey");
  outcorey.value = 169;

  //arm x dist 100
  const armx = document.getElementById("armx");
  armx.value = 100;

  //arm y dist 50
  const army = document.getElementById("army");
  army.value = 50;

  //arm x mean 200
  const armmx = document.getElementById("armmx");
  armmx.value = 200;

  //arm y mean 100
  const armmy = document.getElementById("armmy");
  armmy.value = 100;

  //bar len 100
  const barl = document.getElementById("barl");
  barl.value = 100;

  //bar wid 20
  const barw = document.getElementById("barw");
  barw.value = 20;

  //nebula scale min 5
  const nebmin = document.getElementById("nebmin");
  nebmin.value = 5;

  //nebula scale max 15
  const nebmax = document.getElementById("nebmax");
  nebmax.value = 15;

  //Add intensity, num lights, etc:
};