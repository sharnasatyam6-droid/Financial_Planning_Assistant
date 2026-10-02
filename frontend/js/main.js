const buttons = document.querySelectorAll(".primary-btn");

buttons.forEach(function(button) {
    button.addEventListener("click", function() {
        alert("Finora account setup will be available in the next version.");
    });
});