// // heatmap-toggle.js

// // Reference to the currently loaded script
// let currentScript = null;

// // Function to clear chart before switching
// function clearChart() {
//   d3.select("#chart").selectAll("*").remove();
// }

// // Function to dynamically load a script file
// function loadScript(scriptPath) {
//   // Remove any existing script tag
//   if (currentScript) {
//     document.body.removeChild(currentScript);
//   }

//   // Clear the existing visualization
//   clearChart();

//   // Create a new script tag
//   const script = document.createElement("script");
//   script.src = scriptPath;
//   script.type = "text/javascript";
//   script.onload = () => console.log(`Loaded: ${scriptPath}`);

//   // Append the script tag to the body
//   document.body.appendChild(script);

//   // Update the current script reference
//   currentScript = script;
// }

// // Event Listeners for Switching Between Levels
// document.getElementById("switchLevel1").addEventListener("click", () => {
//   loadScript("js/heatmap-level1.js");
// });

// document.getElementById("switchLevel2").addEventListener("click", () => {
//   loadScript("js/heatmap-level2.js");
// });

// // **Load Level 1 by Default**
// loadScript("js/heatmap-level1.js");
// heatmap-toggle.js

// heatmap-toggle.js

// Ensure scripts are loaded before calling functions
document.addEventListener("DOMContentLoaded", () => {
    if (window.drawLevel1) {
    //   window.AbortControllerdrawLevel1(); // ✅ Load Level 1 by default
    drawLevel1();
    } else {
      console.error("drawLevel1 is not defined. Check if heatmap-level1.js is loaded.");
    }
  
    // Event Listeners for Switching Between Levels
    document.getElementById("switchLevel1").addEventListener("click", () => {
      if (window.drawLevel1) {
        drawLevel1();
        document.getElementById("toggleTemp").style.display = "inline-block";
      } else {
        console.error("drawLevel1 is not defined. Ensure heatmap-level1.js is loaded.");
      }
    });
  
    document.getElementById("switchLevel2").addEventListener("click", () => {
      if (window.drawLevel2) {
        drawLevel2();
        document.getElementById("toggleTemp").style.display = "inline-block";
      } else {
        console.error("drawLevel2 is not defined. Ensure heatmap-level2.js is loaded.");
      }
    });
  });