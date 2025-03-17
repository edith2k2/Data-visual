// Ensure scripts are loaded before calling functions
document.addEventListener("DOMContentLoaded", () => {
    // Check if drawLevel1 function is available
    if (window.drawLevel1) {
        // Load Level 1 by default
        drawLevel1();
    } else {
        console.error("drawLevel1 is not defined. Check if heatmap-level1.js is loaded.");
    }

    // Event Listener for Switching to Level 1
    document.getElementById("switchLevel1").addEventListener("click", () => {
        // Check if drawLevel1 function is available
        if (window.drawLevel1) {
            // Call drawLevel1 function
            drawLevel1();
            // Display the temperature toggle button
            document.getElementById("toggleTemp").style.display = "inline-block";
        } else {
            console.error("drawLevel1 is not defined. Ensure heatmap-level1.js is loaded.");
        }
    });

    // Event Listener for Switching to Level 2
    document.getElementById("switchLevel2").addEventListener("click", () => {
        // Check if drawLevel2 function is available
        if (window.drawLevel2) {
            // Call drawLevel2 function
            drawLevel2();
            // Display the temperature toggle button
            document.getElementById("toggleTemp").style.display = "inline-block";
        } else {
            console.error("drawLevel2 is not defined. Ensure heatmap-level2.js is loaded.");
        }
    });
});